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

        processed_profile_image = profile_image
        if profile_image and profile_image.startswith("data:"):
            try:
                import base64

                base64_data = profile_image.split(";base64,")[1]
                processed_profile_image = base64.b64decode(base64_data)
            except Exception as img_error:
                print(f"Error processing profile image: {img_error}")
                processed_profile_image = b""
        elif profile_image:
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
    records = db.get_all_records_by_clause("users", "role = ?", "employee")

    # Process profile images for frontend display
    for record in records:
        if record.get("profile_image"):
            profile_img = record["profile_image"]
            if isinstance(profile_img, bytes):
                try:
                    import base64

                    record["profile_image"] = (
                        f"data:image/png;base64,{base64.b64encode(profile_img).decode('utf-8')}"
                    )
                except Exception as e:
                    print(f"Error converting profile image: {e}")
                    record["profile_image"] = ""

    return jsonify(records), 200


@usuario_router.route("/employee/<user_id>", methods=["GET"])
def obtener_empleado_by_id(user_id):
    db = Database()
    record = db.get_record_by_id("users", user_id)
    if record["success"]:
        employee_data = record["record"]

        if employee_data and employee_data.get("profile_image"):
            profile_img = employee_data["profile_image"]
            if isinstance(profile_img, bytes):
                try:
                    import base64

                    employee_data["profile_image"] = (
                        f"data:image/png;base64,{base64.b64encode(profile_img).decode('utf-8')}"
                    )
                except Exception as e:
                    print(f"Error converting profile image: {e}")
                    employee_data["profile_image"] = ""

        storages = db.get_storages_by_user(user_id)
        employee_data["assigned_storages"] = storages

        return jsonify({"success": True, "record": employee_data}), 200
    else:
        return jsonify({"mensaje": "Usuario no encontrado", "status": "error"}), 404


@usuario_router.route("/employee/<user_id>/storages", methods=["GET"])
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


@usuario_router.route("/employee/<user_id>/storages", methods=["POST"])
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


@usuario_router.route("/employee/<user_id>/storages/<storage_id>", methods=["DELETE"])
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


@usuario_router.route("/<user_id>", methods=["PUT"])
def update_user(user_id):
    """Update user information"""
    db = Database()
    data = request.json

    # Get current user data first
    current_user = db.get_record_by_id("users", user_id)
    if not current_user["success"]:
        return jsonify({"mensaje": "Usuario no encontrado", "status": "error"}), 404

    # Prepare update data
    update_data = {"id": user_id}

    # Only update fields that are provided
    if "username" in data:
        update_data["username"] = data["username"]
    if "fullname" in data:
        update_data["fullname"] = data["fullname"]
    if "email" in data:
        update_data["email"] = data["email"]
    if "phone" in data:
        update_data["phone"] = data["phone"]
    if "domicilio" in data:
        update_data["domicilio"] = data["domicilio"]
    if "cuit" in data:
        update_data["cuit"] = data["cuit"]
    if "role" in data:
        update_data["role"] = data["role"]
    if "status" in data:
        update_data["status"] = data["status"]

    # Handle password update if provided
    if "password" in data and data["password"]:
        hashed_password = generate_password_hash(data["password"])
        update_data["password"] = hashed_password

    # Handle profile image update if provided
    if "profile_image" in data:
        profile_image = data["profile_image"]
        if profile_image and profile_image.startswith("data:"):
            try:
                import base64

                base64_data = profile_image.split(";base64,")[1]
                processed_profile_image = base64.b64decode(base64_data)
                update_data["profile_image"] = processed_profile_image
            except Exception as img_error:
                print(f"Error processing profile image: {img_error}")
                update_data["profile_image"] = b""
        elif profile_image:
            update_data["profile_image"] = (
                profile_image.encode("utf-8")
                if isinstance(profile_image, str)
                else profile_image
            )
        else:
            update_data["profile_image"] = b""

    try:
        result = db.update_record("users", update_data)
        if result["success"]:
            return jsonify(
                {"mensaje": "Usuario actualizado con éxito", "status": "éxito"}
            ), 200
        else:
            return jsonify({"mensaje": result["message"], "status": "error"}), 500
    except Exception as e:
        print(f"Error updating user: {e}")
        return jsonify(
            {"mensaje": f"Error interno del servidor: {str(e)}", "status": "error"}
        ), 500


@usuario_router.route("/<user_id>", methods=["DELETE"])
def delete_user(user_id):
    """Delete a user"""
    db = Database()

    try:
        # First, remove all storage relationships for this user
        user_storage_relationships = db.get_storages_by_user(user_id)
        for storage in user_storage_relationships:
            db.remove_user_storage_relationship(user_id, storage["id"])

        # Then delete the user
        result = db.delete_record("users", "id = ?", (user_id,))
        if result["success"]:
            return jsonify(
                {"mensaje": "Usuario eliminado con éxito", "status": "éxito"}
            ), 200
        else:
            return jsonify({"mensaje": result["message"], "status": "error"}), 500
    except Exception as e:
        print(f"Error deleting user: {e}")
        return jsonify(
            {"mensaje": f"Error interno del servidor: {str(e)}", "status": "error"}
        ), 500
