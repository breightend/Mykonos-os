-- SCRIPT SQL PARA REPARAR LA BASE DE DATOS
-- Ejecuta estos comandos en tu cliente SQLite sobre mykonos.db

-- 1. Eliminar tabla sessions existente (si existe)
DROP TABLE IF EXISTS sessions;

-- 2. Crear nueva tabla sessions con estructura correcta
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    storage_id INTEGER,  -- NULLABLE para permitir login sin sucursales
    session_token TEXT NOT NULL UNIQUE,
    login_time TEXT DEFAULT CURRENT_TIMESTAMP,
    last_activity TEXT DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1,
    ip_address TEXT,
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (storage_id) REFERENCES storage (id)
);

-- 3. Verificar que el usuario admin esté activo
UPDATE users SET status = 'active' WHERE username = 'admin';

-- 4. Verificar datos
SELECT 'Usuario admin:' as info, id, username, role, status 
FROM users WHERE username = 'admin';

SELECT 'Estructura sessions:' as info;
PRAGMA table_info(sessions);
