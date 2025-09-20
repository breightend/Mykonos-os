CREATE TABLE IF NOT EXISTS barcode_print_settings (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) DEFAULT 'default' UNIQUE,
    show_product_name BOOLEAN DEFAULT true,
    show_variant_name BOOLEAN DEFAULT true,
    show_size BOOLEAN DEFAULT true,
    show_color BOOLEAN DEFAULT true,
    show_price BOOLEAN DEFAULT false,
    show_barcode BOOLEAN DEFAULT true,
    print_width INTEGER DEFAULT 450,
    print_height INTEGER DEFAULT 200,
    font_size INTEGER DEFAULT 12,
    background_color VARCHAR(7) DEFAULT '#FFFFFF',
    text_color VARCHAR(7) DEFAULT '#000000',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configuration
INSERT INTO barcode_print_settings (user_id) VALUES ('default')
ON CONFLICT (user_id) DO NOTHING;