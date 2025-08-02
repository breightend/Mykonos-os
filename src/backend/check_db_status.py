import sqlite3
import os

# Conectar a la base de datos
db_path = os.path.join('database', 'mykonos.db')
print(f"Conectando a: {db_path}")

if not os.path.exists(db_path):
    print(f"❌ Base de datos no encontrada en {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Verificar códigos de barras
cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants WHERE variant_barcode IS NULL OR variant_barcode = ''")
null_empty_count = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants WHERE variant_barcode IS NOT NULL AND variant_barcode != ''")
valid_count = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants")
total_count = cursor.fetchone()[0]

print(f"📊 ESTADO ACTUAL DE LA BASE DE DATOS:")
print(f"   Total de variantes: {total_count}")
print(f"   NULL/Vacíos: {null_empty_count}")
print(f"   Válidos: {valid_count}")

# Mostrar algunos ejemplos
cursor.execute("""
    SELECT id, product_id, variant_barcode, 
           CASE 
               WHEN variant_barcode IS NULL THEN 'NULL'
               WHEN variant_barcode = '' THEN 'EMPTY'
               ELSE 'VALID'
           END as status
    FROM warehouse_stock_variants 
    LIMIT 10
""")

print(f"\n📋 EJEMPLOS DE REGISTROS:")
for row in cursor.fetchall():
    print(f"   ID: {row[0]}, Producto: {row[1]}, Barcode: '{row[2]}', Status: {row[3]}")

conn.close()
print("\n✅ Verificación completada")
