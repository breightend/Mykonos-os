from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from database.database import Database  # Asegúrate de importar tu clase Database

usuario_router = Blueprint('usuario_router', __name__)  # Creás un Blueprint

@usuario_router.route('/', methods=['POST'])
def recibir_datos():
    db = Database()
    data = request.json  # Obtenemos los datos del frontend

    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"mensaje": "Faltan datos", "status": "error"}), 400

    # Hash de la contraseña
    hashed_password = generate_password_hash(password)

    # Guardar en la base de datos
    success = db.add_record("users", {"username": username, "password": hashed_password})

    if success:
        return jsonify({"mensaje": "Usuario creado con éxito", "status": "éxito"}), 200
    else:
        return jsonify({"mensaje": "Error al crear el usuario", "status": "error"}), 500