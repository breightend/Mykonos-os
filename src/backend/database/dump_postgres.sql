-- PostgreSQL dump for Mykonos-os database
-- Compatible with Docker PostgreSQL containers

-- Create tables in dependency order (tables without foreign keys first)

CREATE TABLE IF NOT EXISTS responsabilidades_afip (
	id SERIAL PRIMARY KEY,
	codigo INTEGER NOT NULL,
	descripcion TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS size_categories (
	id SERIAL PRIMARY KEY,
	category_name TEXT NOT NULL UNIQUE,
	permanent BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS sizes (
	id SERIAL PRIMARY KEY,
	size_name TEXT NOT NULL,
	category_id INTEGER NOT NULL,
	description TEXT,
	FOREIGN KEY(category_id) REFERENCES size_categories(id)
);

CREATE TABLE IF NOT EXISTS colors (
	id SERIAL PRIMARY KEY,
	color_name TEXT NOT NULL,
	color_hex TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS brands (
	id SERIAL PRIMARY KEY,
	brand_name TEXT NOT NULL UNIQUE,
	description TEXT,
	creation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	last_modified_date TIMESTAMP
);

CREATE TABLE IF NOT EXISTS entities (
	id SERIAL PRIMARY KEY,
	entity_name TEXT NOT NULL,
	entity_type TEXT NOT NULL,
	razon_social TEXT NOT NULL,
	responsabilidad_iva INTEGER NOT NULL,
	domicilio_comercial TEXT NOT NULL,
	cuit TEXT NOT NULL UNIQUE,
	inicio_actividades TEXT,
	ingresos_brutos TEXT,
	contact_name TEXT,
	phone_number TEXT,
	email TEXT,
	observations TEXT
);

CREATE TABLE IF NOT EXISTS file_attachments (
	id SERIAL PRIMARY KEY,
	file_name TEXT NOT NULL,
	file_extension TEXT NOT NULL,
	file_content BYTEA NOT NULL,
	upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	comment TEXT
);

CREATE TABLE IF NOT EXISTS storage (
	id SERIAL PRIMARY KEY,
	name TEXT NOT NULL,
	address TEXT,
	postal_code TEXT,
	phone_number TEXT,
	area TEXT,
	description TEXT,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	status TEXT DEFAULT 'Activo'
);

CREATE TABLE IF NOT EXISTS users (
	id SERIAL PRIMARY KEY,
	username TEXT UNIQUE,
	fullname TEXT,
	password TEXT,
	email TEXT,
	phone TEXT,
	domicilio TEXT,
	cuit TEXT NOT NULL UNIQUE,
	role TEXT,
	status TEXT,
	session_token TEXT,
	profile_image BYTEA,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS groups (
	id SERIAL PRIMARY KEY,
	group_name TEXT NOT NULL,
	parent_group_id INTEGER,
	marked_as_root INTEGER NOT NULL DEFAULT 0,
	FOREIGN KEY(parent_group_id) REFERENCES groups(id)
);

CREATE TABLE IF NOT EXISTS products (
	id SERIAL PRIMARY KEY,
	provider_code TEXT,
	product_name TEXT NOT NULL,
	group_id INTEGER,
	provider_id INTEGER,
	description TEXT,
	cost DECIMAL(12,2),
	sale_price DECIMAL(12,2),
	tax DECIMAL(12,2),
	discount DECIMAL(12,2),
	comments TEXT,
	user_id INTEGER,
	images_ids TEXT,
	brand_id INTEGER,
	creation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	last_modified_date TIMESTAMP,
	original_price DECIMAL(12,2) DEFAULT 0,
	discount_percentage DECIMAL(5,2) DEFAULT 0,
	discount_amount DECIMAL(12,2) DEFAULT 0,
	has_discount INTEGER DEFAULT 0,
	FOREIGN KEY(brand_id) REFERENCES brands(id),
	FOREIGN KEY(group_id) REFERENCES groups(id),
	FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS purchases (
	id SERIAL PRIMARY KEY,
	entity_id INTEGER,
	purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	subtotal DECIMAL(12,2) NOT NULL,
	discount DECIMAL(12,2) DEFAULT 0.0,
	total DECIMAL(12,2) NOT NULL,
	payment_method TEXT,
	transaction_number TEXT,
	invoice_number TEXT,
	notes TEXT,
	file_id INTEGER,
	status TEXT DEFAULT 'Pendiente de entrega',
	delivery_date TIMESTAMP,
	FOREIGN KEY(entity_id) REFERENCES entities(id),
	FOREIGN KEY(file_id) REFERENCES file_attachments(id)
);

CREATE TABLE IF NOT EXISTS account_movements (
	id SERIAL PRIMARY KEY,
	numero_operacion INTEGER NOT NULL CHECK(numero_operacion > 0),
	entity_id INTEGER NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	descripcion TEXT,
	medio_pago TEXT,
	numero_de_comprobante TEXT,
	purchase_id INTEGER,
	debe DECIMAL(12,2),
	haber DECIMAL(12,2),
	saldo DECIMAL(12,2),
	file_id INTEGER,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY(entity_id) REFERENCES entities(id),
	FOREIGN KEY(file_id) REFERENCES file_attachments(id),
	FOREIGN KEY(purchase_id) REFERENCES purchases(id)
);

CREATE TABLE IF NOT EXISTS barcodes (
	id SERIAL PRIMARY KEY,
	barcode TEXT NOT NULL UNIQUE,
	product_id INTEGER,
	FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS images (
	id SERIAL PRIMARY KEY,
	image_data BYTEA NOT NULL,
	product_id INTEGER,
	FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS inventory_movements_groups (
	id SERIAL PRIMARY KEY,
	origin_branch_id INTEGER NOT NULL,
	destination_branch_id INTEGER NOT NULL,
	status TEXT NOT NULL DEFAULT 'empacado',
	movement_type TEXT NOT NULL DEFAULT 'transfer',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	shipped_at TIMESTAMP,
	delivered_at TIMESTAMP,
	received_at TIMESTAMP,
	created_by_user_id INTEGER,
	updated_by_user_id INTEGER,
	notes TEXT,
	FOREIGN KEY(created_by_user_id) REFERENCES users(id),
	FOREIGN KEY(destination_branch_id) REFERENCES storage(id),
	FOREIGN KEY(origin_branch_id) REFERENCES storage(id),
	FOREIGN KEY(updated_by_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS inventory_movements (
	id SERIAL PRIMARY KEY,
	inventory_movements_group_id INTEGER NOT NULL,
	product_id INTEGER NOT NULL,
	quantity INTEGER NOT NULL CHECK(quantity > 0),
	discount DECIMAL(12,2) DEFAULT 0.0,
	subtotal DECIMAL(12,2) NOT NULL,
	total DECIMAL(12,2) NOT NULL,
	movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY(inventory_movements_group_id) REFERENCES inventory_movements_groups(id),
	FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS product_colors (
	id SERIAL PRIMARY KEY,
	product_id INTEGER NOT NULL,
	color_id INTEGER NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY(color_id) REFERENCES colors(id),
	FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS product_sizes (
	id SERIAL PRIMARY KEY,
	product_id INTEGER NOT NULL,
	size_id INTEGER NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY(product_id) REFERENCES products(id),
	FOREIGN KEY(size_id) REFERENCES sizes(id)
);

CREATE TABLE IF NOT EXISTS proveedorxmarca (
	id_brand INTEGER NOT NULL,
	id_provider INTEGER NOT NULL,
	PRIMARY KEY(id_brand, id_provider),
	FOREIGN KEY(id_brand) REFERENCES brands(id),
	FOREIGN KEY(id_provider) REFERENCES entities(id)
);

CREATE TABLE IF NOT EXISTS purchases_detail (
	id SERIAL PRIMARY KEY,
	purchase_id INTEGER NOT NULL,
	product_id INTEGER,
	cost_price DECIMAL(12,2) NOT NULL,
	quantity INTEGER NOT NULL CHECK(quantity > 0),
	discount DECIMAL(12,2) DEFAULT 0.0,
	subtotal DECIMAL(12,2) NOT NULL,
	metadata TEXT,
	FOREIGN KEY(product_id) REFERENCES products(id),
	FOREIGN KEY(purchase_id) REFERENCES purchases(id)
);

CREATE TABLE IF NOT EXISTS sales (
	id SERIAL PRIMARY KEY,
	customer_id INTEGER,
	employee_id INTEGER NOT NULL,
	cashier_user_id INTEGER NOT NULL,
	storage_id INTEGER NOT NULL,
	sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	subtotal DECIMAL(12,2) NOT NULL,
	tax_amount DECIMAL(12,2) DEFAULT 0.0,
	discount DECIMAL(12,2) DEFAULT 0.0,
	total DECIMAL(12,2) NOT NULL,
	payment_method TEXT NOT NULL,
	payment_reference TEXT,
	invoice_number TEXT,
	receipt_number TEXT,
	notes TEXT,
	status TEXT DEFAULT 'Completada',
	refund_reason TEXT,
	refunded_at TIMESTAMP,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY(cashier_user_id) REFERENCES users(id),
	FOREIGN KEY(customer_id) REFERENCES entities(id),
	FOREIGN KEY(employee_id) REFERENCES entities(id),
	FOREIGN KEY(storage_id) REFERENCES storage(id)
);

CREATE TABLE IF NOT EXISTS warehouse_stock (
	id SERIAL PRIMARY KEY,
	product_id INTEGER NOT NULL,
	branch_id INTEGER NOT NULL,
	quantity INTEGER NOT NULL CHECK(quantity >= 0),
	last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY(branch_id) REFERENCES storage(id),
	FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS warehouse_stock_variants (
	id SERIAL PRIMARY KEY,
	product_id INTEGER NOT NULL,
	size_id INTEGER,
	color_id INTEGER,
	branch_id INTEGER NOT NULL,
	quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity >= 0),
	variant_barcode TEXT,
	last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY(branch_id) REFERENCES storage(id),
	FOREIGN KEY(color_id) REFERENCES colors(id),
	FOREIGN KEY(product_id) REFERENCES products(id),
	FOREIGN KEY(size_id) REFERENCES sizes(id)
);

CREATE TABLE IF NOT EXISTS sales_detail (
	id SERIAL PRIMARY KEY,
	sale_id INTEGER NOT NULL,
	product_id INTEGER NOT NULL,
	variant_id INTEGER,
	product_name TEXT NOT NULL,
	product_code TEXT,
	size_name TEXT,
	color_name TEXT,
	cost_price DECIMAL(12,2) NOT NULL,
	sale_price DECIMAL(12,2) NOT NULL,
	quantity INTEGER NOT NULL CHECK(quantity > 0),
	discount_percentage DECIMAL(5,2) DEFAULT 0.0,
	discount_amount DECIMAL(12,2) DEFAULT 0.0,
	tax_percentage DECIMAL(5,2) DEFAULT 0.0,
	tax_amount DECIMAL(12,2) DEFAULT 0.0,
	subtotal DECIMAL(12,2) NOT NULL,
	total DECIMAL(12,2) NOT NULL,
	profit_margin DECIMAL(12,2),
	barcode_scanned TEXT,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY(product_id) REFERENCES products(id),
	FOREIGN KEY(sale_id) REFERENCES sales(id),
	FOREIGN KEY(variant_id) REFERENCES warehouse_stock_variants(id)
);

CREATE TABLE IF NOT EXISTS sessions (
	id SERIAL PRIMARY KEY,
	user_id INTEGER NOT NULL,
	storage_id INTEGER,
	session_token TEXT NOT NULL UNIQUE,
	login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	is_active INTEGER DEFAULT 1,
	ip_address TEXT,
	user_agent TEXT,
	FOREIGN KEY(storage_id) REFERENCES storage(id),
	FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS usersxstorage (
	id_user INTEGER NOT NULL,
	id_storage INTEGER NOT NULL,
	PRIMARY KEY(id_user, id_storage),
	FOREIGN KEY(id_storage) REFERENCES storage(id),
	FOREIGN KEY(id_user) REFERENCES users(id)
);

-- Sample data inserts (in dependency order)

-- First insert entities (referenced by account_movements)
INSERT INTO entities (id, entity_name, entity_type, razon_social, responsabilidad_iva, domicilio_comercial, cuit, inicio_actividades, ingresos_brutos, contact_name, phone_number, email, observations) VALUES 
(1, 'IODI', 'provider', '111', 222, 'Buenos Aires 32', '27112233225', '2025-07-30', '0', 'Jose Luis', '0114225141', 'iodi@mail.com', 'Proveedor de pantalones'),
(2, 'Juan Luis', 'client', '122', 2222, 'Duarte Quiroz 34', '11558866', NULL, NULL, '', '03514225141', 'jaun@mail.com', 'Suele comprar Jeans'),
(3, 'Ana Gabriel', 'client', '11', 22, 'Sta Fe 44', '1155446633', NULL, NULL, '', '03512514149', 'ana@mail.com', 'buen clienta');

-- Then insert brands
INSERT INTO brands (id, brand_name, description, creation_date, last_modified_date) VALUES 
(1, 'Marca 1', 'Nada interesante de esto la verdad', '2025-08-01T00:16:19.508Z', '2025-08-01T00:16:19.508Z');

-- Insert colors
INSERT INTO colors (id, color_name, color_hex) VALUES 
(2, 'Negro', '#000000'),
(3, 'Rojo', '#ff0000'),
(4, 'Verde', '#59ff00'),
(5, 'Azul', '#002aff');

-- Insert groups
INSERT INTO groups (id, group_name, parent_group_id, marked_as_root) VALUES 
(1, 'Remera', NULL, 1),
(2, 'Pantalon', NULL, 1),
(3, 'Remera gasa', 1, 0),
(4, 'Jean', 2, 1);

-- Now insert account_movements (references entities)
INSERT INTO account_movements (id, numero_operacion, entity_id, created_at, descripcion, medio_pago, numero_de_comprobante, purchase_id, debe, haber, saldo, file_id, updated_at) VALUES 
(1, 1, 1, '2025-08-05 10:19:21', 'Test debit movement - Venta a cuenta corriente', 'cuenta_corriente', NULL, NULL, 150.5, 0.0, 150.5, NULL, '2025-08-05 10:19:21'),
(2, 2, 1, '2025-08-05 10:19:46', 'Test debit movement - Venta a cuenta corriente', 'cuenta_corriente', NULL, NULL, 150.5, 0.0, 301.0, NULL, '2025-08-05 10:19:46'),
(3, 3, 2, '2025-08-05 10:26:39', 'Venta a cuenta corriente - Total: $15300', 'cuenta_corriente', NULL, NULL, 15300.0, 0.0, 15300.0, NULL, '2025-08-05 10:26:39'),
(4, 4, 2, '2025-08-05 10:33:16', 'Test sale - Pago parcial: $50.00 - Deuda: $100.50', 'cuenta_corriente', NULL, NULL, 100.5, 0.0, 15400.5, NULL, '2025-08-05 10:33:16'),
(5, 5, 2, '2025-08-05 11:04:44', 'Pago parcial en efectivo', 'efectivo', 'REC-001', NULL, 0.0, 5000.0, 10400.5, NULL, '2025-08-05 11:04:44'),
(6, 6, 2, '2025-08-05 11:05:52', 'Venta a cuenta corriente - Total: $15300', 'cuenta_corriente', NULL, NULL, 15300.0, 0.0, 25700.5, NULL, '2025-08-05 11:05:52'),
(7, 7, 2, '2025-08-05 11:06:42', 'Venta a cuenta corriente - Total: $15300 - Pago inicial (efectivo): $1.34 - Pago parcial (efectivo): $1.34 - Deuda: $15298.66', 'cuenta_corriente', NULL, NULL, 15298.66, 0.0, 40999.16, NULL, '2025-08-05 11:06:42'),
(8, 8, 2, '2025-08-05 11:15:15', 'Pago recibido (Efectivo)', 'efectivo', NULL, NULL, 0.0, 1000.0, 39999.16, NULL, '2025-08-05 11:15:15'),
(9, 9, 1, '2025-08-05 11:37:29', 'Devolución - Venta #2 - Motivo: Producto defectuoso', 'devolucion', NULL, NULL, 0.0, 150.5, 150.5, NULL, '2025-08-05 11:37:29');

-- Update sequences to match inserted data
SELECT setval('account_movements_id_seq', (SELECT MAX(id) FROM account_movements));
SELECT setval('brands_id_seq', (SELECT MAX(id) FROM brands));
SELECT setval('colors_id_seq', (SELECT MAX(id) FROM colors));
SELECT setval('entities_id_seq', (SELECT MAX(id) FROM entities));
SELECT setval('groups_id_seq', (SELECT MAX(id) FROM groups));
