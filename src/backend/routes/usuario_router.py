from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from database.database import Database

usuario_router = Blueprint("usuario_router", __name__)


@usuario_router.route("/employees", methods=["POST"])
def recibir_datos_empleados():
    db = Database()
    data = request.json

    print(f"Received data: {data}")

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

    # Validate required fields
    if not username or not password:
        return jsonify(
            {"mensaje": "Username y password son requeridos", "status": "error"}
        ), 400

    if not fullname:
        return jsonify({"mensaje": "Fullname es requerido", "status": "error"}), 400

    if not cuit:
        return jsonify({"mensaje": "CUIT es requerido", "status": "error"}), 400

    if not email:
        return jsonify({"mensaje": "Email es requerido", "status": "error"}), 400

    if not phone:
        return jsonify({"mensaje": "Teléfono es requerido", "status": "error"}), 400

    if not domicilio:
        return jsonify({"mensaje": "Domicilio es requerido", "status": "error"}), 400

    if not profile_image or not profile_image.strip():
        return jsonify(
            {"mensaje": "Foto de perfil es requerida", "status": "error"}
        ), 400

    try:
        # Check if username already exists
        existing_user = db.get_all_records_by_clause("users", "username = ?", username)
        if existing_user and len(existing_user) > 0:
            return jsonify(
                {"mensaje": "El nombre de usuario ya existe", "status": "error"}
            ), 400

        # Check if cuit already exists
        existing_cuit = db.get_all_records_by_clause("users", "cuit = ?", cuit)
        if existing_cuit and len(existing_cuit) > 0:
            return jsonify({"mensaje": "El CUIT ya existe", "status": "error"}), 400

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

        print(
            f"Attempting to insert user data: {username}, {fullname}, {email}, {phone}, {cuit}"
        )

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

        print(f"Database result: {result}")

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
        import traceback

        traceback.print_exc()
        return jsonify(
            {"mensaje": f"Error interno del servidor: {str(e)}", "status": "error"}
        ), 500


@usuario_router.route("/employees", methods=["GET"])
def obtener_usuario_empleado():
    db = Database()
    records = db.get_all_records_by_clause("users", "role = ?", "employee")

    # Process all records to handle bytes and memoryview objects
    for record in records:
        # Convert memoryview to bytes for all fields
        for k, v in list(record.items()):
            if isinstance(v, memoryview):
                record[k] = v.tobytes()

        # Handle profile_image conversion
        if record.get("profile_image"):
            profile_img = record["profile_image"]
            if isinstance(profile_img, (bytes, memoryview)):
                try:
                    import base64

                    # Convert memoryview to bytes if needed
                    if isinstance(profile_img, memoryview):
                        profile_img = profile_img.tobytes()
                    if len(profile_img) > 0:  # Check if bytes data is not empty
                        record["profile_image"] = (
                            f"data:image/png;base64,{base64.b64encode(profile_img).decode('utf-8')}"
                        )
                    else:
                        record["profile_image"] = ""
                except Exception as e:
                    print(
                        f"Error converting profile image for user {record.get('id', 'unknown')}: {e}"
                    )
                    record["profile_image"] = ""
            elif profile_img is None:
                record["profile_image"] = ""
        else:
            record["profile_image"] = ""

        # Ensure all other fields are JSON serializable
        for key, value in record.items():
            if isinstance(value, (bytes, memoryview)):
                try:
                    # Convert memoryview to bytes if needed
                    if isinstance(value, memoryview):
                        value = value.tobytes()
                    # Try to decode as text first
                    record[key] = value.decode("utf-8")
                except UnicodeDecodeError:
                    # If it's not text, convert to base64
                    import base64

                    record[key] = base64.b64encode(value).decode("utf-8")
                except Exception as e:
                    print(
                        f"Error converting bytes/memoryview field {key} for user {record.get('id', 'unknown')}: {e}"
                    )
                    record[key] = ""

    return jsonify(records), 200


@usuario_router.route("/employee/<user_id>", methods=["GET"])
def obtener_empleado_by_id(user_id):
    db = Database()
    record = db.get_record_by_id("users", user_id)
    if record["success"]:
        employee_data = record["record"]

        # Convert memoryview to bytes for all fields
        for k, v in list(employee_data.items()):
            if isinstance(v, memoryview):
                employee_data[k] = v.tobytes()

        # Handle profile_image conversion
        if employee_data and employee_data.get("profile_image"):
            profile_img = employee_data["profile_image"]
            if isinstance(profile_img, (bytes, memoryview)):
                try:
                    import base64

                    if isinstance(profile_img, memoryview):
                        profile_img = profile_img.tobytes()
                    if len(profile_img) > 0:
                        employee_data["profile_image"] = (
                            f"data:image/png;base64,{base64.b64encode(profile_img).decode('utf-8')}"
                        )
                    else:
                        employee_data["profile_image"] = ""
                except Exception as e:
                    print(f"Error converting profile image for user {user_id}: {e}")
                    employee_data["profile_image"] = ""
            elif profile_img is None:
                employee_data["profile_image"] = ""
        else:
            employee_data["profile_image"] = ""

        # Ensure all other fields are JSON serializable
        for key, value in employee_data.items():
            if isinstance(value, (bytes, memoryview)):
                try:
                    if isinstance(value, memoryview):
                        value = value.tobytes()
                    employee_data[key] = value.decode("utf-8")
                except UnicodeDecodeError:
                    import base64

                    employee_data[key] = base64.b64encode(value).decode("utf-8")
                except Exception as e:
                    print(
                        f"Error converting bytes/memoryview field {key} for user {user_id}: {e}"
                    )
                    employee_data[key] = ""

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


@usuario_router.route("/employee/username/<username>", methods=["GET"])
def get_employee_by_username(username):
    """Get employee by username"""
    db = Database()
    result = db.get_record_by_clause("users", "username = ?", (username,))
    if result["success"] and result["record"] is not None:
        # Elimina o convierte los campos problemáticos
        record = result["record"]
        # Por ejemplo, si tienes un campo 'password' o 'image' que es binario:
        if "password" in record:
            del record["password"]
        # Si tienes otros campos binarios, elimínalos o conviértelos aquí
        # if "image" in record:
        #     record["image"] = base64.b64encode(record["image"]).decode()  # si quieres devolverlo como string
        return jsonify({"data": record, "status": "éxito"}), 200
    else:
        return jsonify({"mensaje": result["message"], "status": "error"}), 404
