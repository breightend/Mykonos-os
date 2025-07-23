#!/usr/bin/env python3
"""
INSTRUCCIONES:
1. Abre Python en el directorio backend
2. Copia y pega este código línea por línea
3. Ejecuta cada bloque

PROBLEMA IDENTIFICADO:
- La tabla 'sessions' tiene storage_id como NOT NULL pero intentamos insertar NULL
- Solución: Recrear tabla con storage_id NULLABLE
"""

# PASO 1: Conectar a la base de datos
import sqlite3

conn = sqlite3.connect("database/mykonos.db")
cursor = conn.cursor()

# PASO 2: Eliminar tabla sessions problemática
cursor.execute("DROP TABLE IF EXISTS sessions")
print("✅ Tabla sessions eliminada")

# PASO 3: Crear nueva tabla sessions (storage_id NULLABLE)
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
print("✅ Nueva tabla sessions creada")

# PASO 4: Verificar usuario admin
cursor.execute("SELECT id, username, role, status FROM users WHERE username = 'admin'")
admin = cursor.fetchone()
if admin:
    print(f"✅ Usuario admin: ID={admin[0]}, Role={admin[2]}, Status={admin[3]}")
    if admin[3] != "active":
        cursor.execute("UPDATE users SET status = 'active' WHERE username = 'admin'")
        print("✅ Usuario admin activado")
else:
    print("❌ Usuario admin no encontrado - ejecuta admin_manager.py primero")

# PASO 5: Verificar estructura
cursor.execute("PRAGMA table_info(sessions)")
columns = cursor.fetchall()
print("📋 Estructura de sessions:")
for col in columns:
    null_info = "NOT NULL" if col[3] else "NULLABLE"
    print(f"   {col[1]} ({col[2]}) - {null_info}")

# PASO 6: Confirmar cambios
conn.commit()
conn.close()
print("🎉 Base de datos reparada - intenta login nuevamente")

# RESULTADO ESPERADO:
# ✅ Tabla sessions eliminada
# ✅ Nueva tabla sessions creada
# ✅ Usuario admin: ID=1, Role=administrator, Status=active
# 📋 Estructura de sessions:
#    id (INTEGER) - NOT NULL
#    user_id (INTEGER) - NOT NULL
#    storage_id (INTEGER) - NULLABLE  ← ESTO RESUELVE EL PROBLEMA
#    session_token (TEXT) - NOT NULL
#    ...
# 🎉 Base de datos reparada - intenta login nuevamente
