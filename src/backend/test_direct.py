#!/usr/bin/env python3
"""
Script directo para probar función de detalles de producto
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import Database


def test_product_details():
    """Probar directamente la función de detalles de producto"""
    product_id = 3

    print(f"🧪 Probando detalles de producto ID: {product_id}")

    try:
        # Instanciar database
        db = Database()

        # Obtener detalles básicos del producto
        print("📋 Obteniendo producto...")
        product_query = "SELECT * FROM productos WHERE id = ?"
        products = db.fetch_records(product_query, (product_id,))

        if not products:
            print(f"❌ No se encontró producto con ID {product_id}")
            return

        product = products[0]
        print(f"✅ Producto encontrado: {product.get('nombre', 'Sin nombre')}")
        print(f"   images_ids: {product.get('images_ids', 'No especificado')}")

        # Probar obtención de imagen
        print("🖼️ Obteniendo imagen del producto...")
        image_data = db.get_product_image(product_id)

        if image_data:
            print(f"✅ Imagen encontrada! Tamaño: {len(image_data)} caracteres")
            print(f"   Tipo: {type(image_data)}")
            if isinstance(image_data, str):
                print(f"   Primeros 50 caracteres: {image_data[:50]}...")

                # Verificar formato base64
                if image_data.startswith("data:image/"):
                    print("✅ Formato data URI correcto")
                elif image_data.startswith("/9j/") or image_data.startswith("iVBOR"):
                    print("✅ Formato base64 puro (JPEG o PNG)")
                else:
                    print("⚠️ Formato de imagen no reconocido")

            print("✅ ¡La imagen debería mostrarse correctamente en el frontend!")
        else:
            print("❌ No se encontró imagen para este producto")

        # Verificar tabla images directamente
        print("\n🔍 Verificando tabla images...")
        image_query = "SELECT id, product_id, length(image_data) as size FROM images WHERE product_id = ?"
        images = db.fetch_records(image_query, (product_id,))

        if images:
            for img in images:
                print(
                    f"   Imagen ID {img['id']}: product_id={img['product_id']}, tamaño={img['size']} bytes"
                )
        else:
            print("   No hay imágenes en la tabla para este producto")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    test_product_details()
