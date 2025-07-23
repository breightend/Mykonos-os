#!/usr/bin/env python3
"""
Script de debug para verificar las imágenes en la base de datos
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import Database


def check_images():
    """Verificar las imágenes en la base de datos"""
    db = Database()

    # Verificar productos con images_ids
    print("🔍 Verificando productos con images_ids...")
    products_query = "SELECT id, product_name, images_ids FROM products WHERE images_ids IS NOT NULL AND images_ids != ''"
    products_result = db.execute_query(products_query)

    if products_result:
        print(f"✅ Encontrados {len(products_result)} productos con images_ids:")
        for product in products_result:
            if isinstance(product, dict):
                print(
                    f"   - ID: {product.get('id')}, Nombre: {product.get('product_name')}, images_ids: {product.get('images_ids')}"
                )
            else:
                print(
                    f"   - ID: {product[0]}, Nombre: {product[1]}, images_ids: {product[2]}"
                )
    else:
        print("❌ No se encontraron productos con images_ids")

    print("\n🔍 Verificando tabla de imágenes...")
    images_query = "SELECT id, product_id, LENGTH(image_data) as size FROM images"
    images_result = db.execute_query(images_query)

    if images_result:
        print(f"✅ Encontradas {len(images_result)} imágenes:")
        for image in images_result:
            if isinstance(image, dict):
                print(
                    f"   - Image ID: {image.get('id')}, Product ID: {image.get('product_id')}, Size: {image.get('size')} bytes"
                )
            else:
                print(
                    f"   - Image ID: {image[0]}, Product ID: {image[1]}, Size: {image[2]} bytes"
                )
    else:
        print("❌ No se encontraron imágenes en la tabla")

    # Verificar si hay productos con images_ids que no tienen imagen real
    print("\n🔍 Verificando consistency entre products e images...")
    if products_result and images_result:
        product_ids_with_images_ids = set()
        for product in products_result:
            product_id = product.get("id") if isinstance(product, dict) else product[0]
            product_ids_with_images_ids.add(product_id)

        product_ids_with_actual_images = set()
        for image in images_result:
            product_id = (
                image.get("product_id") if isinstance(image, dict) else image[1]
            )
            product_ids_with_actual_images.add(product_id)

        missing_images = product_ids_with_images_ids - product_ids_with_actual_images
        orphan_images = product_ids_with_actual_images - product_ids_with_images_ids

        if missing_images:
            print(f"⚠️  Productos con images_ids pero sin imagen real: {missing_images}")

        if orphan_images:
            print(f"⚠️  Imágenes sin referencia en products: {orphan_images}")

        if not missing_images and not orphan_images:
            print(
                "✅ Consistency OK: Todos los productos con images_ids tienen imagen real"
            )


if __name__ == "__main__":
    check_images()
