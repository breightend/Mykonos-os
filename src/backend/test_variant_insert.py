#!/usr/bin/env python3
"""
Script de prueba para insertar variantes de stock
"""

import sqlite3
from datetime import datetime

def test_insert_variant():
    conn = sqlite3.connect('database/mykonos.db')
    cursor = conn.cursor()
    
    print("=== TESTING VARIANT INSERTION ===")
    
    # Verificar que existan datos básicos necesarios
    cursor.execute('SELECT id FROM products ORDER BY id DESC LIMIT 1')
    product_result = cursor.fetchone()
    if not product_result:
        print("❌ No hay productos en la BD")
        return
    
    product_id = product_result[0]
    print(f"🔍 Usando producto ID: {product_id}")
    
    cursor.execute('SELECT id FROM storage LIMIT 1')
    storage_result = cursor.fetchone()
    if not storage_result:
        print("❌ No hay sucursales en la BD")
        return
    
    storage_id = storage_result[0]
    print(f"🔍 Usando sucursal ID: {storage_id}")
    
    cursor.execute('SELECT id FROM sizes LIMIT 1')
    size_result = cursor.fetchone()
    if not size_result:
        print("❌ No hay talles en la BD")
        return
    
    size_id = size_result[0]
    print(f"🔍 Usando talle ID: {size_id}")
    
    cursor.execute('SELECT id FROM colors LIMIT 1')
    color_result = cursor.fetchone()
    if not color_result:
        print("❌ No hay colores en la BD")
        return
    
    color_id = color_result[0]
    print(f"🔍 Usando color ID: {color_id}")
    
    # Intentar insertar una variante de prueba
    try:
        test_variant = {
            'product_id': product_id,
            'branch_id': storage_id,
            'size_id': size_id,
            'color_id': color_id,
            'quantity': 100,
            'last_updated': datetime.now().isoformat()
        }
        
        placeholders = ", ".join([f":{key}" for key in test_variant.keys()])
        columns = ", ".join(test_variant.keys())
        sql = f"INSERT INTO warehouse_stock_variants ({columns}) VALUES ({placeholders})"
        
        print(f"🔍 SQL: {sql}")
        print(f"🔍 Data: {test_variant}")
        
        cursor.execute(sql, test_variant)
        conn.commit()
        
        variant_id = cursor.lastrowid
        print(f"✅ Variante insertada con ID: {variant_id}")
        
        # Verificar que se insertó correctamente
        cursor.execute('SELECT * FROM warehouse_stock_variants WHERE id = ?', (variant_id,))
        inserted = cursor.fetchone()
        print(f"✅ Datos insertados: {inserted}")
        
    except Exception as e:
        print(f"❌ Error insertando variante: {e}")
    
    finally:
        conn.close()

if __name__ == "__main__":
    test_insert_variant()
