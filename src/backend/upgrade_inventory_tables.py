#!/usr/bin/env python3
"""
Script para actualizar las tablas de inventario con los nuevos campos
Este script agrega las columnas necesarias para el manejo de estados de envíos
"""

import sqlite3
import os
from datetime import datetime


def upgrade_inventory_tables():
    """
    Actualiza las tablas INVENTORY_MOVEMETNS_GROUPS con los nuevos campos
    """
    # Ruta a la base de datos
    db_path = os.path.join(os.path.dirname(__file__), "database", "mykonos.db")

    if not os.path.exists(db_path):
        print(f"❌ No se encontró la base de datos en: {db_path}")
        return False

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print("🔄 Iniciando actualización de tablas de inventario...")

        # Verificar si las columnas ya existen
        cursor.execute("PRAGMA table_info(inventory_movemetns_groups)")
        columns = [column[1] for column in cursor.fetchall()]

        # Lista de nuevas columnas a agregar
        new_columns = [
            ("status", "TEXT NOT NULL DEFAULT 'empacado'"),
            ("movement_type", "TEXT NOT NULL DEFAULT 'transfer'"),
            ("updated_at", "TEXT DEFAULT CURRENT_TIMESTAMP"),
            ("shipped_at", "TEXT"),
            ("delivered_at", "TEXT"),
            ("received_at", "TEXT"),
            ("created_by_user_id", "INTEGER"),
            ("updated_by_user_id", "INTEGER"),
        ]

        # Agregar columnas que no existen
        for column_name, column_definition in new_columns:
            if column_name not in columns:
                try:
                    alter_query = f"ALTER TABLE inventory_movemetns_groups ADD COLUMN {column_name} {column_definition}"
                    cursor.execute(alter_query)
                    print(f"✅ Agregada columna: {column_name}")
                except sqlite3.Error as e:
                    print(f"❌ Error agregando columna {column_name}: {e}")

        # Crear índices para mejorar el rendimiento
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_inv_groups_status ON inventory_movemetns_groups(status)",
            "CREATE INDEX IF NOT EXISTS idx_inv_groups_origin ON inventory_movemetns_groups(origin_branch_id)",
            "CREATE INDEX IF NOT EXISTS idx_inv_groups_destination ON inventory_movemetns_groups(destination_branch_id)",
            "CREATE INDEX IF NOT EXISTS idx_inv_groups_created_at ON inventory_movemetns_groups(created_at)",
        ]

        for index_query in indexes:
            try:
                cursor.execute(index_query)
                print("✅ Índice creado exitosamente")
            except sqlite3.Error as e:
                print(f"❌ Error creando índice: {e}")

        # Actualizar registros existentes con valores por defecto
        try:
            cursor.execute("""
                UPDATE inventory_movemetns_groups 
                SET status = 'empacado', 
                    movement_type = 'transfer',
                    updated_at = CURRENT_TIMESTAMP
                WHERE status IS NULL OR status = ''
            """)

            updated_rows = cursor.rowcount
            if updated_rows > 0:
                print(f"✅ Actualizados {updated_rows} registros existentes")

        except sqlite3.Error as e:
            print(f"❌ Error actualizando registros existentes: {e}")

        conn.commit()
        print("✅ Actualización de tablas completada exitosamente")

        return True

    except sqlite3.Error as e:
        print(f"❌ Error de base de datos: {e}")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False
    finally:
        if conn:
            conn.close()


def verify_upgrade():
    """
    Verifica que la actualización se haya realizado correctamente
    """
    db_path = os.path.join(os.path.dirname(__file__), "database", "mykonos.db")

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Verificar estructura de la tabla
        cursor.execute("PRAGMA table_info(inventory_movemetns_groups)")
        columns = cursor.fetchall()

        print("\n📊 Estructura actual de inventory_movemetns_groups:")
        for column in columns:
            print(f"  - {column[1]} ({column[2]})")

        # Contar registros
        cursor.execute("SELECT COUNT(*) FROM inventory_movemetns_groups")
        count = cursor.fetchone()[0]
        print(f"\n📈 Total de registros: {count}")

        if count > 0:
            cursor.execute("""
                SELECT status, COUNT(*) 
                FROM inventory_movemetns_groups 
                GROUP BY status
            """)
            status_counts = cursor.fetchall()
            print("\n📊 Distribución por estado:")
            for status, count in status_counts:
                print(f"  - {status}: {count}")

        return True

    except sqlite3.Error as e:
        print(f"❌ Error verificando actualización: {e}")
        return False
    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    print("🚀 Iniciando actualización de tablas de inventario")
    print(f"⏰ Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)

    if upgrade_inventory_tables():
        print("\n" + "=" * 50)
        verify_upgrade()
        print("\n✅ ¡Actualización completada exitosamente!")
        print(
            "\nAhora puedes usar las nuevas funcionalidades de movimientos de inventario."
        )
    else:
        print("\n❌ La actualización falló. Revisa los errores anteriores.")
        exit(1)
