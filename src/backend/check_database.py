from database.database import Database

# Crear conexión a la base de datos
db = Database()

# Verificar qué tablas existen
print("=== TABLAS DISPONIBLES ===")
tables_query = 'SELECT name FROM sqlite_master WHERE type="table"'
tables = db.execute_query(tables_query)
for table in tables:
    print(f"- {table[0]}")

print("\n=== ESTRUCTURA DE LA TABLA PRODUCTS ===")
try:
    schema_query = "PRAGMA table_info(products)"
    schema = db.execute_query(schema_query)
    for column in schema:
        print(
            f"{column[1]} - {column[2]} - Nullable: {not column[3]} - Default: {column[4]}"
        )
except Exception as e:
    print(f"Error: {e}")

print("\n=== DATOS EN LA TABLA PRODUCTS ===")
try:
    products_query = "SELECT * FROM products LIMIT 10"
    products = db.execute_query(products_query)
    print(f"Total productos encontrados: {len(products)}")
    for product in products:
        print(product)
except Exception as e:
    print(f"Error: {e}")

print("\n=== DATOS EN LA TABLA WAREHOUSE_STOCK ===")
try:
    stock_query = "SELECT * FROM warehouse_stock LIMIT 10"
    stock = db.execute_query(stock_query)
    print(f"Total registros de stock encontrados: {len(stock)}")
    for item in stock:
        print(item)
except Exception as e:
    print(f"Error: {e}")

print("\n=== DATOS EN LA TABLA STORAGE ===")
try:
    storage_query = "SELECT * FROM storage LIMIT 10"
    storages = db.execute_query(storage_query)
    print(f"Total sucursales encontradas: {len(storages)}")
    for storage in storages:
        print(storage)
except Exception as e:
    print(f"Error: {e}")
