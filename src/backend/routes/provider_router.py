from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from database.database import Database 

provider_router = Blueprint('provider_router', __name__)  # Creás un Blueprint
@provider_router.route('/', methods=['POST'])
def recibir_datos():
    db = Database()
    data = request.json
    # Obtenemos los datos del frontend
    entity_name = data.get("entity_name")
    entity_type = data.get("entity_type")        
    razon_social = data.get("razon_social")
    responsabilidad_iva = data.get("responsabilidad_iva")
    domicilio_comercial = data.get("domicilio_comercial")
    cuit = data.get("cuit")
    inicio_actividad = data.get("inicio_actividad")  
    ingreso_brutos = data.get("ingreso_brutos")
    contact_name = data.get("contact_name")
    phone_number = data.get("phone_number")
    email = data.get("email")
    observation = data.get("observation")

    if not entity_name or not entity_type or not razon_social or not responsabilidad_iva or not domicilio_comercial or not cuit or not inicio_actividad or not ingreso_brutos or not contact_name or not phone_number or not email:
        return jsonify({"mensaje": "Faltan datos", "status": "error"}), 400
    
    success = db.add_record("entities", {
        "entity_name": entity_name,
        "entity_type": entity_type,
        "razon_social": razon_social,
        "responsabilidad_iva": responsabilidad_iva,
        "domicilio_comercial": domicilio_comercial,
        "cuit": cuit,
        "inicio_actividad": inicio_actividad,
        "ingreso_brutos": ingreso_brutos,
        "contact_name": contact_name,
        "phone_number": phone_number,
        "email": email,
        "observation": observation
    })
    print(success)
    if success:
        return jsonify({"mensaje": "Proveedor creado con éxito", "status": "éxito"}), 200
    else:
        return jsonify({"mensaje": "Error al crear el proveedor", "status": "error"}), 500