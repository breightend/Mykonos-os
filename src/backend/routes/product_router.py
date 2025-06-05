from flask import Blueprint, request, jsonify
from database.database import Database

product_router = Blueprint("product_router", __name__)

@product_router.route('/', methods=['POST'])
def recibir_datos():
    data = request.json
    # Obtenemos los datos del producto 
    barcode = data.get("barcode")
    provider_code = data.get("provider_code")
    product_name = data.get("product_name")
    group_id = data.get("group_id")
    provider_id = data.get("provider_id")
    size_id = data.get("size_id")
    description = data.get("description")
    cost = data.get("cost")
    sale_price = data.get("sale_price")
    tax = data.get("tax")
    discount = data.get("discount")
    color_id = data.get("color_id")
    comments = data.get("comments")
    user_id = data.get("user_id")
    image_ids = data.get("image_ids")
    brand_id = data.get("brand_id")
    creation_date = data.get("creation_date")
    last_modified_date = data.get("last_modified_date")

    db = Database()
    # if not barcode or not provider_code or not product_name or not group_id or not provider_id or not size_id or not description or not cost or not sale_price or not tax or not discount or not color_id or not comments or not user_id or not image_ids or not brand_id:
    #     return jsonify({"mensaje": "Faltan datos", "status": "error"}), 400
    success = db.add_record(
        "products",
        {
            "barcode": barcode,
            "provider_code": provider_code,
            "product_name": product_name,
            "group_id": group_id,
            "provider_id": provider_id,
            "size_id": size_id,
            "description": description,
            "cost": cost,
            "sale_price": sale_price,
            "tax": tax,
            "discount": discount,
            "color_id": color_id,
            "comments": comments,
            "user_id": user_id,
            "image_ids": image_ids,
            "brand_id": brand_id,
            "creation_date": creation_date,
            "last_modified_date": last_modified_date, 
        },
    )
    if success:
        return jsonify({"mensaje": "Producto creado con éxito", "status": "éxito"}), 200
    else:
        return jsonify({"mensaje": "Error al crear el producto", "status": "error"}), 500
    
    
@product_router.route("/", methods=["GET"])
def obtener_productos():
    # Obtener los productos de la base de datos
    db = Database()
    products = db.get_all_records("products")
    if not products:
        return jsonify({"mensaje": "No se encontraron productos", "status": "error"}), 404
    return jsonify(products), 200


@product_router.route("/sizes", methods=["POST"])
def recibir_datos_talle():
    data = request.json
    # Obtenemos los datos del producto
    size_name = data.get("size_name")
    category_id = data.get("category_id")
    description = data.get("description")

    db = Database()
    # if not size_name or not category_id or not description:
    #     return jsonify({"mensaje": "Faltan datos", "status": "error"}), 400
    success = db.add_record(
        "sizes",
        {
            "size_name": size_name,
            "category_id": category_id,
            "description": description,
        },
    )
    if success:
        return jsonify({"mensaje": "Talle creado con éxito", "status": "éxito"}), 200
    else:
        return jsonify({"mensaje": "Error al crear el talle", "status": "error"}), 500


@product_router.route("/sizes", methods=["GET"])
def obtener_talles():
    # Obtener los talles de la base de datos
    db = Database()
    sizes = db.get_all_records("sizes")
    print(sizes)
    if not sizes:
        return jsonify({"mensaje": "No se encontraron talles", "status": "error"}), 404
    return jsonify(sizes), 200



@product_router.route("/sizeXcategory", methods=["GET"])
def obtenerSizeXCategory():
    db = Database()
    category_response = db.get_join_records(
        "size_categories", "sizes", "id", "category_id"
    )
    if not category_response:
        return jsonify({"mensaje": "No se encontraron talles", "status": "error"}), 404
    return jsonify(category_response), 200


@product_router.route("/category", methods=["POST"])
def recibir_datos_categoria():
    data = request.json
    # Obtenemos los datos del producto
    category_name = data.get("category_name")
    permanent = data.get("permanent")

    db = Database()
    # if not category_name or not description:
    #     return jsonify({"mensaje": "Faltan datos", "status": "error"}), 400
    success = db.add_record(
        "size_categories", {"category_name": category_name, "permanent": permanent}
    )
    if success:
        return (
            jsonify({"mensaje": "Categoria creada con éxito", "status": "éxito"}),
            200,
        )
    else:
        return (
            jsonify({"mensaje": "Error al crear la categoria", "status": "error"}),
            500,
        )


@product_router.route("/category", methods=["GET"])
def obtener_categorias():
    # Obtener los talles de la base de datos
    db = Database()
    categories = db.get_all_records("size_categories")
    print(categories)
    if not categories:
        return jsonify(
            {"mensaje": "No se encontraron categorías", "status": "error"}
        ), 404
    return jsonify(categories), 200

@product_router.route("/colors", methods=["POST"])
def recibir_datos_color():
    data = request.json
    # Obtenemos los datos del producto
    color_name = data.get("color_name")
    color_hex = data.get("color_hex")

    db = Database()
    # if not color_name or not color_hex:
    #     return jsonify({"mensaje": "Faltan datos", "status": "error"}), 400
    success = db.add_record(
        "colors", {"color_name": color_name, "color_hex": color_hex}
    )
    if success:
        return jsonify({"mensaje": "Color creado con éxito", "status": "éxito"}), 200
    else:
        return jsonify({"mensaje": "Error al crear el color", "status": "error"}), 500


@product_router.route("/colors", methods=["GET"])
def obtener_colores():
    # Obtener los colores de la base de datos
    db = Database()
    colors = db.get_all_records("colors")
    if not colors:
        return jsonify({"mensaje": "No se encontraron colores", "status": "error"}), 404
    return jsonify(colors), 200

@product_router.route("/color/<color_id>", methods=["DELETE"])
def eliminar_color(color_id):
    db = Database()
    success = db.delete_record("colors", color_id)
    if success:
        return jsonify({"mensaje": "Color eliminado con éxito", "status": "éxito"}), 200
    else:
        return jsonify({"mensaje": "Error al eliminar el color", "status": "error"}), 500


@product_router.route("/familyProducts", methods=["POST"])
def recibir_datos_familia_producto():
    data = request.json
    # Obtenemos los datos del producto
    group_name = data.get("group_name")
    parent_group_id = data.get("parent_group_id")
    marked_as_root = data.get("marked_as_root")

    db = Database()
    # if not family_name or not description:
    #     return jsonify({"mensaje": "Faltan datos", "status": "error"}), 400
    success = db.add_record(
        "groups", {"group_name": group_name, "parent_group_id": parent_group_id, "marked_as_root": marked_as_root}   
    )
    if success:
        return (
            jsonify({"mensaje": "Familia de productos creada con éxito", "status": "éxito"}),
            200,
        )
    else:
        return (
            jsonify({"mensaje": "Error al crear la familia de productos", "status": "error"}),
            500,
        )
    
@product_router.route("/familyProducts", methods=["GET"])
def obtener_familia_producto():
    # Obtener los colores de la base de datos
    db = Database()
    family_products = db.get_all_records("groups")
    if not family_products:
        return jsonify({"mensaje": "No se encontraron familias de productos", "status": "error"}), 404
    return jsonify(family_products), 200

@product_router.route("/familyProducts/<group_id>", methods=["PUT"])
def actualizar_familia_producto(group_id):
    db = Database()

    data = request.json
    # Obtenemos los datos del producto
    group_name = data.get("group_name")
    parent_group_id = data.get("parent_group_id")
    marked_as_root = data.get("marked_as_root")

    # if not family_name or not description:
    #     return jsonify({"mensaje": "Faltan datos", "status": "error"}), 400
    success = db.update_record(
        "groups",
        {
            "id": group_id,
            "group_name": group_name,
            "parent_group_id": parent_group_id,
            "marked_as_root": marked_as_root,
        },

    )
    if success:
        return (
            jsonify({"mensaje": "Familia de productos actualizada con éxito", "status": "éxito"}),
            200,
        )
    else:
        return (
            jsonify({"mensaje": "Error al actualizar la familia de productos", "status": "error"}),
            500,
        )