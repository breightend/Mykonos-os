#!/usr/bin/env python3
"""
Migración para agregar campos de descuento a la tabla products
"""

import sqlite3
import os


def add_discount_fields_to_products():
    """
    Agrega campos para manejar descuentos en la tabla products
    """
    # Ruta a la base de datos
    db_path = "database/mykonos.db"

    if not os.path.exists(db_path):
        print(f"❌ Base de datos no encontrada en: {db_path}")
        return False

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print("🔄 Agregando campos de descuento a la tabla products...")

        # Lista de campos a agregar
        new_fields = [
            ("original_price", "REAL DEFAULT 0"),
            ("discount_percentage", "REAL DEFAULT 0"),
            ("discount_amount", "REAL DEFAULT 0"),
            ("has_discount", "INTEGER DEFAULT 0"),
        ]

        # Verificar qué campos ya existen
        cursor.execute("PRAGMA table_info(products)")
        existing_columns = [row[1] for row in cursor.fetchall()]
        print(f"🔍 Columnas existentes: {existing_columns}")

        # Agregar campos que no existen
        for field_name, field_definition in new_fields:
            if field_name not in existing_columns:
                try:
                    alter_query = f"ALTER TABLE products ADD COLUMN {field_name} {field_definition}"
                    print(f"📝 Ejecutando: {alter_query}")
                    cursor.execute(alter_query)
                    print(f"✅ Campo {field_name} agregado exitosamente")
                except sqlite3.Error as e:
                    print(f"❌ Error agregando campo {field_name}: {e}")
                    continue
            else:
                print(f"⚠️ Campo {field_name} ya existe, omitiendo...")

        # Inicializar original_price con el valor de sale_price para productos existentes
        print("🔄 Inicializando original_price con valores de sale_price...")
        cursor.execute("""
            UPDATE products 
            SET original_price = sale_price 
            WHERE original_price = 0 AND sale_price > 0
        """)

        affected_rows = cursor.rowcount
        print(f"✅ {affected_rows} productos actualizados con precio original")

        conn.commit()

        # Verificar que los campos se agregaron correctamente
        cursor.execute("PRAGMA table_info(products)")
        final_columns = [row[1] for row in cursor.fetchall()]

        print(f"🔍 Columnas finales: {final_columns}")

        # Verificar algunos registros
        cursor.execute(
            "SELECT id, product_name, sale_price, original_price, has_discount FROM products LIMIT 3"
        )
        sample_data = cursor.fetchall()

        print(f"📊 Datos de muestra:")
        for row in sample_data:
            print(
                f"  ID: {row[0]}, Producto: {row[1]}, Precio venta: {row[2]}, Precio original: {row[3]}, Tiene descuento: {row[4]}"
            )

        conn.close()
        print("✅ Migración completada exitosamente")
        return True

    except Exception as e:
        print(f"❌ Error durante la migración: {e}")
        return False


if __name__ == "__main__":
    print("🚀 Iniciando migración de campos de descuento...")
    success = add_discount_fields_to_products()

    if success:
        print("🎉 Migración completada con éxito")
    else:
        print("💥 Migración falló")
