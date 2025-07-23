from flask import Blueprint, request, jsonify
from services.auth_service import (
    authenticate_user,
    validate_session,
    logout_session,
    get_user_sessions,
)
from database.database import Database

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Maneja la autenticación de usuario.

    Returns:
        JSON con mensaje de éxito o error y, en caso exitoso, los datos de sesión.
    """
    try:
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")
        storage_id = data.get("storage_id")

        # Obtener información adicional del request
        ip_address = request.remote_addr
        user_agent = request.headers.get("User-Agent")

        if not username or not password:
            return jsonify(
                {"success": False, "message": "Usuario y contraseña son requeridos."}
            ), 400

        # Verificar si hay sucursales disponibles
        db = Database()
        available_storages = db.get_all_records_by_clause(
            "storage", "status = ?", "Activo"
        )

        if available_storages and len(available_storages) > 0:
            # Si hay sucursales disponibles, es requerido seleccionar una
            if not storage_id:
                return jsonify(
                    {"success": False, "message": "Debe seleccionar una sucursal."}
                ), 400
        else:
            # Si no hay sucursales, usar None como storage_id
            storage_id = None

        auth_response = authenticate_user(
            username, password, storage_id, ip_address, user_agent
        )

        if auth_response["success"]:
            return jsonify(auth_response), 200
        else:
            return jsonify(auth_response), 401

    except Exception as e:
        print(f"Error en login: {e}")
        return jsonify(
            {"success": False, "message": "Error interno del servidor."}
        ), 500


@auth_bp.route("/validate", methods=["POST"])
def validate():
    """
    Valida un token de sesión.

    Returns:
        JSON con información de la sesión si es válida.
    """
    try:
        data = request.get_json()
        session_token = data.get("session_token")

        if not session_token:
            return jsonify(
                {"success": False, "message": "Token de sesión requerido."}
            ), 400

        validation_response = validate_session(session_token)

        if validation_response["success"]:
            return jsonify(validation_response), 200
        else:
            return jsonify(validation_response), 401

    except Exception as e:
        print(f"Error en validate: {e}")
        return jsonify(
            {"success": False, "message": "Error interno del servidor."}
        ), 500


@auth_bp.route("/logout", methods=["POST"])
def logout():
    """
    Cierra una sesión de usuario.

    Returns:
        JSON con confirmación del logout.
    """
    try:
        data = request.get_json()
        session_token = data.get("session_token")

        if not session_token:
            return jsonify(
                {"success": False, "message": "Token de sesión requerido."}
            ), 400

        logout_response = logout_session(session_token)

        return jsonify(logout_response), 200

    except Exception as e:
        print(f"Error en logout: {e}")
        return jsonify(
            {"success": False, "message": "Error interno del servidor."}
        ), 500


@auth_bp.route("/storages", methods=["GET"])
def get_available_storages():
    """
    Obtiene la lista de sucursales disponibles para login.

    Returns:
        JSON con la lista de sucursales activas.
    """
    try:
        db = Database()
        storages = db.get_all_records_by_clause("storage", "status = ?", "Activo")

        # Formatear la respuesta
        formatted_storages = []
        if storages:
            for storage in storages:
                formatted_storages.append(
                    {
                        "id": storage.get("id"),
                        "name": storage.get("name"),
                        "address": storage.get("address", ""),
                        "description": storage.get("description", ""),
                    }
                )

        return jsonify({"success": True, "storages": formatted_storages}), 200

    except Exception as e:
        print(f"Error obteniendo sucursales: {e}")
        return jsonify(
            {"success": False, "message": "Error al obtener sucursales."}
        ), 500


@auth_bp.route("/sessions/<int:user_id>", methods=["GET"])
def get_user_active_sessions(user_id):
    """
    Obtiene las sesiones activas de un usuario específico.

    Args:
        user_id: ID del usuario

    Returns:
        JSON con la lista de sesiones activas.
    """
    try:
        sessions = get_user_sessions(user_id)

        return jsonify({"success": True, "sessions": sessions}), 200

    except Exception as e:
        print(f"Error obteniendo sesiones del usuario {user_id}: {e}")
        return jsonify({"success": False, "message": "Error al obtener sesiones."}), 500
