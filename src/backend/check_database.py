#!/usr/bin/env python3
"""
Script para verificar la estructura de la base de datos
"""

import sqlite3
import os


def check_database():
    db_path = os.path.join(os.path.dirname(__file__), "database", "mykonos.db")

    if not os.path.exists(db_path):
        print(f"❌ No se encontró la base de datos en: {db_path}")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Obtener todas las tablas
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]

        print("📊 Tablas en la base de datos:")
        for table in sorted(tables):
            print(f"  - {table}")

        # Verificar tablas de inventario específicamente
        inventory_tables = [t for t in tables if "inventory" in t.lower()]
        print(f"\n📦 Tablas de inventario encontradas: {inventory_tables}")

        # Si existe una tabla de inventario, mostrar su estructura
        if inventory_tables:
            for table in inventory_tables:
                print(f"\n🔍 Estructura de {table}:")
                cursor.execute(f"PRAGMA table_info({table})")
                columns = cursor.fetchall()
                for column in columns:
                    print(f"  - {column[1]} ({column[2]})")

        conn.close()

    except sqlite3.Error as e:
        print(f"❌ Error de base de datos: {e}")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")


if __name__ == "__main__":
    check_database()
