-- 1. Backup before mutating anything
CREATE TABLE products_backup_pre_multistore AS SELECT * FROM products;

-- 2. Verify row count of backup
SELECT COUNT(*) FROM products_backup_pre_multistore;

-- 3. Check current state
SELECT store_id, COUNT(*) FROM products GROUP BY store_id;

-- =======================================================
-- REDISTRIBUTE PRODUCTS
-- Note: Replace the UUIDs below with the actual store IDs 
-- created by the seed-stores.js script!
-- =======================================================
DO $$
DECLARE
    -- The existing store ID where all products currently live
    old_store_id UUID := 'YOUR-OLD-STORE-ID';
    
    -- The new store IDs created by seed-stores.js
    new_store_1 UUID := 'YOUR-NEW-STORE-ID-1';
    new_store_2 UUID := 'YOUR-NEW-STORE-ID-2';
    
    products_cursor CURSOR FOR SELECT id FROM products WHERE store_id = old_store_id;
    prod_id UUID;
    counter INT := 0;
BEGIN
    OPEN products_cursor;
    LOOP
        FETCH products_cursor INTO prod_id;
        EXIT WHEN NOT FOUND;
        
        counter := counter + 1;
        
        -- Distribute 80% to new stores (approx 40% each)
        IF counter % 5 = 0 OR counter % 5 = 1 THEN
            UPDATE products SET store_id = new_store_1 WHERE id = prod_id;
        ELSIF counter % 5 = 2 OR counter % 5 = 3 THEN
            UPDATE products SET store_id = new_store_2 WHERE id = prod_id;
        END IF;
        
        -- The remaining 20% stays in the old store (counter % 5 = 4)
        -- We duplicate these items so that they appear in the new stores as well, 
        -- giving them overlapping inventory.
        IF counter % 5 = 4 THEN
            -- Duplicate into new_store_1
            INSERT INTO products (id, store_id, name, brand, category, description, image_url, mrp, discount_percent, sale_price, stock, expiry_date, status, is_active, created_at, updated_at)
            SELECT gen_random_uuid(), new_store_1, name, brand, category, description, image_url, mrp, discount_percent, sale_price, stock + 2, expiry_date, status, is_active, now(), now()
            FROM products WHERE id = prod_id;
            
            -- Duplicate into new_store_2
            INSERT INTO products (id, store_id, name, brand, category, description, image_url, mrp, discount_percent, sale_price, stock, expiry_date, status, is_active, created_at, updated_at)
            SELECT gen_random_uuid(), new_store_2, name, brand, category, description, image_url, mrp, discount_percent, sale_price, stock + 5, expiry_date, status, is_active, now(), now()
            FROM products WHERE id = prod_id;
        END IF;
        
    END LOOP;
    CLOSE products_cursor;
END $$;

-- 4. Re-check current state to verify distribution
SELECT store_id, COUNT(*) FROM products GROUP BY store_id;
