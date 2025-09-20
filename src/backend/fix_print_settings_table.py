#!/usr/bin/env python3
"""
Script para recrear la tabla barcode_print_settings con la estructura correcta
"""

import sys
import os

sys.path.append(os.path.dirname(__file__))

from database.connection import Database


def fix_print_settings_table():
    """Recrear la tabla con la estructura correcta"""
    db = Database()

    try:
        print("🔧 Iniciando corrección de la tabla barcode_print_settings...")

        # Primero, verificar si la tabla existe
        check_table = db.execute_query("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'barcode_print_settings'
            );
        """)

        table_exists = check_table[0][0] if check_table else False
        print(f"📋 La tabla existe: {table_exists}")

        if table_exists:
            # Guardar datos existentes si los hay
            print("💾 Guardando datos existentes...")
            existing_data = db.execute_query("SELECT * FROM barcode_print_settings")
            print(f"   Encontrados {len(existing_data)} registros existentes")

            # Eliminar la tabla existente
            print("🗑️ Eliminando tabla existente...")
            db.execute_query("DROP TABLE IF EXISTS barcode_print_settings CASCADE")

        # Crear la tabla con la estructura correcta
        print("🏗️ Creando tabla con estructura correcta...")
        create_table_sql = """
        CREATE TABLE barcode_print_settings (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(100) DEFAULT 'default' UNIQUE,
            show_product_name BOOLEAN DEFAULT true,
            show_variant_name BOOLEAN DEFAULT true,
            show_size BOOLEAN DEFAULT true,
            show_color BOOLEAN DEFAULT true,
            show_price BOOLEAN DEFAULT false,
            show_barcode BOOLEAN DEFAULT true,
            print_width INTEGER DEFAULT 450,
            print_height INTEGER DEFAULT 200,
            font_size INTEGER DEFAULT 12,
            background_color VARCHAR(7) DEFAULT '#FFFFFF',
            text_color VARCHAR(7) DEFAULT '#000000',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """

        db.execute_query(create_table_sql)
        print("✅ Tabla creada exitosamente")

        # Insertar configuración por defecto
        print("📝 Insertando configuración por defecto...")
        default_insert = """
        INSERT INTO barcode_print_settings (user_id) 
        VALUES ('default')
        ON CONFLICT (user_id) DO NOTHING;
        """

        db.execute_query(default_insert)
        print("✅ Configuración por defecto insertada")

        # Verificar que todo funciona
        print("🧪 Probando query del endpoint...")
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

        if test_result:
            print("✅ Query funciona correctamente!")
            print(f"   Datos obtenidos: {test_result[0]}")
        else:
            print("⚠️ No se encontraron datos para el usuario 'default'")

        print("\n🎉 Tabla barcode_print_settings corregida exitosamente!")

    except Exception as e:
        print(f"❌ Error corrigiendo tabla: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    fix_print_settings_table()
