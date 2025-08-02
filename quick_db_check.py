import sqlite3
import os

# Verificar base de datos
db_path = r"c:\Users\Brenda\Desktop\BrendaDevs\Mykonos-os\src\backend\database\mykonos.db"

print(f"Verificando base de datos en: {db_path}")
print(f"Archivo existe: {os.path.exists(db_path)}")

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Verificar tablas
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [t[0] for t in cursor.fetchall()]
    print(f"Tablas disponibles: {tables}")
    
    # Verificar productos
    cursor.execute("SELECT COUNT(*) FROM products")
    products_count = cursor.fetchone()[0]
    print(f"Total productos: {products_count}")
    
    # Verificar warehouse_stock_variants
    if 'warehouse_stock_variants' in tables:
        cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants")
        variants_count = cursor.fetchone()[0]
        print(f"Total variantes: {variants_count}")
        
        if variants_count > 0:
            cursor.execute("""
                SELECT id, product_id, variant_barcode, 
                       CASE 
                           WHEN variant_barcode IS NULL THEN 'NULL'
                           WHEN variant_barcode = '' THEN 'EMPTY'
                           ELSE 'VALID'
                       END as status
                FROM warehouse_stock_variants 
                LIMIT 5
            """)
            samples = cursor.fetchall()
            print("Muestras de variantes:")
            for sample in samples:
                print(f"  ID: {sample[0]}, Producto: {sample[1]}, Barcode: '{sample[2]}', Status: {sample[3]}")
        else:
            print("No hay variantes en la tabla")
    else:
        print("Tabla warehouse_stock_variants no existe")
    
    # Verificar warehouse_stock tradicional
    if 'warehouse_stock' in tables:
        cursor.execute("SELECT COUNT(*) FROM warehouse_stock")
        stock_count = cursor.fetchone()[0]
        print(f"Registros en warehouse_stock: {stock_count}")
        
        if stock_count > 0:
            cursor.execute("SELECT product_id, branch_id, quantity FROM warehouse_stock WHERE quantity > 0 LIMIT 3")
            stock_samples = cursor.fetchall()
            print("Muestras de stock tradicional:")
            for sample in stock_samples:
                print(f"  Producto: {sample[0]}, Sucursal: {sample[1]}, Cantidad: {sample[2]}")
    
    conn.close()

print("Verificación completada")
