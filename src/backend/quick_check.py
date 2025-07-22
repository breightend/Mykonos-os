from database.database import Database
import json


def quick_check():
    """Verificación rápida de datos en la base de datos"""
    db = Database()

    print("=== VERIFICACIÓN RÁPIDA DE BASE DE DATOS ===\n")

    try:
        # Contar productos
        products_count = db.execute_query("SELECT COUNT(*) FROM products")[0][0]
        print(f"📦 Total productos: {products_count}")

        # Contar stock
        stock_count = db.execute_query("SELECT COUNT(*) FROM warehouse_stock")[0][0]
        print(f"📊 Total registros de stock: {stock_count}")

        # Contar sucursales
        storage_count = db.execute_query("SELECT COUNT(*) FROM storage")[0][0]
        print(f"🏪 Total sucursales: {storage_count}")

        if products_count == 0:
            print("\n⚠️  No hay productos en la base de datos!")
            print("Ejecutando sample_inventory_data.py...")
            import subprocess
            import sys

            result = subprocess.run(
                [sys.executable, "sample_inventory_data.py"],
                capture_output=True,
                text=True,
            )
            print(result.stdout)
            if result.stderr:
                print("Errores:", result.stderr)
        else:
            print(f"\n✅ Hay datos en la base de datos")

            # Mostrar query del endpoint
            print("\n🔍 Probando query del endpoint:")
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
            print(f"📋 Resultados encontrados: {len(results)}")

            for i, result in enumerate(results):
                print(f"\n  Producto {i + 1}:")
                print(f"    ID: {result[0]}")
                print(f"    Producto: {result[1]}")
                print(f"    Marca: {result[2]}")
                print(f"    Cantidad: {result[3]}")
                print(f"    Sucursal: {result[4]}")
                print(f"    Fecha: {result[6]}")
                print(f"    Colores: {result[7]}")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    quick_check()
