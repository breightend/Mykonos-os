from flask import Blueprint, request, jsonify
from services.auth_service import authenticate_user

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Maneja la autenticación de usuario.

    Returns:
        JSON con mensaje de éxito o error y, en caso exitoso, el token JWT.
    """
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"success": False, "message": "Faltan datos."}), 400

    auth_response = authenticate_user(username, password)

    if auth_response["success"]:
        return jsonify(auth_response), 200
    else:
        return jsonify(auth_response), 401
