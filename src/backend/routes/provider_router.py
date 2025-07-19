from flask import Blueprint, request, jsonify
from database.database import Database

provider_router = Blueprint("provider_router", __name__)


@provider_router.route("/", methods=["POST"])
def recibir_datos():
    try:
        data = request.json
        entity_name = data.get("entity_name")
        entity_type = data.get("entity_type")
        razon_social = data.get("razon_social")
        responsabilidad_iva = data.get("responsabilidad_iva")
        domicilio_comercial = data.get("domicilio_comercial")
        cuit = data.get("cuit")
        inicio_actividades = data.get("inicio_actividades")
        ingreso_brutos = data.get("ingresos_brutos")
        contact_name = data.get("contact_name")
        phone_number = data.get("phone_number")
        email = data.get("email")
        observations = data.get("observations")

        if not entity_name or not razon_social or not domicilio_comercial or not cuit:
            return jsonify(
                {
                    "mensaje": "Faltan campos requeridos",
                    "status": "error",
                    "error": "entity_name, razon_social, domicilio_comercial y cuit son campos obligatorios",
                }
            ), 400

        # Convert responsabilidad_iva to integer if it's a string
        if responsabilidad_iva:
            try:
                responsabilidad_iva = int(responsabilidad_iva)
            except (ValueError, TypeError):
                responsabilidad_iva = 0

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
        print(f"observations: {observations}")

        db = Database()

        result = db.add_record(
            "entities",
            {
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
                "observations": observations,
            },
        )
        print(f"result: {result}")
        if result["success"]:
            return jsonify(
                {"mensaje": "Proveedor creado con éxito", "status": "éxito"}
            ), 200
        else:
            # Check for specific error types
            error_message = result["message"]
            if "UNIQUE constraint failed: entities.cuit" in error_message:
                return jsonify(
                    {
                        "mensaje": "Error: El CUIT ingresado ya existe en el sistema",
                        "status": "error",
                        "error": "CUIT duplicado",
                    }
                ), 400
            else:
                return jsonify(
                    {
                        "mensaje": "Error al crear el proveedor",
                        "status": "error",
                        "error": result["message"],
                    }
                ), 500
    except Exception as e:
        print(f"Error in recibir_datos: {str(e)}")
        return jsonify(
            {
                "mensaje": "Error interno del servidor",
                "status": "error",
                "error": str(e),
            }
        ), 500


@provider_router.route("/", methods=["GET"])
def get_all_records():
    db = Database()
    #    records = db.get_all_records("entities")
    records = db.get_all_records_by_clause("entities", "entity_type LIKE ?", "provider")
    return jsonify(records), 200


@provider_router.route("/<provider_id>", methods=["GET"])
def get_provider_by_id(provider_id):
    db = Database()
    result = db.get_record_by_id("entities", provider_id)
    if result["success"]:
        return jsonify(result["record"]), 200
    else:
        return jsonify({"mensaje": "Proveedor no encontrado", "status": "error"}), 404


# Anda!
@provider_router.route("/<provider_id>", methods=["PUT"])
def update_provider(provider_id):
    db = Database()
    # provider_id = request.args.get('provider')
    data = request.json
    # Obtenemos los datos del frontend
    entity_name = data.get("entity_name")
    entity_type = data.get("entity_type")
    razon_social = data.get("razon_social")
    responsabilidad_iva = data.get("responsabilidad_iva")
    domicilio_comercial = data.get("domicilio_comercial")
    cuit = data.get("cuit")
    inicio_actividades = data.get("inicio_actividades")
    ingreso_brutos = data.get("ingresos_brutos")
    contact_name = data.get("contact_name")
    phone_number = data.get("phone_number")
    email = data.get("email")
    observations = data.get("observations")

    result = db.update_record(
        "entities",
        {
            "id": provider_id,
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
            "observations": observations,
        },
    )

    if result["success"]:
        return jsonify(
            {"mensaje": "Providere actualizado con éxito", "status": "éxito"}
        ), 200
    else:
        return jsonify(
            {
                "mensaje": "Error al actualizar el proveedor",
                "status": "error",
                "error": result["message"],
            }
        ), 500


@provider_router.route("/<provider_id>", methods=["DELETE"])
def delete_provider(provider_id):
    db = Database()
    result = db.delete_record("entities", "id = ?", provider_id)
    if result["success"]:
        return jsonify(
            {"mensaje": "Proveedor eliminado con éxito", "status": "éxito"}
        ), 200
    else:
        return jsonify(
            {
                "mensaje": "Error al eliminar el proveedor",
                "status": "error",
                "error": result["message"],
            }
        ), 500


@provider_router.route("/brand", methods=["POST"])
def recibir_datos_marca():
    data = request.json
    # Obtenemos los datos del producto
    brand_name = data.get("brand_name")
    description = data.get("description")
    creation_date = data.get("creation_date")
    last_modified_date = data.get("last_modified_date")
    db = Database()
    # if not family_name or not description:
    #     return jsonify({"mensaje": "Faltan datos", "status": "error"}), 400
    result = db.add_record(
        "brands",
        {
            "brand_name": brand_name,
            "description": description,
            "creation_date": creation_date,
            "last_modified_date": last_modified_date,
        },
    )
    if result["success"]:
        return (
            jsonify(
                {
                    "mensaje": "Marca creada con éxito",
                    "status": "éxito",
                    "brand_id": result["rowid"],
                }
            ),
            200,
        )
    else:
        return (
            jsonify(
                {
                    "mensaje": "Error al crear la marca",
                    "status": "error",
                    "error": result["message"],
                }
            ),
            500,
        )


@provider_router.route("/brand", methods=["GET"])
def get_all_brands():
    db = Database()
    records = db.get_all_records("brands")
    return jsonify(records), 200


@provider_router.route("/providerXbrand", methods=["POST"])
def recibir_datos_marcaXproveedores():
    data = request.json
    id_brand = data.get("id_brand")
    id_provider = data.get("id_provider")

    db = Database()
    result = db.add_record(
        "proveedorxmarca", {"id_provider": id_provider, "id_brand": id_brand}
    )
    if result["success"]:
        return (
            jsonify({"mensaje": "Marca asignada con éxito", "status": "éxito"}),
            200,
        )
    else:
        return (
            jsonify(
                {
                    "mensaje": "Error al asignar la marca",
                    "status": "error",
                    "error": result["message"],
                }
            ),
            500,
        )


@provider_router.route("/providerXbrand", methods=["GET"])
def getProviderXBrand():
    db = Database()
    records = db.get_all_records("proveedorxmarca")
    return jsonify(records), 200


@provider_router.route("/providerJoinMarca", methods=["GET"])
def getProviderJoinMarca():
    db = Database()
    records = db.get_join_records_tres_tables(
        "brands", "proveedorxmarca", "entities", "id", "id_brand", "id_provider"
    )
    return jsonify(records), 200


@provider_router.route("/brand/<id_brand>", methods=["GET"])
def get_brand_by_id(id_brand):
    db = Database()
    result = db.get_record_by_id("brands", id_brand)
    if result["success"]:
        return jsonify(result["record"]), 200
    else:
        return jsonify({"mensaje": "Marca no encontrada", "status": "error"}), 404


@provider_router.route("/brand/<id_brand>", methods=["PUT"])
def update_brand(id_brand):
    db = Database()
    data = request.json
    brand_name = data.get("brand_name")
    description = data.get("description")
    last_modified_date = data.get("last_modified_date")

    result = db.update_record(
        "brands",
        {
            "id": id_brand,
            "brand_name": brand_name,
            "description": description,
            "last_modified_date": last_modified_date,
        },
    )

    if result["success"]:
        return jsonify(
            {"mensaje": "Marca actualizada con éxito", "status": "éxito"}
        ), 200
    else:
        return jsonify(
            {
                "mensaje": "Error al actualizar la marca",
                "status": "error",
                "error": result["message"],
            }
        ), 500


@provider_router.route("/brand/<id_brand>", methods=["DELETE"])
def delete_brand(id_brand):
    db = Database()
    result = db.delete_record("brands", "id = ?", id_brand)
    if result["success"]:
        return jsonify({"mensaje": "Marca eliminada con éxito", "status": "éxito"}), 200
    else:
        return jsonify(
            {
                "mensaje": "Error al eliminar la marca",
                "status": "error",
                "error": result["message"],
            }
        ), 500


@provider_router.route("/brand/by-provider/<id_provider>", methods=["GET"])
def get_brands_by_provider(id_provider):
    db = Database()
    query = """
        SELECT b.* FROM brands b
        INNER JOIN proveedorxmarca pm ON b.id = pm.id_brand
        WHERE pm.id_provider = ?
    """
    records = db.execute_query(query, (id_provider,))
    return jsonify(records), 200


@provider_router.route("/providerXbrand/<id_provider>/<id_brand>", methods=["DELETE"])
def remove_brand_from_provider(id_provider, id_brand):
    db = Database()
    result = db.delete_record(
        "proveedorxmarca", "id_provider = ? AND id_brand = ?", (id_provider, id_brand)
    )
    if result["success"]:
        return jsonify(
            {"mensaje": "Marca removida del proveedor con éxito", "status": "éxito"}
        ), 200
    else:
        return jsonify(
            {
                "mensaje": "Error al remover la marca del proveedor",
                "status": "error",
                "error": result["message"],
            }
        ), 500
