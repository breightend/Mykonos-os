#!/usr/bin/env python3
import sqlite3
import sys
from pathlib import Path


def check_admin_user():
    db_path = Path("database/mykonos.db")

    if not db_path.exists():
        print("❌ Base de datos no encontrada")
        return False

    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()

        # Verificar si existe la tabla users
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
        )
        if not cursor.fetchone():
            print("❌ Tabla 'users' no existe")
            return False

        # Buscar usuario admin
        cursor.execute(
            "SELECT username, role, password_hash FROM users WHERE username = ?",
            ("admin",),
        )
        result = cursor.fetchone()

        if result:
            username, role, password_hash = result
            print(f"✅ Usuario encontrado:")
            print(f"   Username: {username}")
            print(f"   Role: {role}")
            print(f"   Password hash exists: {'Sí' if password_hash else 'No'}")
            print(
                f"   Password hash length: {len(password_hash) if password_hash else 0}"
            )
        else:
            print("❌ Usuario admin no encontrado")

        # Mostrar todos los usuarios
        cursor.execute("SELECT username, role FROM users")
        all_users = cursor.fetchall()
        print(f"\n📋 Todos los usuarios en la base de datos ({len(all_users)}):")
        for user in all_users:
            print(f"   - {user[0]} ({user[1]})")

        conn.close()
        return result is not None

    except Exception as e:
        print(f"❌ Error al verificar la base de datos: {e}")
        return False


if __name__ == "__main__":
    check_admin_user()
