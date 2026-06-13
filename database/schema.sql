-- =============================================
-- NearX Database Schema — Supabase / PostgreSQL
-- Run this in Supabase SQL Editor (in order)
-- =============================================

-- ==================
-- 1. ENUM TYPES
-- ==================

CREATE TYPE user_role AS ENUM ('customer', 'store_owner', 'delivery_partner', 'admin');
CREATE TYPE order_status AS ENUM ('placed', 'accepted', 'packed', 'out_for_delivery', 'delivered', 'cancelled');
CREATE TYPE product_status AS ENUM ('active', 'buy_soon', 'last_chance', 'expired');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE delivery_status AS ENUM ('assigned', 'picked_up', 'in_transit', 'delivered', 'failed');
CREATE TYPE notification_type AS ENUM ('order_update', 'deal_alert', 'expiry_warning', 'system');

-- ==================
-- 2. TABLES
-- ==================

-- Profiles: Extends Supabase auth.users with app-specific data.
-- Every authenticated user gets a row here via trigger.
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          user_role       NOT NULL DEFAULT 'customer',
  full_name     TEXT            NOT NULL,
  phone         TEXT            UNIQUE,
  avatar_url    TEXT,
  is_active     BOOLEAN         NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_phone ON profiles(phone);

-- Addresses: Saved delivery addresses for customers.
CREATE TABLE addresses (
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

CREATE INDEX idx_addresses_user ON addresses(user_id);

-- Stores: Each store_owner can own one store.
-- Location stored as lat/lng for PostGIS-free distance queries.
CREATE TABLE stores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID            NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  name          TEXT            NOT NULL,
  description   TEXT,
  address       TEXT            NOT NULL,
  city          TEXT            NOT NULL,
  pincode       TEXT            NOT NULL,
  lat           DECIMAL(10,7)   NOT NULL,
  lng           DECIMAL(10,7)   NOT NULL,
  phone         TEXT,
  logo_url      TEXT,
  is_active     BOOLEAN         NOT NULL DEFAULT true,
  avg_rating    DECIMAL(2,1)    NOT NULL DEFAULT 0.0,
  total_reviews INTEGER         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_stores_owner ON stores(owner_id);
CREATE INDEX idx_stores_city ON stores(city);
CREATE INDEX idx_stores_location ON stores(lat, lng);

-- Products: Near-expiry items listed by stores.
-- discount_percent is a stored column updated by the Edge Function cron job.
-- All prices in paise (integer). ₹68 = 6800.
CREATE TABLE products (
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

CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_expiry ON products(expiry_date);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;

-- Orders: One order = one store. Items from single store only.
-- All money in paise.
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID            NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  store_id        UUID            NOT NULL REFERENCES stores(id) ON DELETE SET NULL,
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

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Order Items: Individual products within an order.
-- Snapshot of price at time of order (won't change if product price changes later).
CREATE TABLE order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID            NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    UUID            NOT NULL REFERENCES products(id) ON DELETE SET NULL,
  product_name  TEXT            NOT NULL,
  quantity      INTEGER         NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price    INTEGER         NOT NULL,
  total_price   INTEGER         NOT NULL,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Delivery Assignments: Links an order to a delivery partner.
CREATE TABLE delivery_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID            NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  partner_id      UUID            NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  status          delivery_status NOT NULL DEFAULT 'assigned',
  picked_up_at    TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  earnings        INTEGER         NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_delivery_partner ON delivery_assignments(partner_id);
CREATE INDEX idx_delivery_order ON delivery_assignments(order_id);
CREATE INDEX idx_delivery_status ON delivery_assignments(status);

-- Reviews: Customer reviews on stores after order delivery.
CREATE TABLE reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  store_id      UUID            NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_id      UUID            NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating        INTEGER         NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT now(),
  UNIQUE(customer_id, order_id)
);

CREATE INDEX idx_reviews_store ON reviews(store_id);

-- Notifications: Push/in-app notifications for all users.
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID            NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type          notification_type NOT NULL DEFAULT 'system',
  title         TEXT            NOT NULL,
  body          TEXT,
  is_read       BOOLEAN         NOT NULL DEFAULT false,
  metadata      JSONB,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- ==================
-- 3. AUTO-UPDATE updated_at TRIGGER
-- ==================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_addresses_updated BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_stores_updated BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_delivery_updated BEFORE UPDATE ON delivery_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==================
-- 4. AUTO-CREATE PROFILE ON SIGNUP
-- ==================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ==================
-- 5. STOCK DECREMENT FUNCTION (atomic, prevents oversell)
-- ==================

CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  UPDATE products
  SET stock = stock - p_quantity
  WHERE id = p_product_id AND stock >= p_quantity AND is_active = true;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql;
