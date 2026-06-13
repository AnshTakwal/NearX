-- ==========================================
-- DUMMY DATA SEEDER FOR NEARX
-- Run this in your Supabase SQL Editor!
-- ==========================================

-- 1. Create a dummy Auth User for our Store
INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'authenticated',
    'authenticated',
    'dummy_store@nearx.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Fresh Mart","role":"store_owner"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- Note: Your trigger `on_auth_user_created` will automatically create a row in the `profiles` table!

-- 2. Wait a split second for the trigger to finish, then insert the Store
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM stores WHERE id = 'ssssssss-ssss-ssss-ssss-ssssssssssss') THEN
    INSERT INTO stores (id, owner_id, name, description, address, city, pincode, lat, lng, is_active)
    VALUES (
        'ssssssss-ssss-ssss-ssss-ssssssssssss',
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'Fresh Mart (Dummy Store)',
        'Your neighborhood grocery store',
        '123 Market Road',
        'Delhi',
        '110001',
        28.6139,
        77.2090,
        true
    );
  END IF;
END $$;

-- 3. Insert Dummy Products (Using Emojis as Images)
INSERT INTO products (store_id, name, brand, category, description, image_url, mrp, discount_percent, sale_price, stock, expiry_date)
VALUES 
('ssssssss-ssss-ssss-ssss-ssssssssssss', 'Organic Milk 1L', 'Amul', 'Dairy', 'Fresh organic milk expiring soon', '🥛', 6000, 50, 3000, 10, CURRENT_DATE + INTERVAL '2 days'),
('ssssssss-ssss-ssss-ssss-ssssssssssss', 'Whole Wheat Bread', 'Britannia', 'Bakery', 'Healthy brown bread', '🍞', 4000, 40, 2400, 5, CURRENT_DATE + INTERVAL '3 days'),
('ssssssss-ssss-ssss-ssss-ssssssssssss', 'Chocolate Chip Cookies', 'Parle', 'Snacks', 'Kids love these yummy cookies', '🍪', 5000, 20, 4000, 15, CURRENT_DATE + INTERVAL '10 days'),
('ssssssss-ssss-ssss-ssss-ssssssssssss', 'Fresh Red Apples 1kg', 'Local Farms', 'Fruits', 'Sweet red apples', '🍎', 12000, 30, 8400, 8, CURRENT_DATE + INTERVAL '5 days'),
('ssssssss-ssss-ssss-ssss-ssssssssssss', 'Yogurt / Curd 500g', 'Mother Dairy', 'Dairy', 'Fresh thick curd', '🥣', 3000, 20, 2400, 12, CURRENT_DATE + INTERVAL '4 days'),
('ssssssss-ssss-ssss-ssss-ssssssssssss', 'Orange Juice 1L', 'Tropicana', 'Beverages', '100% natural fruit juice', '🧃', 10000, 60, 4000, 6, CURRENT_DATE + INTERVAL '1 days'),
('ssssssss-ssss-ssss-ssss-ssssssssssss', 'Oats 1kg', 'Quaker', 'Pantry', 'Healthy breakfast oats', '🌾', 15000, 10, 13500, 20, CURRENT_DATE + INTERVAL '20 days'),
('ssssssss-ssss-ssss-ssss-ssssssssssss', 'Potato Chips', 'Lays', 'Snacks', 'Crispy salty chips', '🥔', 2000, 50, 1000, 30, CURRENT_DATE + INTERVAL '2 days');
