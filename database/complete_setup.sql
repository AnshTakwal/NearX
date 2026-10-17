-- ============================================================
-- NEARX — COMPLETE DATABASE SETUP
-- Run this SINGLE script in Supabase SQL Editor.
-- It creates all tables, functions, triggers, RLS policies,
-- and seeds dummy data so the app works immediately.
-- ============================================================


-- ============================================================
-- SECTION 1: ENUM TYPES
-- ============================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'store_owner', 'delivery_partner', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('placed', 'accepted', 'packed', 'out_for_delivery', 'delivered', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('active', 'buy_soon', 'last_chance', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE delivery_status AS ENUM ('assigned', 'picked_up', 'in_transit', 'delivered', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('order_update', 'deal_alert', 'expiry_warning', 'system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================
-- SECTION 2: TABLES
-- ============================================================

-- PROFILES
-- Extends auth.users with app-specific data.
-- A trigger (created below) auto-inserts a row here on sign-up.
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          user_role       NOT NULL DEFAULT 'customer',
  full_name     TEXT            NOT NULL DEFAULT 'User',
  phone         TEXT            UNIQUE,
  avatar_url    TEXT,
  is_active     BOOLEAN         NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role  ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- ADDRESSES
-- Saved delivery addresses for customers.
CREATE TABLE IF NOT EXISTS addresses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label         TEXT            NOT NULL DEFAULT 'Home',
  address_line  TEXT            NOT NULL,
  city          TEXT            NOT NULL,
  pincode       TEXT            NOT NULL,
  lat           DECIMAL(10,7),
  lng           DECIMAL(10,7),
  is_default    BOOLEAN         NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);

-- STORES
-- Each store_owner can own exactly one store (UNIQUE on owner_id).
-- Lat/lng used for proximity searches without PostGIS.
CREATE TABLE IF NOT EXISTS stores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID            NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  name          TEXT            NOT NULL,
  description   TEXT,
  address       TEXT            NOT NULL,
  city          TEXT            NOT NULL,
  pincode       TEXT            NOT NULL,
  lat           DECIMAL(10,7)   NOT NULL DEFAULT 28.6139,
  lng           DECIMAL(10,7)   NOT NULL DEFAULT 77.2090,
  phone         TEXT,
  logo_url      TEXT,
  is_active     BOOLEAN         NOT NULL DEFAULT true,
  avg_rating    DECIMAL(2,1)    NOT NULL DEFAULT 0.0,
  total_reviews INTEGER         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stores_owner    ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_city     ON stores(city);
CREATE INDEX IF NOT EXISTS idx_stores_location ON stores(lat, lng);

-- PRODUCTS
-- Near-expiry items listed by stores.
-- All prices stored in PAISE (integer). ₹50 = 5000 paise.
-- discount_percent is recalculated client-side / by a cron job.
CREATE TABLE IF NOT EXISTS products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id          UUID            NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name              TEXT            NOT NULL,
  brand             TEXT,
  category          TEXT            NOT NULL,
  description       TEXT,
  image_url         TEXT,
  mrp               INTEGER         NOT NULL CHECK (mrp > 0),
  discount_percent  INTEGER         NOT NULL DEFAULT 10 CHECK (discount_percent BETWEEN 0 AND 100),
  sale_price        INTEGER         NOT NULL CHECK (sale_price > 0),
  stock             INTEGER         NOT NULL DEFAULT 0 CHECK (stock >= 0),
  expiry_date       DATE            NOT NULL,
  status            product_status  NOT NULL DEFAULT 'active',
  is_active         BOOLEAN         NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_store    ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_expiry   ON products(expiry_date);
CREATE INDEX IF NOT EXISTS idx_products_status   ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_active   ON products(is_active) WHERE is_active = true;

-- ORDERS
-- One order per store. All money in paise.
CREATE TABLE IF NOT EXISTS orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID            REFERENCES profiles(id) ON DELETE SET NULL,
  store_id        UUID            REFERENCES stores(id) ON DELETE SET NULL,
  address_id      UUID            REFERENCES addresses(id) ON DELETE SET NULL,
  status          order_status    NOT NULL DEFAULT 'placed',
  subtotal        INTEGER         NOT NULL DEFAULT 0,
  delivery_fee    INTEGER         NOT NULL DEFAULT 4000,
  total           INTEGER         NOT NULL DEFAULT 0,
  savings         INTEGER         NOT NULL DEFAULT 0,
  payment_status  payment_status  NOT NULL DEFAULT 'pending',
  payment_id      TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_store    ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status   ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created  ON orders(created_at DESC);

-- ORDER ITEMS
-- Individual products within an order.
-- Snapshot of price at time of order (immutable).
CREATE TABLE IF NOT EXISTS order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID            NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    UUID            REFERENCES products(id) ON DELETE SET NULL,
  product_name  TEXT            NOT NULL,
  quantity      INTEGER         NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price    INTEGER         NOT NULL,
  total_price   INTEGER         NOT NULL,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- DELIVERY ASSIGNMENTS
-- Links an order to a delivery partner.
CREATE TABLE IF NOT EXISTS delivery_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID            NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  partner_id      UUID            REFERENCES profiles(id) ON DELETE SET NULL,
  status          delivery_status NOT NULL DEFAULT 'assigned',
  picked_up_at    TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  earnings        INTEGER         NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_partner ON delivery_assignments(partner_id);
CREATE INDEX IF NOT EXISTS idx_delivery_order   ON delivery_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_status  ON delivery_assignments(status);

-- REVIEWS
-- Customer reviews on stores after delivery.
CREATE TABLE IF NOT EXISTS reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  store_id      UUID            NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_id      UUID            NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating        INTEGER         NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT now(),
  UNIQUE(customer_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_store ON reviews(store_id);

-- NOTIFICATIONS
-- In-app notifications for all user roles.
CREATE TABLE IF NOT EXISTS notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type          notification_type NOT NULL DEFAULT 'system',
  title         TEXT            NOT NULL,
  body          TEXT,
  is_read       BOOLEAN         NOT NULL DEFAULT false,
  metadata      JSONB,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user   ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;


-- ============================================================
-- SECTION 3: FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at on any UPDATE
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables that have updated_at
DROP TRIGGER IF EXISTS trg_profiles_updated    ON profiles;
DROP TRIGGER IF EXISTS trg_addresses_updated   ON addresses;
DROP TRIGGER IF EXISTS trg_stores_updated      ON stores;
DROP TRIGGER IF EXISTS trg_products_updated    ON products;
DROP TRIGGER IF EXISTS trg_orders_updated      ON orders;
DROP TRIGGER IF EXISTS trg_delivery_updated    ON delivery_assignments;

CREATE TRIGGER trg_profiles_updated    BEFORE UPDATE ON profiles            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_addresses_updated   BEFORE UPDATE ON addresses           FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_stores_updated      BEFORE UPDATE ON stores              FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated    BEFORE UPDATE ON products            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated      BEFORE UPDATE ON orders              FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_delivery_updated    BEFORE UPDATE ON delivery_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- Auto-create profile row when a new user signs up.
-- Reads full_name and role from user metadata set during registration.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'customer'::public.user_role),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        role      = EXCLUDED.role,
        phone     = EXCLUDED.phone;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- Atomic stock decrement — prevents overselling.
-- SECURITY DEFINER allows customers to decrement stock without needing direct UPDATE rights on products table.
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


-- Transactional checkout function: place_order
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


-- ============================================================
-- SECTION 4: ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores               ENABLE ROW LEVEL SECURITY;
ALTER TABLE products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews              ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications        ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before re-creating to avoid conflicts
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Helper functions for RLS to prevent recursion
CREATE OR REPLACE FUNCTION public.is_delivery_partner_for_order(order_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.delivery_assignments da
    WHERE da.order_id = order_uuid AND da.partner_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_store_owner_for_order(order_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.stores s ON s.id = o.store_id
    WHERE o.id = order_uuid AND s.owner_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ---- PROFILES ----
-- Anyone can read profiles (needed for order -> customer name joins)
CREATE POLICY "Profiles: public read"
  ON profiles FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Profiles: self update"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- The trigger function (SECURITY DEFINER) handles INSERT on registration.
-- We also allow anon inserts to let the trigger work cleanly:
CREATE POLICY "Profiles: system insert"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR auth.uid() IS NULL);


-- ---- ADDRESSES ----
CREATE POLICY "Addresses: self read"
  ON addresses FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Addresses: self insert"
  ON addresses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Addresses: self update"
  ON addresses FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Addresses: self delete"
  ON addresses FOR DELETE USING (auth.uid() = user_id);


-- ---- STORES ----
-- Everyone (including unauthenticated) can read active stores
CREATE POLICY "Stores: public read"
  ON stores FOR SELECT USING (is_active = true);

-- Store owners can insert their own store
CREATE POLICY "Stores: owner insert"
  ON stores FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Store owners can update only their own store
CREATE POLICY "Stores: owner update"
  ON stores FOR UPDATE USING (auth.uid() = owner_id);


-- ---- PRODUCTS ----
-- Everyone can read active products (customers browse without login on landing)
CREATE POLICY "Products: public read"
  ON products FOR SELECT USING (is_active = true);

-- Store owners can insert products only for their own store
CREATE POLICY "Products: store owner insert"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = store_id AND stores.owner_id = auth.uid())
  );

-- Store owners can update their store's products
CREATE POLICY "Products: store owner update"
  ON products FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = store_id AND stores.owner_id = auth.uid())
  );

-- Store owners can soft-delete (is_active = false) their products
CREATE POLICY "Products: store owner delete"
  ON products FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = store_id AND stores.owner_id = auth.uid())
  );


-- ---- ORDERS ----
-- Customers see their own orders
CREATE POLICY "Orders: customer read"
  ON orders FOR SELECT USING (auth.uid() = customer_id);

-- Store owners see orders placed at their store
CREATE POLICY "Orders: store owner read"
  ON orders FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = store_id AND stores.owner_id = auth.uid())
  );

-- Delivery partners see available orders and their assigned orders
CREATE POLICY "Orders: delivery partner read"
  ON orders FOR SELECT
  USING (
    status = 'out_for_delivery'
    OR public.is_delivery_partner_for_order(id, auth.uid())
  );

-- Customers can place orders
CREATE POLICY "Orders: customer insert"
  ON orders FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Store owners can update status (accept, pack, etc.)
CREATE POLICY "Orders: store owner update"
  ON orders FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM stores WHERE stores.id = store_id AND stores.owner_id = auth.uid())
  );


-- ---- ORDER ITEMS ----
-- Customers can read their own order's items
CREATE POLICY "Order Items: customer read"
  ON order_items FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.customer_id = auth.uid())
  );

-- Store owners can read items for their store's orders
CREATE POLICY "Order Items: store owner read"
  ON order_items FOR SELECT
  USING (
    public.is_store_owner_for_order(order_id, auth.uid())
  );

-- Delivery partners can read items for their assigned orders
CREATE POLICY "Order Items: delivery partner read"
  ON order_items FOR SELECT
  USING (
    public.is_delivery_partner_for_order(order_id, auth.uid())
  );

-- Customers can insert items when placing an order
CREATE POLICY "Order Items: customer insert"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.customer_id = auth.uid())
  );


-- ---- DELIVERY ASSIGNMENTS ----
-- Delivery partners see their own assignments
CREATE POLICY "Delivery: partner read"
  ON delivery_assignments FOR SELECT USING (auth.uid() = partner_id);

-- Store owners can see delivery status for their orders
CREATE POLICY "Delivery: store owner read"
  ON delivery_assignments FOR SELECT
  USING (
    public.is_store_owner_for_order(order_id, auth.uid())
  );

-- Delivery partners can update their assignment (mark picked_up / delivered)
CREATE POLICY "Delivery: partner update"
  ON delivery_assignments FOR UPDATE USING (auth.uid() = partner_id);
-- Delivery partners can accept available deliveries for themselves
CREATE POLICY "Delivery: partner insert"
  ON delivery_assignments FOR INSERT
  WITH CHECK (auth.uid() = partner_id);
-- Store owners can insert/assign a delivery partner to an order
CREATE POLICY "Delivery: store owner insert"
  ON delivery_assignments FOR INSERT
  WITH CHECK (
    public.is_store_owner_for_order(order_id, auth.uid())
  );





-- ---- REVIEWS ----
-- Anyone can read reviews
CREATE POLICY "Reviews: public read"
  ON reviews FOR SELECT USING (true);

-- Customers can write reviews for their own orders
CREATE POLICY "Reviews: customer insert"
  ON reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);


-- ---- NOTIFICATIONS ----
-- Users can only see their own notifications
CREATE POLICY "Notifications: self read"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

-- Users can mark their own notifications as read
CREATE POLICY "Notifications: self update"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);


-- ============================================================
-- SECTION 5: DUMMY DATA
-- All prices in PAISE. ₹1 = 100 paise.
-- We create one dummy store owner + store + 12 products.
-- ============================================================

-- Step 1: Insert a dummy auth user for the store owner.
INSERT INTO auth.users (
  id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'authenticated', 'authenticated',
  'demostore@nearx.com',
  crypt('DemoStore@123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Fresh Mart Store","role":"store_owner"}',
  now(), now(), '', '', '', ''
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Upsert profile (trigger fires on insert above, but just to be safe)
INSERT INTO profiles (id, full_name, role)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Fresh Mart Store', 'store_owner')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

-- Step 3: Create the dummy store
INSERT INTO stores (id, owner_id, name, description, address, city, pincode, lat, lng, is_active)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Fresh Mart',
  'Your trusted neighbourhood grocery store. Save more on near-expiry deals!',
  '12, Main Market Road',
  'Delhi',
  '110001',
  28.6139,
  77.2090,
  true
)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Insert 12 dummy products across all categories
INSERT INTO products (store_id, name, brand, category, description, image_url, mrp, discount_percent, sale_price, stock, expiry_date, status)
VALUES
-- Dairy
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Full Cream Milk 1L',     'Amul',        'Dairy',      'Rich full-cream milk, perfect for chai and cereal.',       '🥛', 6800,  55, 3060, 12, CURRENT_DATE + 2,  'last_chance'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Thick Curd 500g',        'Mother Dairy','Dairy',      'Creamy, probiotic-rich fresh curd.',                       '🥣', 5000,  30, 3500,  8, CURRENT_DATE + 3,  'buy_soon'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Cheese Slices 200g',     'Amul',        'Dairy',      'Processed cheese slices for sandwiches and burgers.',      '🧀', 10000, 40, 6000,  5, CURRENT_DATE + 4,  'buy_soon'),

-- Bakery
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Whole Wheat Bread',      'Britannia',   'Bakery',     'Healthy brown bread, no maida. Great for breakfast.',      '🍞', 5500,  45, 3025,  6, CURRENT_DATE + 2,  'last_chance'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Butter Croissants 4pc',  'La Boulange', 'Bakery',     'Flaky, golden buttery croissants.',                        '🥐', 8000,  35, 5200,  4, CURRENT_DATE + 1,  'last_chance'),

-- Snacks
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Salted Chips 150g',      'Lays',        'Snacks',     'Classic salted potato chips — kids go crazy for these!',  '🥔', 3000,  50, 1500, 20, CURRENT_DATE + 3,  'buy_soon'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Choco Chip Cookies 200g','Parle',       'Snacks',     'Crunchy chocolate chip cookies for the whole family.',    '🍪', 5000,  25, 3750, 15, CURRENT_DATE + 10, 'active'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Instant Noodles 4pk',    'Maggi',       'Snacks',     '2-minute noodles, every student''s best friend.',          '🍜', 7200,  20, 5760, 18, CURRENT_DATE + 14, 'active'),

-- Beverages
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Orange Juice 1L',        'Tropicana',   'Beverages',  '100% natural pressed orange juice, no added sugar.',      '🧃', 15000, 60, 6000,  7, CURRENT_DATE + 1,  'last_chance'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Cold Coffee 250ml',      'Nescafe',     'Beverages',  'Ready to drink cold coffee — perfect for summers.',       '☕',  5500,  30, 3850, 10, CURRENT_DATE + 5,  'buy_soon'),

-- Pantry
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Rolled Oats 1kg',        'Quaker',      'Pantry',     'Heart-healthy whole grain oats for a nutritious breakfast.','🌾',22000, 15,18700, 25, CURRENT_DATE + 20, 'active'),

-- Fruits
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Red Apples 1kg',         'Farm Fresh',  'Fruits',     'Crunchy, sweet Shimla apples. Freshly sourced.',          '🍎', 18000, 30,12600,  9, CURRENT_DATE + 5,  'buy_soon');


-- ============================================================
-- DONE! Your NearX database is fully set up.
-- Summary of what was created:
--   Tables:    profiles, addresses, stores, products,
--              orders, order_items, delivery_assignments,
--              reviews, notifications
--   Functions: update_updated_at, handle_new_user, decrement_stock
--   Triggers:  auto updated_at on 6 tables, auto profile on signup
--   RLS:       All tables secured with role-based policies
--   Dummy:     1 store (Fresh Mart) + 12 products across 5 categories
--
-- Demo Store Login (for testing as store owner):
--   Email:    demostore@nearx.com
--   Password: DemoStore@123
-- ============================================================
