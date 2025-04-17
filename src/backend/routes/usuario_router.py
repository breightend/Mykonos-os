from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from database.database import Database  

usuario_router = Blueprint('usuario_router', __name__)  # Creás un Blueprint

@usuario_router.route('/', methods=['POST'])
def recibir_datos():
    db = Database()
    data = request.json  # Obtenemos los datos del frontend

    fullname = data.get("fullname")
    email = data.get("email")
    phone= data.get("phone")
    role= data.get("role")
    status= data.get("status")
    session_token= data.get("session_token")
    profile_image= data.get("profile_image")
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"mensaje": "Faltan datos", "status": "error"}), 400

    # Hash de la contraseña
    hashed_password = generate_password_hash(password)

    # Guardar en la base de datos
    success = db.add_record("users", {"username": username, "password": hashed_password, "fullname": fullname, "email": email, "phone": phone, "role": role, "status": status, "session_token": session_token, "profile_image": profile_image})

    if success:
        return jsonify({"mensaje": "Usuario creado con éxito", "status": "éxito"}), 200
    else:
        return jsonify({"mensaje": "Error al crear el usuario", "status": "error"}), 500
    

@usuario_router.route('/<user_id>', methods=['GET'])
def obtener_usuario(user_id):
    db = Database()
    records = db.get_all_records_by_clause("users", "role LIKE ?", "employee")
    return jsonify(records), 200
