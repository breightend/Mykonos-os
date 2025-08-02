#!/usr/bin/env python3
import sqlite3
import os
import sys

# Agregar el directorio backend al path para importar módulos
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

def simple_db_check():
    """Verificación simple de la base de datos"""
    
    db_path = os.path.join(backend_dir, 'database', 'mykonos.db')
    print(f"DB Path: {db_path}")
    print(f"DB Exists: {os.path.exists(db_path)}")
    
    if not os.path.exists(db_path):
        print("❌ Base de datos no encontrada")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verificar tablas
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"Tablas: {[t[0] for t in tables]}")
        
        # Verificar productos
        cursor.execute("SELECT COUNT(*) FROM products")
        products_count = cursor.fetchone()[0]
        print(f"Productos: {products_count}")
        
        # Verificar warehouse_stock_variants
        try:
            cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants")
            variants_count = cursor.fetchone()[0]
            print(f"Variantes: {variants_count}")
            
            if variants_count > 0:
                cursor.execute("SELECT id, product_id, variant_barcode FROM warehouse_stock_variants LIMIT 3")
                samples = cursor.fetchall()
                print("Ejemplos:")
                for sample in samples:
                    print(f"  ID: {sample[0]}, Producto: {sample[1]}, Barcode: {sample[2]}")
        except Exception as e:
            print(f"Error con warehouse_stock_variants: {e}")
        
        conn.close()
        print("✅ Verificación completada")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    simple_db_check()
