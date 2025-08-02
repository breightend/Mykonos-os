#!/usr/bin/env python3
"""
Script de migración para remover la tabla 'barcodes' y la columna 'barcode' de la tabla 'products'
ya que ahora solo usamos códigos de barras por variantes.

Fecha: Agosto 2025
Autor: Sistema Mykonos-OS
"""

import sqlite3
import os
import sys
from datetime import datetime

# Añadir el directorio padre al path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def backup_database(db_path):
    """Crea una copia de respaldo de la base de datos"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = f"{db_path}.backup_remove_general_barcodes_{timestamp}"

    # Hacer copia de seguridad
    source_conn = sqlite3.connect(db_path)
    backup_conn = sqlite3.connect(backup_path)
    source_conn.backup(backup_conn)
    source_conn.close()
    backup_conn.close()

    print(f"✅ Backup creado: {backup_path}")
    return backup_path


def remove_general_barcodes(db_path):
    """Remueve la tabla barcodes y la columna barcode de products"""

    print("🔄 Iniciando migración para remover códigos de barras generales...")

    # Crear backup
    backup_path = backup_database(db_path)

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Verificar si la tabla barcodes existe
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='barcodes'"
        )
        barcodes_table_exists = cursor.fetchone() is not None

        if barcodes_table_exists:
            print("🗑️ Eliminando tabla 'barcodes'...")
            cursor.execute("DROP TABLE IF EXISTS barcodes")
            print("✅ Tabla 'barcodes' eliminada")
        else:
            print("ℹ️ La tabla 'barcodes' no existe")

        # Verificar si la columna barcode existe en products
        cursor.execute("PRAGMA table_info(products)")
        columns = cursor.fetchall()
        barcode_column_exists = any(col[1] == "barcode" for col in columns)

        if barcode_column_exists:
            print("🔧 Removiendo columna 'barcode' de tabla 'products'...")

            # SQLite no soporta DROP COLUMN directamente, así que recreamos la tabla
            # Crear tabla temporal sin la columna barcode
            cursor.execute("""
                CREATE TABLE products_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    provider_code TEXT,
                    product_name TEXT NOT NULL,
                    group_id INTEGER,
                    provider_id INTEGER,
                    description TEXT,
                    cost REAL,
                    sale_price REAL,
                    tax REAL,
                    discount REAL,
                    comments TEXT,
                    user_id INTEGER,
                    images_ids TEXT,
                    brand_id INTEGER,
                    creation_date TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
                    last_modified_date TEXT
                )
            """)

            # Copiar datos sin la columna barcode
            cursor.execute("""
                INSERT INTO products_new (
                    id, provider_code, product_name, group_id, provider_id, 
                    description, cost, sale_price, tax, discount, comments, 
                    user_id, images_ids, brand_id, creation_date, last_modified_date
                )
                SELECT 
                    id, provider_code, product_name, group_id, provider_id, 
                    description, cost, sale_price, tax, discount, comments, 
                    user_id, images_ids, brand_id, creation_date, last_modified_date
                FROM products
            """)

            # Eliminar tabla original y renombrar
            cursor.execute("DROP TABLE products")
            cursor.execute("ALTER TABLE products_new RENAME TO products")

            print("✅ Columna 'barcode' removida de tabla 'products'")
        else:
            print("ℹ️ La columna 'barcode' no existe en la tabla 'products'")

        # Verificar estado final
        print("\n📊 Verificación final:")

        # Verificar que barcodes fue eliminada
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='barcodes'"
        )
        if cursor.fetchone() is None:
            print("✅ Tabla 'barcodes' confirmada como eliminada")
        else:
            print("❌ Error: Tabla 'barcodes' aún existe")

        # Verificar estructura de products
        cursor.execute("PRAGMA table_info(products)")
        columns = cursor.fetchall()
        print("🔍 Columnas en tabla 'products':")
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")

        # Verificar que tenemos variant_barcodes
        cursor.execute(
            "SELECT COUNT(*) FROM warehouse_stock_variants WHERE variant_barcode IS NOT NULL AND variant_barcode != ''"
        )
        variant_barcodes_count = cursor.fetchone()[0]
        print(f"📊 Códigos de barras de variantes existentes: {variant_barcodes_count}")

        conn.commit()
        conn.close()

        print("\n🎉 Migración completada exitosamente!")
        print(f"📄 Backup disponible en: {backup_path}")

        return True

    except Exception as e:
        print(f"❌ Error durante la migración: {e}")
        print(f"🔙 Restaure desde el backup: {backup_path}")
        return False


def main():
    # Ruta a la base de datos
    script_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(script_dir, "mykonos.db")

    if not os.path.exists(db_path):
        print(f"❌ Base de datos no encontrada en: {db_path}")
        return

    print("🏷️ MIGRACIÓN: Remover códigos de barras generales")
    print("=" * 60)
    print("Esta migración:")
    print("  ✓ Elimina la tabla 'barcodes'")
    print("  ✓ Remueve la columna 'barcode' de 'products'")
    print("  ✓ Mantiene los códigos de barras por variante intactos")
    print("=" * 60)

    # Confirmar
    response = input("¿Continuar? (y/N): ").lower().strip()
    if response != "y":
        print("❌ Migración cancelada")
        return

    success = remove_general_barcodes(db_path)

    if success:
        print(
            "\n✨ El sistema ahora usa exclusivamente códigos de barras por variante!"
        )
    else:
        print(
            "\n💥 Migración falló. Verifique los logs y restaure desde el backup si es necesario."
        )


if __name__ == "__main__":
    main()
