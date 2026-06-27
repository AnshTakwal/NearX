-- =============================================
-- NearX RLS Policies — Supabase
-- Run AFTER schema.sql
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ==================
-- PROFILES
-- ==================

-- Anyone can read public profile info
CREATE POLICY "Profiles: public read"
  ON profiles FOR SELECT
  USING (true);

-- Users can update only their own profile
CREATE POLICY "Profiles: self update"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ==================
-- ADDRESSES
-- ==================

-- Customers see only their own addresses
CREATE POLICY "Addresses: self read"
  ON addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Addresses: delivery partner read"
  ON addresses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.address_id = addresses.id
        AND orders.status = 'out_for_delivery'
    ) OR EXISTS (
      SELECT 1 FROM orders
      WHERE orders.address_id = addresses.id
        AND public.is_delivery_partner_for_order(orders.id, auth.uid())
    )
  );

CREATE POLICY "Addresses: self insert"
  ON addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Addresses: self update"
  ON addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Addresses: self delete"
  ON addresses FOR DELETE
  USING (auth.uid() = user_id);

-- ==================
-- STORES
-- ==================

-- Everyone can read active stores
CREATE POLICY "Stores: public read"
  ON stores FOR SELECT
  USING (is_active = true);

-- Store owners can insert their own store
CREATE POLICY "Stores: owner insert"
  ON stores FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Store owners can update their own store
CREATE POLICY "Stores: owner update"
  ON stores FOR UPDATE
  USING (auth.uid() = owner_id);

-- ==================
-- PRODUCTS
-- ==================

-- Everyone can see active products
CREATE POLICY "Products: public read"
  ON products FOR SELECT
  USING (is_active = true);

-- Store owners can insert products for their store
CREATE POLICY "Products: store owner insert"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores WHERE stores.id = store_id AND stores.owner_id = auth.uid()
    )
  );

-- Store owners can update their store's products
CREATE POLICY "Products: store owner update"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stores WHERE stores.id = store_id AND stores.owner_id = auth.uid()
    )
  );

-- Store owners can delete their store's products
CREATE POLICY "Products: store owner delete"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stores WHERE stores.id = store_id AND stores.owner_id = auth.uid()
    )
  );

-- ==================
-- HELPER FUNCTIONS TO PREVENT RLS INFINITE RECURSION
-- ==================================================

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

-- ORDERS
-- ==================

-- Customers see their own orders
CREATE POLICY "Orders: customer read"
  ON orders FOR SELECT
  USING (auth.uid() = customer_id);

-- Store owners see orders for their store
CREATE POLICY "Orders: store owner read"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores WHERE stores.id = store_id AND stores.owner_id = auth.uid()
    )
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
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Store owners can update order status for their store
CREATE POLICY "Orders: store owner update"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stores WHERE stores.id = store_id AND stores.owner_id = auth.uid()
    )
  );

-- ==================
-- ORDER ITEMS
-- ==================

-- Readable by order owner (customer, store owner, delivery partner via join)
CREATE POLICY "Order Items: customer read"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_id AND orders.customer_id = auth.uid()
    )
  );

CREATE POLICY "Order Items: store owner read"
  ON order_items FOR SELECT
  USING (
    public.is_store_owner_for_order(order_id, auth.uid())
  );

-- Customers can insert order items
CREATE POLICY "Order Items: customer insert"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_id AND orders.customer_id = auth.uid()
    )
  );

-- ==================
-- DELIVERY ASSIGNMENTS
-- ==================

-- Delivery partners see their own assignments
CREATE POLICY "Delivery: partner read"
  ON delivery_assignments FOR SELECT
  USING (auth.uid() = partner_id);

-- Store owners see delivery for their orders
CREATE POLICY "Delivery: store owner read"
  ON delivery_assignments FOR SELECT
  USING (
    public.is_store_owner_for_order(order_id, auth.uid())
  );




-- Delivery partners can update their own assignment status
CREATE POLICY "Delivery: partner update"
  ON delivery_assignments FOR UPDATE
  USING (auth.uid() = partner_id);

-- Delivery partners can insert an assignment for themselves
CREATE POLICY "Delivery: partner insert"
  ON delivery_assignments FOR INSERT
  WITH CHECK (auth.uid() = partner_id);

-- ==================
-- REVIEWS
-- ==================

-- Anyone can read reviews
CREATE POLICY "Reviews: public read"
  ON reviews FOR SELECT
  USING (true);

-- Customers can insert reviews for their own orders
CREATE POLICY "Reviews: customer insert"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- ==================
-- NOTIFICATIONS
-- ==================

-- Users see only their own notifications
CREATE POLICY "Notifications: self read"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can mark their own notifications as read
CREATE POLICY "Notifications: self update"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);
