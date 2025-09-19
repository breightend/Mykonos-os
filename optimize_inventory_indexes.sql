-- Inventory Performance Optimization Indexes
-- These indexes will significantly improve query performance for inventory operations

-- Index for warehouse_stock lookups by product and branch
CREATE INDEX IF NOT EXISTS "idx_warehouse_stock_product_branch" 
ON "warehouse_stock" ("product_id", "branch_id");

-- Index for warehouse_stock_variants lookups by product and branch
CREATE INDEX IF NOT EXISTS "idx_warehouse_stock_variants_product_branch" 
ON "warehouse_stock_variants" ("product_id", "branch_id");

-- Index for warehouse_stock_variants lookups by size
CREATE INDEX IF NOT EXISTS "idx_warehouse_stock_variants_size" 
ON "warehouse_stock_variants" ("size_id");

-- Index for warehouse_stock_variants lookups by color
CREATE INDEX IF NOT EXISTS "idx_warehouse_stock_variants_color" 
ON "warehouse_stock_variants" ("color_id");

-- Index for warehouse_stock by branch (for storage-specific queries)
CREATE INDEX IF NOT EXISTS "idx_warehouse_stock_branch" 
ON "warehouse_stock" ("branch_id");

-- Index for warehouse_stock_variants by branch (for storage-specific queries)
CREATE INDEX IF NOT EXISTS "idx_warehouse_stock_variants_branch" 
ON "warehouse_stock_variants" ("branch_id");

-- Composite index for common variant searches
CREATE INDEX IF NOT EXISTS "idx_warehouse_stock_variants_composite" 
ON "warehouse_stock_variants" ("product_id", "size_id", "color_id", "branch_id");

-- Analyze tables to update statistics after creating indexes
ANALYZE warehouse_stock;
ANALYZE warehouse_stock_variants;