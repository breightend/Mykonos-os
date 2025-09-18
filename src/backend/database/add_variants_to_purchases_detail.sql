-- Migración para agregar soporte de variantes a la tabla purchases_detail
-- Esto permitirá almacenar información específica de variantes en los detalles de compra

-- Verificar que la tabla existe
SELECT name FROM sqlite_master WHERE type='table' AND name='purchases_detail';

-- Agregar campos para variantes
ALTER TABLE purchases_detail 
ADD COLUMN variant_id INTEGER;

ALTER TABLE purchases_detail 
ADD COLUMN size_id INTEGER;

ALTER TABLE purchases_detail 
ADD COLUMN color_id INTEGER;

ALTER TABLE purchases_detail 
ADD COLUMN variant_barcode VARCHAR(20);

-- Agregar comentarios (para PostgreSQL usar COMMENT ON, para SQLite se omite)
-- COMMENT ON COLUMN purchases_detail.variant_id IS 'ID de la variante específica del producto';
-- COMMENT ON COLUMN purchases_detail.size_id IS 'ID del talle del producto';
-- COMMENT ON COLUMN purchases_detail.color_id IS 'ID del color del producto';
-- COMMENT ON COLUMN purchases_detail.variant_barcode IS 'Código de barras específico de la variante';

-- Crear índices para mejorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_purchases_detail_variant_id ON purchases_detail(variant_id);
CREATE INDEX IF NOT EXISTS idx_purchases_detail_size_id ON purchases_detail(size_id);
CREATE INDEX IF NOT EXISTS idx_purchases_detail_color_id ON purchases_detail(color_id);
CREATE INDEX IF NOT EXISTS idx_purchases_detail_variant_barcode ON purchases_detail(variant_barcode);

-- Mostrar la estructura actualizada de la tabla
-- .schema purchases_detail;

-- Verificar que las columnas se agregaron correctamente
PRAGMA table_info(purchases_detail);