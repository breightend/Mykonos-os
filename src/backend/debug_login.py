import sqlite3
import sys
from werkzeug.security import check_password_hash


def test_admin_login():
    try:
        # Conectar a la base de datos
        conn = sqlite3.connect("database/mykonos.db")
        cursor = conn.cursor()

        # Buscar el usuario admin
        cursor.execute(
            "SELECT id, username, password, role, status FROM users WHERE username = ?",
            ("admin",),
        )
        user = cursor.fetchone()

        if not user:
            print("❌ Usuario admin no encontrado")
            return False

        user_id, username, password_hash, role, status = user
        print(f"✅ Usuario encontrado:")
        print(f"   ID: {user_id}")
        print(f"   Username: {username}")
        print(f"   Role: {role}")
        print(f"   Status: {status}")
        print(
            f"   Password hash: {password_hash[:20]}..."
            if password_hash
            else "   Password hash: None"
        )

        # Verificar contraseña
        test_password = "admin123"
        if password_hash:
            password_valid = check_password_hash(password_hash, test_password)
            print(
                f"   Password validation: {'✅ Válida' if password_valid else '❌ Inválida'}"
            )
        else:
            print("   Password validation: ❌ No hay hash de contraseña")
            password_valid = False

        # Verificar tabla de sesiones
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'"
        )
        sessions_table_exists = cursor.fetchone() is not None
        print(
            f"   Tabla sessions existe: {'✅ Sí' if sessions_table_exists else '❌ No'}"
        )

        # Verificar sucursales
        cursor.execute("SELECT COUNT(*) FROM storage WHERE status = 'Activo'")
        active_storages = cursor.fetchone()[0]
        print(f"   Sucursales activas: {active_storages}")

        conn.close()

        # Resumen
        print(f"\n📊 Resumen del diagnóstico:")
        print(f"   Usuario existe: {'✅' if user else '❌'}")
        print(f"   Estado activo: {'✅' if status == 'active' else '❌'}")
        print(f"   Contraseña válida: {'✅' if password_valid else '❌'}")
        print(f"   Tabla sessions: {'✅' if sessions_table_exists else '❌'}")

        return user and status == "active" and password_valid and sessions_table_exists

    except Exception as e:
        print(f"❌ Error: {e}")
        return False


if __name__ == "__main__":
    success = test_admin_login()
    if success:
        print(f"\n🎉 El usuario admin debería poder hacer login correctamente")
    else:
        print(f"\n⚠️ Hay problemas que impiden el login del usuario admin")
