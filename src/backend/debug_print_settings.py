#!/usr/bin/env python3
"""
Script para verificar la estructura de la tabla barcode_print_settings
"""

import sys
import os

sys.path.append(os.path.dirname(__file__))

from database.connection import Database


def verify_table_structure():
    """Verificar estructura y contenido de la tabla"""
    db = Database()

    try:
        # Verificar si la tabla existe y su estructura
        result = db.execute_query("""
            SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'barcode_print_settings' 
            ORDER BY ordinal_position
        """)

        print("📋 Estructura de la tabla barcode_print_settings:")
        for row in result:
            print(f"  - {row[0]} ({row[1]}) - Nullable: {row[2]} - Default: {row[3]}")

        # Verificar constraints únicos
        constraints = db.execute_query("""
            SELECT tc.constraint_name, kcu.column_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            WHERE tc.table_name = 'barcode_print_settings' 
                AND tc.constraint_type = 'UNIQUE'
        """)

        print(f"\n🔐 Constraints únicos encontrados: {len(constraints)}")
        for constraint in constraints:
            print(f"  - {constraint[0]} en columna: {constraint[1]}")

        # Verificar contenido
        content = db.execute_query("SELECT * FROM barcode_print_settings LIMIT 5")
        print(f"\n📊 Contenido actual ({len(content)} filas):")
        for i, row in enumerate(content):
            print(f"  Fila {i + 1}: {row}")

        # Intentar un SELECT como el que está fallando
        print("\n🧪 Probando query del endpoint que falla...")
        test_result = db.execute_query(
            """
            SELECT show_product_name, show_variant_name, show_size, show_color, 
                   show_price, show_barcode, print_width, print_height, font_size,
                   background_color, text_color
            FROM barcode_print_settings 
            WHERE user_id = %s
        """,
            ("default",),
        )

        print(f"✅ Query exitoso. Resultados: {len(test_result)}")
        if test_result:
            print(f"   Datos: {test_result[0]}")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    verify_table_structure()
