#!/usr/bin/env python3
"""
Script para actualizar la estructura de la tabla sessions
permitiendo storage_id como nullable
"""

import sqlite3
from pathlib import Path


def update_sessions_table():
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
            print("🔧 Eliminando tabla sessions existente para recrearla...")
            cursor.execute("DROP TABLE sessions")

        print("🔧 Creando nueva tabla sessions con storage_id nullable...")

        # Crear la nueva tabla sessions
        create_sessions_table_sql = """
        CREATE TABLE sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            storage_id INTEGER,
            session_token TEXT NOT NULL UNIQUE,
            login_time TEXT DEFAULT CURRENT_TIMESTAMP,
            last_activity TEXT DEFAULT CURRENT_TIMESTAMP,
            is_active INTEGER DEFAULT 1,
            ip_address TEXT,
            user_agent TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (storage_id) REFERENCES storage (id)
        )
        """

        cursor.execute(create_sessions_table_sql)
        conn.commit()
        print("✅ Tabla sessions creada exitosamente")

        # Verificar estructura de la nueva tabla
        cursor.execute("PRAGMA table_info(sessions)")
        columns = cursor.fetchall()
        print("📋 Nueva estructura de la tabla sessions:")
        for col in columns:
            null_constraint = "NOT NULL" if col[3] else "NULLABLE"
            print(f"   {col[1]} ({col[2]}) - {null_constraint}")

        # Verificar datos de prueba
        print("\n🔍 Verificando datos para pruebas...")

        # Verificar usuario admin
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

        # Verificar sucursales
        cursor.execute("SELECT COUNT(*) FROM storage WHERE status = 'Activo'")
        active_storages = cursor.fetchone()[0]
        print(f"📊 Sucursales activas: {active_storages}")

        if active_storages == 0:
            print(
                "ℹ️  Sin sucursales activas - el login admin funcionará sin requerir sucursal"
            )

        conn.close()
        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False


if __name__ == "__main__":
    success = update_sessions_table()
    if success:
        print("\n🎉 Base de datos actualizada exitosamente")
        print("🔑 Ahora puedes intentar hacer login con admin/admin123")
    else:
        print("\n⚠️ Hubo problemas al actualizar la base de datos")
