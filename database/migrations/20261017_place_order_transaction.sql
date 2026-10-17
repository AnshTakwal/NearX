-- ============================================================
-- Migration: 20261017_place_order_transaction.sql
-- Description: Transactional checkout function (place_order) &
--              SECURITY DEFINER fix for decrement_stock.
-- ============================================================

-- 1. Fix decrement_stock with SECURITY DEFINER
-- Customers have no direct UPDATE permission on the products table under RLS,
-- so decrement_stock must run with elevated privileges (SECURITY DEFINER)
-- and fixed search_path to prevent search_path escalation attacks.
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  UPDATE products
  SET stock = stock - p_quantity
  WHERE id = p_product_id
    AND stock >= p_quantity
    AND is_active = true;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Transactional checkout function: place_order
-- Accepts a cart items JSONB array, delivery address ID, and customer ID.
-- In a single atomic transaction:
--  - Validates caller authorization (auth.uid() = p_customer_id)
--  - Deterministically locks product rows in product ID order (FOR UPDATE)
--  - Verifies active status and sufficient inventory
--  - Decrements inventory atomically
--  - Recalculates sale prices & discounts server-side (does not trust client prices)
--  - Groups orders by store (one order per store)
--  - Distributes delivery fees evenly across stores
--  - Inserts order & order_items rows
--  - Returns the list of created order objects as JSONB
--  - Raises an exception on any failure, rolling back all changes cleanly
CREATE OR REPLACE FUNCTION place_order(
  p_items JSONB,
  p_address_id UUID,
  p_customer_id UUID DEFAULT auth.uid()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prod RECORD;
  v_total_distinct_items INTEGER;
  v_locked_items INTEGER := 0;
  v_days_left INTEGER;
  v_discount_pct INTEGER;
  v_unit_price INTEGER;
  v_total_price INTEGER;
  v_item_savings INTEGER;
  v_items_by_store JSONB := '{}'::jsonb;
  v_store_id TEXT;
  v_store_uuid UUID;
  v_store_keys TEXT[];
  v_num_stores INTEGER;
  v_total_delivery_fee INTEGER;
  v_multi_store_fee INTEGER;
  v_base_delivery_per_store INTEGER;
  v_remainder_fee INTEGER;
  v_store_delivery_fee INTEGER;
  v_store_subtotal INTEGER;
  v_store_savings INTEGER;
  v_order_total INTEGER;
  v_item_obj JSONB;
  v_item_elem JSONB;
  v_new_order RECORD;
  v_created_orders JSONB := '[]'::jsonb;
BEGIN
  -- 1. Authorization checks
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_customer_id THEN
    RAISE EXCEPTION 'Unauthorized: customer ID does not match authenticated user';
  END IF;

  IF auth.role() = 'anon' AND auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to place an order';
  END IF;

  IF p_customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer ID is required';
  END IF;

  IF p_address_id IS NULL THEN
    RAISE EXCEPTION 'Delivery address is required';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- 2. Verify delivery address exists
  IF NOT EXISTS (
    SELECT 1 FROM addresses
    WHERE id = p_address_id
      AND (user_id = p_customer_id OR user_id IS NULL)
  ) THEN
    RAISE EXCEPTION 'Invalid delivery address';
  END IF;

  -- 3. Calculate expected distinct items count
  SELECT count(DISTINCT COALESCE((elem->>'product_id')::uuid, (elem->>'id')::uuid))
  INTO v_total_distinct_items
  FROM jsonb_array_elements(p_items) AS elem;

  -- 4. Lock products deterministically (ordered by p.id) to prevent deadlocks
  FOR v_prod IN
    WITH parsed_items AS (
      SELECT
        COALESCE((elem->>'product_id')::uuid, (elem->>'id')::uuid) AS pid,
        SUM(COALESCE((elem->>'quantity')::integer, (elem->>'cartQty')::integer, 1))::integer AS qty
      FROM jsonb_array_elements(p_items) AS elem
      GROUP BY 1
    )
    SELECT
      p.id,
      p.store_id,
      p.name,
      p.mrp,
      p.stock,
      p.expiry_date,
      p.is_active,
      p.sale_price AS stored_sale_price,
      pi.qty
    FROM parsed_items pi
    JOIN products p ON p.id = pi.pid
    ORDER BY p.id
    FOR UPDATE OF p
  LOOP
    v_locked_items := v_locked_items + 1;

    -- Validate quantity
    IF v_prod.qty <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity % for product "%"', v_prod.qty, v_prod.name;
    END IF;

    -- Validate active
    IF NOT v_prod.is_active THEN
      RAISE EXCEPTION 'Product "%" is no longer available', v_prod.name;
    END IF;

    -- Validate stock
    IF v_prod.stock < v_prod.qty THEN
      RAISE EXCEPTION 'Product "%" is out of stock (requested: %, available: %)',
        v_prod.name, v_prod.qty, v_prod.stock;
    END IF;

    -- Recompute dynamic discount tier based on days until expiry
    v_days_left := v_prod.expiry_date - CURRENT_DATE;
    IF v_days_left < 0 THEN
      RAISE EXCEPTION 'Product "%" has expired and cannot be purchased', v_prod.name;
    ELSIF v_days_left < 7 THEN
      v_discount_pct := 60;
    ELSIF v_days_left <= 15 THEN
      v_discount_pct := 40;
    ELSIF v_days_left <= 30 THEN
      v_discount_pct := 25;
    ELSE
      v_discount_pct := 10;
    END IF;

    -- Recompute unit sale price in paise (server-side, never trusting client)
    v_unit_price := ROUND(v_prod.mrp * (1.0 - (v_discount_pct::numeric / 100.0)))::integer;
    IF v_unit_price <= 0 THEN
      v_unit_price := COALESCE(v_prod.stored_sale_price, v_prod.mrp);
    END IF;

    v_total_price := v_unit_price * v_prod.qty;
    v_item_savings := GREATEST(0, (v_prod.mrp - v_unit_price) * v_prod.qty);

    -- Atomically decrement stock
    UPDATE products
    SET stock = stock - v_prod.qty
    WHERE id = v_prod.id;

    -- Build item JSON object for order items
    v_item_obj := jsonb_build_object(
      'product_id', v_prod.id,
      'product_name', v_prod.name,
      'quantity', v_prod.qty,
      'unit_price', v_unit_price,
      'total_price', v_total_price,
      'savings', v_item_savings
    );

    -- Group items by store_id
    v_store_id := v_prod.store_id::text;
    IF v_items_by_store ? v_store_id THEN
      v_items_by_store := jsonb_set(
        v_items_by_store,
        ARRAY[v_store_id],
        (v_items_by_store->v_store_id) || jsonb_build_array(v_item_obj)
      );
    ELSE
      v_items_by_store := jsonb_set(
        v_items_by_store,
        ARRAY[v_store_id],
        jsonb_build_array(v_item_obj),
        true
      );
    END IF;
  END LOOP;

  -- Ensure all items in cart were found
  IF v_locked_items < v_total_distinct_items THEN
    RAISE EXCEPTION 'One or more products in your cart could not be found';
  END IF;

  -- 5. Calculate multi-store fees & insert orders
  SELECT ARRAY(SELECT jsonb_object_keys(v_items_by_store)) INTO v_store_keys;
  v_num_stores := cardinality(v_store_keys);

  IF v_num_stores = 0 THEN
    RAISE EXCEPTION 'No valid items to order';
  END IF;

  v_total_delivery_fee := 4000;
  v_multi_store_fee := CASE WHEN v_num_stores > 1 THEN 2000 ELSE 0 END;
  v_base_delivery_per_store := (v_total_delivery_fee + v_multi_store_fee) / v_num_stores;
  v_remainder_fee := (v_total_delivery_fee + v_multi_store_fee) % v_num_stores;

  FOREACH v_store_id IN ARRAY v_store_keys LOOP
    v_store_uuid := v_store_id::uuid;

    -- Calculate subtotal and savings for this store
    SELECT
      COALESCE(SUM((item->>'total_price')::integer), 0),
      COALESCE(SUM((item->>'savings')::integer), 0)
    INTO v_store_subtotal, v_store_savings
    FROM jsonb_array_elements(v_items_by_store->v_store_id) AS item;

    -- Allocate delivery fee
    v_store_delivery_fee := v_base_delivery_per_store + CASE WHEN v_remainder_fee > 0 THEN 1 ELSE 0 END;
    IF v_remainder_fee > 0 THEN
      v_remainder_fee := v_remainder_fee - 1;
    END IF;

    v_order_total := v_store_subtotal + v_store_delivery_fee;

    -- Insert order record
    INSERT INTO orders (
      customer_id,
      store_id,
      address_id,
      status,
      subtotal,
      delivery_fee,
      total,
      savings,
      payment_status,
      payment_id
    ) VALUES (
      p_customer_id,
      v_store_uuid,
      p_address_id,
      'placed',
      v_store_subtotal,
      v_store_delivery_fee,
      v_order_total,
      v_store_savings,
      'pending',
      NULL
    ) RETURNING * INTO v_new_order;

    -- Insert order items
    FOR v_item_elem IN SELECT * FROM jsonb_array_elements(v_items_by_store->v_store_id) LOOP
      INSERT INTO order_items (
        order_id,
        product_id,
        product_name,
        quantity,
        unit_price,
        total_price
      ) VALUES (
        v_new_order.id,
        (v_item_elem->>'product_id')::uuid,
        v_item_elem->>'product_name',
        (v_item_elem->>'quantity')::integer,
        (v_item_elem->>'unit_price')::integer,
        (v_item_elem->>'total_price')::integer
      );
    END LOOP;

    v_created_orders := v_created_orders || to_jsonb(v_new_order);
  END LOOP;

  RETURN v_created_orders;
END;
$$;
