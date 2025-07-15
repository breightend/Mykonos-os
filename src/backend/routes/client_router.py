from flask import Blueprint, request, jsonify
from database.database import Database 

client_router = Blueprint('client_router', __name__)
#Este es el endpoint que recibe los datos del cliente y los guarda en la base de datos
@client_router.route('/', methods=['POST'])
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
    observation = data.get("observations")

    db = Database()

    
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
        return jsonify({"mensaje": "Proveedor creado con éxito", "status": "éxito"}), 200
    else:
        return jsonify({"mensaje": "Error al crear el proveedor", "status": "error"}), 500

@client_router.route( '/' , methods=['GET'])
def get_all_records():
    db = Database()
    records = db.get_all_records_by_clause("entities", "entity_type LIKE ?", "client")
    return jsonify(records), 200


@client_router.route( '/<client_id>' , methods=['GET'])
def get_client_by_id(client_id):
    db = Database()
    record = db.get_record_by_id("entities", client_id)
    if record:
        return jsonify(record), 200
    else:
        return jsonify({"mensaje": "Cliente no encontrado", "status": "error"}), 404
    
#Anda! 
@client_router.route( '/<client_id>' , methods=['PUT'])
def update_client(client_id):
    db = Database()
    # client_id = request.args.get('client')
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
        "id": client_id,
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
        return jsonify({"mensaje": "Cliente actualizado con éxito", "status": "éxito"}), 200
    else:
        return jsonify({"mensaje": "Error al actualizar el proveedor", "status": "error"}), 500
    
@client_router.route( '/<client_id>' , methods=['DELETE'])
def delete_client(client_id):
    db = Database()
    success = db.delete_record("entities", "id = ?", client_id)
    if success:
        return jsonify({"mensaje": "Proveedor eliminado con éxito", "status": "éxito"}), 200
    else:
        return jsonify({"mensaje": "Error al eliminar el proveedor", "status": "error"}), 500