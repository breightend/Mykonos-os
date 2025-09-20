#!/usr/bin/env python3
"""
Script para verificar específicamente el producto 14
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src', 'backend'))

from database.database import Database

def check_product_14():
    """
    Verifica específicamente el producto 14
    """
    print("🔍 Verificando producto 14 específicamente...")
    
    db = Database()
    
    try:
        # Verificar en la tabla products
        product_query = "SELECT id, product_name, images_ids FROM products WHERE id = 14"
        product_result = db.execute_query(product_query)
        
        print("📋 Datos del producto:")
        if product_result:
            product = product_result[0]
            print(f"   ID: {product['id'] if isinstance(product, dict) else product[0]}")
            print(f"   Nombre: {product['product_name'] if isinstance(product, dict) else product[1]}")
            print(f"   images_ids: {product['images_ids'] if isinstance(product, dict) else product[2]}")
        else:
            print("   ❌ Producto no encontrado")
            return
            
        # Verificar en la tabla images
        image_query = "SELECT product_id, length(image_data) as size FROM images WHERE product_id = 14"
        image_result = db.execute_query(image_query)
        
        print("\n🖼️ Datos de imagen:")
        if image_result and len(image_result) > 0:
            image = image_result[0]
            print(f"   product_id: {image['product_id'] if isinstance(image, dict) else image[0]}")
            print(f"   Tamaño imagen: {image['size'] if isinstance(image, dict) else image[1]} bytes")
            
            # Intentar obtener la imagen usando el método del endpoint
            print("\n🔍 Probando método get_product_image:")
            image_result = db.get_product_image(14)
            print(f"   Success: {image_result.get('success')}")
            print(f"   Message: {image_result.get('message')}")
            if image_result.get('image_data'):
                print(f"   Image data size: {len(image_result['image_data'])} bytes")
            else:
                print("   ❌ No image data returned")
        else:
            print("   ❌ No se encontró imagen en la tabla images")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_product_14()