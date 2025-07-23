from database.database import Database

print("🚀 Inicializando base de datos...")

try:
    # Crear instancia de la base de datos
    # Esto automáticamente ejecutará create_tables() en el constructor
    db = Database()
    print("✅ Base de datos inicializada exitosamente")

    # Verificar que la tabla sessions se creó correctamente
    import sqlite3

    conn = sqlite3.connect("database/mykonos.db")
    cursor = conn.cursor()

    # Verificar tabla sessions
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'"
    )
    sessions_exists = cursor.fetchone()

    if sessions_exists:
        print("✅ Tabla sessions creada correctamente")

        # Mostrar estructura
        cursor.execute("PRAGMA table_info(sessions)")
        columns = cursor.fetchall()
        print("📋 Estructura de sessions:")
        for col in columns:
            null_info = "NOT NULL" if col[3] else "NULLABLE"
            print(f"   {col[1]} ({col[2]}) - {null_info}")
    else:
        print("❌ Tabla sessions no se creó")

    # Verificar usuario admin
    cursor.execute("SELECT id, username, role FROM users WHERE username = 'admin'")
    admin = cursor.fetchone()

    if admin:
        print(f"✅ Usuario admin encontrado: ID={admin[0]}, Role={admin[2]}")
    else:
        print("❌ Usuario admin no encontrado")

    conn.close()

    print("\n🎉 La base de datos está lista para el login")
    print("🔑 Prueba ahora con: admin / admin123")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback

    traceback.print_exc()
