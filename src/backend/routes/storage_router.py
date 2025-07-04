from flask import Blueprint, request, jsonify
from database.database import Database

storage_router = Blueprint("storage_router", __name__)


# Get all storage/sucursales
@storage_router.route("/", methods=["GET"])
def get_all_storage():
    db = Database()
    records = db.get_all_records("storage")
    return jsonify(records), 200


# Get storage by ID
@storage_router.route("/<storage_id>", methods=["GET"])
def get_storage_by_id(storage_id):
    db = Database()
    record = db.get_record_by_id("storage", storage_id)
    if record:
        return jsonify(record), 200
    else:
        return jsonify({"mensaje": "Sucursal no encontrada", "status": "error"}), 404


# Create new storage/sucursal
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

    db = Database()

    success = db.add_record(
        "storage",
        {
            "name": name,
            "address": address,
            "postal_code": postal_code,
            "phone_number": phone_number,
            "area": area,
            "description": description,
        },
    )

    if success:
        return jsonify({"mensaje": "Sucursal creada con éxito", "status": "éxito"}), 200
    else:
        return jsonify(
            {"mensaje": "Error al crear la sucursal", "status": "error"}
        ), 500


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

    success = db.update_record(
        "storage",
        {
            "id": storage_id,
            "name": name,
            "address": address,
            "postal_code": postal_code,
            "phone_number": phone_number,
            "area": area,
            "description": description,
        },
    )

    if success:
        return jsonify(
            {"mensaje": "Sucursal actualizada con éxito", "status": "éxito"}
        ), 200
    else:
        return jsonify(
            {"mensaje": "Error al actualizar la sucursal", "status": "error"}
        ), 500


# Delete storage/sucursal
@storage_router.route("/<storage_id>", methods=["DELETE"])
def delete_storage(storage_id):
    db = Database()
    success = db.delete_record("storage", "id = ?", storage_id)
    if success:
        return jsonify(
            {"mensaje": "Sucursal eliminada con éxito", "status": "éxito"}
        ), 200
    else:
        return jsonify(
            {"mensaje": "Error al eliminar la sucursal", "status": "error"}
        ), 500


# Get employees for a specific storage/sucursal
@storage_router.route("/<storage_id>/employees", methods=["GET"])
def get_storage_employees(storage_id):
    db = Database()
    # Get employees assigned to this storage using USERSXSTORAGE table
    query = """
    SELECT u.id, u.username, u.fullname, u.email, u.phone, u.domicilio, u.cuit, u.role, u.status
    FROM users u
    INNER JOIN usersxstorage us ON u.id = us.id_user
    WHERE us.id_storage = ? AND u.role = 'employee'
    """
    try:
        employees = db.execute_query(query, (storage_id,))
        return jsonify(employees), 200
    except Exception as e:
        print(f"Error fetching employees: {e}")
        return jsonify(
            {"mensaje": "Error al obtener empleados de la sucursal", "status": "error"}
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
