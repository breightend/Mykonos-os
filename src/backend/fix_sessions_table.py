#!/usr/bin/env python3
"""
Script para verificar y crear la tabla sessions si no existe
"""

import sqlite3
from pathlib import Path


def check_and_create_sessions_table():
    db_path = Path("database/mykonos.db")

    if not db_path.exists():
        print("❌ Base de datos no encontrada")
        return False

    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()

        # Verificar si existe la tabla sessions
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'"
        )
        table_exists = cursor.fetchone()

        if table_exists:
            print("✅ Tabla sessions ya existe")
            # Mostrar estructura de la tabla
            cursor.execute("PRAGMA table_info(sessions)")
            columns = cursor.fetchall()
            print("📋 Estructura de la tabla sessions:")
            for col in columns:
                print(f"   {col[1]} ({col[2]})")
        else:
            print("❌ Tabla sessions NO existe")
            print("🔧 Creando tabla sessions...")

            # Crear la tabla sessions
            create_sessions_table_sql = """
            CREATE TABLE sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                storage_id INTEGER,
                session_token TEXT NOT NULL UNIQUE,
                ip_address TEXT,
                user_agent TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (storage_id) REFERENCES storage (id)
            )
            """

            cursor.execute(create_sessions_table_sql)
            conn.commit()
            print("✅ Tabla sessions creada exitosamente")

        # Verificar tabla users
        cursor.execute(
            "SELECT id, username, role, status FROM users WHERE username = 'admin'"
        )
        admin_user = cursor.fetchone()

        if admin_user:
            print(
                f"✅ Usuario admin encontrado: ID={admin_user[0]}, Role={admin_user[2]}, Status={admin_user[3]}"
            )
        else:
            print("❌ Usuario admin no encontrado")

        # Verificar tabla storage
        cursor.execute("SELECT COUNT(*) FROM storage WHERE status = 'Activo'")
        active_storages = cursor.fetchone()[0]
        print(f"📊 Sucursales activas: {active_storages}")

        conn.close()
        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False


if __name__ == "__main__":
    success = check_and_create_sessions_table()
    if success:
        print("\n🎉 Base de datos verificada y preparada para autenticación")
    else:
        print("\n⚠️ Hubo problemas al verificar/crear la base de datos")
