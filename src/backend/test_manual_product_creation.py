#!/usr/bin/env python3
"""
Script para probar la funcionalidad de creación de productos con variantes
"""

import sys
import os

# Agregar el directorio actual al path para poder importar modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import Database
from datetime import datetime


def test_product_creation_with_variants():
    print("🔍 PRUEBA DE CREACIÓN DE PRODUCTO CON VARIANTES")

    db = Database()

    # 1. Crear un producto de prueba
    product_data = {
        "barcode": "1234567890123",
        "provider_code": "PROV-001",
        "product_name": "Producto de Prueba Variantes",
        "group_id": 1,  # Asumiendo que existe
        "provider_id": 1,  # Asumiendo que existe
        "description": "Producto para probar variantes de stock",
        "cost": 50.0,
        "sale_price": 100.0,
        "tax": 21.0,
        "discount": 0.0,
        "comments": "Prueba de variantes",
        "user_id": 1,
        "brand_id": 1,  # Asumiendo que existe
        "creation_date": datetime.now().isoformat(),
        "last_modified_date": datetime.now().isoformat(),
    }

    print("📝 Creando producto...")
    product_result = db.add_record("products", product_data)

    if not product_result.get("success"):
        print(f"❌ Error creando producto: {product_result.get('message')}")
        return

    product_id = product_result.get("rowid")
    print(f"✅ Producto creado con ID: {product_id}")

    # 2. Crear algunas variantes de prueba
    storage_id = 1  # Asumiendo que existe una sucursal

    # Verificar que existan talles y colores
    sizes_result = db.execute_query("SELECT id, size_name FROM sizes LIMIT 3")
    colors_result = db.execute_query("SELECT id, color_name FROM colors LIMIT 3")

    if not sizes_result or not colors_result:
        print("❌ No hay talles o colores suficientes en la BD")
        return

    print(f"🔍 Talles disponibles: {sizes_result}")
    print(f"🔍 Colores disponibles: {colors_result}")

    # Crear variantes específicas
    stock_variants = [
        {
            "product_id": product_id,
            "branch_id": storage_id,
            "size_id": sizes_result[0][0],
            "color_id": colors_result[0][0],
            "quantity": 10,
            "last_updated": datetime.now().isoformat(),
        },
        {
            "product_id": product_id,
            "branch_id": storage_id,
            "size_id": sizes_result[0][0],
            "color_id": colors_result[1][0],
            "quantity": 15,
            "last_updated": datetime.now().isoformat(),
        },
        {
            "product_id": product_id,
            "branch_id": storage_id,
            "size_id": sizes_result[1][0],
            "color_id": colors_result[0][0],
            "quantity": 7,
            "last_updated": datetime.now().isoformat(),
        },
    ]

    print(f"📝 Creando {len(stock_variants)} variantes...")

    variants_created = 0
    for i, variant in enumerate(stock_variants):
        print(
            f"  Creando variante {i + 1}: Talle {variant['size_id']}, Color {variant['color_id']}, Cantidad {variant['quantity']}"
        )

        result = db.add_record("warehouse_stock_variants", variant)

        if result.get("success"):
            variants_created += 1
            print(f"    ✅ Variante creada con ID: {result.get('rowid')}")
        else:
            print(f"    ❌ Error: {result.get('message')}")

    print(f"\n📊 RESUMEN:")
    print(f"  - Producto ID: {product_id}")
    print(f"  - Variantes creadas: {variants_created}/{len(stock_variants)}")

    # 3. Verificar que las variantes se crearon correctamente
    print(f"\n🔍 VERIFICANDO VARIANTES CREADAS...")
    variants_query = """
    SELECT wsv.id, wsv.quantity, s.size_name, c.color_name
    FROM warehouse_stock_variants wsv
    LEFT JOIN sizes s ON wsv.size_id = s.id
    LEFT JOIN colors c ON wsv.color_id = c.id
    WHERE wsv.product_id = ?
    """

    created_variants = db.execute_query(variants_query, (product_id,))

    if created_variants:
        print(f"✅ {len(created_variants)} variantes encontradas:")
        for v in created_variants:
            print(f"  - ID: {v[0]}, Cantidad: {v[1]}, Talle: {v[2]}, Color: {v[3]}")
    else:
        print("❌ No se encontraron variantes para el producto")


if __name__ == "__main__":
    test_product_creation_with_variants()
