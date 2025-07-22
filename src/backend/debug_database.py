from database.database import Database
import json


def check_database():
    db = Database()

    print("=== VERIFICACIÓN DE BASE DE DATOS ===\n")

    # Verificar tablas
    print("1. TABLAS DISPONIBLES:")
    tables_query = 'SELECT name FROM sqlite_master WHERE type="table"'
    tables = db.execute_query(tables_query)
    for table in tables:
        print(f"   - {table[0]}")

    # Verificar estructura de products
    print("\n2. ESTRUCTURA DE LA TABLA PRODUCTS:")
    try:
        schema_query = "PRAGMA table_info(products)"
        schema = db.execute_query(schema_query)
        for column in schema:
            print(
                f"   {column[1]} ({column[2]}) - Nullable: {not column[3]} - Default: {column[4]}"
            )
    except Exception as e:
        print(f"   Error: {e}")

    # Contar productos
    print("\n3. CONTEO DE PRODUCTOS:")
    try:
        count_query = "SELECT COUNT(*) FROM products"
        count = db.execute_query(count_query)
        print(f"   Total productos: {count[0][0]}")
    except Exception as e:
        print(f"   Error: {e}")

    # Verificar algunos productos
    print("\n4. PRIMEROS 5 PRODUCTOS:")
    try:
        products_query = "SELECT id, product_name, brand_id, last_modified_date FROM products LIMIT 5"
        products = db.execute_query(products_query)
        for product in products:
            print(
                f"   ID: {product[0]}, Nombre: {product[1]}, Brand ID: {product[2]}, Fecha: {product[3]}"
            )
    except Exception as e:
        print(f"   Error: {e}")

    # Verificar warehouse_stock
    print("\n5. CONTEO DE STOCK:")
    try:
        stock_count_query = "SELECT COUNT(*) FROM warehouse_stock"
        stock_count = db.execute_query(stock_count_query)
        print(f"   Total registros de stock: {stock_count[0][0]}")
    except Exception as e:
        print(f"   Error: {e}")

    # Verificar primeros registros de stock
    print("\n6. PRIMEROS 5 REGISTROS DE STOCK:")
    try:
        stock_query = (
            "SELECT id, product_id, branch_id, quantity FROM warehouse_stock LIMIT 5"
        )
        stock = db.execute_query(stock_query)
        for item in stock:
            print(
                f"   ID: {item[0]}, Product ID: {item[1]}, Branch ID: {item[2]}, Cantidad: {item[3]}"
            )
    except Exception as e:
        print(f"   Error: {e}")

    # Verificar storage/sucursales
    print("\n7. SUCURSALES DISPONIBLES:")
    try:
        storage_query = "SELECT id, name, status FROM storage"
        storages = db.execute_query(storage_query)
        for storage in storages:
            print(f"   ID: {storage[0]}, Nombre: {storage[1]}, Status: {storage[2]}")
    except Exception as e:
        print(f"   Error: {e}")

    # Probar la query del endpoint
    print("\n8. PRUEBA DE QUERY DEL ENDPOINT:")
    try:
        endpoint_query = """
        SELECT 
            p.id,
            p.product_name as producto,
            b.brand_name as marca,
            ws.quantity as cantidad,
            s.name as sucursal,
            s.id as sucursal_id,
            p.last_modified_date as fecha,
            GROUP_CONCAT(DISTINCT c.color_name, ', ') as colores
        FROM warehouse_stock ws
        JOIN products p ON ws.product_id = p.id
        JOIN storage s ON ws.branch_id = s.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN product_colors pc ON p.id = pc.product_id
        LEFT JOIN colors c ON pc.color_id = c.id
        GROUP BY p.id, ws.branch_id
        ORDER BY p.product_name, s.name
        LIMIT 5
        """
        results = db.execute_query(endpoint_query)
        print(f"   Resultados encontrados: {len(results)}")
        for result in results:
            print(
                f"   {json.dumps(dict(zip(['id', 'producto', 'marca', 'cantidad', 'sucursal', 'sucursal_id', 'fecha', 'colores'], result)), ensure_ascii=False)}"
            )
    except Exception as e:
        print(f"   Error: {e}")


if __name__ == "__main__":
    check_database()
