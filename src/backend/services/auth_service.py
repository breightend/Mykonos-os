import secrets
from werkzeug.security import check_password_hash
from database.database import Database

db = Database()


def authenticate_user(username, password, storage_id, ip_address=None, user_agent=None):
    """
    Verifica las credenciales del usuario y crea una sesión.

    Args:
        username (str): Nombre de usuario.
        password (str): Contraseña ingresada por el usuario.
        storage_id (int): ID de la sucursal seleccionada.
        ip_address (str): Dirección IP del cliente.
        user_agent (str): Información del navegador/cliente.

    Returns:
        dict: {'success': bool, 'message': str, 'session_data': dict (si éxito)}
    """
    # Buscar usuario por username
    user_response = db.get_record_by_clause(
        table_name="users", search_clause="username=?", value=username
    )

    if not user_response["success"]:
        return {"success": False, "message": "Error al buscar usuario."}

    user_record = user_response["record"]

    if not user_record:
        return {"success": False, "message": "Usuario no encontrado."}

    # Verificar que el usuario esté activo
    if user_record.get("status") != "active":
        return {
            "success": False,
            "message": "Usuario inactivo. Contacte al administrador.",
        }

    # Extraer valores específicos
    user_id = user_record["id"]
    db_password = user_record["password"]
    user_role = user_record.get("role", "employee")

    # Verificar la contraseña hasheada
    if not check_password_hash(db_password, password):
        return {"success": False, "message": "Contraseña incorrecta."}

    # Manejar el caso donde no hay sucursales disponibles
    storage_info = None
    if storage_id is not None:
        # Verificar que la sucursal existe
        storage_response = db.get_record_by_id("storage", storage_id)
        if not storage_response["success"] or not storage_response["record"]:
            return {"success": False, "message": "Sucursal no encontrada."}

        storage_info = storage_response["record"]
        if storage_info.get("status") != "Activo":
            return {"success": False, "message": "Sucursal inactiva."}

        # Verificar que el usuario tiene acceso a esta sucursal (solo para empleados)
        if user_role == "employee":
            has_access = db.check_user_storage_relationship_exists(user_id, storage_id)
            if not has_access:
                return {"success": False, "message": "No tiene acceso a esta sucursal."}
    else:
        # No hay sucursales disponibles, solo permitir administradores
        if user_role != "administrator":
            return {
                "success": False,
                "message": "No hay sucursales disponibles. Solo administradores pueden acceder.",
            }

    # Cerrar sesiones anteriores del usuario
    close_user_sessions(user_id)

    # Generar token de sesión único
    session_token = secrets.token_urlsafe(32)

    # Crear nueva sesión
    session_data = {
        "user_id": user_id,
        "storage_id": storage_id,
        "session_token": session_token,
        "ip_address": ip_address,
        "user_agent": user_agent,
        "is_active": 1,
        # Los campos login_time y last_activity se establecen automáticamente con DEFAULT CURRENT_TIMESTAMP
    }

    session_result = db.add_record("sessions", session_data)

    if not session_result["success"]:
        return {"success": False, "message": "Error al crear sesión."}

    # Preparar datos de respuesta
    response_data = {
        "user_id": user_id,
        "username": user_record["username"],
        "fullname": user_record["fullname"],
        "role": user_role,
        "storage_id": storage_id,
        "storage_name": storage_info.get("name") if storage_info else "Sin sucursal",
        "session_token": session_token,
        "session_id": session_result["rowid"],
    }

    print(f"🔐 Datos de respuesta del login: {response_data}")
    return {"success": True, "message": "Login exitoso.", "session_data": response_data}


def close_user_sessions(user_id):
    """
    Cierra todas las sesiones activas de un usuario.

    Args:
        user_id (int): ID del usuario.
    """
    try:
        # Actualizar todas las sesiones del usuario para marcarlas como inactivas
        db.execute_query(
            "UPDATE sessions SET is_active = 0 WHERE user_id = ? AND is_active = 1",
            (user_id,),
        )
        return True
    except Exception as e:
        print(f"Error cerrando sesiones del usuario {user_id}: {e}")
        return False


def validate_session(session_token):
    """
    Valida un token de sesión.

    Args:
        session_token (str): Token de sesión a validar.

    Returns:
        dict: {'success': bool, 'message': str, 'session_data': dict (si éxito)}
    """
    if not session_token:
        return {"success": False, "message": "Token de sesión requerido."}

    # Buscar sesión activa
    session_response = db.get_record_by_clause(
        "sessions", "session_token=? AND is_active=1", session_token
    )

    if not session_response["success"] or not session_response["record"]:
        return {"success": False, "message": "Sesión inválida o expirada."}

    session = session_response["record"]

    # Actualizar última actividad
    db.execute_query(
        "UPDATE sessions SET last_activity = CURRENT_TIMESTAMP WHERE id = ?",
        (session["id"],),
    )

    # Obtener datos del usuario
    user_response = db.get_record_by_id("users", session["user_id"])
    if not user_response["success"]:
        return {"success": False, "message": "Usuario no encontrado."}

    user = user_response["record"]

    # Obtener datos de la sucursal (si existe)
    storage_name = "Sin sucursal"
    if session["storage_id"]:
        storage_response = db.get_record_by_id("storage", session["storage_id"])
        if storage_response["success"] and storage_response["record"]:
            storage_name = storage_response["record"]["name"]

    return {
        "success": True,
        "message": "Sesión válida.",
        "session_data": {
            "user_id": user["id"],
            "username": user["username"],
            "fullname": user["fullname"],
            "role": user["role"],
            "storage_id": session["storage_id"],
            "storage_name": storage_name,
            "session_token": session_token,
            "session_id": session["id"],
        },
    }


def logout_session(session_token):
    """
    Cierra una sesión específica.

    Args:
        session_token (str): Token de sesión a cerrar.

    Returns:
        dict: {'success': bool, 'message': str}
    """
    if not session_token:
        return {"success": False, "message": "Token de sesión requerido."}

    try:
        result = db.execute_query(
            "UPDATE sessions SET is_active = 0 WHERE session_token = ? AND is_active = 1",
            (session_token,),
        )

        if result:
            return {"success": True, "message": "Sesión cerrada exitosamente."}
        else:
            return {"success": False, "message": "Sesión no encontrada."}
    except Exception as e:
        print(f"Error cerrando sesión: {e}")
        return {"success": False, "message": "Error al cerrar sesión."}


def get_user_sessions(user_id):
    """
    Obtiene todas las sesiones activas de un usuario.

    Args:
        user_id (int): ID del usuario.

    Returns:
        list: Lista de sesiones activas.
    """
    try:
        sessions = db.get_all_records_by_clause(
            "sessions", "user_id = ? AND is_active = 1", user_id
        )
        return sessions if sessions else []
    except Exception as e:
        print(f"Error obteniendo sesiones del usuario {user_id}: {e}")
        return []
