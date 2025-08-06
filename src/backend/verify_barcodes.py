#!/usr/bin/env python3
"""
Verificación simple de códigos de barras usando la configuración del proyecto
"""

import sys
import os

# Agregar el path del backend al sys.path
backend_path = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_path)

from database.database import Database


def main():
    print("🔍 VERIFICACIÓN DE CÓDIGOS DE BARRAS")
    print("=" * 50)

    try:
        # Inicializar la base de datos
        db = Database()

        print("\n📊 VERIFICANDO ESTRUCTURA...")

        # Verificar si existe la tabla warehouse_stock_variants
        cursor = db.get_cursor()
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'warehouse_stock_variants'
            )
        """)
        table_exists = cursor.fetchone()[0]
        print(
            f"  • Tabla warehouse_stock_variants existe: {'✅' if table_exists else '❌'}"
        )

        if table_exists:
            # Contar registros
            cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants")
            total = cursor.fetchone()[0]
            print(f"  • Total de variantes: {total}")

            # Contar con códigos de barras
            cursor.execute("""
                SELECT COUNT(*) FROM warehouse_stock_variants 
                WHERE barcode IS NOT NULL AND barcode != ''
            """)
            with_barcode = cursor.fetchone()[0]
            print(f"  • Con código de barras: {with_barcode}")

            # Mostrar algunos ejemplos
            if with_barcode > 0:
                print("\n🔍 EJEMPLOS:")
                cursor.execute("""
                    SELECT w.barcode, p.name, s.size_name, c.color_name, w.current_stock
                    FROM warehouse_stock_variants w
                    LEFT JOIN products p ON w.product_id = p.id
                    LEFT JOIN sizes s ON w.size_id = s.id
                    LEFT JOIN colors c ON w.color_id = c.id
                    WHERE w.barcode IS NOT NULL AND w.barcode != ''
                    LIMIT 5
                """)
                examples = cursor.fetchall()
                for i, ex in enumerate(examples, 1):
                    print(f"  {i}. {ex[0]} - {ex[1]} ({ex[2]}/{ex[3]}) Stock: {ex[4]}")

            # Verificar productos sin variantes
            cursor.execute("""
                SELECT COUNT(DISTINCT p.id) 
                FROM products p
                LEFT JOIN warehouse_stock_variants w ON p.id = w.product_id
                WHERE w.id IS NULL
            """)
            without_variants = cursor.fetchone()[0]
            print(f"  • Productos sin variantes: {without_variants}")

        cursor.close()
        print("\n✅ Verificación completada")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    main()
