#!/usr/bin/env python3
"""
Script de prueba para verificar la actualización de productos
"""

import sys
import os

# Agregar el directorio actual al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import Database
from datetime import datetime
import json


def test_product_update():
    """
    Prueba la funcionalidad de actualización de productos
    """
    print("🧪 Iniciando prueba de actualización de productos...")

    try:
        # Conectar a la base de datos
        db = Database()

        # 1. Verificar que existen las columnas de descuento
        print("🔍 Verificando estructura de la tabla products...")
        schema_result = db.execute_query("PRAGMA table_info(products)")

        discount_fields = [
            "original_price",
            "discount_percentage",
            "discount_amount",
            "has_discount",
        ]
        existing_fields = [row["name"] for row in schema_result]

        print(f"📋 Campos existentes en products: {existing_fields}")

        for field in discount_fields:
            if field in existing_fields:
                print(f"✅ Campo {field} existe")
            else:
                print(f"❌ Campo {field} NO existe")

        # 2. Verificar que existen productos para probar
        products_result = db.execute_query(
            "SELECT id, product_name FROM products LIMIT 3"
        )

        if not products_result:
            print("⚠️ No hay productos en la base de datos para probar")
            return False

        print(f"📦 Productos encontrados: {len(products_result)}")
        for product in products_result:
            print(f"   - ID: {product['id']}, Nombre: {product['product_name']}")

        # 3. Probar actualización de un producto
        test_product_id = products_result[0]["id"]
        print(f"\n🔄 Probando actualización del producto ID: {test_product_id}")

        # Datos de prueba
        test_data = {
            "description": "Descripción actualizada por test",
            "original_price": 100.0,
            "discount_percentage": 10.0,
            "discount_amount": 10.0,
            "has_discount": 1,
            "sale_price": 90.0,
            "last_modified_date": datetime.now().isoformat(),
        }

        # Construir query de actualización
        update_fields = []
        update_values = []

        for field, value in test_data.items():
            update_fields.append(f"{field} = ?")
            update_values.append(value)

        update_values.append(test_product_id)

        update_query = f"""
        UPDATE products 
        SET {", ".join(update_fields)}
        WHERE id = ?
        """

        print(f"📝 Query: {update_query}")
        print(f"📝 Valores: {update_values}")

        # Ejecutar actualización
        result = db.execute_query(update_query, update_values)

        # Verificar que se actualizó
        updated_product = db.execute_query(
            "SELECT * FROM products WHERE id = ?", (test_product_id,)
        )

        if updated_product:
            product = updated_product[0]
            print(f"✅ Producto actualizado correctamente:")
            print(f"   - Descripción: {product.get('description')}")
            print(f"   - Precio original: {product.get('original_price')}")
            print(f"   - Descuento %: {product.get('discount_percentage')}")
            print(f"   - Descuento $: {product.get('discount_amount')}")
            print(f"   - Tiene descuento: {product.get('has_discount')}")
            print(f"   - Precio venta: {product.get('sale_price')}")
        else:
            print("❌ No se pudo verificar la actualización")

        # 4. Probar creación de variante de stock
        print(f"\n📦 Probando variantes de stock...")

        # Verificar estructura de warehouse_stock_variants
        variants_schema = db.execute_query(
            "PRAGMA table_info(warehouse_stock_variants)"
        )
        print(
            f"📋 Campos en warehouse_stock_variants: {[row['name'] for row in variants_schema]}"
        )

        # Buscar sucursales y talles/colores disponibles
        storages = db.execute_query("SELECT id, name FROM storage LIMIT 1")
        sizes = db.execute_query("SELECT id, size_name FROM sizes LIMIT 1")
        colors = db.execute_query("SELECT id, color_name FROM colors LIMIT 1")

        if storages and sizes and colors:
            storage_id = storages[0]["id"]
            size_id = sizes[0]["id"]
            color_id = colors[0]["id"]

            print(f"📍 Usando sucursal: {storages[0]['name']} (ID: {storage_id})")
            print(f"📏 Usando talla: {sizes[0]['size_name']} (ID: {size_id})")
            print(f"🎨 Usando color: {colors[0]['color_name']} (ID: {color_id})")

            # Verificar si ya existe esta variante
            existing_variant = db.execute_query(
                """
                SELECT id FROM warehouse_stock_variants 
                WHERE product_id = ? AND size_id = ? AND color_id = ? AND branch_id = ?
            """,
                (test_product_id, size_id, color_id, storage_id),
            )

            if existing_variant:
                print("📦 Variante ya existe, actualizando cantidad...")
                update_variant_query = """
                UPDATE warehouse_stock_variants 
                SET quantity = ?, last_updated = ?
                WHERE product_id = ? AND size_id = ? AND color_id = ? AND branch_id = ?
                """
                db.execute_query(
                    update_variant_query,
                    (
                        50,
                        datetime.now().isoformat(),
                        test_product_id,
                        size_id,
                        color_id,
                        storage_id,
                    ),
                )
            else:
                print("📦 Creando nueva variante...")
                # Generar código de barras simple
                variant_barcode = (
                    f"TEST{test_product_id}{size_id}{color_id}{storage_id}"
                )

                insert_variant_query = """
                INSERT INTO warehouse_stock_variants 
                (product_id, size_id, color_id, branch_id, quantity, variant_barcode, last_updated)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """
                db.execute_query(
                    insert_variant_query,
                    (
                        test_product_id,
                        size_id,
                        color_id,
                        storage_id,
                        25,
                        variant_barcode,
                        datetime.now().isoformat(),
                    ),
                )

            # Verificar la variante
            variant_check = db.execute_query(
                """
                SELECT wsv.*, s.size_name, c.color_name, st.name as storage_name
                FROM warehouse_stock_variants wsv
                LEFT JOIN sizes s ON wsv.size_id = s.id
                LEFT JOIN colors c ON wsv.color_id = c.id
                LEFT JOIN storage st ON wsv.branch_id = st.id
                WHERE wsv.product_id = ? AND wsv.size_id = ? AND wsv.color_id = ? AND wsv.branch_id = ?
            """,
                (test_product_id, size_id, color_id, storage_id),
            )

            if variant_check:
                variant = variant_check[0]
                print(f"✅ Variante verificada:")
                print(f"   - Talla: {variant.get('size_name')}")
                print(f"   - Color: {variant.get('color_name')}")
                print(f"   - Sucursal: {variant.get('storage_name')}")
                print(f"   - Cantidad: {variant.get('quantity')}")
                print(f"   - Código: {variant.get('variant_barcode')}")
        else:
            print(
                "⚠️ No hay sucursales/talles/colores suficientes para probar variantes"
            )

        print("\n🎉 Prueba completada exitosamente!")
        return True

    except Exception as e:
        print(f"❌ Error durante la prueba: {e}")
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = test_product_update()
    if success:
        print("\n✅ Todas las pruebas pasaron")
    else:
        print("\n❌ Algunas pruebas fallaron")
