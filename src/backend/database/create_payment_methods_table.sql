CREATE TABLE IF NOT EXISTS payment_methods (



    id SERIAL PRIMARY KEY,


    method_name VARCHAR(100) NOT NULL UNIQUE,


    display_name VARCHAR(200) NOT NULL,


    description TEXT,


    is_active BOOLEAN NOT NULL DEFAULT true,


    requires_reference BOOLEAN NOT NULL DEFAULT false,


    icon_name VARCHAR(50),


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP


);

INSERT INTO payment_methods (method_name, display_name, description, requires_reference, icon_name)
VALUES 
    ('efectivo', 'Efectivo', 'Pago en efectivo', false, 'HandCoins'),
    ('tarjeta_debito', 'Tarjeta de Débito', 'Pago con tarjeta de débito', true, 'CreditCard'),
    ('tarjeta_credito', 'Tarjeta de Crédito', 'Pago con tarjeta de crédito', true, 'CreditCard'),
    ('transferencia', 'Transferencia Bancaria', 'Transferencia bancaria', true, 'Landmark'),
    ('cheque', 'Cheque', 'Pago con cheque', true, 'CheckCircle'),
    ('cuenta_corriente', 'Cuenta Corriente', 'Pago a cuenta corriente', false, 'FileText')


ON CONFLICT (method_name) DO NOTHING;
-- Agregar trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';



DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();