#!/usr/bin/env python3
import sqlite3
import os


def verify_database_structure():
    """Verificar la estructura de la base de datos y los códigos de barras"""

    # Conectar a la base de datos
    db_path = os.path.join("database", "mykonos.db")
    if not os.path.exists(db_path):
        print(f"Error: No se encontró la base de datos en {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        print("=== ESTRUCTURA DE TABLA warehouse_stock_variants ===")
        cursor.execute("PRAGMA table_info(warehouse_stock_variants)")
        columns = cursor.fetchall()
        for col in columns:
            print(
                f"  {col[1]} | {col[2]} | NULL: {not col[3]} | Default: {col[4]} | PK: {bool(col[5])}"
            )

        print("\n=== CONTEO DE REGISTROS ===")
        cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants")
        total = cursor.fetchone()[0]

        cursor.execute(
            "SELECT COUNT(*) FROM warehouse_stock_variants WHERE variant_barcode IS NOT NULL AND variant_barcode != ''"
        )
        with_barcode = cursor.fetchone()[0]

        print(f"  Total de registros: {total}")
        print(f"  Con variant_barcode: {with_barcode}")

        print("\n=== EJEMPLOS DE REGISTROS ===")
        cursor.execute("""
            SELECT wsv.id, wsv.product_id, wsv.variant_barcode, p.product_name, s.size_name, c.color_name
            FROM warehouse_stock_variants wsv
            LEFT JOIN products p ON wsv.product_id = p.id
            LEFT JOIN sizes s ON wsv.size_id = s.id
            LEFT JOIN colors c ON wsv.color_id = c.id
            LIMIT 5
        """)
        examples = cursor.fetchall()
        for row in examples:
            print(
                f"  ID: {row[0]}, Product: {row[3]}, Size: {row[4]}, Color: {row[5]}, Barcode: {row[2]}"
            )

        print("\n=== VERIFICAR ENDPOINT DE PRODUCTOS ===")
        # Verificar si hay algún producto específico para probar
        cursor.execute("SELECT id, product_name FROM products LIMIT 3")
        products = cursor.fetchall()
        print("  Productos disponibles para probar:")
        for prod in products:
            print(f"    ID: {prod[0]}, Nombre: {prod[1]}")

    except Exception as e:
        print(f"Error al verificar la base de datos: {e}")
    finally:
        conn.close()


if __name__ == "__main__":
    verify_database_structure()
