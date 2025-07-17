from flask import Blueprint, request, jsonify
from database.database import Database

storage_router = Blueprint("storage_router", __name__)


# Anda
@storage_router.route("/", methods=["GET"])
def get_all_storage():
    db = Database()
    records = db.get_all_records("storage")
    return jsonify(records), 200


# Anda
@storage_router.route("/<storage_id>", methods=["GET"])
def get_storage_by_id(storage_id):
    db = Database()
    result = db.get_record_by_id("storage", storage_id)
    if result["success"] and result["record"]:
        return jsonify({"success": True, "record": result["record"]}), 200
    else:
        return jsonify(
            {"mensaje": "Sucursal no encontrada", "status": "error", "success": False}
        ), 404


# Anda
@storage_router.route("/", methods=["POST"])
def create_storage():
    data = request.json
    # Get data from frontend
    name = data.get("name")
    address = data.get("address")
    postal_code = data.get("postal_code")
    phone_number = data.get("phone_number")
    area = data.get("area")
    description = data.get("description")
    status = data.get("status", "active")  # Default to 'active' if not provided
    created_at = data.get("created_at")

    db = Database()

    result = db.add_record(
        "storage",
        {
            "name": name,
            "address": address,
            "postal_code": postal_code,
            "phone_number": phone_number,
            "area": area,
            "description": description,
            "status": status,
            "created_at": created_at,
        },
    )

    if result["success"]:
        return jsonify({"mensaje": "Sucursal creada con éxito", "status": "éxito"}), 200
    else:
        return jsonify({"mensaje": result["message"], "status": "error"}), 500


# Update storage/sucursal
@storage_router.route("/<storage_id>", methods=["PUT"])
def update_storage(storage_id):
    db = Database()
    data = request.json

    # Get data from frontend
    name = data.get("name")
    address = data.get("address")
    postal_code = data.get("postal_code")
    phone_number = data.get("phone_number")
    area = data.get("area")
    description = data.get("description")
    status = data.get("status", "active")
    created_at = data.get("created_at")

    result = db.update_record(
        "storage",
        {
            "id": storage_id,
            "name": name,
            "address": address,
            "postal_code": postal_code,
            "phone_number": phone_number,
            "area": area,
            "description": description,
            "status": status,
            "created_at": created_at,
        },
    )

    if result["success"]:
        return jsonify(
            {"mensaje": "Sucursal actualizada con éxito", "status": "éxito"}
        ), 200
    else:
        return jsonify({"mensaje": result["message"], "status": "error"}), 500


# Delete storage/sucursal
@storage_router.route("/<storage_id>", methods=["DELETE"])
def delete_storage(storage_id):
    db = Database()
    result = db.delete_record("storage", "id = ?", (storage_id,))
    if result["success"]:
        return jsonify(
            {"mensaje": "Sucursal eliminada con éxito", "status": "éxito"}
        ), 200
    else:
        return jsonify({"mensaje": result["message"], "status": "error"}), 500

#obtiene empleados de una sucursal
@storage_router.route("/<storage_id>/employees", methods=["GET"])
def get_storage_employees(storage_id):
    db = Database()
    try:
        # Validate storage_id
        if not storage_id:
            return jsonify(
                {"mensaje": "ID de sucursal es requerido", "status": "error"}
            ), 400

        storage_result = db.get_record_by_id("storage", storage_id)
        if not storage_result["success"] or not storage_result["record"]:
            return jsonify(
                {
                    "mensaje": f"Sucursal con ID {storage_id} no encontrada",
                    "status": "error",
                }
            ), 404

        # Use the database method to get users by storage
        employees = db.get_users_by_storage(storage_id)

        return jsonify(employees), 200
    except Exception as e:
        print(f"Error fetching employees for storage {storage_id}: {e}")
        import traceback

        traceback.print_exc()
        return jsonify(
            {
                "mensaje": f"Error al obtener empleados de la sucursal: {str(e)}",
                "status": "error",
                "storage_id": storage_id,
            }
        ), 500


# Assign employee to storage/sucursal
@storage_router.route("/<storage_id>/employees", methods=["POST"])
def assign_employee_to_storage(storage_id):
    data = request.json
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"mensaje": "user_id es requerido", "status": "error"}), 400

    db = Database()

    # Use the specific method for adding user-storage relationships
    result = db.add_user_storage_relationship(user_id, storage_id)

    if result["success"]:
        return jsonify(
            {"mensaje": "Empleado asignado a sucursal con éxito", "status": "éxito"}
        ), 200
    else:
        return jsonify({"mensaje": result["message"], "status": "error"}), 400


# Remove employee from storage/sucursal
@storage_router.route("/<storage_id>/employees/<user_id>", methods=["DELETE"])
def remove_employee_from_storage(storage_id, user_id):
    db = Database()
    result = db.remove_user_storage_relationship(user_id, storage_id)

    if result["success"]:
        return jsonify(
            {"mensaje": "Empleado removido de sucursal con éxito", "status": "éxito"}
        ), 200
    else:
        return jsonify({"mensaje": result["message"], "status": "error"}), 400
