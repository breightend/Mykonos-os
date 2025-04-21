from flask import Blueprint, request, jsonify
from database.database import Database
product_router = Blueprint('product_router', __name__)

""" @product_router.route('/', methods=['POST'])
def recibir_datos():
    data = request.json
    # Obtenemos los datos del producto """
    

@product_router.route('/size', methods=['POST'])
def recibir_datos_talle():
    data = request.json
    # Obtenemos los datos del producto
    size_name = data.get("size_name")
    category_id = data.get("category_id")
    description = data.get("description")

    db = Database()
    # if not size_name or not category_id or not description:
    #     return jsonify({"mensaje": "Faltan datos", "status": "error"}), 400
    success = db.add_record("sizes", {
        "size_name": size_name,
        "category_id": category_id,
        "description": description
    })
    if success:
        return jsonify({"mensaje": "Talle creado con éxito", "status": "éxito"}), 200
    else:
        return jsonify({"mensaje": "Error al crear el talle", "status": "error"}), 500

@product_router.route('/size', methods=['GET'])
def obtener_talles():
    # Obtener los talles de la base de datos
    db = Database()
    sizes = db.get_sizes()
    if not sizes:
        return jsonify({"mensaje": "No se encontraron talles", "status": "error"}), 404
    return jsonify(sizes), 200


@product_router.route('/colors', methods=['POST'])
def recibir_datos_color():
    data = request.json
    # Obtenemos los datos del producto
    color_name = data.get("color_name")
    color_hex = data.get("color_hex")

    db = Database()
    # if not color_name or not color_hex:
    #     return jsonify({"mensaje": "Faltan datos", "status": "error"}), 400
    success = db.add_record("colors", {
        "color_name": color_name,
        "color_hex": color_hex
    })
    if success:
        return jsonify({"mensaje": "Color creado con éxito", "status": "éxito"}), 200
    else:
        return jsonify({"mensaje": "Error al crear el color", "status": "error"}), 500

@product_router.route('/colors', methods=['GET'])
def obtener_colores():
    # Obtener los colores de la base de datos
    db = Database()
    colors = db.get_colors()
    if not colors:
        return jsonify({"mensaje": "No se encontraron colores", "status": "error"}), 404
    return jsonify(colors), 200
