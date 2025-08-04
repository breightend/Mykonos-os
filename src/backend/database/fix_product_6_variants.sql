-- MANUAL SQL COMMANDS TO FIX DATABASE INCONSISTENCY
-- Run these commands in your SQLite database browser or command line

-- 1. First, check current state of variants for product 6
SELECT 
    wsv.id, 
    wsv.size_id, 
    wsv.color_id, 
    wsv.quantity, 
    wsv.variant_barcode,
    s.size_name,
    c.color_name
FROM warehouse_stock_variants wsv
LEFT JOIN sizes s ON wsv.size_id = s.id
LEFT JOIN colors c ON wsv.color_id = c.id
WHERE wsv.product_id = 6;

-- 2. Check what the correct size IDs should be
SELECT id, size_name FROM sizes ORDER BY id;

-- 3. Fix the size_id inconsistencies
-- Based on your debug output, we need to fix:
-- - Variant ID 8 should have size_id = 8 (for 'S') instead of 1
-- - Variant ID 9 should have size_id = 9 (for 'M') instead of 2

UPDATE warehouse_stock_variants 
SET size_id = 8
WHERE id = 8 AND product_id = 6;

UPDATE warehouse_stock_variants 
SET size_id = 9  
WHERE id = 9 AND product_id = 6;

-- 4. Verify the fix worked
SELECT 
    wsv.id, 
    wsv.size_id, 
    wsv.color_id, 
    wsv.quantity, 
    wsv.variant_barcode,
    s.size_name,
    c.color_name
FROM warehouse_stock_variants wsv
LEFT JOIN sizes s ON wsv.size_id = s.id
LEFT JOIN colors c ON wsv.color_id = c.id
WHERE wsv.product_id = 6;
