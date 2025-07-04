from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from database.database import Database

usuario_router = Blueprint("usuario_router", __name__)  # Creás un Blueprint


@usuario_router.route("/employees", methods=["POST"])
def recibir_datos_empleados():
    db = Database()
    data = request.json  # Obtenemos los datos del frontend

    # Required fields
    username = data.get("username")
    password = data.get("password")
    fullname = data.get("fullname")
    email = data.get("email")
    phone = data.get("phone")
    cuit = data.get("cuit")
    domicilio = data.get("domicilio")

    # Optional fields with defaults
    role = data.get("role", "employee")
    status = data.get("status", "active")
    session_token = data.get("session_token", "")
    profile_image = data.get("profile_image", "")

    if not username or not password:
        return jsonify(
            {"mensaje": "Username y password son requeridos", "status": "error"}
        ), 400

    if not fullname:
        return jsonify({"mensaje": "Fullname es requerido", "status": "error"}), 400

    try:
        # Hash de la contraseña
        hashed_password = generate_password_hash(password)

        # Handle profile_image: if it's a base64 string, convert to bytes
        processed_profile_image = profile_image
        if profile_image and profile_image.startswith("data:"):
            # Extract the base64 part and convert to bytes
            try:
                import base64

                base64_data = profile_image.split(";base64,")[1]
                processed_profile_image = base64.b64decode(base64_data)
            except Exception as img_error:
                print(f"Error processing profile image: {img_error}")
                processed_profile_image = b""  # Empty bytes if conversion fails
        elif profile_image:
            # If it's already a string but not a data URI, store as is
            processed_profile_image = (
                profile_image.encode("utf-8")
                if isinstance(profile_image, str)
                else profile_image
            )
        else:
            processed_profile_image = b""  # Empty bytes for no image

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
                "profile_image": processed_profile_image,
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
            print(f"Database error: {result.get('message', 'Unknown error')}")
            return jsonify(
                {
                    "mensaje": f"Error al crear el usuario: {result.get('message', 'Unknown error')}",
                    "status": "error",
                }
            ), 500

    except Exception as e:
        print(f"Exception in user creation: {e}")
        return jsonify(
            {"mensaje": f"Error interno del servidor: {str(e)}", "status": "error"}
        ), 500


@usuario_router.route("/employees", methods=["GET"])
def obtener_usuario_empleado():
    db = Database()
    records = db.get_all_records_by_clause("users", "role LIKE ?", "employee")
    return jsonify(records), 200


@usuario_router.route("employee/<user_id>", methods=["GET"])
def obtener_empleado_by_id(user_id):
    db = Database()
    record = db.get_record_by_id("users", user_id)
    if record["success"]:
        employee_data = record["record"]

        # Convert profile_image from bytes to base64 string if needed
        if employee_data and employee_data.get("profile_image"):
            profile_img = employee_data["profile_image"]
            if isinstance(profile_img, bytes):
                try:
                    import base64

                    # Convert bytes to base64 string
                    employee_data["profile_image"] = (
                        f"data:image/png;base64,{base64.b64encode(profile_img).decode('utf-8')}"
                    )
                except Exception as e:
                    print(f"Error converting profile image: {e}")
                    employee_data["profile_image"] = ""

        # Get the employee's assigned storages
        storages = db.get_storages_by_user(user_id)
        employee_data["assigned_storages"] = storages

        return jsonify({"success": True, "record": employee_data}), 200
    else:
        return jsonify({"mensaje": "Usuario no encontrado", "status": "error"}), 404


@usuario_router.route("employee/<user_id>/storages", methods=["GET"])
def get_employee_storages(user_id):
    """Get all storages assigned to a specific employee"""
    db = Database()
    try:
        storages = db.get_storages_by_user(user_id)
        return jsonify(storages), 200
    except Exception as e:
        print(f"Error getting employee storages: {e}")
        return jsonify(
            {"mensaje": "Error al obtener sucursales del empleado", "status": "error"}
        ), 500


@usuario_router.route("employee/<user_id>/storages", methods=["POST"])
def assign_storage_to_employee(user_id):
    """Assign a storage to an employee"""
    db = Database()
    data = request.json
    storage_id = data.get("storage_id")

    if not storage_id:
        return jsonify({"mensaje": "storage_id es requerido", "status": "error"}), 400

    try:
        result = db.add_user_storage_relationship(user_id, storage_id)
        if result["success"]:
            return jsonify(
                {"mensaje": "Sucursal asignada con éxito", "status": "éxito"}
            ), 200
        else:
            return jsonify({"mensaje": result["message"], "status": "error"}), 400
    except Exception as e:
        print(f"Error assigning storage to employee: {e}")
        return jsonify({"mensaje": "Error al asignar sucursal", "status": "error"}), 500


@usuario_router.route("employee/<user_id>/storages/<storage_id>", methods=["DELETE"])
def remove_storage_from_employee(user_id, storage_id):
    """Remove a storage assignment from an employee"""
    db = Database()
    try:
        result = db.remove_user_storage_relationship(user_id, storage_id)
        if result["success"]:
            return jsonify(
                {"mensaje": "Sucursal removida con éxito", "status": "éxito"}
            ), 200
        else:
            return jsonify({"mensaje": result["message"], "status": "error"}), 400
    except Exception as e:
        print(f"Error removing storage from employee: {e}")
        return jsonify({"mensaje": "Error al remover sucursal", "status": "error"}), 500
