-- Fix inventory_movements table to include variant information

-- Add variant information columns
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS variant_id INTEGER;
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS size_id INTEGER;
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS color_id INTEGER;
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS variant_barcode TEXT;

-- Add foreign key constraints (if they don't exist)
DO $$ 
BEGIN
    -- Add foreign key for variant_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_inventory_movements_variant'
    ) THEN
        ALTER TABLE inventory_movements 
        ADD CONSTRAINT fk_inventory_movements_variant 
        FOREIGN KEY (variant_id) REFERENCES warehouse_stock_variants(id);
    END IF;
    
    -- Add foreign key for size_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_inventory_movements_size'
    ) THEN
        ALTER TABLE inventory_movements 
        ADD CONSTRAINT fk_inventory_movements_size 
        FOREIGN KEY (size_id) REFERENCES sizes(id);
    END IF;
    
    -- Add foreign key for color_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_inventory_movements_color'
    ) THEN
        ALTER TABLE inventory_movements 
        ADD CONSTRAINT fk_inventory_movements_color 
        FOREIGN KEY (color_id) REFERENCES colors(id);
    END IF;
END $$;
