from flask import Blueprint, request, jsonify
from database.database import Database

@product_router.route('/', methods=['POST'])
def recibir_datos():
    data = request.json
    # Obtenemos los datos del producto
    

@product_router.route('/size', methods=['POST'])
def recibir_datos_talle():
    data = request.json
    # Obtenemos los datos del producto
    size_name = data.get("size_name")
    category_id = data.get("category_id")
    description = data.get("description")

@product_router.route('/color', methods=['POST'])
def recibir_datos_color():
    data = request.json
    # Obtenemos los datos del producto
    color_name = data.get("color_name")
    color_hex = data.get("color_hex")
   