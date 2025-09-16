-- Fix integer overflow issues for large product IDs
-- Change product_id columns from INTEGER to BIGINT

-- First, change the products table id column to BIGINT
ALTER TABLE products ALTER COLUMN id TYPE BIGINT;

-- Change product_id references in other tables to BIGINT
ALTER TABLE purchases_detail ALTER COLUMN product_id TYPE BIGINT;

-- Check if there are other tables that reference product_id
ALTER TABLE warehouse_stock ALTER COLUMN product_id TYPE BIGINT;
ALTER TABLE warehouse_stock_variants ALTER COLUMN product_id TYPE BIGINT;
ALTER TABLE sales_detail ALTER COLUMN product_id TYPE BIGINT;
ALTER TABLE images ALTER COLUMN product_id TYPE BIGINT;
ALTER TABLE product_sizes ALTER COLUMN product_id TYPE BIGINT;
ALTER TABLE product_colors ALTER COLUMN product_id TYPE BIGINT;
ALTER TABLE inventory_movements ALTER COLUMN product_id TYPE BIGINT;

-- Also change any other potential ID fields that might have large values
-- Check if purchase_id might also need to be BIGINT in the future
-- For now, keeping it as INTEGER since purchases are sequential

-- Add a comment to track this change
COMMENT ON COLUMN products.id IS 'Changed to BIGINT to support large timestamp-based IDs';
COMMENT ON COLUMN purchases_detail.product_id IS 'Changed to BIGINT to support large timestamp-based product IDs';
