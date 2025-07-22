#!/usr/bin/env python3
"""
Script para verificar y corregir problemas de inventario
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import Database


def main():
    print("🔧 DIAGNÓSTICO Y CORRECCIÓN DE INVENTARIO\n")

    db = Database()

    # 1. Verificar tablas esenciales
    print("1. Verificando estructura de base de datos...")
    try:
        tables_needed = [
            "products",
            "warehouse_stock",
            "storage",
            "brands",
            "colors",
            "product_colors",
        ]
        tables_query = "SELECT name FROM sqlite_master WHERE type='table'"
        existing_tables = [row[0] for row in db.execute_query(tables_query)]

        missing_tables = [
            table for table in tables_needed if table not in existing_tables
        ]
        if missing_tables:
            print(f"❌ Faltan tablas: {missing_tables}")
            return False
        else:
            print("✅ Todas las tablas necesarias existen")
    except Exception as e:
        print(f"❌ Error verificando tablas: {e}")
        return False

    # 2. Verificar datos
    print("\n2. Verificando datos...")
    try:
        counts = {}
        for table in tables_needed:
            count = db.execute_query(f"SELECT COUNT(*) FROM {table}")[0][0]
            counts[table] = count
            print(f"   {table}: {count} registros")

        if counts["products"] == 0:
            print("\n⚠️  No hay productos. Insertando datos de ejemplo...")
            # Importar y ejecutar sample_inventory_data
            from sample_inventory_data import insert_sample_data

            insert_sample_data()
            print("✅ Datos de ejemplo insertados")
    except Exception as e:
        print(f"❌ Error verificando datos: {e}")
        return False

    # 3. Probar query del endpoint
    print("\n3. Probando query del endpoint de inventario...")
    try:
        query = """
        SELECT 
            p.id,
            p.product_name as producto,
            COALESCE(b.brand_name, 'Sin marca') as marca,
            ws.quantity as cantidad,
            s.name as sucursal,
            s.id as sucursal_id,
            COALESCE(p.last_modified_date, datetime('now')) as fecha,
            COALESCE(GROUP_CONCAT(DISTINCT c.color_name, ', '), 'Sin colores') as colores
        FROM warehouse_stock ws
        JOIN products p ON ws.product_id = p.id
        JOIN storage s ON ws.branch_id = s.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN product_colors pc ON p.id = pc.product_id
        LEFT JOIN colors c ON pc.color_id = c.id
        WHERE s.status = 'Activo'
        GROUP BY p.id, ws.branch_id
        ORDER BY p.product_name, s.name
        """

        results = db.execute_query(query)
        print(f"✅ Query ejecutada exitosamente. {len(results)} productos encontrados")

        if len(results) > 0:
            print("\nEjemplo de datos:")
            for i, row in enumerate(results[:3]):
                print(f"  {i + 1}. {row[1]} ({row[2]}) - {row[4]}: {row[3]} unidades")
        else:
            print("⚠️  No se encontraron productos con stock")

    except Exception as e:
        print(f"❌ Error en query del endpoint: {e}")
        import traceback

        traceback.print_exc()
        return False

    # 4. Verificar que hay stock con cantidad > 0
    print("\n4. Verificando stock disponible...")
    try:
        stock_query = "SELECT COUNT(*) FROM warehouse_stock WHERE quantity > 0"
        stock_with_quantity = db.execute_query(stock_query)[0][0]
        print(f"✅ {stock_with_quantity} productos tienen stock > 0")

        if stock_with_quantity == 0:
            print("⚠️  Todos los productos tienen stock 0. Actualizando algunos...")
            update_query = """
            UPDATE warehouse_stock 
            SET quantity = CASE 
                WHEN product_id % 3 = 0 THEN 10
                WHEN product_id % 3 = 1 THEN 5
                ELSE 15
            END
            WHERE product_id <= 3
            """
            db.execute_update(update_query)
            print("✅ Stock actualizado para algunos productos")

    except Exception as e:
        print(f"❌ Error verificando stock: {e}")

    print("\n🎉 Diagnóstico completado!")
    return True


if __name__ == "__main__":
    success = main()
    if success:
        print(
            "\n✅ Todo parece estar en orden. El endpoint de inventario debería funcionar ahora."
        )
    else:
        print("\n❌ Se encontraron problemas que requieren atención.")
