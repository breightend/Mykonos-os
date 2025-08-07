-- Migración para agregar campos de variante a la tabla inventory_movements
-- Esto permitirá almacenar información específica de variantes en los movimientos

-- Agregar campos para variantes
ALTER TABLE inventory_movements 
ADD COLUMN variant_id INTEGER,
ADD COLUMN size_id INTEGER,
ADD COLUMN color_id INTEGER,
ADD COLUMN variant_barcode VARCHAR(20);

-- Agregar foreign keys para mantener integridad referencial
ALTER TABLE inventory_movements 
ADD CONSTRAINT fk_inventory_movements_variant 
FOREIGN KEY (variant_id) REFERENCES warehouse_stock_variants(id);

ALTER TABLE inventory_movements 
ADD CONSTRAINT fk_inventory_movements_size 
FOREIGN KEY (size_id) REFERENCES sizes(id);

ALTER TABLE inventory_movements 
ADD CONSTRAINT fk_inventory_movements_color 
FOREIGN KEY (color_id) REFERENCES colors(id);

-- Crear índices para mejorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant_id ON inventory_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_size_id ON inventory_movements(size_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_color_id ON inventory_movements(color_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant_barcode ON inventory_movements(variant_barcode);

-- Mostrar información de la tabla actualizada
\d inventory_movements;
