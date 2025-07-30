#!/usr/bin/env python3
"""
Script para probar y crear datos de ejemplo para warehouse_stock_variants
"""

from database.database import Database
from datetime import datetime


def test_variants():
    db = Database()

    try:
        # Verificar si la tabla existe
        print("🔍 Verificando tabla warehouse_stock_variants...")
        structure = db.execute_query("PRAGMA table_info(warehouse_stock_variants)")
        if not structure:
            print("❌ La tabla warehouse_stock_variants no existe")
            return

        print("✅ Tabla existe. Estructura:")
        for col in structure:
            print(f"  - {col[1]} ({col[2]})")

        # Contar registros existentes
        count_result = db.execute_query(
            "SELECT COUNT(*) as count FROM warehouse_stock_variants"
        )
        count = count_result[0]["count"] if count_result else 0
        print(f"\n📊 Registros existentes: {count}")

        # Mostrar algunos registros si existen
        if count > 0:
            sample = db.execute_query("SELECT * FROM warehouse_stock_variants LIMIT 5")
            print("\n📋 Registros de ejemplo:")
            for i, record in enumerate(sample):
                print(
                    f"  {i + 1}. Product: {record.get('product_id')}, Size: {record.get('size_id')}, Color: {record.get('color_id')}, Quantity: {record.get('quantity')}"
                )

        # Verificar productos, talles y colores disponibles
        print("\n🔍 Verificando datos relacionados...")

        products = db.execute_query("SELECT id, product_name FROM products LIMIT 3")
        print(f"📦 Productos disponibles: {len(products) if products else 0}")
        if products:
            for p in products[:3]:
                print(f"  - ID {p.get('id')}: {p.get('product_name')}")

        sizes = db.execute_query("SELECT id, size_name FROM sizes LIMIT 5")
        print(f"📏 Talles disponibles: {len(sizes) if sizes else 0}")
        if sizes:
            for s in sizes[:3]:
                print(f"  - ID {s.get('id')}: {s.get('size_name')}")

        colors = db.execute_query("SELECT id, color_name FROM colors LIMIT 5")
        print(f"🎨 Colores disponibles: {len(colors) if colors else 0}")
        if colors:
            for c in colors[:3]:
                print(f"  - ID {c.get('id')}: {c.get('color_name')}")

        storage = db.execute_query("SELECT id, name FROM storage LIMIT 3")
        print(f"🏪 Sucursales disponibles: {len(storage) if storage else 0}")
        if storage:
            for st in storage[:3]:
                print(f"  - ID {st.get('id')}: {st.get('name')}")

        # Si no hay registros de variantes, crear algunos de ejemplo
        if count == 0 and products and sizes and colors and storage:
            print("\n🆕 Creando registros de ejemplo...")

            # Tomar el primer producto, talle, color y sucursal
            product_id = products[0]["id"]
            size_id = sizes[0]["id"]
            color_id = colors[0]["id"]
            branch_id = storage[0]["id"]

            # Crear un registro de ejemplo
            variant_data = {
                "product_id": product_id,
                "branch_id": branch_id,
                "size_id": size_id,
                "color_id": color_id,
                "quantity": 10,
                "last_updated": datetime.now().isoformat(),
            }

            result = db.add_record("warehouse_stock_variants", variant_data)
            if result.get("success"):
                print(
                    f"✅ Creado registro de ejemplo: Producto {product_id}, Talle {size_id}, Color {color_id}, Cantidad 10"
                )
            else:
                print(f"❌ Error creando registro: {result.get('message')}")

        # Verificar el query del endpoint
        print("\n🔍 Probando query del endpoint...")
        if products:
            product_id = products[0]["id"]
            variants_query = """
            SELECT 
                wsv.id,
                s.size_name,
                c.color_name,
                c.color_hex,
                st.name as sucursal_nombre,
                st.id as sucursal_id,
                wsv.quantity,
                wsv.last_updated,
                wsv.size_id,
                wsv.color_id
            FROM warehouse_stock_variants wsv
            LEFT JOIN sizes s ON wsv.size_id = s.id
            LEFT JOIN colors c ON wsv.color_id = c.id
            JOIN storage st ON wsv.branch_id = st.id
            WHERE wsv.product_id = ?
            ORDER BY s.size_name, c.color_name, st.name
            """

            variants_result = db.execute_query(variants_query, (product_id,))
            print(
                f"📊 Query resultado para producto {product_id}: {len(variants_result) if variants_result else 0} registros"
            )

            if variants_result:
                print("📋 Datos encontrados:")
                for v in variants_result[:3]:
                    print(
                        f"  - Talle: {v.get('size_name')}, Color: {v.get('color_name')}, Cantidad: {v.get('quantity')}"
                    )
            else:
                print("❌ No se encontraron variantes para este producto")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    test_variants()
