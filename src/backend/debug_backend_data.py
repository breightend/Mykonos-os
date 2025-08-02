#!/usr/bin/env python3
"""
Script de debugging para verificar exactamente qué devuelve el backend
"""

import sqlite3
import os
import json

def debug_backend_data():
    print("🔍 DEBUGGING: Verificando datos del backend")
    print("=" * 60)
    
    # Conectar a la base de datos
    db_path = os.path.join('database', 'mykonos.db')
    
    if not os.path.exists(db_path):
        print(f"❌ ERROR: Base de datos no encontrada en {db_path}")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 1. Verificar estructura de warehouse_stock_variants
        print("\n1. 📋 ESTRUCTURA DE warehouse_stock_variants:")
        cursor.execute("PRAGMA table_info(warehouse_stock_variants)")
        columns = cursor.fetchall()
        for col in columns:
            print(f"   {col[1]} ({col[2]})")
        
        # 2. Contar registros
        cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants")
        total = cursor.fetchone()[0]
        print(f"\n2. 📊 TOTAL DE REGISTROS: {total}")
        
        cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants WHERE variant_barcode IS NULL")
        null_count = cursor.fetchone()[0]
        print(f"   Con variant_barcode NULL: {null_count}")
        
        cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants WHERE variant_barcode = ''")
        empty_count = cursor.fetchone()[0]
        print(f"   Con variant_barcode vacío: {empty_count}")
        
        cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants WHERE variant_barcode IS NOT NULL AND variant_barcode != ''")
        valid_count = cursor.fetchone()[0]
        print(f"   Con variant_barcode válido: {valid_count}")
        
        # 3. Mostrar datos reales como los devuelve el endpoint
        print("\n3. 🔍 SIMULANDO CONSULTA DEL ENDPOINT product-details:")
        
        # Obtener un producto de ejemplo
        cursor.execute("SELECT DISTINCT product_id FROM warehouse_stock_variants LIMIT 1")
        product_result = cursor.fetchone()
        
        if not product_result:
            print("❌ No hay productos con variantes")
            return
        
        product_id = product_result[0]
        print(f"   Producto de prueba: ID {product_id}")
        
        # Simular exactamente la consulta del endpoint
        variants_query = """
        SELECT 
            wsv.id,
            s.size_name,
            c.color_name,
            c.color_hex,
            st.name as sucursal_nombre,
            st.id as sucursal_id,
            wsv.quantity,
            wsv.last_updated,
            wsv.size_id,
            wsv.color_id,
            wsv.variant_barcode
        FROM warehouse_stock_variants wsv
        LEFT JOIN sizes s ON wsv.size_id = s.id
        LEFT JOIN colors c ON wsv.color_id = c.id
        JOIN storage st ON wsv.branch_id = st.id
        WHERE wsv.product_id = ?
        ORDER BY s.size_name, c.color_name, st.name
        """
        
        cursor.execute(variants_query, (product_id,))
        variants_data = cursor.fetchall()
        
        print(f"\n4. 📦 DATOS DE VARIANTES (como los ve el backend):")
        print(f"   Cantidad de variantes encontradas: {len(variants_data)}")
        
        for i, variant in enumerate(variants_data[:3]):  # Mostrar solo las primeras 3
            print(f"\n   Variante {i+1}:")
            print(f"     ID: {variant[0]}")
            print(f"     Size: {variant[1]}")
            print(f"     Color: {variant[2]}")
            print(f"     Color Hex: {variant[3]}")
            print(f"     Sucursal: {variant[4]}")
            print(f"     Sucursal ID: {variant[5]}")
            print(f"     Quantity: {variant[6]}")
            print(f"     Last Updated: {variant[7]}")
            print(f"     Size ID: {variant[8]}")
            print(f"     Color ID: {variant[9]}")
            print(f"     VARIANT_BARCODE: '{variant[10]}' (tipo: {type(variant[10])})")
        
        # 5. Simular el JSON que se envía al frontend
        print(f"\n5. 📤 JSON QUE SE ENVÍA AL FRONTEND:")
        
        json_variants = []
        for variant in variants_data[:2]:  # Solo las primeras 2 para el ejemplo
            variant_item = {
                "id": variant[0],
                "size_name": variant[1],
                "color_name": variant[2],
                "color_hex": variant[3],
                "sucursal_nombre": variant[4],
                "sucursal_id": variant[5],
                "quantity": variant[6],
                "last_updated": variant[7],
                "size_id": variant[8],
                "color_id": variant[9],
                "variant_barcode": variant[10],
            }
            json_variants.append(variant_item)
        
        print(json.dumps(json_variants, indent=2, default=str))
        
        # 6. Verificar directamente en la tabla
        print(f"\n6. 🔬 VERIFICACIÓN DIRECTA EN LA TABLA:")
        cursor.execute("SELECT id, variant_barcode FROM warehouse_stock_variants WHERE product_id = ? LIMIT 5", (product_id,))
        direct_check = cursor.fetchall()
        
        for record in direct_check:
            barcode_value = record[1]
            print(f"   ID {record[0]}: variant_barcode = '{barcode_value}' (tipo: {type(barcode_value)})")
            if barcode_value is None:
                print(f"     ❌ PROBLEMA: variant_barcode es NULL")
            elif barcode_value == '':
                print(f"     ❌ PROBLEMA: variant_barcode es cadena vacía")
            else:
                print(f"     ✅ OK: variant_barcode tiene valor")
        
    except Exception as e:
        print(f"❌ ERROR durante la verificación: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    debug_backend_data()
