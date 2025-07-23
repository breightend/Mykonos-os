import sqlite3

print("🔍 Verificando estado de la base de datos...")

try:
    conn = sqlite3.connect("database/mykonos.db")
    cursor = conn.cursor()

    # Verificar tabla sessions
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'"
    )
    if cursor.fetchone():
        print("✅ Tabla sessions existe")

        # Verificar estructura de sessions
        cursor.execute("PRAGMA table_info(sessions)")
        columns = cursor.fetchall()
        storage_id_nullable = False
        for col in columns:
            if (
                col[1] == "storage_id" and col[3] == 0
            ):  # col[3] es notnull (0 = nullable)
                storage_id_nullable = True
                break

        if storage_id_nullable:
            print("✅ storage_id es nullable")
        else:
            print("❌ storage_id NO es nullable - este es el problema")
    else:
        print("❌ Tabla sessions no existe")

    # Verificar usuario admin
    cursor.execute(
        "SELECT id, username, role, status FROM users WHERE username = 'admin'"
    )
    admin = cursor.fetchone()
    if admin:
        print(f"✅ Usuario admin: ID={admin[0]}, Role={admin[2]}, Status={admin[3]}")
    else:
        print("❌ Usuario admin no encontrado")

    # Verificar sesiones activas
    cursor.execute("SELECT COUNT(*) FROM sessions WHERE is_active = 1")
    active_sessions = cursor.fetchone()[0]
    print(f"📊 Sesiones activas: {active_sessions}")

    if active_sessions > 0:
        cursor.execute("""
            SELECT s.id, u.username, s.storage_id, s.is_active
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.is_active = 1
        """)
        sessions = cursor.fetchall()
        print("📋 Sesiones activas:")
        for session in sessions:
            print(
                f"   - Session {session[0]}: {session[1]}, Storage: {session[2]}, Active: {session[3]}"
            )

    conn.close()

except Exception as e:
    print(f"❌ Error: {e}")

print("\n🔧 Si storage_id NO es nullable, ejecuta:")
print("python fix_login.py")
