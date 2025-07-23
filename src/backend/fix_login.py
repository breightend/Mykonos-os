#!/usr/bin/env python3
"""
Solución completa para el problema de login
"""

import sqlite3
import os
import sys


def fix_database():
    """Arregla la base de datos recreando la tabla sessions"""

    print("🔧 Solucionando problema de login...")

    # Ruta a la base de datos
    db_path = "database/mykonos.db"

    if not os.path.exists(db_path):
        print("❌ Base de datos no encontrada")
        return False

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print("1️⃣ Eliminando tabla sessions existente...")
        cursor.execute("DROP TABLE IF EXISTS sessions")

        print("2️⃣ Creando nueva tabla sessions con estructura correcta...")
        create_sessions_sql = """
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
        cursor.execute(create_sessions_sql)

        print("3️⃣ Verificando usuario admin...")
        cursor.execute(
            "SELECT id, username, role, status FROM users WHERE username = 'admin'"
        )
        admin = cursor.fetchone()

        if admin:
            user_id, username, role, status = admin
            print(f"✅ Usuario admin: ID={user_id}, Role={role}, Status={status}")

            if status != "active":
                print("⚠️ Activando usuario admin...")
                cursor.execute(
                    "UPDATE users SET status = 'active' WHERE username = 'admin'"
                )
        else:
            print("❌ Usuario admin no encontrado")
            return False

        print("4️⃣ Verificando sucursales...")
        cursor.execute("SELECT COUNT(*) FROM storage WHERE status = 'Activo'")
        storages_count = cursor.fetchone()[0]
        print(f"📊 Sucursales activas: {storages_count}")

        conn.commit()
        conn.close()

        print("✅ Base de datos reparada exitosamente")
        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_login():
    """Prueba la función de login directamente"""

    print("\n🧪 Probando función de login...")

    try:
        # Importar las funciones necesarias
        sys.path.insert(0, os.path.dirname(__file__))
        from services.auth_service import authenticate_user

        # Probar login
        result = authenticate_user(
            username="admin",
            password="admin123",
            storage_id=None,  # Sin sucursal para primer login
            ip_address="127.0.0.1",
            user_agent="Test",
        )

        if result["success"]:
            print("✅ Login exitoso!")
            print(f"   Usuario: {result['session_data']['username']}")
            print(f"   Role: {result['session_data']['role']}")
            print(f"   Token: {result['session_data']['session_token'][:20]}...")
            return True
        else:
            print(f"❌ Login falló: {result['message']}")
            return False

    except Exception as e:
        print(f"❌ Error en test de login: {e}")
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("🚀 REPARACIÓN DEL SISTEMA DE LOGIN")
    print("=" * 50)

    # Paso 1: Reparar base de datos
    if fix_database():
        # Paso 2: Probar login
        if test_login():
            print("\n🎉 PROBLEMA RESUELTO!")
            print("=" * 50)
            print("🔑 Ahora puedes hacer login con:")
            print("   Usuario: admin")
            print("   Contraseña: admin123")
            print("   URL Frontend: http://localhost:3000")
            print("   API Backend: http://localhost:5000/api/auth/login")
            print("=" * 50)
        else:
            print("\n⚠️ Base de datos reparada pero login aún falla")
    else:
        print("\n❌ No se pudo reparar la base de datos")
