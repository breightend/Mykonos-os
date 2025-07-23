# Sistema de Autenticación - Mykonos-OS

## 📋 Resumen

Este sistema implementa un completo sistema de autenticación con manejo de sesiones para Mykonos-OS, que incluye:

- ✅ Autenticación de usuarios
- ✅ Gestión de sesiones con tokens seguros
- ✅ Relación usuario-sucursal en sesiones
- ✅ Control de acceso basado en roles
- ✅ Protección de rutas en frontend
- ✅ Scripts para gestión de administradores

## 🚀 Instalación y Configuración

### 1. Backend - Configuración Python

```bash
cd src/backend

# Instalar dependencias (si es necesario)
pip install flask flask-cors werkzeug

# Ejecutar el servidor
python main.py
```

### 2. Crear Usuario Administrador

**Opción A: Usuario por defecto**

```bash
cd src/backend
python admin_manager.py
```

- Usuario: `admin`
- Contraseña: `admin123`

**Opción B: Usuario personalizado**

```bash
cd src/backend
python admin_manager.py create-custom
```

**Opción C: Listar administradores existentes**

```bash
cd src/backend
python admin_manager.py list
```

### 3. Frontend - Configuración React

El frontend ya está configurado con:

- ✅ SessionProvider global
- ✅ Rutas protegidas
- ✅ Componente de login actualizado
- ✅ Información de sesión en la interfaz

## 📊 Estructura de Base de Datos

### Nueva Tabla: `sessions`

```sql
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    storage_id INTEGER NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    login_time TEXT DEFAULT CURRENT_TIMESTAMP,
    last_activity TEXT DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1,
    ip_address TEXT,
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (storage_id) REFERENCES storage(id)
);
```

## 🔧 API Endpoints

### Autenticación

#### `POST /api/auth/login`

Iniciar sesión

```json
{
  "username": "admin",
  "password": "admin123",
  "storage_id": 1
}
```

#### `POST /api/auth/validate`

Validar sesión

```json
{
  "session_token": "token_here"
}
```

#### `POST /api/auth/logout`

Cerrar sesión

```json
{
  "session_token": "token_here"
}
```

#### `GET /api/auth/storages`

Obtener sucursales disponibles

## 🛡️ Seguridad Implementada

### Backend

- ✅ Contraseñas hasheadas con Werkzeug
- ✅ Tokens de sesión únicos y seguros
- ✅ Validación de permisos usuario-sucursal
- ✅ Control de sesiones activas
- ✅ Verificación de estado de usuarios y sucursales

### Frontend

- ✅ Almacenamiento seguro de tokens en localStorage
- ✅ Verificación automática de sesión al iniciar
- ✅ Rutas protegidas con ProtectedRoute
- ✅ Limpieza automática de tokens inválidos

## 👥 Gestión de Usuarios

### Roles Disponibles

- **administrator**: Acceso completo al sistema
- **employee**: Acceso limitado según asignación de sucursales

### Creación de Administradores

Los administradores solo pueden ser creados mediante:

1. Script `admin_manager.py`
2. Función `create_custom_admin()` en el código
3. El administrador por defecto que se crea automáticamente

### Asignación de Sucursales

- Los **administradores** tienen acceso a todas las sucursales
- Los **empleados** solo a las sucursales asignadas en la tabla `usersxstorage`

## 🔄 Flujo de Autenticación

1. **Usuario accede al login** (`/`)
2. **Carga sucursales disponibles** (GET `/api/auth/storages`)
3. **Ingresa credenciales** y opcionalmente selecciona sucursal
   - Si hay sucursales disponibles: debe seleccionar una
   - Si no hay sucursales: solo administradores pueden acceder (sin selección)
4. **Backend valida** usuario, contraseña y permisos
5. **Se crea sesión** en base de datos con token único
6. **Frontend almacena token** y navega a `/home`
7. **Rutas protegidas verifican** token en cada acceso
8. **SessionInfo muestra** datos de usuario y sucursal (o "Sin sucursal" si no hay)

## ✨ Funcionalidades Especiales

### Manejo de Sistema Sin Sucursales

- **Primera instalación**: Si no hay sucursales configuradas, solo administradores pueden acceder
- **Login sin sucursal**: No se requiere seleccionar sucursal si no hay ninguna disponible
- **Sesión sin sucursal**: Se muestra "Sin sucursal asignada" en la interfaz
- **Notificación**: Administradores ven aviso para configurar sucursales

### Control de Acceso Inteligente

- **Administradores**: Acceso completo independientemente de sucursales
- **Empleados**: Requieren sucursal asignada para acceder
- **Validación automática**: Sistema verifica permisos usuario-sucursal

## 🗂️ Archivos Modificados/Creados

### Backend

- ✅ `database/database.py` - Nueva tabla sessions
- ✅ `services/auth_service.py` - Lógica de autenticación
- ✅ `routes/auth.py` - Endpoints de autenticación
- ✅ `commons/create_admin.py` - Gestión de administradores
- ✅ `admin_manager.py` - Script CLI para administradores
- ✅ `main.py` - Registro del router auth

### Frontend

- ✅ `contexts/SessionContext.jsx` - Contexto global de sesión
- ✅ `components/login.jsx` - Login con nueva funcionalidad
- ✅ `components/ProtectedRoute.jsx` - Protección de rutas
- ✅ `components/SessionInfo.jsx` - Info de sesión en UI
- ✅ `App.jsx` - SessionProvider y rutas protegidas

## 🎯 Próximos Pasos

1. **Integrar SessionInfo** en la barra de navegación
2. **Implementar permisos granulares** por módulo
3. **Agregar logs de auditoría** para accesos
4. **Configurar expiración** automática de sesiones
5. **Implementar 2FA** para administradores

## 🆘 Solución de Problemas

### Primer Login (Sin Sucursales)

**Problema**: "No hay sucursales configuradas"
**Solución**:

1. Crear usuario administrador: `python admin_manager.py`
2. Hacer login como administrador (usuario: `admin`, contraseña: `admin123`)
3. Crear al menos una sucursal desde el panel de administración
4. Los empleados podrán acceder una vez asignados a sucursales

### Error "Usuario no encontrado"

- Verificar que existe al menos un usuario administrador
- Ejecutar `python admin_manager.py list` para verificar

### Error "Sucursal no encontrada"

- Verificar que existen sucursales con status "Activo"
- Revisar tabla `storage` en la base de datos

### Error de conexión

- Verificar que el servidor Python está ejecutándose en puerto 5000
- Verificar configuración CORS en `main.py`

### Token inválido

- El token se limpia automáticamente al ser inválido
- El usuario será redirigido al login

### Empleado sin acceso a sucursales

**Problema**: Empleado no puede seleccionar ninguna sucursal
**Solución**:

1. Administrador debe asignar sucursales al empleado
2. Usar la interfaz de gestión de empleados
3. Verificar la tabla `usersxstorage` en la base de datos

---

**¡Sistema de autenticación implementado exitosamente! 🎉**
