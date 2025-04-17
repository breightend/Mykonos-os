from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from database.database import Database 

employee_router = Blueprint('employee_router', __name__)  # Creás un Blueprint
@employee_router.route('/', methods=['POST'])
def recibir_datos():
    data = request.json
    # Obtenemos los datos del frontend
    entity_name = data.get("entity_name")
    entity_type = data.get("entity_type")        
    razon_social = data.get("razon_social")
    responsabilidad_iva = data.get("responsabilidad_iva")
    domicilio_comercial = data.get("domicilio_comercial")
    cuit = data.get("cuit")
    inicio_actividades = data.get("inicio_actividad")  
    ingreso_brutos = data.get("ingreso_brutos")
    contact_name = data.get("contact_name")
    phone_number = data.get("phone_number")
    email = data.get("email")
    observation = data.get("observation")

    print(f"entity_name: {entity_name}")
    print(f"entity_type: {entity_type}")
    print(f"razon_social: {razon_social}")
    print(f"responsabilidad_iva: {responsabilidad_iva}")
    print(f"domicilio_comercial: {domicilio_comercial}")
    print(f"cuit: {cuit}")
    print(f"inicio_actividad: {inicio_actividades}")
    print(f"ingreso_brutos: {ingreso_brutos}")
    print(f"contact_name: {contact_name}")
    print(f"phone_number: {phone_number}")
    print(f"email: {email}")
    print(f"observation: {observation}")

    db = Database()
    # if not entity_name or not entity_type or not razon_social or not responsabilidad_iva or not domicilio_comercial or not cuit or not inicio_actividad or not ingreso_brutos or not contact_name or not phone_number or not email:
    #     return jsonify({"mensaje": "Faltan datos", "status": "error"}), 400
    
    success = db.add_record("entities", {
        "entity_name": entity_name,
        "entity_type": entity_type,
        "razon_social": razon_social,
        "responsabilidad_iva": responsabilidad_iva,
        "domicilio_comercial": domicilio_comercial,
        "cuit": cuit,
        "inicio_actividades": inicio_actividades,
        "ingresos_brutos": ingreso_brutos,
        "contact_name": contact_name,
        "phone_number": phone_number,
        "email": email,
        "observations": observation
    })
    print(f"success: {success}")
    if success:
        return jsonify({"mensaje": "Empleado creado con éxito", "status": "éxito"}), 200
    else:
        return jsonify({"mensaje": "Error al crear el empleado", "status": "error"}), 500
    
    #Lo que obtengo lo muestro en la tabla employeees    
@employee_router.route( '/' , methods=['GET'])
def get_all_records():
    db = Database()
#    records = db.get_all_records("entities")
    records = db.get_all_records_by_clause("entities", "entity_type LIKE ?", "employee")
    return jsonify(records), 200


@employee_router.route( '/<employee_id>' , methods=['GET'])
def get_employee_by_id(employee_id):
    db = Database()
    record = db.get_record_by_id("entities", employee_id)
    if record:
        return jsonify(record), 200
    else:
        return jsonify({"mensaje": "Employeee no encontrado", "status": "error"}), 404
    
#Anda! 
@employee_router.route( '/<employee_id>' , methods=['PUT'])
def update_employee(employee_id):
    db = Database()
    # employee_id = request.args.get('employee')
    data = request.json
    # Obtenemos los datos del frontend
    entity_name = data.get("entity_name")
    entity_type = data.get("entity_type")        
    razon_social = data.get("razon_social")
    responsabilidad_iva = data.get("responsabilidad_iva")
    domicilio_comercial = data.get("domicilio_comercial")
    cuit = data.get("cuit")
    inicio_actividades = data.get("inicio_actividad")  
    ingreso_brutos = data.get("ingreso_brutos")
    contact_name = data.get("contact_name")
    phone_number = data.get("phone_number")
    email = data.get("email")
    observation = data.get("observation")

    success = db.update_record("entities", {
        "id": employee_id,
        "entity_name": entity_name,
        "entity_type": entity_type,
        "razon_social": razon_social,
        "responsabilidad_iva": responsabilidad_iva,
        "domicilio_comercial": domicilio_comercial,
        "cuit": cuit,
        "inicio_actividades": inicio_actividades,
        "ingresos_brutos": ingreso_brutos,
        "contact_name": contact_name,
        "phone_number": phone_number,
        "email": email,
        "observations": observation
    })

    if success:
        return jsonify({"mensaje": "Empleado actualizado con éxito", "status": "éxito"}), 200
    else:
        return jsonify({"mensaje": "Error al actualizar el empleado", "status": "error"}), 500
    
@employee_router.route( '/<employee_id>' , methods=['DELETE'])
def delete_employee(employee_id):
    db = Database()
    success = db.delete_record("entities", "id = ?", employee_id)
    if success:
        return jsonify({"mensaje": "Empleado eliminado con éxito", "status": "éxito"}), 200
    else:
        return jsonify({"mensaje": "Error al eliminar el empleado", "status": "error"}), 500