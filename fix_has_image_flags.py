#!/usr/bin/env python3
"""
Script para corregir flags has_image incorrectos en la base de datos.
Este script sincroniza el estado has_image de productos con la existencia real de imágenes.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src', 'backend'))

from database.database import Database

def fix_has_image_flags():
    """
    Corrige los flags has_image de todos los productos
    """
    print("🔧 Iniciando corrección de flags has_image...")
    
    db = Database()
    
    try:
        # Obtener todos los productos
        products_query = "SELECT id, product_name, images_ids FROM products"
        products = db.execute_query(products_query)
        
        if not products:
            print("❌ No se encontraron productos")
            return
            
        print(f"📋 Procesando {len(products)} productos...")
        
        corrected_count = 0
        
        for product in products:
            product_id = product['id'] if isinstance(product, dict) else product[0]
            product_name = product['product_name'] if isinstance(product, dict) else product[1]
            current_images_ids = product['images_ids'] if isinstance(product, dict) else product[2]
            
            # Verificar si realmente tiene imagen en la tabla images
            image_check_query = "SELECT COUNT(*) as count FROM images WHERE product_id = %s"
            image_result = db.execute_query(image_check_query, (product_id,))
            
            actual_has_image = False
            if image_result and len(image_result) > 0:
                count = image_result[0]['count'] if isinstance(image_result[0], dict) else image_result[0][0]
                actual_has_image = count > 0
            
            # Determinar el valor correcto para images_ids
            correct_images_ids = "1" if actual_has_image else None
            
            # Actualizar si es necesario
            if (current_images_ids is None and actual_has_image) or (current_images_ids is not None and not actual_has_image):
                print(f"🔧 Corrigiendo producto {product_id} ({product_name}): has_image -> {actual_has_image}")
                
                update_query = "UPDATE products SET images_ids = %s WHERE id = %s"
                update_params = (correct_images_ids, product_id)
                
                update_result = db.execute_query(update_query, update_params)
                corrected_count += 1
            else:
                print(f"✅ Producto {product_id} ({product_name}): correcto (has_image = {actual_has_image})")
        
        print(f"\n🎯 Resumen:")
        print(f"   - Productos procesados: {len(products)}")
        print(f"   - Productos corregidos: {corrected_count}")
        print(f"   - Productos ya correctos: {len(products) - corrected_count}")
        
    except Exception as e:
        print(f"❌ Error durante la corrección: {e}")
        import traceback
        traceback.print_exc()

def verify_corrections():
    """
    Verifica que las correcciones se aplicaron correctamente
    """
    print("\n🔍 Verificando correcciones...")
    
    db = Database()
    
    try:
        # Productos que dicen tener imagen pero no la tienen
        false_positives_query = """
        SELECT p.id, p.product_name 
        FROM products p 
        LEFT JOIN images i ON p.id = i.product_id 
        WHERE p.images_ids IS NOT NULL 
        AND i.product_id IS NULL
        """
        
        false_positives = db.execute_query(false_positives_query)
        
        # Productos que tienen imagen pero no están marcados
        false_negatives_query = """
        SELECT p.id, p.product_name 
        FROM products p 
        INNER JOIN images i ON p.id = i.product_id 
        WHERE p.images_ids IS NULL
        """
        
        false_negatives = db.execute_query(false_negatives_query)
        
        print(f"❌ Falsos positivos (dicen tener imagen pero no la tienen): {len(false_positives) if false_positives else 0}")
        if false_positives:
            for fp in false_positives[:5]:  # Mostrar solo los primeros 5
                product_id = fp['id'] if isinstance(fp, dict) else fp[0]
                product_name = fp['product_name'] if isinstance(fp, dict) else fp[1]
                print(f"   - ID {product_id}: {product_name}")
        
        print(f"❌ Falsos negativos (tienen imagen pero no están marcados): {len(false_negatives) if false_negatives else 0}")
        if false_negatives:
            for fn in false_negatives[:5]:  # Mostrar solo los primeros 5
                product_id = fn['id'] if isinstance(fn, dict) else fn[0]
                product_name = fn['product_name'] if isinstance(fn, dict) else fn[1]
                print(f"   - ID {product_id}: {product_name}")
                
        if (not false_positives or len(false_positives) == 0) and (not false_negatives or len(false_negatives) == 0):
            print("✅ ¡Todas las correcciones aplicadas correctamente!")
        
    except Exception as e:
        print(f"❌ Error durante la verificación: {e}")

if __name__ == "__main__":
    fix_has_image_flags()
    verify_corrections()