import sqlite3
import os


def quick_db_check():
    """Verificación rápida de la base de datos"""

    db_path = os.path.join("database", "mykonos.db")
    if not os.path.exists(db_path):
        print(f"No se encontró la base de datos en {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Verificar estructura de la tabla
    cursor.execute("PRAGMA table_info(warehouse_stock_variants)")
    columns = cursor.fetchall()
    print("Columnas en warehouse_stock_variants:")
    for col in columns:
        print(f"  {col[1]} ({col[2]})")

    # Verificar si existe la columna variant_barcode
    has_barcode_column = any(col[1] == "variant_barcode" for col in columns)
    print(f"\nColumna variant_barcode existe: {has_barcode_column}")

    if has_barcode_column:
        # Contar registros con códigos de barras
        cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants")
        total = cursor.fetchone()[0]

        cursor.execute(
            "SELECT COUNT(*) FROM warehouse_stock_variants WHERE variant_barcode IS NOT NULL AND variant_barcode != ''"
        )
        with_barcode = cursor.fetchone()[0]

        print(f"Total registros: {total}")
        print(f"Con códigos de barras: {with_barcode}")

        # Mostrar ejemplos
        cursor.execute("""
            SELECT wsv.id, p.product_name, s.size_name, c.color_name, wsv.variant_barcode
            FROM warehouse_stock_variants wsv
            LEFT JOIN products p ON wsv.product_id = p.id
            LEFT JOIN sizes s ON wsv.size_id = s.id
            LEFT JOIN colors c ON wsv.color_id = c.id
            WHERE wsv.variant_barcode IS NOT NULL AND wsv.variant_barcode != ''
            LIMIT 5
        """)

        examples = cursor.fetchall()
        print("\nEjemplos de registros con códigos de barras:")
        for ex in examples:
            print(
                f"  ID: {ex[0]}, Producto: {ex[1]}, Talla: {ex[2]}, Color: {ex[3]}, Código: {ex[4]}"
            )

    conn.close()


if __name__ == "__main__":
    quick_db_check()
