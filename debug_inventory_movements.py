#!/usr/bin/env python3

import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "src", "backend"))

from database.database import Database


def debug_inventory_movements():
    """Debug inventory movements data"""
    try:
        db = Database()

        print("🔍 === DEBUG INVENTORY MOVEMENTS ===")

        # 1. Verificar estructura de inventory_movements
        print("\n📋 Estructura de inventory_movements:")
        try:
            result = db.execute_query("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'inventory_movements' 
                ORDER BY ordinal_position
            """)
            for col in result:
                print(f"  - {col['column_name']}: {col['data_type']}")
        except Exception as e:
            print(f"❌ Error obteniendo estructura: {e}")

        # 2. Verificar datos en inventory_movements
        print("\n📦 Datos en inventory_movements:")
        try:
            movements = db.execute_query("SELECT * FROM inventory_movements LIMIT 3")
            if movements:
                print(f"✅ Encontrados {len(movements)} registros")
                for i, mov in enumerate(movements):
                    print(
                        f"  [{i + 1}] ID: {mov['id']}, Group: {mov['inventory_movements_group_id']}, Product: {mov['product_id']}"
                    )
                    # Verificar si tiene variant_barcode
                    if "variant_barcode" in mov:
                        print(f"      Variant Code: {mov['variant_barcode']}")
                    if "size_id" in mov:
                        print(f"      Size ID: {mov['size_id']}")
                    if "color_id" in mov:
                        print(f"      Color ID: {mov['color_id']}")
            else:
                print("❌ No hay datos en inventory_movements")
        except Exception as e:
            print(f"❌ Error obteniendo movimientos: {e}")

        # 3. Verificar grupos pendientes
        print("\n📋 Grupos de envíos pendientes:")
        try:
            groups = db.execute_query("""
                SELECT id, status, origin_branch_id, destination_branch_id, created_at
                FROM inventory_movements_groups 
                WHERE status IN ('empacado', 'en_transito')
                ORDER BY created_at DESC
                LIMIT 5
            """)
            if groups:
                print(f"✅ Encontrados {len(groups)} grupos pendientes")
                for group in groups:
                    print(f"  - Group ID: {group['id']}, Status: {group['status']}")
                    print(
                        f"    From: {group['origin_branch_id']} → To: {group['destination_branch_id']}"
                    )

                    # Verificar movimientos de este grupo
                    movements_in_group = db.execute_query(
                        """
                        SELECT im.*, p.product_name 
                        FROM inventory_movements im
                        JOIN products p ON im.product_id = p.id
                        WHERE im.inventory_movements_group_id = %s
                    """,
                        (group["id"],),
                    )

                    print(f"    Productos: {len(movements_in_group)} items")
                    for mov in movements_in_group:
                        print(f"      - {mov['product_name']} (qty: {mov['quantity']})")

            else:
                print("❌ No hay grupos pendientes")
        except Exception as e:
            print(f"❌ Error obteniendo grupos: {e}")

        # 4. Probar query específica de get_pending_shipments
        print("\n🧪 Probando query de get_pending_shipments:")
        try:
            # Usar storage_id = 1 para probar
            test_storage_id = 1

            query = """
            SELECT 
                p.product_name, 
                p.sale_price,
                p.cost,
                b.brand_name,
                im.quantity,
                s.size_name,
                c.color_name,
                c.color_hex,
                im.variant_barcode
            FROM inventory_movements im
            JOIN products p ON im.product_id = p.id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN sizes s ON im.size_id = s.id
            LEFT JOIN colors c ON im.color_id = c.id
            WHERE im.inventory_movements_group_id = %s
            ORDER BY p.product_name, s.size_name, c.color_name
            """

            # Obtener un grupo para probar
            test_groups = db.execute_query("""
                SELECT id FROM inventory_movements_groups 
                WHERE status IN ('empacado', 'en_transito')
                LIMIT 1
            """)

            if test_groups:
                test_group_id = test_groups[0]["id"]
                print(f"  Probando con group_id: {test_group_id}")

                products = db.execute_query(query, (test_group_id,))
                if products:
                    print(f"  ✅ Query exitosa, {len(products)} productos encontrados")
                    for p in products:
                        print(
                            f"    - {p['product_name']} | Marca: {p['brand_name']} | Talle: {p['size_name']} | Color: {p['color_name']}"
                        )
                        print(
                            f"      Código: {p['variant_barcode']} | Precio: ${p['sale_price']}"
                        )
                else:
                    print("  ❌ Query no retornó productos")
            else:
                print("  ❌ No hay grupos para probar")

        except Exception as e:
            print(f"❌ Error probando query: {e}")

    except Exception as e:
        print(f"❌ Error general: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    debug_inventory_movements()
