from flask import Blueprint, request, jsonify, Response
from database.database import Database
from datetime import datetime

product_router = Blueprint("product_router", __name__)


@product_router.route("/", methods=["POST"])
def recibir_datos():
    data = request.json
    print("🔍 DATOS RECIBIDOS EN EL BACKEND:")
    print(f"  - storage_id: {data.get('storage_id')}")
    print(f"  - initial_quantity: {data.get('initial_quantity')}")
    print(f"  - stock_variants: {data.get('stock_variants', [])}")
    print(f"  - size_ids: {data.get('size_ids', [])}")
    print(f"  - color_ids: {data.get('color_ids', [])}")

    # Obtenemos los datos del producto
    provider_code = data.get("provider_code")
    product_name = data.get("product_name")
    group_id = data.get("group_id")
    provider_id = data.get("provider_id")
    description = data.get("description")
    cost = data.get("cost")
    sale_price = data.get("sale_price")
    original_price = data.get("original_price")  # Add original_price extraction
    tax = data.get("tax")
    discount = data.get("discount")
    comments = data.get("comments")
    user_id = data.get("user_id") or 1  # Default to user ID 1 if not provided
    images_ids = data.get("images_ids")  # Campo legacy - mantenemos por compatibilidad
    brand_id = data.get("brand_id")
    creation_date = data.get("creation_date") or datetime.now()
    last_modified_date = data.get("last_modified_date")
    # Nuevos arrays para las relaciones muchos a muchos
    size_ids = data.get("size_ids", [])  # Array de IDs de talles
    color_ids = data.get("color_ids", [])  # Array de IDs de colores
    # Datos de imagen en base64
    product_image = data.get("product_image")  # Imagen en formato base64
    # Datos para el stock inicial
    storage_id = data.get("storage_id")  # ID de la sucursal para el stock inicial
    initial_quantity = data.get("initial_quantity", 0)  # Cantidad inicial para el stock
    # 🆕 Variantes específicas con cantidades
    stock_variants = data.get(
        "stock_variants", []
    )  # Array de variantes con cantidades específicas

    db = Database()
    # if not barcode or not provider_code or not product_name or not group_id or not provider_id or not description or not cost or not sale_price or not tax or not discount or not comments or not user_id or not image_ids or not brand_id:
    #     return jsonify({"mensaje": "Faltan datos", "status": "error"}), 400
    success = db.add_record(
        "products",
        {
            "provider_code": provider_code,
            "product_name": product_name,
            "group_id": group_id,
            "provider_id": provider_id,
            "description": description,
            "cost": cost,
            "sale_price": sale_price,
            "original_price": original_price,  
            "tax": tax,
            "discount": discount,
            "comments": comments,
            "user_id": user_id,
            "images_ids": images_ids,
            "brand_id": brand_id,
            "creation_date": creation_date,
            "last_modified_date": last_modified_date,
            "state": data.get(
                "state", "activo"
            ),  
        },
    )

    if success.get("success"):
        # Obtener el ID del producto recién creado
        product_id = success.get("rowid")

        # Procesar imagen si está presente
        image_id = None
        if product_image:
            try:
                import base64

                # Remover el prefijo data URI si está presente
                if product_image.startswith("data:"):
                    product_image = product_image.split(",")[1]

                # Decodificar base64 a bytes
                image_bytes = base64.b64decode(product_image)

                # Guardar imagen en la base de datos
                image_result = db.add_product_image(product_id, image_bytes)
                if image_result.get("success"):
                    image_id = image_result.get("image_id")
                    print(f"✅ Imagen guardada exitosamente con ID: {image_id}")

                    # Actualizar el campo images_ids del producto con el ID de la imagen
                    db.update_record(
                        "products", {"images_ids": str(image_id), "id": product_id}
                    )
                else:
                    print(f"❌ Error al guardar imagen: {image_result.get('message')}")
            except Exception as e:
                print(f"❌ Error al procesar imagen: {str(e)}")

        # Agregar las relaciones con talles
        for size_id in size_ids:
            db.add_product_size_relationship(product_id, size_id)

        # Agregar las relaciones con colores
        for color_id in color_ids:
            db.add_product_color_relationship(product_id, color_id)

        # Crear stock inicial si se especifica una sucursal y cantidad
        if storage_id and initial_quantity > 0:
            stock_result = db.set_initial_stock(
                product_id, storage_id, initial_quantity
            )
            if not stock_result.get("success"):
                print(
                    f"⚠️ Advertencia: Error al crear stock inicial: {stock_result.get('message')}"
                )

            # 🆕 CREAR REGISTROS EN WAREHOUSE_STOCK_VARIANTS CON CANTIDADES REALES
            if stock_variants and len(stock_variants) > 0:
                print(
                    f"🔄 Creando {len(stock_variants)} registros de stock por variantes con cantidades específicas"
                )
                print("🔍 DETALLE DE VARIANTES RECIBIDAS:")
                for i, variant in enumerate(stock_variants):
                    print(
                        f"  [{i + 1}] size_id: {variant.get('size_id')}, color_id: {variant.get('color_id')}, quantity: {variant.get('quantity')}"
                    )
                    print(
                        f"      size_name: {variant.get('size_name')}, color_name: {variant.get('color_name')}"
                    )

                variants_created = 0
                total_variant_quantity = 0

                for variant in stock_variants:
                    variant_stock_data = {
                        "product_id": product_id,
                        "branch_id": storage_id,
                        "size_id": variant.get("size_id"),
                        "color_id": variant.get("color_id"),
                        "quantity": variant.get("quantity", 0),
                        "last_updated": datetime.now().isoformat(),
                    }

                    result = db.add_record(
                        "warehouse_stock_variants", variant_stock_data
                    )
                    if result.get("success"):
                        variants_created += 1
                        total_variant_quantity += variant.get("quantity", 0)
                        print(
                            f"  ✅ Variante: {variant.get('size_name')} + {variant.get('color_name')} = {variant.get('quantity')} unidades"
                        )
                    else:
                        print(f"  ❌ Error creando variante: {result.get('message')}")

                print(
                    f"✅ Creadas {variants_created} variantes con {total_variant_quantity} unidades en total"
                )

                # Verificar que las cantidades coincidan
                if total_variant_quantity != initial_quantity:
                    print(
                        f"⚠️ ADVERTENCIA: La suma de variantes ({total_variant_quantity}) no coincide con el stock inicial ({initial_quantity})"
                    )

            # Si no hay variantes específicas, crear registros con cantidad 0 para todas las combinaciones
            elif size_ids and color_ids:
                variants_result = db.create_initial_variant_stock_records(
                    product_id, storage_id, size_ids, color_ids
                )
                if variants_result.get("success"):
                    print(f"✅ {variants_result.get('message')}")
                    if variants_result.get("errors"):
                        print(
                            f"⚠️ Algunos errores durante la creación: {variants_result.get('errors')}"
                        )
                else:
                    print(
                        f"❌ Error creando stock por variantes: {variants_result.get('message')}"
                    )
            else:
                print(
                    "⚠️ No se crearon registros de stock por variantes: no hay talles o colores definidos"
                )

        return jsonify(
            {
                "mensaje": "Producto creado con éxito",
                "status": "éxito",
                "product_id": product_id,
                "image_id": image_id,
            }
        ), 200
    else:
        return jsonify(
            {
                "mensaje": f"Error al crear el producto: {success.get('message')}",
                "status": "error",
            }
        ), 400


@product_router.route("/<int:product_id>/image", methods=["GET"])
def get_product_image(product_id):
    """
    Obtiene la imagen de un producto específico
    """
    try:
        db = Database()
        image_result = db.get_product_image(product_id)

        if image_result.get("success") and image_result.get("image_data"):
            # Retornar la imagen directamente como respuesta binaria
            return Response(
                image_result["image_data"],
                mimetype="image/jpeg",  # Asumimos JPEG, podrías detectar el tipo real
                headers={
                    "Content-Type": "image/jpeg",
                    "Cache-Control": "public, max-age=3600",  # Cache por 1 hora
                },
            )
        else:
            return jsonify(
                {
                    "status": "error",
                    "message": "No se encontró imagen para este producto",
                }
            ), 404

    except Exception as e:
        return jsonify(
            {"status": "error", "message": f"Error al obtener imagen: {str(e)}"}
        ), 500


@product_router.route("/", methods=["GET"])
def obtener_productos():
    # Obtener los productos de la base de datos
    db = Database()
    products = db.get_all_records("products")
    if not products:
        return jsonify(
            {"mensaje": "No se encontraron productos", "status": "error"}
        ), 404
    return jsonify(products), 200


@product_router.route("/sizes", methods=["POST"])
def recibir_datos_talle():
    data = request.json
    # Obtenemos los datos del producto - acepta tanto 'name' como 'size_name'
    size_name = data.get("name") or data.get("size_name")
    category_id = data.get("category_id")
    description = data.get("description")

    db = Database()
    # if not size_name or not category_id or not description:
    #     return jsonify({"mensaje": "Faltan datos", "status": "error"}), 400
    result = db.add_record(
        "sizes",
        {
            "size_name": size_name,
            "category_id": category_id,
            "description": description,
        },
    )

    if result.get("success"):
        print(f"✅ Talle creado exitosamente: {size_name} con ID {result.get('rowid')}")
        return jsonify({"mensaje": "Talle creado con éxito", "status": "éxito"}), 200
    else:
        print(f"❌ Error al crear talle: {result.get('message')}")
        return jsonify(
            {
                "mensaje": f"Error al crear el talle: {result.get('message')}",
                "status": "error",
            }
        ), 500


@product_router.route("/sizes", methods=["GET"])
def obtener_talles():
    # Obtener los talles de la base de datos
    db = Database()
    sizes = db.get_all_records("sizes")
    print(f"Sizes encontrados: {sizes}")
    # Devolver array vacío si no hay datos, no un error
    if not sizes:
        print("No hay talles en la base de datos, devolviendo array vacío")
        return jsonify([]), 200
    return jsonify(sizes), 200


@product_router.route("/sizeXcategory", methods=["GET"])
def obtenerSizeXCategory():
    db = Database()
    category_response = db.get_join_records(
        "size_categories", "sizes", "id", "category_id"
    )
    print(f"SizeXCategory encontrado: {category_response}")
    # Devolver array vacío si no hay datos, no un error
    if not category_response:
        print(
            "No hay relaciones size-category en la base de datos, devolviendo array vacío"
        )
        return jsonify([]), 200
    return jsonify(category_response), 200


@product_router.route("/category", methods=["POST"])
def recibir_datos_categoria():
    data = request.json
    # Obtenemos los datos del producto - acepta tanto 'name' como 'category_name'
    category_name = data.get("name") or data.get("category_name")
    permanent_raw = data.get("permanent")

    # Convertir valores enteros/string a booleano para PostgreSQL
    if permanent_raw in [1, "1", "true", "True", True]:
        permanent = True
    elif permanent_raw in [0, "0", "false", "False", False]:
        permanent = False
    else:
        permanent = bool(permanent_raw)  # fallback para otros valores

    db = Database()
    # if not category_name or not description:
    #     return jsonify({"mensaje": "Faltan datos", "status": "error"}), 400
    result = db.add_record(
        "size_categories", {"category_name": category_name, "permanent": permanent}
    )

    if result.get("success"):
        print(
            f"✅ Categoría creada exitosamente: {category_name} con ID {result.get('rowid')}"
        )
        return (
            jsonify({"mensaje": "Categoria creada con éxito", "status": "éxito"}),
            200,
        )
    else:
        print(f"❌ Error al crear categoría: {result.get('message')}")
        return (
            jsonify(
                {
                    "mensaje": f"Error al crear la categoria: {result.get('message')}",
                    "status": "error",
                }
            ),
            500,
        )


@product_router.route("/category", methods=["GET"])
def obtener_categorias():
    # Obtener las categorías de la base de datos
    db = Database()
    categories = db.get_all_records("size_categories")
    print(f"Categorías encontradas: {categories}")
    # Devolver array vacío si no hay datos, no un error
    if not categories:
        print("No hay categorías en la base de datos, devolviendo array vacío")
        return jsonify([]), 200
    return jsonify(categories), 200


@product_router.route("/category/<int:category_id>", methods=["DELETE"])
def eliminar_categoria(category_id):
    """
    Elimina una categoría si no está siendo utilizada por ningún talle o producto
    """
    try:
        db = Database()

        # Verificar si hay talles que usan esta categoría
        sizes_using_category = db.execute_query(
            "SELECT COUNT(*) as count FROM sizes WHERE category_id = %s", (category_id,)
        )

        if sizes_using_category and sizes_using_category[0].get("count", 0) > 0:
            return jsonify(
                {
                    "mensaje": "No se puede eliminar la categoría porque tiene talles asociados",
                    "status": "error",
                }
            ), 400

        # Verificar si hay productos que usan talles de esta categoría
        products_using_category = db.execute_query(
            """
            SELECT COUNT(DISTINCT p.id) as count 
            FROM products p 
            JOIN warehouse_stock_variants wsv ON p.id = wsv.product_id 
            JOIN sizes s ON wsv.size_id = s.id 
            WHERE s.category_id = %s
        """,
            (category_id,),
        )

        if products_using_category and products_using_category[0].get("count", 0) > 0:
            return jsonify(
                {
                    "mensaje": "No se puede eliminar la categoría porque hay productos que usan talles de esta categoría",
                    "status": "error",
                }
            ), 400

        # Si no hay dependencias, eliminar la categoría
        result = db.delete_record("size_categories", "id = %s", (category_id,))

        if result.get("success"):
            print(f"✅ Categoría eliminada exitosamente: ID {category_id}")
            return jsonify(
                {"mensaje": "Categoría eliminada con éxito", "status": "éxito"}
            ), 200
        else:
            print(f"❌ Error al eliminar categoría: {result.get('message')}")
            return jsonify(
                {
                    "mensaje": f"Error al eliminar la categoría: {result.get('message')}",
                    "status": "error",
                }
            ), 500

    except Exception as e:
        print(f"❌ Error inesperado al eliminar categoría: {str(e)}")
        return jsonify(
            {"mensaje": f"Error inesperado: {str(e)}", "status": "error"}
        ), 500


@product_router.route("/sizes/<int:size_id>", methods=["DELETE"])
def eliminar_talle(size_id):
    """
    Elimina un talle si no está siendo utilizado por ningún producto
    """
    try:
        db = Database()

        # Verificar si hay productos que usan este talle
        products_using_size = db.execute_query(
            """
            SELECT COUNT(DISTINCT p.id) as count 
            FROM products p 
            JOIN warehouse_stock_variants wsv ON p.id = wsv.product_id 
            WHERE wsv.size_id = %s
        """,
            (size_id,),
        )

        if products_using_size and products_using_size[0].get("count", 0) > 0:
            return jsonify(
                {
                    "mensaje": "No se puede eliminar el talle porque hay productos que lo utilizan",
                    "status": "error",
                }
            ), 400

        # Si no hay dependencias, eliminar el talle
        result = db.delete_record("sizes", "id = %s", (size_id,))

        if result.get("success"):
            print(f"✅ Talle eliminado exitosamente: ID {size_id}")
            return jsonify(
                {"mensaje": "Talle eliminado con éxito", "status": "éxito"}
            ), 200
        else:
            print(f"❌ Error al eliminar talle: {result.get('message')}")
            return jsonify(
                {
                    "mensaje": f"Error al eliminar el talle: {result.get('message')}",
                    "status": "error",
                }
            ), 500

    except Exception as e:
        print(f"❌ Error inesperado al eliminar talle: {str(e)}")
        return jsonify(
            {"mensaje": f"Error inesperado: {str(e)}", "status": "error"}
        ), 500


@product_router.route("/colors", methods=["POST"])
def recibir_datos_color():
    data = request.json
    # Obtenemos los datos del producto
    color_name = data.get("color_name")
    color_hex = data.get("color_hex")

    db = Database()
    # if not color_name or not color_hex:
    #     return jsonify({"mensaje": "Faltan datos", "status": "error"}), 400
    result = db.add_record("colors", {"color_name": color_name, "color_hex": color_hex})

    if result.get("success"):
        print(
            f"✅ Color creado exitosamente: {color_name} con ID {result.get('rowid')}"
        )
        return jsonify({"mensaje": "Color creado con éxito", "status": "éxito"}), 200
    else:
        print(f"❌ Error al crear color: {result.get('message')}")
        return jsonify(
            {
                "mensaje": f"Error al crear el color: {result.get('message')}",
                "status": "error",
            }
        ), 500


@product_router.route("/colors", methods=["GET"])
def obtener_colores():
    # Obtener los colores de la base de datos
    db = Database()
    colors = db.get_all_records("colors")
    if not colors:
        return jsonify({"mensaje": "No se encontraron colores", "status": "error"}), 404
    return jsonify(colors), 200


@product_router.route("/colors/<color_id>", methods=["DELETE"])
def eliminar_color(color_id):
    db = Database()
    success = db.delete_record("colors", "id = ?", color_id)
    if success:
        return jsonify({"mensaje": "Color eliminado con éxito", "status": "éxito"}), 200
    else:
        return jsonify(
            {"mensaje": "Error al eliminar el color", "status": "error"}
        ), 500


@product_router.route("/colors/<color_id>/usage", methods=["GET"])
def verificar_uso_color(color_id):
    """
    Verifica si un color está siendo usado por algún producto.
    Retorna información sobre cuántos productos lo usan.
    """
    try:
        db = Database()

        # Verificar en la tabla de relaciones product_colors
        products_using_color = db.get_products_by_color(color_id)

        product_count = len(products_using_color) if products_using_color else 0
        is_in_use = product_count > 0

        return jsonify(
            {
                "isInUse": is_in_use,
                "productCount": product_count,
                "message": f"Color {'en uso' if is_in_use else 'no está en uso'} por {product_count} producto(s)",
            }
        ), 200

    except Exception as e:
        return jsonify(
            {
                "error": f"Error al verificar uso del color: {str(e)}",
                "isInUse": True,  # Por seguridad, asumir que está en uso si hay error
                "productCount": 0,
            }
        ), 500


@product_router.route("/familyProducts", methods=["POST"])
def recibir_datos_familia_producto():
    data = request.json
    print(f"🔄 Recibiendo datos de familia: {data}")

    # Obtenemos los datos del producto
    group_name = data.get("group_name")
    parent_group_id = data.get("parent_group_id")
    marked_as_root = data.get("marked_as_root")

    if not group_name:
        return jsonify(
            {"mensaje": "El nombre del grupo es requerido", "status": "error"}
        ), 400

    db = Database()

    try:
        # Usar la nueva funcionalidad de add_record que es compatible con PostgreSQL
        result = db.add_record(
            "groups",
            {
                "group_name": group_name,
                "parent_group_id": parent_group_id,
                "marked_as_root": marked_as_root,
            },
        )

        print(f"🔍 Resultado add_record: {result}")

        if result and result.get("success"):
            return (
                jsonify(
                    {
                        "mensaje": "Familia de productos creada con éxito",
                        "status": "éxito",
                        "id": result.get("rowid"),
                    }
                ),
                200,
            )
        else:
            error_msg = (
                result.get("message", "Error desconocido")
                if result
                else "Error al crear la familia"
            )
            return (
                jsonify(
                    {
                        "mensaje": f"Error al crear la familia de productos: {error_msg}",
                        "status": "error",
                    }
                ),
                500,
            )
    except Exception as e:
        print(f"❌ Error en recibir_datos_familia_producto: {e}")
        import traceback

        traceback.print_exc()
        return (
            jsonify({"mensaje": f"Error interno: {str(e)}", "status": "error"}),
            500,
        )


@product_router.route("/familyProducts", methods=["GET"])
def obtener_familia_producto():
    try:
        print("🔍 Obteniendo familias de productos...")
        db = Database()
        family_products = db.get_all_records("groups")

        print(
            f"🔍 Familias encontradas: {len(family_products) if family_products else 0}"
        )
        print(f"🔍 Datos: {family_products}")

        if not family_products:
            # Retornar lista vacía en lugar de error, para que el frontend funcione
            return jsonify([]), 200
        return jsonify(family_products), 200
    except Exception as e:
        print(f"❌ Error obteniendo familias: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"mensaje": f"Error interno: {str(e)}", "status": "error"}), 500


@product_router.route("/familyProducts/tree", methods=["GET"])
def obtener_familia_producto_arbol():
    """Obtener los grupos de productos en estructura de árbol jerárquico"""
    db = Database()
    family_products = db.get_all_records("groups")

    if not family_products:
        return jsonify(
            {"mensaje": "No se encontraron familias de productos", "status": "error"}
        ), 404

    # Convertir la lista plana en estructura de árbol
    def build_tree(items, parent_id=None):
        tree = []
        for item in items:
            if item.get("parent_group_id") == parent_id:
                children = build_tree(items, item["id"])
                if children:
                    item["children"] = children
                tree.append(item)
        return tree

    # Construir el árbol empezando desde los nodos raíz (parent_group_id = None)
    tree_structure = build_tree(family_products, None)

    return jsonify(tree_structure), 200


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
            jsonify(
                {
                    "mensaje": "Familia de productos actualizada con éxito",
                    "status": "éxito",
                }
            ),
            200,
        )
    else:
        return (
            jsonify(
                {
                    "mensaje": "Error al actualizar la familia de productos",
                    "status": "error",
                }
            ),
            500,
        )


# ============== ENDPOINTS PARA RELACIONES MUCHOS A MUCHOS ==============


@product_router.route("/<product_id>/sizes", methods=["POST"])
def agregar_talle_a_producto(product_id):
    """Agregar un talle a un producto específico"""
    data = request.json
    size_id = data.get("size_id")

    if not size_id:
        return jsonify({"mensaje": "Se requiere size_id", "status": "error"}), 400

    db = Database()
    result = db.add_product_size_relationship(product_id, size_id)

    if result.get("success"):
        return jsonify(
            {"mensaje": "Talle agregado al producto con éxito", "status": "éxito"}
        ), 200
    else:
        return jsonify(
            {
                "mensaje": f"Error al agregar el talle al producto: {result.get('message')}",
                "status": "error",
            }
        ), 500


@product_router.route("/<product_id>/sizes/<size_id>", methods=["DELETE"])
def remover_talle_de_producto(product_id, size_id):
    """Remover un talle de un producto específico"""
    db = Database()
    result = db.remove_product_size_relationship(product_id, size_id)

    if result.get("success"):
        return jsonify(
            {"mensaje": "Talle removido del producto con éxito", "status": "éxito"}
        ), 200
    else:
        return jsonify(
            {
                "mensaje": f"Error al remover el talle del producto: {result.get('message')}",
                "status": "error",
            }
        ), 500


@product_router.route("/<product_id>/colors", methods=["POST"])
def agregar_color_a_producto(product_id):
    """Agregar un color a un producto específico"""
    data = request.json
    color_id = data.get("color_id")

    if not color_id:
        return jsonify({"mensaje": "Se requiere color_id", "status": "error"}), 400

    db = Database()
    result = db.add_product_color_relationship(product_id, color_id)

    if result.get("success"):
        return jsonify(
            {"mensaje": "Color agregado al producto con éxito", "status": "éxito"}
        ), 200
    else:
        return jsonify(
            {
                "mensaje": f"Error al agregar el color al producto: {result.get('message')}",
                "status": "error",
            }
        ), 500


@product_router.route("/<product_id>/colors/<color_id>", methods=["DELETE"])
def remover_color_de_producto(product_id, color_id):
    """Remover un color de un producto específico"""
    db = Database()
    result = db.remove_product_color_relationship(product_id, color_id)

    if result.get("success"):
        return jsonify(
            {"mensaje": "Color removido del producto con éxito", "status": "éxito"}
        ), 200
    else:
        return jsonify(
            {
                "mensaje": f"Error al remover el color del producto: {result.get('message')}",
                "status": "error",
            }
        ), 500


@product_router.route("/<product_id>/sizes", methods=["GET"])
def obtener_talles_de_producto(product_id):
    """Obtener todos los talles de un producto específico"""
    db = Database()
    sizes = db.get_sizes_by_product(product_id)

    if not sizes:
        return jsonify(
            {
                "mensaje": "No se encontraron talles para este producto",
                "status": "error",
            }
        ), 404
    return jsonify(sizes), 200


@product_router.route("/<product_id>/colors", methods=["GET"])
def obtener_colores_de_producto(product_id):
    """Obtener todos los colores de un producto específico"""
    db = Database()
    colors = db.get_colors_by_product(product_id)

    if not colors:
        return jsonify(
            {
                "mensaje": "No se encontraron colores para este producto",
                "status": "error",
            }
        ), 404
    return jsonify(colors), 200


@product_router.route("/sizes/<size_id>/products", methods=["GET"])
def obtener_productos_por_talle(size_id):
    """Obtener todos los productos que tienen un talle específico"""
    db = Database()
    products = db.get_products_by_size(size_id)

    if not products:
        return jsonify(
            {
                "mensaje": "No se encontraron productos para este talle",
                "status": "error",
            }
        ), 404
    return jsonify(products), 200


@product_router.route("/colors/<color_id>/products", methods=["GET"])
def obtener_productos_por_color(color_id):
    """Obtener todos los productos que tienen un color específico"""
    db = Database()
    products = db.get_products_by_color(color_id)

    if not products:
        return jsonify(
            {
                "mensaje": "No se encontraron productos para este color",
                "status": "error",
            }
        ), 404
    return jsonify(products), 200


@product_router.route("/<product_id>/details", methods=["GET"])
def obtener_producto_completo(product_id):
    """Obtener un producto con todos sus talles y colores"""
    db = Database()

    # Obtener datos básicos del producto
    product_result = db.get_record_by_id("products", product_id)
    if not product_result.get("success"):
        return jsonify({"mensaje": "Producto no encontrado", "status": "error"}), 404

    product = product_result.get("record")

    # Obtener talles del producto
    sizes = db.get_sizes_by_product(product_id)

    # Obtener colores del producto
    colors = db.get_colors_by_product(product_id)

    # Combinar toda la información
    product_details = {
        "product": product,
        "sizes": sizes if sizes else [],
        "colors": colors if colors else [],
    }

    return jsonify(product_details), 200


@product_router.route("/<product_id>/sizes/bulk", methods=["POST"])
def agregar_multiples_talles_a_producto(product_id):
    """Agregar múltiples talles a un producto"""
    data = request.json
    size_ids = data.get("size_ids", [])

    if not size_ids:
        return jsonify(
            {"mensaje": "Se requiere un array de size_ids", "status": "error"}
        ), 400

    db = Database()
    success_count = 0

    for size_id in size_ids:
        result = db.add_product_size_relationship(product_id, size_id)
        if result.get("success"):
            success_count += 1

    if success_count > 0:
        return jsonify(
            {
                "mensaje": f"{success_count} talles agregados al producto con éxito",
                "status": "éxito",
                "agregados": success_count,
                "total": len(size_ids),
            }
        ), 200
    else:
        return jsonify(
            {"mensaje": "Error al agregar talles al producto", "status": "error"}
        ), 500


@product_router.route("/<product_id>/colors/bulk", methods=["POST"])
def agregar_multiples_colores_a_producto(product_id):
    """Agregar múltiples colores a un producto"""
    data = request.json
    color_ids = data.get("color_ids", [])

    if not color_ids:
        return jsonify(
            {"mensaje": "Se requiere un array de color_ids", "status": "error"}
        ), 400

    db = Database()
    success_count = 0

    for color_id in color_ids:
        result = db.add_product_color_relationship(product_id, color_id)
        if result.get("success"):
            success_count += 1

    if success_count > 0:
        return jsonify(
            {
                "mensaje": f"{success_count} colores agregados al producto con éxito",
                "status": "éxito",
                "agregados": success_count,
                "total": len(color_ids),
            }
        ), 200
    else:
        return jsonify(
            {"mensaje": "Error al agregar colores al producto", "status": "error"}
        ), 500


@product_router.route("/<int:product_id>/stock/<int:branch_id>", methods=["GET"])
def get_product_stock(product_id, branch_id):
    """
    Obtiene el stock de un producto en una sucursal específica.
    """
    try:
        db = Database()
        result = db.get_product_stock_by_branch(product_id, branch_id)

        if result.get("success"):
            return jsonify(
                {
                    "success": True,
                    "product_id": product_id,
                    "branch_id": branch_id,
                    "quantity": result.get("quantity", 0),
                    "message": result.get("message"),
                }
            ), 200
        else:
            return jsonify(
                {
                    "success": False,
                    "product_id": product_id,
                    "branch_id": branch_id,
                    "quantity": 0,
                    "message": result.get("message"),
                }
            ), 404

    except Exception as e:
        return jsonify(
            {"success": False, "message": f"Error al obtener stock: {str(e)}"}
        ), 500


@product_router.route("/stock/by-branch/<int:branch_id>", methods=["GET"])
def get_all_stock_by_branch(branch_id):
    """
    Obtiene todo el stock de una sucursal específica.
    """
    try:
        db = Database()
        # Obtener todos los registros de stock para la sucursal
        stock_records = db.get_all_records_by_clause(
            "warehouse_stock", "branch_id = ?", branch_id
        )

        return jsonify(
            {
                "success": True,
                "branch_id": branch_id,
                "stock_records": stock_records,
                "total_products": len(stock_records),
            }
        ), 200

    except Exception as e:
        return jsonify(
            {
                "success": False,
                "message": f"Error al obtener stock de la sucursal: {str(e)}",
            }
        ), 500


@product_router.route(
    "/<int:product_id>/remove-from-storage/<int:branch_id>", methods=["DELETE"]
)
def remove_product_from_storage(product_id, branch_id):
    """
    Elimina la relación de un producto con una sucursal (warehouse_stock) solo si la cantidad es 0.
    """
    db = Database()
    # Verificar cantidad actual
    stock_result = db.execute_query(
        "SELECT quantity FROM warehouse_stock WHERE product_id = %s AND branch_id = %s",
        (product_id, branch_id),
    )
    if not stock_result or stock_result[0].get("quantity", 0) != 0:
        return jsonify(
            {"success": False, "message": "Solo se puede eliminar si la cantidad es 0"}
        ), 400

    # Eliminar la relación
    delete_result = db.delete_record(
        "warehouse_stock", "product_id = %s AND branch_id = %s", (product_id, branch_id)
    )
    if delete_result.get("success"):
        return jsonify(
            {"success": True, "message": "Relación eliminada correctamente"}
        ), 200
    else:
        return jsonify(
            {"success": False, "message": "Error al eliminar la relación"}
        ), 500


# Global OPTIONS handler for all routes
@product_router.route("/<path:path>", methods=["OPTIONS"])
@product_router.route("/", methods=["OPTIONS"])
def handle_options(path=None):
    """Handle preflight OPTIONS requests for all routes"""
    return "", 200
