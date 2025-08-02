import sqlite3
import os


def check_products():
    """Verificar la tabla products"""

    db_path = os.path.join("database", "mykonos.db")
    if not os.path.exists(db_path):
        print(f"No se encontró la base de datos en {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Verificar estructura de la tabla products
    print("=== ESTRUCTURA DE LA TABLA PRODUCTS ===")
    cursor.execute("PRAGMA table_info(products)")
    columns = cursor.fetchall()
    for col in columns:
        print(f"  {col[1]} ({col[2]})")

    # Verificar si existe la columna barcode (no debería existir)
    has_barcode_column = any(col[1] == "barcode" for col in columns)
    print(f"\nColumna 'barcode' existe en products: {has_barcode_column}")

    # Contar productos
    cursor.execute("SELECT COUNT(*) FROM products")
    total_products = cursor.fetchone()[0]
    print(f"Total de productos: {total_products}")

    if total_products > 0:
        # Mostrar algunos productos
        print("\n=== EJEMPLOS DE PRODUCTOS ===")
        cursor.execute("""
            SELECT p.id, p.product_name, b.brand_name, p.sale_price
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LIMIT 5
        """)

        products = cursor.fetchall()
        for prod in products:
            print(
                f"ID: {prod[0]}, Nombre: {prod[1]}, Marca: {prod[2]}, Precio: {prod[3]}"
            )

    # Verificar warehouse_stock
    print("\n=== WAREHOUSE_STOCK ===")
    cursor.execute("SELECT COUNT(*) FROM warehouse_stock")
    total_stock = cursor.fetchone()[0]
    print(f"Total registros en warehouse_stock: {total_stock}")

    if total_stock > 0:
        cursor.execute("""
            SELECT ws.product_id, p.product_name, ws.branch_id, ws.quantity
            FROM warehouse_stock ws
            LEFT JOIN products p ON ws.product_id = p.id
            LIMIT 5
        """)

        stock_examples = cursor.fetchall()
        print("Ejemplos de stock:")
        for stock in stock_examples:
            print(
                f"Producto ID: {stock[0]}, Nombre: {stock[1]}, Sucursal: {stock[2]}, Cantidad: {stock[3]}"
            )

    # Hacer la consulta del endpoint products-summary
    print("\n=== CONSULTA DEL ENDPOINT PRODUCTS-SUMMARY ===")
    query = """
    SELECT 
        p.id,
        COALESCE(p.product_name, 'Sin nombre') as producto,
        COALESCE(b.brand_name, 'Sin marca') as marca,
        COALESCE(SUM(ws.quantity), 0) as cantidad_total,
        COALESCE(p.last_modified_date, datetime('now')) as fecha_edicion,
        COUNT(DISTINCT ws.branch_id) as sucursales_con_stock,
        COALESCE(g.group_name, 'Sin grupo') as grupo,
        p.group_id,
        p.sale_price
    FROM products p
    LEFT JOIN warehouse_stock ws ON p.id = ws.product_id
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN groups g ON p.group_id = g.id
    GROUP BY p.id, p.product_name, b.brand_name, p.last_modified_date, g.group_name, p.group_id, p.sale_price
    ORDER BY p.product_name
    """

    cursor.execute(query)
    results = cursor.fetchall()
    print(f"Resultados de la consulta: {len(results)}")

    if results:
        print("Primeros 3 resultados:")
        for i, result in enumerate(results[:3]):
            print(f"  {i + 1}: {result}")

    conn.close()


if __name__ == "__main__":
    check_products()
