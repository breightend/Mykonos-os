import sqlite3

conn = sqlite3.connect("database/mykonos.db")
cursor = conn.cursor()

print("=== PRODUCTOS RECIENTES ===")
cursor.execute("SELECT id, name FROM products ORDER BY id DESC LIMIT 3")
products = cursor.fetchall()
for p in products:
    print(f"ID: {p[0]}, Nombre: {p[1]}")

if products:
    last_product_id = products[0][0]
    print(f"\n=== STOCK DEL PRODUCTO {last_product_id} ===")
    cursor.execute(
        "SELECT * FROM warehouse_stock_variants WHERE product_id = ?",
        (last_product_id,),
    )
    variants = cursor.fetchall()
    print(f"Total variantes: {len(variants)}")
    for v in variants:
        print(
            f"  - Producto: {v[0]}, Sucursal: {v[1]}, Talle: {v[2]}, Color: {v[3]}, Cantidad: {v[4]}"
        )

conn.close()
