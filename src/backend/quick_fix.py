import sqlite3

print("🚀 Actualizando base de datos...")

try:
    conn = sqlite3.connect("database/mykonos.db")
    cursor = conn.cursor()

    # Eliminar tabla sessions si existe
    cursor.execute("DROP TABLE IF EXISTS sessions")
    print("🔧 Tabla sessions eliminada")

    # Crear nueva tabla sessions
    create_sql = """
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
    cursor.execute(create_sql)
    conn.commit()
    print("✅ Nueva tabla sessions creada")

    # Verificar usuario admin
    cursor.execute("SELECT id, username FROM users WHERE username = 'admin'")
    admin = cursor.fetchone()
    if admin:
        print(f"✅ Usuario admin existe: ID={admin[0]}")
    else:
        print("❌ Usuario admin no encontrado")

    conn.close()
    print("🎉 Base de datos actualizada exitosamente")

except Exception as e:
    print(f"❌ Error: {e}")
