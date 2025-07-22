from database.database import Database
import json


def debug_database_data():
    print("🔍 DIAGNÓSTICO DETALLADO DE BASE DE DATOS\n")

    db = Database()

    # 1. Verificar tablas y sus contenidos
    print("1. CONTEO DE REGISTROS EN CADA TABLA:")
    tables_to_check = [
        "products",
        "warehouse_stock",
        "storage",
        "brands",
        "colors",
        "product_colors",
    ]

    for table in tables_to_check:
        try:
            count = db.execute_query(f"SELECT COUNT(*) FROM {table}")[0][0]
            print(f"   📊 {table}: {count} registros")
        except Exception as e:
            print(f"   ❌ {table}: Error - {e}")

    print("\n2. MUESTRA DE DATOS DE CADA TABLA:")

    # Verificar productos
    print("\n   📦 PRODUCTOS (primeros 3):")
    try:
        products = db.execute_query(
            "SELECT id, product_name, brand_id FROM products LIMIT 3"
        )
        for p in products:
            print(f"      ID: {p[0]}, Nombre: {p[1]}, Brand ID: {p[2]}")
    except Exception as e:
        print(f"      ❌ Error en productos: {e}")

    # Verificar warehouse_stock
    print("\n   📋 WAREHOUSE_STOCK (primeros 5):")
    try:
        stock = db.execute_query(
            "SELECT id, product_id, branch_id, quantity FROM warehouse_stock LIMIT 5"
        )
        for s in stock:
            print(
                f"      ID: {s[0]}, Product ID: {s[1]}, Branch ID: {s[2]}, Cantidad: {s[3]}"
            )
    except Exception as e:
        print(f"      ❌ Error en warehouse_stock: {e}")

    # Verificar storage
    print("\n   🏪 STORAGE (todos):")
    try:
        storages = db.execute_query("SELECT id, name, status FROM storage")
        for s in storages:
            print(f"      ID: {s[0]}, Nombre: {s[1]}, Status: {s[2]}")
    except Exception as e:
        print(f"      ❌ Error en storage: {e}")

    # Verificar brands
    print("\n   🏷️ BRANDS (primeros 3):")
    try:
        brands = db.execute_query("SELECT id, brand_name FROM brands LIMIT 3")
        for b in brands:
            print(f"      ID: {b[0]}, Nombre: {b[1]}")
    except Exception as e:
        print(f"      ❌ Error en brands: {e}")

    print("\n3. PROBANDO QUERY PRINCIPAL DEL ENDPOINT:")

    # Probar la query exacta del endpoint
    try:
        query = """
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
        """

        print(f"   🔍 Ejecutando query principal...")
        results = db.execute_query(query)
        print(f"   📊 Resultados encontrados: {len(results)}")

        if len(results) > 0:
            print("\n   📋 PRIMEROS 3 RESULTADOS:")
            for i, row in enumerate(results[:3]):
                result_dict = {
                    "id": row[0],
                    "producto": row[1],
                    "marca": row[2],
                    "cantidad": row[3],
                    "sucursal": row[4],
                    "sucursal_id": row[5],
                    "fecha": row[6],
                    "colores": row[7],
                }
                print(
                    f"      {i + 1}. {json.dumps(result_dict, ensure_ascii=False, indent=8)}"
                )
        else:
            print("   ⚠️ No se encontraron resultados. Investigando...")

            # Verificar los JOINs paso a paso
            print("\n   🔍 VERIFICANDO JOINS PASO A PASO:")

            # Solo warehouse_stock y products
            print("      a) warehouse_stock + products:")
            simple_query = """
            SELECT ws.id, p.product_name, ws.quantity
            FROM warehouse_stock ws
            JOIN products p ON ws.product_id = p.id
            LIMIT 3
            """
            simple_results = db.execute_query(simple_query)
            print(f"         Resultados: {len(simple_results)}")
            for r in simple_results[:3]:
                print(f"         - {r}")

            # Agregar storage
            print("      b) warehouse_stock + products + storage:")
            with_storage = """
            SELECT ws.id, p.product_name, s.name as storage_name, ws.quantity
            FROM warehouse_stock ws
            JOIN products p ON ws.product_id = p.id
            JOIN storage s ON ws.branch_id = s.id
            LIMIT 3
            """
            storage_results = db.execute_query(with_storage)
            print(f"         Resultados: {len(storage_results)}")
            for r in storage_results[:3]:
                print(f"         - {r}")

    except Exception as e:
        print(f"   ❌ Error en query principal: {e}")
        import traceback

        traceback.print_exc()

    print("\n4. PROBANDO QUERY DE STORAGE-LIST:")
    try:
        storage_query = """
        SELECT id, name, address, description, status
        FROM storage
        WHERE status IN ('Activo', 'Active', 'activo', 'active')
        ORDER BY name
        """
        storage_list = db.execute_query(storage_query)
        print(f"   📊 Sucursales activas encontradas: {len(storage_list)}")
        for s in storage_list:
            print(f"      - ID: {s[0]}, Nombre: {s[1]}, Status: {s[4]}")

        if len(storage_list) == 0:
            print("   ⚠️ No hay sucursales activas. Verificando todos los status:")
            all_storage = db.execute_query("SELECT id, name, status FROM storage")
            for s in all_storage:
                print(f"      - ID: {s[0]}, Nombre: {s[1]}, Status: '{s[2]}'")

    except Exception as e:
        print(f"   ❌ Error en storage-list query: {e}")


if __name__ == "__main__":
    debug_database_data()
