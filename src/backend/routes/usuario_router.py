from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from database.database import Database

usuario_router = Blueprint("usuario_router", __name__)  # Creás un Blueprint


@usuario_router.route("/employees", methods=["POST"])
def recibir_datos_empleados():
    db = Database()
    data = request.json  # Obtenemos los datos del frontend

    fullname = data.get("fullname")
    email = data.get("email")
    phone = data.get("phone")
    role = data.get("role")
    status = data.get("status")
    session_token = data.get("session_token")
    profile_image = data.get("profile_image")
    username = data.get("username")
    password = data.get("password")
    cuit = data.get("cuit")
    domicilio = data.get("domicilio")

    if not username or not password:
        return jsonify({"mensaje": "Faltan datos", "status": "error"}), 400

    # Hash de la contraseña
    hashed_password = generate_password_hash(password)  # Guardar en la base de datos
    result = db.add_record(
        "users",
        {
            "username": username,
            "domicilio": domicilio,
            "cuit": cuit,
            "password": hashed_password,
            "fullname": fullname,
            "email": email,
            "phone": phone,
            "role": role,
            "status": status,
            "session_token": session_token,
            "profile_image": profile_image,
        },
    )

    if result["success"]:
        return jsonify(
            {
                "mensaje": "Usuario creado con éxito",
                "status": "éxito",
                "user_id": result["rowid"],
            }
        ), 200
    else:
        return jsonify({"mensaje": "Error al crear el usuario", "status": "error"}), 500


@usuario_router.route("/employees", methods=["GET"])
def obtener_usuario_empleado():
    db = Database()
    records = db.get_all_records_by_clause("users", "role LIKE ?", "employee")
    return jsonify(records), 200


@usuario_router.route("employee/<user_id>", methods=["GET"])
def obtener_empleado_by_id(user_id):
    db = Database()
    record = db.get_record_by_id("users", user_id)
    if record:
        return jsonify(record), 200
    else:
        return jsonify({"mensaje": "Usuario no encontrado", "status": "error"}), 404
