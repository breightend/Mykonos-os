#!/usr/bin/env python3
"""
Script para crear envíos de prueba en el sistema de inventario
Esto permitirá probar la funcionalidad de envíos pendientes
"""

import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "src", "backend"))

from database.database import Database
from datetime import datetime


def create_test_shipments():
    db = Database()

    try:
        print("🔍 Verificando datos existentes...")

        # Verificar sucursales
        storages = db.execute_query("SELECT id, name FROM storage ORDER BY id")
        print("🏪 Sucursales disponibles:")
        for s in storages:
            print(f"  ID: {s['id']}, Nombre: {s['name']}")

        if len(storages) < 2:
            print("❌ Necesitas al menos 2 sucursales para crear envíos")
            return

        # Verificar productos
        products = db.execute_query("SELECT id, product_name FROM products LIMIT 5")
        print("\n📦 Productos disponibles:")
        for p in products:
            print(f"  ID: {p['id']}, Nombre: {p['product_name']}")

        if len(products) == 0:
            print("❌ No hay productos en la base de datos")
            return

        # Crear envío de prueba: Sucursal 2 -> Sucursal 1
        print("\n🚚 Creando envío de prueba...")

        # Insertar grupo de movimiento
        insert_group_query = """
        INSERT INTO inventory_movements_groups 
        (origin_branch_id, destination_branch_id, status, created_at, user_id)
        VALUES (%s, %s, %s, NOW(), %s)
        """

        # Ejecutar INSERT y obtener el ID del grupo
        result = db.execute_query(insert_group_query, (2, 1, "empacado", 1))

        # Obtener el ID del grupo recién creado
        group_id_query = """
        SELECT id FROM inventory_movements_groups 
        WHERE origin_branch_id = %s AND destination_branch_id = %s 
        ORDER BY created_at DESC LIMIT 1
        """
        group_result = db.execute_query(group_id_query, (2, 1))

        if not group_result:
            print("❌ Error al crear el grupo de movimiento")
            return

        group_id = group_result[0]["id"]
        print(f"✅ Grupo de movimiento creado con ID: {group_id}")

        # Insertar movimientos individuales
        for i, product in enumerate(products[:3]):  # Solo los primeros 3 productos
            insert_movement_query = """
            INSERT INTO inventory_movements 
            (inventory_movements_group_id, product_id, quantity, movement_type, created_at)
            VALUES (%s, %s, %s, %s, NOW())
            """

            quantity = (i + 1) * 2  # 2, 4, 6
            db.execute_query(
                insert_movement_query, (group_id, product["id"], quantity, "transfer")
            )
            print(f"  - Movimiento: {product['product_name']} x{quantity}")

        # Crear otro envío en tránsito
        print("\n🚚 Creando segundo envío (en tránsito)...")

        result2 = db.execute_query(insert_group_query, (2, 1, "en_transito", 1))
        group_result2 = db.execute_query(group_id_query, (2, 1))

        if group_result2:
            group_id2 = group_result2[0]["id"]
            print(f"✅ Segundo grupo creado con ID: {group_id2}")

            # Insertar un movimiento para el segundo grupo
            if len(products) > 3:
                db.execute_query(
                    insert_movement_query, (group_id2, products[3]["id"], 1, "transfer")
                )
                print(f"  - Movimiento: {products[3]['product_name']} x1")

        # Verificar resultados
        print("\n🔍 Verificando envíos creados...")

        pending_query = """
        SELECT 
            img.id,
            so.name as from_storage,
            sd.name as to_storage,
            img.status,
            img.created_at,
            COUNT(im.id) as movements_count
        FROM inventory_movements_groups img
        JOIN storage so ON img.origin_branch_id = so.id
        JOIN storage sd ON img.destination_branch_id = sd.id
        LEFT JOIN inventory_movements im ON img.id = im.inventory_movements_group_id
        WHERE img.destination_branch_id = %s 
        AND img.status IN ('empacado', 'en_transito')
        GROUP BY img.id
        ORDER BY img.created_at DESC
        """

        pending_shipments = db.execute_query(pending_query, (1,))
        print(
            f"📦 Envíos pendientes para sucursal 1: {len(pending_shipments) if pending_shipments else 0}"
        )

        if pending_shipments:
            for ship in pending_shipments:
                print(
                    f"  - ID: {ship['id']}, De: {ship['from_storage']}, Estado: {ship['status']}, Movimientos: {ship['movements_count']}"
                )

        print("\n✅ Envíos de prueba creados exitosamente!")
        print(
            "Ahora puedes probar la funcionalidad de 'Envíos Pendientes' en el frontend."
        )

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    create_test_shipments()
