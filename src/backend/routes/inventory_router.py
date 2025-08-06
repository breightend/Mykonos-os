from flask import Blueprint, request, jsonify
from database.database import Database
from datetime import datetime

inventory_router = Blueprint("inventory_router", __name__)


@inventory_router.route("/products-summary", methods=["GET"])
def get_products_summary():
    """
    Obtiene un resumen de productos para la vista principal de inventario
    Muestra: ID, Nombre, Marca, Cantidad Total, Fecha de Edición
    """
    try:
        storage_id = request.args.get("storage_id")
        print(f"🔍 DEBUG products-summary: storage_id recibido: {storage_id}")

        db = Database()

        if storage_id:
            # Productos de una sucursal específica
            query = """
            SELECT 
                p.id,
                COALESCE(p.product_name, 'Sin nombre') as producto,
                COALESCE(b.brand_name, 'Sin marca') as marca,
                COALESCE(SUM(ws.quantity), 0) as cantidad_total,
                COALESCE(p.last_modified_date, NOW()) as fecha_edicion,
                COUNT(DISTINCT ws.branch_id) as sucursales_con_stock,
                COALESCE(g.group_name, 'Sin grupo') as grupo,
                p.group_id,
                p.sale_price
            FROM products p
            LEFT JOIN warehouse_stock ws ON p.id = ws.product_id AND ws.branch_id = %s
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN groups g ON p.group_id = g.id
            GROUP BY p.id, p.product_name, b.brand_name, p.last_modified_date, g.group_name, p.group_id, p.sale_price
            HAVING SUM(ws.quantity) > 0
            ORDER BY p.product_name
            """
            products = db.execute_query(query, (storage_id,))
        else:
            # Todos los productos con su cantidad total
            query = """
            SELECT 
                p.id,
                COALESCE(p.product_name, 'Sin nombre') as producto,
                COALESCE(b.brand_name, 'Sin marca') as marca,
                COALESCE(SUM(ws.quantity), 0) as cantidad_total,
                COALESCE(p.last_modified_date, NOW()) as fecha_edicion,
                COUNT(DISTINCT ws.branch_id) as sucursales_con_stock,
                COALESCE(g.group_name, 'Sin grupo') as grupo,
                p.group_id,
                p.sale_price
            FROM products p
            LEFT JOIN warehouse_stock ws ON p.id = ws.product_id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN groups g ON p.group_id = g.id
            GROUP BY p.id, p.product_name, b.brand_name, p.last_modified_date, g.group_name, p.group_id, p.sale_price
            ORDER BY p.product_name
            """
            products = db.execute_query(query)

        print(f"🔍 DEBUG products-summary: {len(products)} productos encontrados")
        print(f"🔍 DEBUG products-summary: Tipo de resultado: {type(products)}")

        # Procesar datos para asegurar formato consistente
        processed_products = []
        if products:
            for i, p in enumerate(products):
                try:
                    if isinstance(p, dict):
                        product_item = {
                            "id": p.get("id"),
                            "producto": p.get("producto"),
                            "marca": p.get("marca"),
                            "cantidad_total": p.get("cantidad_total"),
                            "fecha_edicion": p.get("fecha_edicion"),
                            "sucursales_con_stock": p.get("sucursales_con_stock"),
                            "grupo": p.get("grupo"),
                            "group_id": p.get("group_id"),
                            "sale_price": p.get("sale_price"),
                        }
                    else:
                        product_item = {
                            "id": p[0],
                            "producto": p[1],
                            "marca": p[2],
                            "cantidad_total": p[3],
                            "fecha_edicion": p[4],
                            "sucursales_con_stock": p[5],
                            "grupo": p[6],
                            "group_id": p[7],
                            "sale_price": p[8],
                        }
                    processed_products.append(product_item)
                except (IndexError, KeyError) as e:
                    print(
                        f"❌ DEBUG products-summary: Error procesando producto {i}: {e}"
                    )
                    continue

        return jsonify({"status": "success", "data": processed_products}), 200

    except Exception as e:
        print(f"❌ DEBUG: Error en get_products_summary: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@inventory_router.route("/product-details/<int:product_id>", methods=["GET"])
def get_product_details(product_id):
    """
    Obtiene toda la información detallada de un producto específico
    Para mostrar en el modal al hacer doble clic
    """
    try:
        db = Database()

        # Información básica del producto
        product_query = """
        SELECT 
            p.id,
            p.provider_code,
            p.product_name,
            p.description,
            p.cost,
            p.sale_price,
            p.original_price,
            p.discount_percentage,
            p.discount_amount,
            p.has_discount,
            p.tax,
            p.discount,
            p.comments,
            p.last_modified_date,
            p.images_ids,
            b.brand_name,
            b.description as brand_description
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE p.id = %s
        """
        product_info = db.execute_query(product_query, (product_id,))

        print(f"🔍 DEBUG product-details: Resultado query producto: {product_info}")
        print(f"🔍 DEBUG product-details: Tipo de resultado: {type(product_info)}")

        if not product_info or len(product_info) == 0:
            return jsonify(
                {"status": "error", "message": "Producto no encontrado"}
            ), 404

        # Acceso seguro a los datos según el formato devuelto por execute_query
        try:
            row = product_info[0]
            print(f"🔍 DEBUG product-details: Primera fila: {row}")
            print(f"🔍 DEBUG product-details: Tipo de fila: {type(row)}")

            # Si es un diccionario, acceso por clave
            if isinstance(row, dict):
                product_data = {
                    "id": row.get("id"),
                    "provider_code": row.get("provider_code"),
                    "product_name": row.get("product_name"),
                    "description": row.get("description"),
                    "cost": row.get("cost"),
                    "sale_price": row.get("sale_price"),
                    "original_price": row.get("original_price"),
                    "discount_percentage": row.get("discount_percentage"),
                    "discount_amount": row.get("discount_amount"),
                    "has_discount": row.get("has_discount"),
                    "tax": row.get("tax"),
                    "discount": row.get("discount"),
                    "comments": row.get("comments"),
                    "last_modified_date": row.get("last_modified_date"),
                    "images_ids": row.get("images_ids"),
                    "brand_name": row.get("brand_name"),
                    "brand_description": row.get("brand_description"),
                }
            else:
                # Si es una tupla/lista, acceso por índice
                product_data = {
                    "id": row[0],
                    "provider_code": row[1],
                    "product_name": row[2],
                    "description": row[3],
                    "cost": row[4],
                    "sale_price": row[5],
                    "original_price": row[6],
                    "discount_percentage": row[7],
                    "discount_amount": row[8],
                    "has_discount": row[9],
                    "tax": row[10],
                    "discount": row[11],
                    "comments": row[12],
                    "last_modified_date": row[13],
                    "images_ids": row[14],
                    "brand_name": row[15],
                    "brand_description": row[16],
                }
        except (IndexError, KeyError) as access_error:
            print(f"❌ DEBUG product-details: Error de acceso: {access_error}")
            return jsonify(
                {
                    "status": "error",
                    "message": f"Error al acceder a los datos del producto: {access_error}",
                }
            ), 500

        # Stock por sucursal
        stock_query = """
        SELECT 
            s.id as sucursal_id,
            s.name as sucursal_nombre,
            s.address as sucursal_direccion,
            ws.quantity,
            ws.last_updated
        FROM warehouse_stock ws
        JOIN storage s ON ws.branch_id = s.id
        WHERE ws.product_id = %s
        ORDER BY s.name
        """
        stock_data = db.execute_query(stock_query, (product_id,))
        print(f"🔍 DEBUG product-details: Stock data: {stock_data}")

        product_data["stock_por_sucursal"] = []
        if stock_data:
            for s in stock_data:
                try:
                    if isinstance(s, dict):
                        stock_item = {
                            "sucursal_id": s.get("sucursal_id"),
                            "sucursal_nombre": s.get("sucursal_nombre"),
                            "sucursal_direccion": s.get("sucursal_direccion"),
                            "cantidad": s.get("quantity"),
                            "ultima_actualizacion": s.get("last_updated"),
                        }
                    else:
                        stock_item = {
                            "sucursal_id": s[0],
                            "sucursal_nombre": s[1],
                            "sucursal_direccion": s[2],
                            "cantidad": s[3],
                            "ultima_actualizacion": s[4],
                        }
                    product_data["stock_por_sucursal"].append(stock_item)
                except (IndexError, KeyError) as e:
                    print(f"❌ DEBUG product-details: Error accediendo stock item: {e}")
                    continue

        # Colores del producto
        colors_query = """
        SELECT c.id, c.color_name, c.color_hex
        FROM product_colors pc
        JOIN colors c ON pc.color_id = c.id
        WHERE pc.product_id = %s
        """
        colors_data = db.execute_query(colors_query, (product_id,))
        print(f"🔍 DEBUG product-details: Colors data: {colors_data}")

        product_data["colores"] = []
        if colors_data:
            for c in colors_data:
                try:
                    if isinstance(c, dict):
                        color_item = {
                            "id": c.get("id"),
                            "nombre": c.get("color_name"),
                            "color_hex": c.get("color_hex"),
                        }
                    else:
                        color_item = {"id": c[0], "nombre": c[1], "color_hex": c[2]}
                    product_data["colores"].append(color_item)
                except (IndexError, KeyError) as e:
                    print(f"❌ DEBUG product-details: Error accediendo color item: {e}")
                    continue

        # Tallas del producto (si existe la tabla)
        try:
            sizes_query = """
            SELECT ps.id, s.size_name
            FROM product_sizes ps
            JOIN sizes s ON ps.size_id = s.id
            WHERE ps.product_id = %s
            """
            sizes_data = db.execute_query(sizes_query, (product_id,))
            print(f"🔍 DEBUG product-details: Sizes data: {sizes_data}")

            product_data["tallas"] = []
            if sizes_data:
                for s in sizes_data:
                    try:
                        if isinstance(s, dict):
                            size_item = {
                                "id": s.get("id"),
                                "nombre": s.get("size_name"),
                            }
                        else:
                            size_item = {"id": s[0], "nombre": s[1]}
                        product_data["tallas"].append(size_item)
                    except (IndexError, KeyError) as e:
                        print(
                            f"❌ DEBUG product-details: Error accediendo size item: {e}"
                        )
                        continue
        except Exception:
            product_data["tallas"] = []

        # Consultar stock detallado por variantes (talle + color + sucursal)
        try:
            variants_query = """
            SELECT 
                wsv.id,
                s.size_name,
                c.color_name,
                c.color_hex,
                st.name as sucursal_nombre,
                st.id as sucursal_id,
                wsv.quantity,
                wsv.last_updated,
                wsv.size_id,
                wsv.color_id,
                wsv.variant_barcode
            FROM warehouse_stock_variants wsv
            LEFT JOIN sizes s ON wsv.size_id = s.id
            LEFT JOIN colors c ON wsv.color_id = c.id
            JOIN storage st ON wsv.branch_id = st.id
            WHERE wsv.product_id = %s
            ORDER BY s.size_name, c.color_name, st.name
            """
            variants_data = db.execute_query(variants_query, (product_id,))
            print(
                f"🔍 DEBUG product-details: Variants data: {len(variants_data) if variants_data else 0} registros"
            )
            print(f"🔍 DEBUG product-details: Variants raw data: {variants_data}")

            product_data["stock_variants"] = []
            if variants_data:
                print(
                    f"🔧 DEBUG: Procesando {len(variants_data)} variantes encontradas..."
                )
                for v in variants_data:
                    try:
                        if isinstance(v, dict):
                            variant_item = {
                                "id": v.get("id"),
                                "size_name": v.get("size_name"),
                                "color_name": v.get("color_name"),
                                "color_hex": v.get("color_hex"),
                                "sucursal_nombre": v.get("sucursal_nombre"),
                                "sucursal_id": v.get("sucursal_id"),
                                "quantity": v.get("quantity"),
                                "last_updated": v.get("last_updated"),
                                "size_id": v.get("size_id"),
                                "color_id": v.get("color_id"),
                                "variant_barcode": v.get("variant_barcode"),
                            }
                        else:
                            variant_item = {
                                "id": v[0],
                                "size_name": v[1],
                                "color_name": v[2],
                                "color_hex": v[3],
                                "sucursal_nombre": v[4],
                                "sucursal_id": v[5],
                                "quantity": v[6],
                                "last_updated": v[7],
                                "size_id": v[8],
                                "color_id": v[9],
                                "variant_barcode": v[10],
                            }

                        # 🔧 DEBUGGING ESPECÍFICO DE VARIANT_BARCODE
                        barcode_value = variant_item["variant_barcode"]
                        print(
                            f"🔧 DEBUG: Variante ID {variant_item['id']} - variant_barcode: '{barcode_value}' (tipo: {type(barcode_value)})"
                        )

                        if barcode_value is None:
                            print(
                                f"❌ BACKEND: Variante {variant_item['id']} tiene variant_barcode NULL"
                            )
                        elif barcode_value == "":
                            print(
                                f"❌ BACKEND: Variante {variant_item['id']} tiene variant_barcode vacío"
                            )
                        else:
                            print(
                                f"✅ BACKEND: Variante {variant_item['id']} tiene variant_barcode válido: '{barcode_value}'"
                            )

                        product_data["stock_variants"].append(variant_item)
                    except (IndexError, KeyError) as e:
                        print(
                            f"❌ DEBUG product-details: Error accediendo variant item: {e}"
                        )
                        continue

                print(
                    f"🎯 DEBUG: Total variantes procesadas: {len(product_data['stock_variants'])}"
                )
                valid_barcodes = sum(
                    1
                    for v in product_data["stock_variants"]
                    if v["variant_barcode"] and v["variant_barcode"] != ""
                )
                print(
                    f"🎯 DEBUG: Variantes con códigos válidos: {valid_barcodes}/{len(product_data['stock_variants'])}"
                )
            else:
                print(
                    "⚠️ DEBUG: No hay datos de variantes en warehouse_stock_variants para este producto"
                )
                product_data["stock_variants"] = []
        except Exception as e:
            print(f"❌ DEBUG product-details: Error consultando variantes: {e}")
            product_data["stock_variants"] = []

        # Calcular totales
        total_stock = sum([s["cantidad"] for s in product_data["stock_por_sucursal"]])
        product_data["stock_total"] = total_stock
        product_data["sucursales_con_stock"] = len(
            [s for s in product_data["stock_por_sucursal"] if s["cantidad"] > 0]
        )

        # Verificar si el producto tiene imagen (sin cargar los datos completos)
        product_data["has_image"] = False
        print(
            f"🔍 DEBUG product-details: Verificando si existe imagen para product_id = {product_id}"
        )

        try:
            # Solo verificar si existe imagen, no cargar los datos
            image_check_query = """
            SELECT COUNT(*) as image_count
            FROM images 
            WHERE product_id = %s 
            LIMIT 1
            """
            print(
                f"🔍 DEBUG product-details: Ejecutando verificación de imagen para product_id = {product_id}"
            )
            image_check_result = db.execute_query(image_check_query, (product_id,))
            print(
                f"🔍 DEBUG product-details: Resultado verificación imagen: {image_check_result}"
            )

            if image_check_result and len(image_check_result) > 0:
                image_count = image_check_result[0]
                if isinstance(image_count, dict):
                    count = image_count.get("image_count", 0)
                else:
                    count = image_count[0]

                product_data["has_image"] = count > 0
                print(
                    f"🖼️ DEBUG product-details: Producto {product_id} {'tiene' if product_data['has_image'] else 'no tiene'} imagen"
                )
            else:
                print(
                    f"🖼️ DEBUG product-details: No se pudo verificar imagen para producto {product_id}"
                )
        except Exception as img_error:
            print(f"❌ DEBUG product-details: Error al verificar imagen: {img_error}")
            import traceback

            traceback.print_exc()
            product_data["has_image"] = False

        return jsonify({"status": "success", "data": product_data}), 200

    except Exception as e:
        print(f"❌ DEBUG: Error en get_product_details: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@inventory_router.route("/products-by-storage", methods=["GET"])
def get_products_by_storage():
    """
    Obtiene todos los productos con sus cantidades por sucursal
    """
    try:
        storage_id = request.args.get("storage_id")
        print(f"🔍 DEBUG: storage_id recibido: {storage_id}")

        db = Database()

        if storage_id:
            print(
                f"🔍 DEBUG: Buscando productos para sucursal específica: {storage_id}"
            )
            # Obtener productos de una sucursal específica
            query = """
            SELECT 
                p.id,
                p.product_name as producto,
                COALESCE(b.brand_name, 'Sin marca') as marca,
                ws.quantity as cantidad,
                s.name as sucursal,
                s.id as sucursal_id,
                COALESCE(p.last_modified_date, NOW()) as fecha,
                COALESCE(STRING_AGG(c.color_name, ', '), 'Sin colores') as colores
            FROM warehouse_stock ws
            JOIN products p ON ws.product_id = p.id
            JOIN storage s ON ws.branch_id = s.id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN product_colors pc ON p.id = pc.product_id
            LEFT JOIN colors c ON pc.color_id = c.id
            WHERE ws.branch_id = %s
            GROUP BY p.id, ws.branch_id, p.product_name, b.brand_name, ws.quantity, s.name, s.id, p.last_modified_date
            ORDER BY p.product_name
            """
            products = db.execute_query(query, (storage_id,))
        else:
            print("🔍 DEBUG: Buscando todos los productos")
            # Obtener todos los productos con sus cantidades por sucursal
            query = """
            SELECT 
                p.id,
                p.product_name as producto,
                COALESCE(b.brand_name, 'Sin marca') as marca,
                ws.quantity as cantidad,
                s.name as sucursal,
                s.id as sucursal_id,
                COALESCE(p.last_modified_date, NOW()) as fecha,
                COALESCE(STRING_AGG(c.color_name, ', '), 'Sin colores') as colores
            FROM warehouse_stock ws
            JOIN products p ON ws.product_id = p.id
            JOIN storage s ON ws.branch_id = s.id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN product_colors pc ON p.id = pc.product_id
            LEFT JOIN colors c ON pc.color_id = c.id
            GROUP BY p.id, ws.branch_id, p.product_name, b.brand_name, ws.quantity, s.name, s.id, p.last_modified_date
            ORDER BY p.product_name, s.name
            """
            products = db.execute_query(query)

        print(f"🔍 DEBUG: Query ejecutado, resultados: {len(products)}")
        if len(products) > 0:
            print(f"🔍 DEBUG: Primer resultado: {products[0]}")
        else:
            print("🔍 DEBUG: No se encontraron resultados")

            # Verificar por qué no hay resultados - con manejo seguro
            try:
                test_products_result = db.execute_query("SELECT COUNT(*) FROM products")
                test_products = (
                    test_products_result[0][0]
                    if test_products_result and len(test_products_result) > 0
                    else 0
                )

                test_stock_result = db.execute_query(
                    "SELECT COUNT(*) FROM warehouse_stock"
                )
                test_stock = (
                    test_stock_result[0][0]
                    if test_stock_result and len(test_stock_result) > 0
                    else 0
                )

                test_storage_result = db.execute_query("SELECT COUNT(*) FROM storage")
                test_storage = (
                    test_storage_result[0][0]
                    if test_storage_result and len(test_storage_result) > 0
                    else 0
                )

                print(
                    f"🔍 DEBUG: Conteos - Products: {test_products}, Stock: {test_stock}, Storage: {test_storage}"
                )
            except Exception as count_error:
                print(f"🔍 DEBUG: Error al contar registros: {count_error}")

        return jsonify({"status": "success", "data": products}), 200

    except Exception as e:
        print(f"❌ DEBUG: Error en get_products_by_storage: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@inventory_router.route("/storage-list", methods=["GET"])
def get_storage_list():
    """
    Obtiene la lista de todas las sucursales/almacenes activas
    """
    try:
        db = Database()

        # Primero verificar todas las sucursales
        all_storages_result = db.execute_query("SELECT id, name, status FROM storage")
        all_storages = all_storages_result if all_storages_result else []

        print(f"🔍 DEBUG storage-list: Total sucursales en DB: {len(all_storages)}")
        print(f"🔍 DEBUG storage-list: Tipo de resultado: {type(all_storages)}")

        if all_storages:
            for i, s in enumerate(all_storages):
                try:
                    if isinstance(s, dict):
                        print(
                            f"   - ID: {s.get('id')}, Nombre: {s.get('name')}, Status: '{s.get('status')}'"
                        )
                    else:
                        print(f"   - ID: {s[0]}, Nombre: {s[1]}, Status: '{s[2]}'")
                except Exception as e:
                    print(f"   - Error accediendo sucursal {i}: {e}")

        # Intentar con filtro flexible primero
        query = """
        SELECT id, name, COALESCE(address, '') as address, COALESCE(description, '') as description, status
        FROM storage
        WHERE status IN ('Activo', 'Active', 'activo', 'active', 'ACTIVO', 'ACTIVE')
        ORDER BY name
        """
        storages_result = db.execute_query(query)
        storages = storages_result if storages_result else []

        print(f"🔍 DEBUG storage-list: Sucursales activas encontradas: {len(storages)}")

        # Si no encuentra ninguna con filtro, devolver todas
        if len(storages) == 0 and len(all_storages) > 0:
            print("🔍 DEBUG storage-list: No hay sucursales activas, devolviendo todas")
            query_all = """
            SELECT id, name, COALESCE(address, '') as address, COALESCE(description, '') as description, status
            FROM storage
            ORDER BY name
            """
            storages_result = db.execute_query(query_all)
            storages = storages_result if storages_result else []

        # Convertir a formato consistente
        processed_storages = []
        if storages:
            for s in storages:
                try:
                    if isinstance(s, dict):
                        storage_item = [
                            s.get("id"),
                            s.get("name"),
                            s.get("address", ""),
                            s.get("description", ""),
                            s.get("status"),
                        ]
                    else:
                        storage_item = list(s)
                    processed_storages.append(storage_item)
                except Exception as e:
                    print(f"❌ DEBUG storage-list: Error procesando sucursal: {e}")
                    continue

        return jsonify({"status": "success", "data": processed_storages}), 200

    except Exception as e:
        print(f"❌ DEBUG: Error en get_storage_list: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@inventory_router.route("/product-stock/<int:product_id>", methods=["GET"])
def get_product_stock_by_storage(product_id):
    """
    Obtiene el stock de un producto específico en todas las sucursales
    """
    try:
        db = Database()
        query = """
        SELECT 
            ws.id,
            p.product_name as producto,
            s.name as sucursal,
            s.id as sucursal_id,
            ws.quantity as cantidad,
            ws.last_updated as ultima_actualizacion
        FROM warehouse_stock ws
        JOIN products p ON ws.product_id = p.id
        JOIN storage s ON ws.branch_id = s.id
        WHERE p.id = %s
        ORDER BY s.name
        """
        stock = db.execute_query(query, (product_id,))

        return jsonify({"status": "success", "data": stock}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@inventory_router.route("/update-stock", methods=["PUT"])
def update_stock():
    """
    Actualiza el stock de un producto en una sucursal específica
    """
    try:
        data = request.get_json()
        product_id = data.get("product_id")
        storage_id = data.get("storage_id")
        quantity = data.get("quantity")

        if not all([product_id, storage_id, quantity is not None]):
            return jsonify(
                {
                    "status": "error",
                    "message": "Faltan campos requeridos: product_id, storage_id, quantity",
                }
            ), 400

        db = Database()

        # Verificar si ya existe un registro para este producto en esta sucursal
        check_query = """
        SELECT id FROM warehouse_stock 
        WHERE product_id = %s AND branch_id = %s
        """
        existing = db.execute_query(check_query, (product_id, storage_id))

        if existing:
            # Actualizar registro existente usando execute_query
            update_query = """
            UPDATE warehouse_stock 
            SET quantity = %s, last_updated = NOW()
            WHERE product_id = %s AND branch_id = %s
            """
            with db.create_connection() as conn:
                cur = conn.cursor()
                cur.execute(update_query, (quantity, product_id, storage_id))
                conn.commit()
        else:
            # Crear nuevo registro usando execute_query
            insert_query = """
            INSERT INTO warehouse_stock (product_id, branch_id, quantity, last_updated)
            VALUES (?, ?, ?, datetime('now', 'localtime'))
            """
            with db.create_connection() as conn:
                cur = conn.cursor()
                cur.execute(insert_query, (product_id, storage_id, quantity))
                conn.commit()

        return jsonify(
            {"status": "success", "message": "Stock actualizado correctamente"}
        ), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@inventory_router.route("/total-stock/<int:product_id>", methods=["GET"])
def get_total_stock(product_id):
    """
    Obtiene el stock total de un producto sumando todas las sucursales
    """
    try:
        db = Database()
        query = """
        SELECT 
            p.product_name as producto,
            SUM(ws.quantity) as stock_total,
            COUNT(ws.branch_id) as sucursales_con_stock
        FROM warehouse_stock ws
        JOIN products p ON ws.product_id = p.id
        WHERE p.id = ? AND ws.quantity > 0
        GROUP BY p.id
        """
        total_stock = db.execute_query(query, (product_id,))

        return jsonify(
            {
                "status": "success",
                "data": total_stock[0]
                if total_stock
                else {"producto": "", "stock_total": 0, "sucursales_con_stock": 0},
            }
        ), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@inventory_router.route("/debug-database", methods=["GET"])
def debug_database():
    """
    Endpoint para verificar la estructura exacta que devuelve execute_query
    """
    try:
        db = Database()
        debug_info = {}

        # Probar diferentes queries simples
        print("🔍 DEBUG: Probando estructura de execute_query")

        # Test 1: SELECT simple
        result1 = db.execute_query(
            "SELECT 1 as test_number, 'test_string' as test_text"
        )
        debug_info["test_simple"] = {
            "result": result1,
            "type": str(type(result1)),
            "length": len(result1) if result1 else 0,
        }
        print(f"   Test simple: {result1}, tipo: {type(result1)}")

        # Test 2: COUNT query
        result2 = db.execute_query(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table'"
        )
        debug_info["test_count"] = {
            "result": result2,
            "type": str(type(result2)),
            "length": len(result2) if result2 else 0,
        }
        print(f"   Test count: {result2}, tipo: {type(result2)}")

        # Test 3: Verificar si las tablas existen
        tables_result = db.execute_query(
            "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('products', 'warehouse_stock', 'storage')"
        )
        debug_info["tables_exist"] = {
            "result": tables_result,
            "tables_found": [row[0] for row in tables_result] if tables_result else [],
        }
        print(f"   Tablas encontradas: {tables_result}")

        return jsonify({"status": "success", "debug": debug_info}), 200

    except Exception as e:
        print(f"❌ DEBUG: Error en debug_database: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@inventory_router.route("/debug-simple", methods=["GET"])
def debug_simple():
    """
    Endpoint simple para verificar datos básicos
    """
    try:
        db = Database()
        debug_info = {}

        # Contar registros con manejo seguro
        try:
            products_result = db.execute_query("SELECT COUNT(*) FROM products")
            debug_info["products_count"] = (
                products_result[0][0]
                if products_result and len(products_result) > 0
                else 0
            )
        except Exception as e:
            debug_info["products_count"] = f"Error: {e}"

        try:
            stock_result = db.execute_query("SELECT COUNT(*) FROM warehouse_stock")
            debug_info["stock_count"] = (
                stock_result[0][0] if stock_result and len(stock_result) > 0 else 0
            )
        except Exception as e:
            debug_info["stock_count"] = f"Error: {e}"

        try:
            storage_result = db.execute_query("SELECT COUNT(*) FROM storage")
            debug_info["storage_count"] = (
                storage_result[0][0]
                if storage_result and len(storage_result) > 0
                else 0
            )
        except Exception as e:
            debug_info["storage_count"] = f"Error: {e}"

        # Verificar algunos productos
        try:
            products = db.execute_query("SELECT id, product_name FROM products LIMIT 3")
            debug_info["sample_products"] = (
                [{"id": p[0], "name": p[1]} for p in products] if products else []
            )
        except Exception as e:
            debug_info["sample_products"] = f"Error: {e}"

        # Verificar stock
        try:
            stock = db.execute_query(
                "SELECT product_id, branch_id, quantity FROM warehouse_stock LIMIT 3"
            )
            debug_info["sample_stock"] = (
                [
                    {"product_id": s[0], "branch_id": s[1], "quantity": s[2]}
                    for s in stock
                ]
                if stock
                else []
            )
        except Exception as e:
            debug_info["sample_stock"] = f"Error: {e}"

        # Verificar sucursales y sus status
        try:
            storages = db.execute_query("SELECT id, name, status FROM storage")
            debug_info["all_storages"] = (
                [{"id": s[0], "name": s[1], "status": s[2]} for s in storages]
                if storages
                else []
            )
        except Exception as e:
            debug_info["all_storages"] = f"Error: {e}"

        # Probar JOIN simple
        try:
            simple_join = db.execute_query("""
                SELECT p.id, p.product_name, ws.quantity, s.name as storage_name
                FROM warehouse_stock ws
                JOIN products p ON ws.product_id = p.id  
                JOIN storage s ON ws.branch_id = s.id
                LIMIT 3
            """)
            if simple_join:
                debug_info["simple_join_results"] = len(simple_join)
                debug_info["simple_join_sample"] = [
                    {
                        "product_id": r[0],
                        "product_name": r[1],
                        "quantity": r[2],
                        "storage": r[3],
                    }
                    for r in simple_join
                ]
            else:
                debug_info["simple_join_results"] = 0
                debug_info["simple_join_sample"] = []
        except Exception as je:
            debug_info["simple_join_error"] = str(je)

        return jsonify({"status": "success", "debug": debug_info}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@inventory_router.route("/debug", methods=["GET"])
def debug_inventory():
    """
    Endpoint de debug para verificar datos de inventario
    """
    try:
        db = Database()
        debug_info = {}

        # Contar productos
        products_count = db.execute_query("SELECT COUNT(*) FROM products")[0][0]
        debug_info["products_count"] = products_count

        # Contar stock
        stock_count = db.execute_query("SELECT COUNT(*) FROM warehouse_stock")[0][0]
        debug_info["stock_count"] = stock_count

        # Contar sucursales
        storage_count = db.execute_query("SELECT COUNT(*) FROM storage")[0][0]
        debug_info["storage_count"] = storage_count

        # Primeros 3 productos
        products = db.execute_query(
            "SELECT id, product_name, brand_id FROM products LIMIT 3"
        )
        debug_info["sample_products"] = [
            {"id": p[0], "name": p[1], "brand_id": p[2]} for p in products
        ]

        # Primeros 3 registros de stock
        stock = db.execute_query(
            "SELECT id, product_id, branch_id, quantity FROM warehouse_stock LIMIT 3"
        )
        debug_info["sample_stock"] = [
            {"id": s[0], "product_id": s[1], "branch_id": s[2], "quantity": s[3]}
            for s in stock
        ]

        # Primeras 3 sucursales
        storages = db.execute_query("SELECT id, name, status FROM storage LIMIT 3")
        debug_info["sample_storages"] = [
            {"id": s[0], "name": s[1], "status": s[2]} for s in storages
        ]

        # Probar query principal
        try:
            main_query = """
            SELECT 
                p.id,
                p.product_name as producto,
                b.brand_name as marca,
                ws.quantity as cantidad,
                s.name as sucursal,
                s.id as sucursal_id,
                p.last_modified_date as fecha,
                STRING_AGG(DISTINCT c.color_name, ', ') as colores
            FROM warehouse_stock ws
            JOIN products p ON ws.product_id = p.id
            JOIN storage s ON ws.branch_id = s.id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN product_colors pc ON p.id = pc.product_id
            LEFT JOIN colors c ON pc.color_id = c.id
            GROUP BY p.id, ws.branch_id, p.product_name, b.brand_name, ws.quantity, s.name, s.id, p.last_modified_date
            ORDER BY p.product_name, s.name
            LIMIT 3
            """
            main_results = db.execute_query(main_query)
            debug_info["main_query_results"] = len(main_results)
            debug_info["sample_main_results"] = [
                {
                    "id": r[0],
                    "producto": r[1],
                    "marca": r[2],
                    "cantidad": r[3],
                    "sucursal": r[4],
                    "sucursal_id": r[5],
                    "fecha": r[6],
                    "colores": r[7],
                }
                for r in main_results
            ]
        except Exception as qe:
            debug_info["main_query_error"] = str(qe)

        return jsonify({"status": "success", "debug": debug_info}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@inventory_router.route("/movements", methods=["POST"])
def create_movement():
    """
    Crea un nuevo movimiento de inventario entre sucursales
    """
    try:
        data = request.get_json()
        from_storage_id = data.get("from_storage_id")
        to_storage_id = data.get("to_storage_id")
        products = data.get("products", [])
        notes = data.get("notes", "")
        user_id = data.get("user_id")  # Se debería obtener del token de sesión

        if not from_storage_id or not to_storage_id or not products:
            return jsonify(
                {
                    "status": "error",
                    "message": "Faltan datos requeridos: from_storage_id, to_storage_id, products",
                }
            ), 400

        if from_storage_id == to_storage_id:
            return jsonify(
                {
                    "status": "error",
                    "message": "La sucursal de origen y destino no pueden ser la misma",
                }
            ), 400

        db = Database()

        # Crear el grupo de movimiento
        group_query = """
        INSERT INTO inventory_movemetns_groups 
        (origin_branch_id, destination_branch_id, status, movement_type, created_by_user_id, notes)
        VALUES (?, ?, 'empacado', 'transfer', ?, ?)
        """
        group_result = db.execute_query(
            group_query, (from_storage_id, to_storage_id, user_id, notes)
        )
        group_id = db.get_last_insert_id()

        total_movement_value = 0

        # Crear los movimientos individuales de productos
        for product in products:
            product_id = product.get("id")
            quantity = product.get("quantity")

            if not product_id or not quantity or quantity <= 0:
                continue

            # Verificar stock disponible
            stock_query = """
            SELECT quantity FROM warehouse_stock 
            WHERE product_id = ? AND branch_id = ?
            """
            stock_result = db.execute_query(stock_query, (product_id, from_storage_id))

            if not stock_result or stock_result[0][0] < quantity:
                return jsonify(
                    {
                        "status": "error",
                        "message": f"Stock insuficiente para el producto ID {product_id}",
                    }
                ), 400

            # Obtener precio del producto
            price_query = "SELECT sale_price FROM products WHERE id = ?"
            price_result = db.execute_query(price_query, (product_id,))
            unit_price = price_result[0][0] if price_result else 0

            subtotal = float(unit_price) * int(quantity)
            total_movement_value += subtotal

            # Insertar el movimiento individual
            movement_query = """
            INSERT INTO inventory_movemetns 
            (inventory_movements_group_id, product_id, quantity, discount, subtotal, total)
            VALUES (?, ?, ?, 0.0, ?, ?)
            """
            db.execute_query(
                movement_query, (group_id, product_id, quantity, subtotal, subtotal)
            )

            # Actualizar stock en sucursal origen (restar)
            update_origin_query = """
            UPDATE warehouse_stock 
            SET quantity = quantity - ?, last_updated = CURRENT_TIMESTAMP
            WHERE product_id = ? AND branch_id = ?
            """
            db.execute_query(
                update_origin_query, (quantity, product_id, from_storage_id)
            )

            # Verificar si existe stock en sucursal destino
            dest_stock_query = """
            SELECT id FROM warehouse_stock 
            WHERE product_id = ? AND branch_id = ?
            """
            dest_stock = db.execute_query(dest_stock_query, (product_id, to_storage_id))

            if dest_stock:
                # Actualizar stock existente en destino (sumar)
                update_dest_query = """
                UPDATE warehouse_stock 
                SET quantity = quantity + ?, last_updated = CURRENT_TIMESTAMP
                WHERE product_id = ? AND branch_id = ?
                """
                db.execute_query(
                    update_dest_query, (quantity, product_id, to_storage_id)
                )
            else:
                # Crear nuevo registro de stock en destino
                insert_dest_query = """
                INSERT INTO warehouse_stock (product_id, branch_id, quantity)
                VALUES (?, ?, ?)
                """
                db.execute_query(
                    insert_dest_query, (product_id, to_storage_id, quantity)
                )

        return jsonify(
            {
                "status": "success",
                "message": "Movimiento creado exitosamente",
                "movement_id": group_id,
                "total_value": total_movement_value,
            }
        ), 201

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@inventory_router.route("/pending-shipments/<int:storage_id>", methods=["GET"])
def get_pending_shipments(storage_id):
    """
    Obtiene envíos pendientes que llegan a una sucursal específica
    """
    try:
        db = Database()

        query = """
        SELECT 
            img.id,
            so.name as from_storage,
            sd.name as to_storage,
            img.status,
            img.created_at,
            img.shipped_at,
            img.delivered_at,
            img.notes,
            STRING_AGG(
                p.product_name || ' (x' || im.quantity || ')', 
                ', '
            ) as products_summary
        FROM inventory_movemetns_groups img
        JOIN storage so ON img.origin_branch_id = so.id
        JOIN storage sd ON img.destination_branch_id = sd.id
        LEFT JOIN inventory_movemetns im ON img.id = im.inventory_movements_group_id
        LEFT JOIN products p ON im.product_id = p.id
        WHERE img.destination_branch_id = %s 
        AND img.status IN ('empacado', 'en_transito')
        GROUP BY img.id
        ORDER BY img.created_at DESC
        """

        shipments = db.execute_query(query, (storage_id,))

        # Formatear resultados
        result = []
        for shipment in shipments:
            # Obtener productos detallados
            products_query = """
            SELECT p.product_name, im.quantity
            FROM inventory_movemetns im
            JOIN products p ON im.product_id = p.id
            WHERE im.inventory_movements_group_id = ?
            """
            products = db.execute_query(products_query, (shipment[0],))

            result.append(
                {
                    "id": shipment[0],
                    "fromStorage": shipment[1],
                    "toStorage": shipment[2],
                    "status": shipment[3],
                    "createdAt": shipment[4][:10]
                    if shipment[4]
                    else None,  # Solo fecha
                    "shippedAt": shipment[5][:10] if shipment[5] else None,
                    "deliveredAt": shipment[6][:10] if shipment[6] else None,
                    "notes": shipment[7],
                    "products": [{"name": p[0], "quantity": p[1]} for p in products],
                }
            )

        return jsonify({"status": "success", "data": result}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@inventory_router.route("/sent-shipments/<int:storage_id>", methods=["GET"])
def get_sent_shipments(storage_id):
    """
    Obtiene envíos realizados desde una sucursal específica
    """
    try:
        db = Database()

        query = """
        SELECT 
            img.id,
            so.name as from_storage,
            sd.name as to_storage,
            img.status,
            img.created_at,
            img.shipped_at,
            img.delivered_at,
            img.notes
        FROM inventory_movemetns_groups img
        JOIN storage so ON img.origin_branch_id = so.id
        JOIN storage sd ON img.destination_branch_id = sd.id
        WHERE img.origin_branch_id = ?
        ORDER BY img.created_at DESC
        """

        shipments = db.execute_query(query, (storage_id,))

        # Formatear resultados
        result = []
        for shipment in shipments:
            # Obtener productos detallados
            products_query = """
            SELECT p.product_name, im.quantity
            FROM inventory_movemetns im
            JOIN products p ON im.product_id = p.id
            WHERE im.inventory_movements_group_id = ?
            """
            products = db.execute_query(products_query, (shipment[0],))

            result.append(
                {
                    "id": shipment[0],
                    "fromStorage": shipment[1],
                    "toStorage": shipment[2],
                    "status": shipment[3],
                    "createdAt": shipment[4][:10] if shipment[4] else None,
                    "shippedAt": shipment[5][:10] if shipment[5] else None,
                    "deliveredAt": shipment[6][:10] if shipment[6] else None,
                    "notes": shipment[7],
                    "products": [{"name": p[0], "quantity": p[1]} for p in products],
                }
            )

        return jsonify({"status": "success", "data": result}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@inventory_router.route("/shipments/<int:shipment_id>/status", methods=["PUT"])
def update_shipment_status(shipment_id):
    """
    Actualiza el estado de un envío
    """
    try:
        data = request.get_json()
        new_status = data.get("status")
        user_id = data.get("user_id")  # Se debería obtener del token de sesión

        valid_statuses = [
            "empacado",
            "en_transito",
            "entregado",
            "recibido",
            "no_recibido",
        ]
        if new_status not in valid_statuses:
            return jsonify(
                {
                    "status": "error",
                    "message": f"Estado inválido. Estados válidos: {', '.join(valid_statuses)}",
                }
            ), 400

        db = Database()

        # Preparar campos de fecha según el nuevo estado
        date_field = None
        if new_status == "en_transito":
            date_field = "shipped_at"
        elif new_status == "entregado":
            date_field = "delivered_at"
        elif new_status in ["recibido", "no_recibido"]:
            date_field = "received_at"

        # Construir query de actualización
        if date_field:
            query = f"""
            UPDATE inventory_movemetns_groups 
            SET status = ?, {date_field} = CURRENT_TIMESTAMP, 
                updated_at = CURRENT_TIMESTAMP, updated_by_user_id = ?
            WHERE id = ?
            """
            params = (new_status, user_id, shipment_id)
        else:
            query = """
            UPDATE inventory_movemetns_groups 
            SET status = ?, updated_at = CURRENT_TIMESTAMP, updated_by_user_id = ?
            WHERE id = ?
            """
            params = (new_status, user_id, shipment_id)

        result = db.execute_query(query, params)

        if db.cursor.rowcount == 0:
            return jsonify({"status": "error", "message": "Envío no encontrado"}), 404

        return jsonify(
            {"status": "success", "message": f"Estado actualizado a: {new_status}"}
        ), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@inventory_router.route("/update-product", methods=["PUT"])
def update_product():
    """
    Actualiza los datos de un producto incluyendo precios, descuentos,
    descripción, comentarios y stock por variantes
    """
    try:
        data = request.json
        product_id = data.get("product_id")

        if not product_id:
            return jsonify(
                {"status": "error", "message": "ID de producto requerido"}
            ), 400

        print(f"🔄 Actualizando producto ID: {product_id}")
        print(f"📊 Datos recibidos: {data}")

        db = Database()

        # 1. Actualizar datos básicos del producto
        update_fields = []
        params = []

        if "description" in data:
            update_fields.append("description = ?")
            params.append(data["description"])

        if "comments" in data:
            update_fields.append("comments = ?")
            params.append(data["comments"])

        if "cost" in data:
            update_fields.append("cost = ?")
            params.append(float(data["cost"]))

        if "sale_price" in data:
            update_fields.append("sale_price = ?")
            params.append(float(data["sale_price"]))

        # Campos de descuento - los agregamos a la tabla products si no existen
        if "original_price" in data:
            update_fields.append("original_price = ?")
            params.append(float(data["original_price"]))

        if "discount_percentage" in data:
            update_fields.append("discount_percentage = ?")
            params.append(float(data["discount_percentage"]))

        if "discount_amount" in data:
            update_fields.append("discount_amount = ?")
            params.append(float(data["discount_amount"]))

        if "has_discount" in data:
            update_fields.append("has_discount = ?")
            params.append(1 if data["has_discount"] else 0)

        # Actualizar fecha de modificación
        update_fields.append("last_modified_date = CURRENT_TIMESTAMP")

        if update_fields:
            params.append(product_id)
            query = f"UPDATE products SET {', '.join(update_fields)} WHERE id = ?"

            print(f"🔍 Query de actualización: {query}")
            print(f"🔍 Parámetros: {params}")

            result = db.execute_query(query, params)

            if not result:
                return jsonify(
                    {"status": "error", "message": "Error actualizando producto"}
                ), 500

            print(f"✅ Producto actualizado, filas afectadas: {db.cursor.rowcount}")

        # 2. Actualizar stock por variantes si se proporcionan
        if "stock_variants" in data and data["stock_variants"]:
            print(f"🔄 Actualizando {len(data['stock_variants'])} variantes de stock")

            for variant in data["stock_variants"]:
                if all(
                    key in variant
                    for key in ["size_id", "color_id", "sucursal_id", "quantity"]
                ):
                    update_variant_query = """
                    UPDATE warehouse_stock_variants 
                    SET quantity = ?, last_updated = CURRENT_TIMESTAMP
                    WHERE product_id = ? AND size_id = ? AND color_id = ? AND branch_id = ?
                    """

                    variant_params = [
                        int(variant["quantity"]),
                        product_id,
                        variant["size_id"],
                        variant["color_id"],
                        variant["sucursal_id"],
                    ]

                    variant_result = db.execute_query(
                        update_variant_query, variant_params
                    )

                    if variant_result and db.cursor.rowcount > 0:
                        print(
                            f"✅ Variante actualizada: Talle {variant['size_id']}, Color {variant['color_id']}, Cantidad: {variant['quantity']}"
                        )
                    else:
                        print(
                            f"⚠️ No se pudo actualizar variante: Talle {variant['size_id']}, Color {variant['color_id']}"
                        )

        return jsonify(
            {
                "status": "success",
                "message": "Producto actualizado correctamente",
                "product_id": product_id,
            }
        ), 200

    except Exception as e:
        print(f"❌ Error actualizando producto: {str(e)}")
        return jsonify({"status": "error", "message": f"Error interno: {str(e)}"}), 500


@inventory_router.route("/products/<int:product_id>", methods=["PUT"])
def update_product_by_id(product_id):
    """
    Actualiza un producto específico por ID (formato REST)
    Incluye información básica, precios, descuentos, stock por variantes, imágenes, colores y talles
    """
    try:
        data = request.json
        print(f"🔄 Actualizando producto ID {product_id} con datos: {data}")

        db = Database()

        # Iniciar transacción manual
        with db.create_connection() as conn:
            try:
                # Crear cursor para toda la transacción
                cursor = conn.cursor()

                # 1. Actualizar datos básicos del producto
                update_fields = []
                update_values = []

                # Campos que se pueden actualizar
                updatable_fields = {
                    "product_name": "product_name",
                    "description": "description",
                    "comments": "comments",
                    "cost": "cost",
                    "sale_price": "sale_price",
                    "original_price": "original_price",
                    "discount_percentage": "discount_percentage",
                    "discount_amount": "discount_amount",
                    "has_discount": "has_discount",
                    "tax": "tax",
                }

                for field, column in updatable_fields.items():
                    if field in data:
                        update_fields.append(f"{column} = %s")
                        # Convertir booleanos a enteros para has_discount
                        if field == "has_discount":
                            update_values.append(1 if data[field] else 0)
                        else:
                            update_values.append(data[field])

                # Agregar fecha de modificación
                if update_fields:
                    update_fields.append("last_modified_date = %s")
                    update_values.append(datetime.now().isoformat())
                    update_values.append(product_id)

                    update_query = f"""
                    UPDATE products 
                    SET {", ".join(update_fields)}
                    WHERE id = %s
                    """

                    cursor.execute(update_query, update_values)
                    print(
                        f"✅ Producto {product_id} actualizado, filas afectadas: {cursor.rowcount}"
                    )

                # 2. Procesar imagen si se proporciona
                if "product_image" in data and data["product_image"]:
                    print(f"🖼️ Procesando imagen para producto {product_id}")
                    try:
                        import base64
                        from PIL import Image
                        import io

                        product_image = data["product_image"]

                        # Remover el prefijo data:image si existe
                        if product_image.startswith("data:"):
                            product_image = product_image.split(",")[1]

                        # Decodificar base64
                        image_bytes = base64.b64decode(product_image)

                        # Redimensionar imagen para evitar archivos muy grandes
                        image = Image.open(io.BytesIO(image_bytes))

                        # Redimensionar si es muy grande (máximo 800x800)
                        max_size = (800, 800)
                        if image.size[0] > max_size[0] or image.size[1] > max_size[1]:
                            image.thumbnail(max_size, Image.Resampling.LANCZOS)
                            print(
                                f"🖼️ Imagen redimensionada de tamaño original a {image.size}"
                            )

                        # Convertir a RGB si es necesario
                        if image.mode in ("RGBA", "P"):
                            image = image.convert("RGB")

                        # Guardar como JPEG con calidad optimizada
                        output = io.BytesIO()
                        image.save(output, format="JPEG", quality=85, optimize=True)
                        optimized_image_bytes = output.getvalue()

                        print(
                            f"🖼️ Imagen optimizada: {len(image_bytes)} -> {len(optimized_image_bytes)} bytes"
                        )

                        # Eliminar imagen anterior si existe
                        cursor.execute(
                            "DELETE FROM images WHERE product_id = %s", (product_id,)
                        )

                        # Insertar nueva imagen
                        cursor.execute(
                            "INSERT INTO images (product_id, image_data) VALUES (%s, %s)",
                            (product_id, optimized_image_bytes),
                        )

                        print(f"✅ Imagen actualizada para producto {product_id}")

                    except Exception as img_error:
                        print(f"❌ Error procesando imagen: {img_error}")
                        import traceback

                        traceback.print_exc()

                # 3. Actualizar relaciones de colores del producto
                if "colors" in data and isinstance(data["colors"], list):
                    print(f"🎨 Actualizando colores del producto {product_id}")

                    # Eliminar colores existentes
                    cursor.execute(
                        "DELETE FROM product_colors WHERE product_id = %s",
                        (product_id,),
                    )

                    # Agregar nuevos colores
                    for color_id in data["colors"]:
                        if color_id:
                            cursor.execute(
                                "INSERT INTO product_colors (product_id, color_id) VALUES (%s, %s)",
                                (product_id, color_id),
                            )
                    print(f"✅ Colores actualizados para producto {product_id}")

                # 4. Actualizar relaciones de tallas del producto
                if "sizes" in data and isinstance(data["sizes"], list):
                    print(f"📏 Actualizando tallas del producto {product_id}")

                    # Eliminar tallas existentes
                    cursor.execute(
                        "DELETE FROM product_sizes WHERE product_id = %s", (product_id,)
                    )

                    # Agregar nuevas tallas
                    for size_id in data["sizes"]:
                        if size_id:
                            cursor.execute(
                                "INSERT INTO product_sizes (product_id, size_id) VALUES (%s, %s)",
                                (product_id, size_id),
                            )
                    print(f"✅ Tallas actualizadas para producto {product_id}")

                # 5. Actualizar stock por variantes si se proporciona
                if "stock_variants" in data and data["stock_variants"]:
                    print(
                        f"🔄 Procesando {len(data['stock_variants'])} variantes de stock"
                    )

                    for variant in data["stock_variants"]:
                        # Usar branch_id en lugar de sucursal_id para compatibilidad
                        branch_id = variant.get("sucursal_id") or variant.get(
                            "branch_id"
                        )

                        if (
                            all(key in variant for key in ["size_id", "color_id"])
                            and branch_id is not None
                        ):
                            # Verificar si es una variante nueva
                            if variant.get("is_new", False):
                                print(
                                    f"📦 Creando nueva variante: Talle {variant['size_id']}, Color {variant['color_id']}"
                                )

                                # Generar código de barras único si no se proporcionó
                                variant_barcode = variant.get("barcode")
                                if not variant_barcode:
                                    import time

                                    timestamp = str(int(time.time()))[-6:]
                                    product_prefix = str(product_id).zfill(4)
                                    size_code = str(variant["size_id"]).zfill(2)
                                    color_code = str(variant["color_id"]).zfill(2)
                                    variant_barcode = f"{product_prefix}{size_code}{color_code}{timestamp}"

                                # Insertar nueva variante
                                cursor.execute(
                                    """
                                    INSERT INTO warehouse_stock_variants 
                                    (product_id, size_id, color_id, branch_id, quantity, variant_barcode, last_updated)
                                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                                """,
                                    (
                                        product_id,
                                        variant["size_id"],
                                        variant["color_id"],
                                        branch_id,
                                        variant.get("quantity", 0),
                                        variant_barcode,
                                        datetime.now().isoformat(),
                                    ),
                                )

                                print(
                                    f"✅ Nueva variante creada: Talle {variant['size_id']}, Color {variant['color_id']}, Barcode: {variant_barcode}"
                                )
                            else:
                                # Actualizar variante existente
                                cursor.execute(
                                    """
                                    UPDATE warehouse_stock_variants 
                                    SET quantity = %s, last_updated = %s
                                    WHERE product_id = %s AND size_id = %s AND color_id = %s AND branch_id = %s
                                """,
                                    (
                                        variant.get("quantity", 0),
                                        datetime.now().isoformat(),
                                        product_id,
                                        variant["size_id"],
                                        variant["color_id"],
                                        branch_id,
                                    ),
                                )

                                if cursor.rowcount > 0:
                                    print(
                                        f"✅ Variante actualizada: Talle {variant['size_id']}, Color {variant['color_id']}, Cantidad: {variant.get('quantity', 0)}"
                                    )
                                else:
                                    print(
                                        f"⚠️ No se encontró variante para actualizar: Talle {variant['size_id']}, Color {variant['color_id']}"
                                    )
                        else:
                            print(f"⚠️ Variante incompleta: {variant}")

                    # 🔄 SINCRONIZAR WAREHOUSE_STOCK CON LAS VARIANTES ACTUALIZADAS
                    print(
                        f"🔄 Sincronizando warehouse_stock para producto {product_id}"
                    )

                    # Obtener todos los branch_ids que tienen variantes de este producto
                    cursor.execute(
                        """
                        SELECT DISTINCT branch_id 
                        FROM warehouse_stock_variants 
                        WHERE product_id = %s
                        """,
                        (product_id,),
                    )

                    affected_branches = cursor.fetchall()

                    for branch_row in affected_branches:
                        branch_id = branch_row[0]

                        # Calcular la suma total de variantes para este producto en esta sucursal
                        cursor.execute(
                            """
                            SELECT COALESCE(SUM(quantity), 0) as total_quantity
                            FROM warehouse_stock_variants 
                            WHERE product_id = %s AND branch_id = %s
                            """,
                            (product_id, branch_id),
                        )

                        total_result = cursor.fetchone()
                        total_quantity = total_result[0] if total_result else 0

                        print(
                            f"📊 Sucursal {branch_id}: Total calculado = {total_quantity}"
                        )

                        # Verificar si existe registro en warehouse_stock
                        cursor.execute(
                            """
                            SELECT id FROM warehouse_stock 
                            WHERE product_id = %s AND branch_id = %s
                            """,
                            (product_id, branch_id),
                        )

                        existing_stock = cursor.fetchone()

                        if existing_stock:
                            # Actualizar cantidad existente
                            cursor.execute(
                                """
                                UPDATE warehouse_stock 
                                SET quantity = %s, last_updated = %s
                                WHERE product_id = %s AND branch_id = %s
                                """,
                                (
                                    total_quantity,
                                    datetime.now().isoformat(),
                                    product_id,
                                    branch_id,
                                ),
                            )
                            print(
                                f"✅ warehouse_stock actualizado: producto {product_id}, sucursal {branch_id}, cantidad {total_quantity}"
                            )
                        else:
                            # Crear nuevo registro si no existe
                            cursor.execute(
                                """
                                INSERT INTO warehouse_stock (product_id, branch_id, quantity, last_updated)
                                VALUES (%s, %s, %s, %s)
                                """,
                                (
                                    product_id,
                                    branch_id,
                                    total_quantity,
                                    datetime.now().isoformat(),
                                ),
                            )
                            print(
                                f"✅ warehouse_stock creado: producto {product_id}, sucursal {branch_id}, cantidad {total_quantity}"
                            )

                # Confirmar transacción
                conn.commit()

                # 6. Obtener datos actualizados del producto para devolver
                cursor.execute(
                    """
                    SELECT p.*, b.brand_name 
                    FROM products p 
                    LEFT JOIN brands b ON p.brand_id = b.id 
                    WHERE p.id = %s
                """,
                    (product_id,),
                )

                updated_product = cursor.fetchone()

                # Convertir a diccionario
                if updated_product:
                    columns = [desc[0] for desc in cursor.description]
                    updated_product_dict = dict(zip(columns, updated_product))
                else:
                    updated_product_dict = None

                return jsonify(
                    {
                        "status": "success",
                        "message": "Producto actualizado correctamente",
                        "data": updated_product_dict,
                    }
                ), 200

            except Exception as e:
                conn.rollback()
                print(f"❌ Error en transacción: {e}")
                raise e

    except Exception as e:
        print(f"❌ Error actualizando producto {product_id}: {str(e)}")
        import traceback

        traceback.print_exc()
        return jsonify({"status": "error", "message": f"Error interno: {str(e)}"}), 500
