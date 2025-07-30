import sqlite3

conn = sqlite3.connect("database/mykonos.db")
cursor = conn.cursor()

# Verificar productos
cursor.execute("SELECT COUNT(*) FROM products")
product_count = cursor.fetchone()[0]
print(f"Productos: {product_count}")

# Verificar sucursales/storage
cursor.execute("SELECT COUNT(*) FROM storage")
storage_count = cursor.fetchone()[0]
print(f"Sucursales: {storage_count}")

# Verificar talles
cursor.execute("SELECT COUNT(*) FROM sizes")
sizes_count = cursor.fetchone()[0]
print(f"Talles: {sizes_count}")

# Verificar colores
cursor.execute("SELECT COUNT(*) FROM colors")
colors_count = cursor.fetchone()[0]
print(f"Colores: {colors_count}")

# Verificar warehouse_stock_variants
cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants")
variants_count = cursor.fetchone()[0]
print(f"Variantes de stock: {variants_count}")

if variants_count > 0:
    cursor.execute("SELECT * FROM warehouse_stock_variants LIMIT 5")
    variants = cursor.fetchall()
    print("Primeras 5 variantes:")
    for v in variants:
        print(f"  {v}")

conn.close()
