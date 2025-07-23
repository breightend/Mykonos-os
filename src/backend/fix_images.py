#!/usr/bin/env python3
"""
Script para corregir la inconsistencia de imágenes en la base de datos
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import Database


def fix_image_consistency():
    """Corregir la inconsistencia de imágenes"""
    db = Database()

    print("🔧 Corriendo fix de consistencia de imágenes...")

    # Obtener productos con images_ids
    products_query = "SELECT id, product_name, images_ids FROM products WHERE images_ids IS NOT NULL AND images_ids != ''"
    products_result = db.execute_query(products_query)

    if products_result:
        for product in products_result:
            if isinstance(product, dict):
                product_id = product.get("id")
                product_name = product.get("product_name")
                images_ids = product.get("images_ids")
            else:
                product_id = product[0]
                product_name = product[1]
                images_ids = product[2]

            print(
                f"📝 Procesando producto ID: {product_id}, Nombre: {product_name}, images_ids: {images_ids}"
            )

            # Verificar si la imagen con ese ID existe pero tiene un product_id incorrecto
            image_query = "SELECT id, product_id FROM images WHERE id = ?"
            image_result = db.execute_query(image_query, (images_ids,))

            if image_result and len(image_result) > 0:
                image_row = image_result[0]
                if isinstance(image_row, dict):
                    current_product_id = image_row.get("product_id")
                else:
                    current_product_id = image_row[1]

                if current_product_id != product_id:
                    print(
                        f"⚠️  Inconsistencia encontrada: Imagen {images_ids} tiene product_id {current_product_id} pero debería ser {product_id}"
                    )

                    # Corregir la inconsistencia
                    update_result = db.update_record(
                        "images", {"id": int(images_ids), "product_id": product_id}
                    )

                    if update_result.get("success"):
                        print(
                            f"✅ Corregido: Imagen {images_ids} ahora tiene product_id {product_id}"
                        )
                    else:
                        print(
                            f"❌ Error al corregir imagen {images_ids}: {update_result.get('message')}"
                        )
                else:
                    print(
                        f"✅ OK: Imagen {images_ids} ya tiene el product_id correcto ({product_id})"
                    )
            else:
                print(f"❌ No se encontró imagen con ID {images_ids}")

    print("\n🔍 Verificación final...")
    # Ejecutar verificación nuevamente
    from debug_images import check_images

    check_images()


if __name__ == "__main__":
    fix_image_consistency()
