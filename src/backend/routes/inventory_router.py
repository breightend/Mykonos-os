from flask import Blueprint, request, jsonify
from database.database import Database
from datetime import datetime
import traceback

inventory_router = Blueprint("inventory_router", __name__)


@inventory_router.route("/products-by-state", methods=["GET"])
def get_products_by_state():
    """
    Obtiene productos agrupados por estado (esperandoArribo, enTienda, sinStock)
    """
    try:
        state_filter = request.args.get("state")  # Optional filter
        
        db = Database()
        
        if state_filter:
            # Filter by specific state
            query = """
            SELECT 
                p.id,
                p.product_name,
                p.state,
                b.brand_name,
                g.group_name,
                p.cost,
                p.sale_price,
                p.last_modified_date,
                COALESCE(SUM(ws.quantity), 0) as stock_total
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN groups g ON p.group_id = g.id
            LEFT JOIN warehouse_stock ws ON p.id = ws.product_id
            WHERE p.state = %s
            GROUP BY p.id, p.product_name, p.state, b.brand_name, g.group_name, p.cost, p.sale_price, p.last_modified_date
            ORDER BY p.last_modified_date DESC
            """
            products = db.execute_query(query, (state_filter,))
        else:
            # Get all products with their states
            query = """
            SELECT 
                p.id,
                p.product_name,
                p.state,
                b.brand_name,
                g.group_name,
                p.cost,
                p.sale_price,
                p.last_modified_date,
                COALESCE(SUM(ws.quantity), 0) as stock_total
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN groups g ON p.group_id = g.id
            LEFT JOIN warehouse_stock ws ON p.id = ws.product_id
            GROUP BY p.id, p.product_name, p.state, b.brand_name, g.group_name, p.cost, p.sale_price, p.last_modified_date
            ORDER BY p.state, p.last_modified_date DESC
            """
            products = db.execute_query(query)
        
        # Group by state for better organization
        grouped_results = {
            "esperandoArribo": [],
            "enTienda": [],
            "sinStock": [],
            "activo": []  # For legacy products
        }
        
        for product in products:
            state = product.get("state", "activo")
            if state not in grouped_results:
                grouped_results[state] = []
            
            grouped_results[state].append({
                "id": product["id"],
                "product_name": product["product_name"],
                "brand_name": product.get("brand_name"),
                "group_name": product.get("group_name"),
                "cost": product.get("cost"),
                "sale_price": product.get("sale_price"),
                "stock_total": product.get("stock_total", 0),
                "last_modified_date": product.get("last_modified_date"),
                "state": state
            })
        
        # Count products by state
        state_counts = {state: len(products) for state, products in grouped_results.items()}
        
        return jsonify({
            "status": "success",
            "products_by_state": grouped_results,
            "state_counts": state_counts
        }), 200

    except Exception as e:
        print(f"Error getting products by state: {e}")
        traceback.print_exc()
        return jsonify({"status": "error", "message": "Error interno del servidor"}), 500


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
            # Productos de una sucursal específica - INCLUDES BOTH TRADITIONAL AND VARIANT STOCK
            query = """
            SELECT 
                p.id,
                COALESCE(p.product_name, 'Sin nombre') as producto,
                COALESCE(b.brand_name, 'Sin marca') as marca,
                COALESCE(
                    COALESCE(SUM(ws.quantity), 0) + COALESCE(SUM(wsv.quantity), 0), 
                    0
                ) as cantidad_total,
                COALESCE(p.last_modified_date, NOW()) as fecha_edicion,
                COUNT(DISTINCT COALESCE(ws.branch_id, wsv.branch_id)) as sucursales_con_stock,
                COALESCE(g.group_name, 'Sin grupo') as grupo,
                p.group_id,
                p.sale_price,
                p.state
            FROM products p
            LEFT JOIN warehouse_stock ws ON p.id = ws.product_id AND ws.branch_id = %s
            LEFT JOIN warehouse_stock_variants wsv ON p.id = wsv.product_id AND wsv.branch_id = %s
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN groups g ON p.group_id = g.id
            WHERE (ws.product_id IS NOT NULL OR wsv.product_id IS NOT NULL)
            GROUP BY p.id, p.product_name, b.brand_name, p.last_modified_date, g.group_name, p.group_id, p.sale_price, p.state
            ORDER BY p.product_name
            """
            products = db.execute_query(query, (storage_id, storage_id))
        else:
            # Todos los productos con su cantidad total - INCLUDES BOTH TRADITIONAL AND VARIANT STOCK
            query = """
            SELECT 
                p.id,
                COALESCE(p.product_name, 'Sin nombre') as producto,
                COALESCE(b.brand_name, 'Sin marca') as marca,
                COALESCE(
                    COALESCE(SUM(ws.quantity), 0) + COALESCE(SUM(wsv.quantity), 0), 
                    0
                ) as cantidad_total,
                COALESCE(p.last_modified_date, NOW()) as fecha_edicion,
                COUNT(DISTINCT COALESCE(ws.branch_id, wsv.branch_id)) as sucursales_con_stock,
                COALESCE(g.group_name, 'Sin grupo') as grupo,
                p.group_id,
                p.sale_price,
                p.state
            FROM products p
            LEFT JOIN warehouse_stock ws ON p.id = ws.product_id
            LEFT JOIN warehouse_stock_variants wsv ON p.id = wsv.product_id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN groups g ON p.group_id = g.id
            WHERE (ws.product_id IS NOT NULL OR wsv.product_id IS NOT NULL)
            GROUP BY p.id, p.product_name, b.brand_name, p.last_modified_date, g.group_name, p.group_id, p.sale_price, p.state
            ORDER BY p.product_name
            """
            products = db.execute_query(query)

        print(f"🔍 DEBUG products-summary: {len(products)} productos encontrados")
        print(f"🔍 DEBUG products-summary: Tipo de resultado: {type(products)}")
        
        # Debug: show first few products
        if products:
            print(f"🔍 DEBUG products-summary: Primeros productos:")
            for i, p in enumerate(products[:3]):
                if isinstance(p, dict):
                    print(f"  {i+1}. ID: {p.get('id')}, Nombre: {p.get('producto')}, Stock: {p.get('cantidad_total')}, Estado: {p.get('state')}")
                else:
                    print(f"  {i+1}. ID: {p[0]}, Nombre: {p[1]}, Stock: {p[3]}, Estado: {p[9] if len(p) > 9 else 'N/A'}")
        else:
            print("🔍 DEBUG products-summary: ¡No se encontraron productos!")

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
        INSERT INTO inventory_movements_groups 
        (origin_branch_id, destination_branch_id, status, movement_type, created_by_user_id, notes)
        VALUES (%s, %s, 'empacado', 'transfer', %s, %s)
        RETURNING id
        """
        group_result = db.execute_query(
            group_query, (from_storage_id, to_storage_id, user_id, notes)
        )

        if not group_result:
            return jsonify(
                {"status": "error", "message": "Error al crear el grupo de movimiento"}
            ), 500

        group_id = group_result[0]["id"]

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
            WHERE product_id = %s AND branch_id = %s
            """
            stock_result = db.execute_query(stock_query, (product_id, from_storage_id))

            if not stock_result or stock_result[0]["quantity"] < quantity:
                return jsonify(
                    {
                        "status": "error",
                        "message": f"Stock insuficiente para el producto ID {product_id}",
                    }
                ), 400

            # Obtener precio del producto
            price_query = "SELECT sale_price FROM products WHERE id = %s"
            price_result = db.execute_query(price_query, (product_id,))
            unit_price = price_result[0]["sale_price"] if price_result else 0

            subtotal = float(unit_price) * int(quantity)
            total_movement_value += subtotal

            # Insertar el movimiento individual
            movement_query = """
            INSERT INTO inventory_movements 
            (inventory_movements_group_id, product_id, quantity, discount, subtotal, total)
            VALUES (%s, %s, %s, 0.0, %s, %s)
            """
            db.execute_query(
                movement_query, (group_id, product_id, quantity, subtotal, subtotal)
            )

            # Actualizar stock en sucursal origen (restar)
            update_origin_query = """
            UPDATE warehouse_stock 
            SET quantity = quantity - %s, last_updated = NOW()
            WHERE product_id = %s AND branch_id = %s
            """
            db.execute_query(
                update_origin_query, (quantity, product_id, from_storage_id)
            )

            # Verificar si existe stock en sucursal destino
            dest_stock_query = """
            SELECT id FROM warehouse_stock 
            WHERE product_id = %s AND branch_id = %s
            """
            dest_stock = db.execute_query(dest_stock_query, (product_id, to_storage_id))

            if dest_stock:
                # Actualizar stock existente en destino (sumar)
                update_dest_query = """
                UPDATE warehouse_stock 
                SET quantity = quantity + %s, last_updated = NOW()
                WHERE product_id = %s AND branch_id = %s
                """
                db.execute_query(
                    update_dest_query, (quantity, product_id, to_storage_id)
                )
            else:
                # Crear nuevo registro de stock en destino
                insert_dest_query = """
                INSERT INTO warehouse_stock (product_id, branch_id, quantity, last_updated)
                VALUES (%s, %s, %s, NOW())
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


@inventory_router.route("/variant-movements", methods=["POST"])
def create_variant_movement():
    """
    Crea un nuevo movimiento de inventario entre sucursales basado en variantes específicas
    """
    try:
        data = request.get_json()
        from_storage_id = data.get("from_storage_id")
        to_storage_id = data.get("to_storage_id")
        variants = data.get("variants", [])
        notes = data.get("notes", "")
        user_id = data.get("user_id")

        print(
            f"🚚 Creando movimiento de variantes desde {from_storage_id} hacia {to_storage_id}"
        )
        print(f"📦 Variantes a mover: {len(variants)}")

        if not from_storage_id or not to_storage_id or not variants:
            return jsonify(
                {
                    "status": "error",
                    "message": "Faltan datos requeridos: from_storage_id, to_storage_id, variants",
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

        # Crear el grupo de movimiento - FIXED: handle PostgreSQL transaction properly
        group_query = """
        INSERT INTO inventory_movements_groups 
        (origin_branch_id, destination_branch_id, status, movement_type, created_by_user_id, notes)
        VALUES (%s, %s, 'empacado', 'variant_transfer', %s, %s)
        """
        try:
            # Execute the INSERT without RETURNING (since execute_query doesn't handle it properly)
            db.execute_query(
                group_query, (from_storage_id, to_storage_id, user_id, notes)
            )

            # Get the last inserted ID separately
            last_id_query = """
            SELECT id FROM inventory_movements_groups 
            WHERE origin_branch_id = %s AND destination_branch_id = %s 
            AND created_by_user_id = %s AND notes = %s
            ORDER BY id DESC LIMIT 1
            """
            group_result = db.execute_query(
                last_id_query, (from_storage_id, to_storage_id, user_id, notes)
            )
            print(f"🔍 DEBUG group_result: {group_result}, tipo: {type(group_result)}")
        except Exception as e:
            print(f"❌ Error creating movement group: {e}")
            import traceback

            traceback.print_exc()
            return jsonify(
                {
                    "status": "error",
                    "message": f"Error al crear el grupo de movimiento: {str(e)}",
                }
            ), 500

        if not group_result:
            return jsonify(
                {
                    "status": "error",
                    "message": "Error al crear el grupo de movimiento - no se pudo obtener ID",
                }
            ), 500

        # Handle both dict and tuple result formats
        if isinstance(group_result[0], dict):
            group_id = group_result[0]["id"]
        else:
            group_id = group_result[0][0]
        print(f"✅ Grupo de movimiento creado con ID: {group_id}")

        total_movement_value = 0

        # Procesar cada variante
        for variant in variants:
            variant_id = variant.get("variant_id")
            product_id = variant.get("product_id")
            size_id = variant.get("size_id")
            color_id = variant.get("color_id")
            quantity = variant.get("quantity")

            print(
                f"🔄 Procesando variante: ID={variant_id}, Producto={product_id}, Cantidad={quantity}"
            )

            if not variant_id or not product_id or not quantity or quantity <= 0:
                print(f"⚠️ Variante incompleta, saltando...")
                continue

            # Verificar stock disponible de la variante en sucursal origen
            stock_query = """
            SELECT quantity FROM warehouse_stock_variants 
            WHERE id = %s AND branch_id = %s
            """
            try:
                stock_result = db.execute_query(
                    stock_query, (variant_id, from_storage_id)
                )
                print(
                    f"🔍 DEBUG stock_result: {stock_result}, tipo: {type(stock_result)}"
                )
            except Exception as e:
                print(f"❌ Error checking stock: {e}")
                import traceback

                traceback.print_exc()
                return jsonify(
                    {
                        "status": "error",
                        "message": f"Error al verificar stock: {str(e)}",
                    }
                ), 500

            if not stock_result:
                return jsonify(
                    {
                        "status": "error",
                        "message": f"Variante ID {variant_id} no encontrada en sucursal {from_storage_id}",
                    }
                ), 400

            # Handle both dict and tuple result formats
            if isinstance(stock_result[0], dict):
                current_stock = stock_result[0]["quantity"]
            else:
                current_stock = stock_result[0][0]

            if current_stock < quantity:
                return jsonify(
                    {
                        "status": "error",
                        "message": f"Stock insuficiente para la variante ID {variant_id}. Disponible: {current_stock}, Solicitado: {quantity}",
                    }
                ), 400

            # Obtener precio del producto
            price_query = "SELECT sale_price FROM products WHERE id = %s"
            try:
                price_result = db.execute_query(price_query, (product_id,))
                print(
                    f"🔍 DEBUG price_result: {price_result}, tipo: {type(price_result)}"
                )
            except Exception as e:
                print(f"❌ Error getting price: {e}")
                import traceback

                traceback.print_exc()
                return jsonify(
                    {"status": "error", "message": f"Error al obtener precio: {str(e)}"}
                ), 500

            # Handle both dict and tuple result formats
            if price_result:
                if isinstance(price_result[0], dict):
                    unit_price = price_result[0]["sale_price"]
                else:
                    unit_price = price_result[0][0]
            else:
                unit_price = 0

            subtotal = float(unit_price) * int(quantity)
            total_movement_value += subtotal

            # Insertar el movimiento individual - FIXED: Incluir información de variante
            # Ahora que tenemos los campos en la DB, podemos almacenar la información completa
            variant_barcode = variant.get("variant_barcode", "")
            movement_query = """
            INSERT INTO inventory_movements 
            (inventory_movements_group_id, product_id, quantity, discount, subtotal, total, variant_id, size_id, color_id, variant_barcode)
            VALUES (%s, %s, %s, 0.0, %s, %s, %s, %s, %s, %s)
            """
            movement_result = db.execute_query(
                movement_query,
                (
                    group_id,
                    product_id,
                    quantity,
                    subtotal,
                    subtotal,
                    variant_id,
                    size_id,
                    color_id,
                    variant_barcode,
                ),
            )

            print(
                f"✅ Movimiento individual registrado para producto {product_id} (variante {variant_id})"
            )

            # Actualizar stock de variante en sucursal origen (restar)
            # SOLO reducir stock en origen - NO agregar en destino hasta confirmación
            update_origin_query = """
            UPDATE warehouse_stock_variants 
            SET quantity = quantity - %s, last_updated = NOW()
            WHERE id = %s AND branch_id = %s
            """
            db.execute_query(
                update_origin_query, (quantity, variant_id, from_storage_id)
            )
            print(f"✅ Stock reducido en origen para variante {variant_id}")

            # Actualizar también el stock general del producto (warehouse_stock)
            # SOLO restar en origen - NO agregar en destino hasta confirmación
            general_stock_origin = """
            SELECT id FROM warehouse_stock WHERE product_id = %s AND branch_id = %s
            """
            origin_stock = db.execute_query(
                general_stock_origin, (product_id, from_storage_id)
            )

            if origin_stock:
                db.execute_query(
                    """
                    UPDATE warehouse_stock 
                    SET quantity = quantity - %s, last_updated = NOW()
                    WHERE product_id = %s AND branch_id = %s
                """,
                    (quantity, product_id, from_storage_id),
                )
                print(f"✅ Stock general reducido en origen")

            # NOTA: El stock NO se agrega al destino aquí.
            # Solo se agregará cuando la sucursal destino confirme la recepción del envío.

        print(
            f"🎉 Movimiento completado exitosamente. Total de variantes: {len(variants)}"
        )

        return jsonify(
            {
                "status": "success",
                "message": "Movimiento de variantes creado exitosamente",
                "movement_id": group_id,
                "total_value": total_movement_value,
                "variants_moved": len(variants),
            }
        ), 201

    except Exception as e:
        print(f"❌ Error creando movimiento de variantes: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@inventory_router.route("/pending-shipments/<int:storage_id>", methods=["GET"])
def get_pending_shipments(storage_id):
    """
    Obtiene envíos pendientes que llegan a una sucursal específica
    """
    try:
        print(f"🔍 DEBUG get_pending_shipments: storage_id = {storage_id}")
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
        FROM inventory_movements_groups img
        JOIN storage so ON img.origin_branch_id = so.id
        JOIN storage sd ON img.destination_branch_id = sd.id
        LEFT JOIN inventory_movements im ON img.id = im.inventory_movements_group_id
        LEFT JOIN products p ON im.product_id = p.id
        WHERE img.destination_branch_id = %s 
        AND img.status IN ('empacado', 'en_transito')
        GROUP BY img.id, so.name, sd.name, img.status, img.created_at, img.shipped_at, img.delivered_at, img.notes
        ORDER BY img.created_at DESC
        """

        print(f"🔍 DEBUG get_pending_shipments: Ejecutando query...")
        shipments = db.execute_query(query, (storage_id,))
        print(
            f"🔍 DEBUG get_pending_shipments: Resultados = {len(shipments) if shipments else 0}"
        )

        if shipments:
            print("🔍 DEBUG get_pending_shipments: Envíos encontrados:")
            for ship in shipments:
                print(
                    f"  - ID: {ship['id']}, De: {ship['from_storage']} → A: {ship['to_storage']}, Estado: {ship['status']}"
                )
        else:
            print(
                f"🔍 DEBUG get_pending_shipments: No se encontraron envíos HACIA la sucursal {storage_id}"
            )
            print(
                "   Esto significa que no hay envíos de otras sucursales dirigidos a esta sucursal"
            )
            print(
                "   Para crear envíos de prueba, usa el botón '🧪 Test Data' en el frontend"
            )

        # Formatear resultados
        result = []
        for shipment in shipments:
            # Obtener productos detallados - FIXED: Usar misma lógica que sent-shipments
            # Ahora que inventory_movements tiene campos de variante, podemos obtener la información real
            products_query = """
            SELECT 
                p.product_name,
                p.sale_price,
                p.cost,
                b.brand_name,
                im.quantity,
                im.product_id,
                im.variant_id,
                s.size_name,
                c.color_name,
                c.color_hex,
                im.variant_barcode
            FROM inventory_movements im
            JOIN products p ON im.product_id = p.id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN warehouse_stock_variants wsv ON im.variant_id = wsv.id
            LEFT JOIN sizes s ON im.size_id = s.id OR wsv.size_id = s.id  
            LEFT JOIN colors c ON im.color_id = c.id OR wsv.color_id = c.id
            WHERE im.inventory_movements_group_id = %s
            """
            products = db.execute_query(products_query, (shipment["id"],))

            result.append(
                {
                    "id": shipment["id"],
                    "fromStorage": shipment["from_storage"],
                    "toStorage": shipment["to_storage"],
                    "status": shipment["status"],
                    "createdAt": shipment["created_at"].strftime("%Y-%m-%d")
                    if shipment["created_at"]
                    else None,
                    "shippedAt": shipment["shipped_at"].strftime("%Y-%m-%d")
                    if shipment["shipped_at"]
                    else None,
                    "deliveredAt": shipment["delivered_at"].strftime("%Y-%m-%d")
                    if shipment["delivered_at"]
                    else None,
                    "notes": shipment["notes"],
                    "products": [
                        {
                            "name": p["product_name"],
                            "quantity": p["quantity"],
                            "product_id": p["product_id"],
                            "variant_id": p["variant_id"],
                            "brand": p["brand_name"],
                            "sale_price": float(p["sale_price"])
                            if p["sale_price"]
                            else 0,
                            "cost": float(p["cost"]) if p["cost"] else 0,
                            "size": p["size_name"],
                            "color": p["color_name"],
                            "color_hex": p["color_hex"],
                            "variant_barcode": p["variant_barcode"],
                        }
                        for p in products
                    ],
                }
            )

        return jsonify({"status": "success", "data": result}), 200

    except Exception as e:
        print(f"❌ Error en get_pending_shipments: {e}")
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@inventory_router.route("/create-test-shipments", methods=["POST"])
def create_test_shipments():
    """
    Crea envíos de prueba para testing (temporal)
    """
    try:
        print("🧪 Creando envíos de prueba...")
        db = Database()

        # Verificar sucursales
        storages = db.execute_query("SELECT id, name FROM storage ORDER BY id LIMIT 3")
        if len(storages) < 2:
            return jsonify(
                {"status": "error", "message": "Se necesitan al menos 2 sucursales"}
            ), 400

        # Verificar productos
        products = db.execute_query("SELECT id, product_name FROM products LIMIT 5")
        if len(products) == 0:
            return jsonify(
                {"status": "error", "message": "No hay productos en la base de datos"}
            ), 400

        # Crear envío de prueba: Sucursal 1 → Sucursal 2 (EMPACADO)
        insert_group_query = """
        INSERT INTO inventory_movements_groups 
        (origin_branch_id, destination_branch_id, status, created_at, user_id)
        VALUES (%s, %s, %s, NOW(), %s)
        """

        db.execute_query(insert_group_query, (1, 2, "empacado", 1))

        # Obtener el ID del grupo recién creado
        group_id_query = """
        SELECT id FROM inventory_movements_groups 
        WHERE origin_branch_id = %s AND destination_branch_id = %s 
        ORDER BY created_at DESC LIMIT 1
        """
        group_result = db.execute_query(group_id_query, (1, 2))

        if group_result:
            group_id = group_result[0]["id"]
            print(
                f"✅ Grupo empacado creado con ID: {group_id} (Sucursal 1 → Sucursal 2)"
            )

            # Insertar movimientos individuales
            insert_movement_query = """
            INSERT INTO inventory_movements 
            (inventory_movements_group_id, product_id, quantity, movement_type, created_at)
            VALUES (%s, %s, %s, %s, NOW())
            """

            for i, product in enumerate(products[:2]):  # Solo 2 productos
                quantity = (i + 1) * 2  # 2, 4
                db.execute_query(
                    insert_movement_query,
                    (group_id, product["id"], quantity, "transfer"),
                )
                print(f"  - Movimiento: {product['product_name']} x{quantity}")

        # Crear segundo envío: Sucursal 1 → Sucursal 2 (EN_TRANSITO)
        db.execute_query(insert_group_query, (1, 2, "en_transito", 1))
        group_result2 = db.execute_query(group_id_query, (1, 2))

        if group_result2:
            group_id2 = group_result2[0]["id"]
            print(
                f"✅ Grupo en tránsito creado con ID: {group_id2} (Sucursal 1 → Sucursal 2)"
            )

            if len(products) > 2:
                db.execute_query(
                    insert_movement_query, (group_id2, products[2]["id"], 3, "transfer")
                )
                print(f"  - Movimiento: {products[2]['product_name']} x3")

        # También crear envíos hacia la sucursal 1 para pruebas completas
        db.execute_query(insert_group_query, (2, 1, "empacado", 1))
        group_result3 = db.execute_query(group_id_query, (2, 1))

        if group_result3:
            group_id3 = group_result3[0]["id"]
            print(
                f"✅ Grupo adicional creado con ID: {group_id3} (Sucursal 2 → Sucursal 1)"
            )

            if len(products) > 3:
                db.execute_query(
                    insert_movement_query, (group_id3, products[3]["id"], 1, "transfer")
                )
                print(f"  - Movimiento: {products[3]['product_name']} x1")

        return jsonify(
            {
                "status": "success",
                "message": "Envíos de prueba creados exitosamente",
                "data": {
                    "groups_created": 3,
                    "movements_created": 4,
                    "description": "Creados envíos bidireccionales para pruebas completas",
                },
            }
        ), 200

    except Exception as e:
        print(f"❌ Error creando envíos de prueba: {e}")
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@inventory_router.route("/sent-shipments/<int:storage_id>", methods=["GET"])
def get_sent_shipments(storage_id):
    """
    Obtiene envíos realizados desde una sucursal específica
    """
    try:
        print(f"🔍 DEBUG get_sent_shipments: storage_id = {storage_id}")
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
        FROM inventory_movements_groups img
        JOIN storage so ON img.origin_branch_id = so.id
        JOIN storage sd ON img.destination_branch_id = sd.id
        WHERE img.origin_branch_id = %s
        ORDER BY img.created_at DESC
        """

        print(f"🔍 DEBUG get_sent_shipments: Ejecutando query principal...")
        shipments = db.execute_query(query, (storage_id,))
        print(
            f"🔍 DEBUG get_sent_shipments: Resultados = {len(shipments) if shipments else 0}"
        )

        # Formatear resultados
        result = []
        for shipment in shipments:
            print(
                f"🔍 DEBUG get_sent_shipments: Procesando shipment ID = {shipment['id']}"
            )
            # Obtener productos detallados - FIXED: Usar nombres correctos de columnas
            products_query = """
            SELECT 
                p.product_name,
                p.sale_price,
                p.cost,
                b.brand_name,
                im.quantity,
                im.product_id,
                im.variant_id,
                s.size_name,
                c.color_name,
                c.color_hex,
                im.variant_barcode
            FROM inventory_movements im
            JOIN products p ON im.product_id = p.id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN warehouse_stock_variants wsv ON im.variant_id = wsv.id
            LEFT JOIN sizes s ON im.size_id = s.id OR wsv.size_id = s.id  
            LEFT JOIN colors c ON im.color_id = c.id OR wsv.color_id = c.id
            WHERE im.inventory_movements_group_id = %s
            """
            products = db.execute_query(products_query, (shipment["id"],))
            print(
                f"🔍 DEBUG get_sent_shipments: Productos = {len(products) if products else 0}"
            )

            result.append(
                {
                    "id": shipment["id"],
                    "fromStorage": shipment["from_storage"],
                    "toStorage": shipment["to_storage"],
                    "status": shipment["status"],
                    "createdAt": shipment["created_at"].strftime("%Y-%m-%d")
                    if shipment["created_at"]
                    else None,
                    "shippedAt": shipment["shipped_at"].strftime("%Y-%m-%d")
                    if shipment["shipped_at"]
                    else None,
                    "deliveredAt": shipment["delivered_at"].strftime("%Y-%m-%d")
                    if shipment["delivered_at"]
                    else None,
                    "notes": shipment["notes"],
                    "products": [
                        {
                            "name": p["product_name"],
                            "quantity": p["quantity"],
                            "product_id": p["product_id"],
                            "variant_id": p["variant_id"],
                            "brand": p["brand_name"],
                            "sale_price": float(p["sale_price"])
                            if p["sale_price"]
                            else 0,
                            "cost": float(p["cost"]) if p["cost"] else 0,
                            "size": p["size_name"],
                            "color": p["color_name"],
                            "color_hex": p["color_hex"],
                            "variant_barcode": p["variant_barcode"],
                        }
                        for p in products
                    ],
                }
            )

        print(f"🔍 DEBUG get_sent_shipments: Total resultados = {len(result)}")
        return jsonify({"status": "success", "data": result}), 200

    except Exception as e:
        print(f"❌ Error en get_sent_shipments: {e}")
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@inventory_router.route("/shipments/<int:shipment_id>/status", methods=["PUT"])
def update_shipment_status(shipment_id):
    """
    Actualiza el estado de un envío
    Cuando el estado cambia a 'recibido', transfiere el stock al destino
    """
    try:
        data = request.get_json()
        new_status = data.get("status")
        user_id = data.get("user_id")  # Se debería obtener del token de sesión

        print(f"🔄 Actualizando estado de envío {shipment_id} a '{new_status}'")

        valid_statuses = [
            "empacado",
            "en_transito",
            "entregado",
            "recibido",
            "cancelado",
            "retomado",
        ]
        if new_status not in valid_statuses:
            return jsonify(
                {
                    "status": "error",
                    "message": f"Estado inválido. Estados válidos: {', '.join(valid_statuses)}",
                }
            ), 400

        db = Database()

        # Obtener información del envío antes de actualizar
        shipment_query = """
        SELECT origin_branch_id, destination_branch_id, status
        FROM inventory_movements_groups 
        WHERE id = %s
        """
        shipment_info = db.execute_query(shipment_query, (shipment_id,))

        if not shipment_info:
            return jsonify({"status": "error", "message": "Envío no encontrado"}), 404

        origin_branch_id = shipment_info[0]["origin_branch_id"]
        destination_branch_id = shipment_info[0]["destination_branch_id"]
        current_status = shipment_info[0]["status"]

        print(
            f"📦 Envío: Origen={origin_branch_id}, Destino={destination_branch_id}, Estado actual='{current_status}'"
        )

        # Preparar campos de fecha según el nuevo estado
        date_field = None
        if new_status == "en_transito":
            date_field = "shipped_at"
        elif new_status == "entregado":
            date_field = "delivered_at"
        elif new_status == "recibido":
            date_field = "received_at"
        elif new_status == "no_recibido":
            date_field = (
                "received_at"  # También registrar cuando se marcó como no recibido
            )

        # Construir query de actualización
        if date_field:
            query = f"""
            UPDATE inventory_movements_groups 
            SET status = %s, {date_field} = NOW(), 
                updated_at = NOW(), updated_by_user_id = %s
            WHERE id = %s
            """
            params = (new_status, user_id, shipment_id)
        else:
            query = """
            UPDATE inventory_movements_groups 
            SET status = %s, updated_at = NOW(), updated_by_user_id = %s
            WHERE id = %s
            """
            params = (new_status, user_id, shipment_id)

        db.execute_query(query, params)
        print(f"✅ Estado actualizado a '{new_status}'")

        # LÓGICA ESPECIAL: Si el estado cambia a "recibido", transferir stock al destino
        if new_status == "recibido":
            print("🚚 Iniciando transferencia de stock al destino...")

            # Obtener todos los movimientos del grupo
            movements_query = """
            SELECT 
                im.product_id,
                im.quantity,
                wsv.id as variant_id,
                wsv.size_id,
                wsv.color_id,
                wsv.variant_barcode
            FROM inventory_movements im
            LEFT JOIN warehouse_stock_variants wsv ON im.product_id = wsv.product_id 
                AND wsv.branch_id = %s
            WHERE im.inventory_movements_group_id = %s
            """
            movements = db.execute_query(
                movements_query, (origin_branch_id, shipment_id)
            )

            for movement in movements:
                product_id = movement["product_id"]
                quantity = movement["quantity"]
                size_id = movement["size_id"]
                color_id = movement["color_id"]
                variant_barcode = movement["variant_barcode"]

                print(f"🔄 Transfiriendo producto {product_id}, cantidad {quantity}")

                # Verificar si existe la misma variante en sucursal destino
                dest_variant_query = """
                SELECT id FROM warehouse_stock_variants 
                WHERE product_id = %s AND size_id = %s AND color_id = %s AND branch_id = %s
                """
                dest_variant = db.execute_query(
                    dest_variant_query,
                    (product_id, size_id, color_id, destination_branch_id),
                )

                if dest_variant:
                    # Actualizar stock existente en destino (sumar)
                    update_dest_query = """
                    UPDATE warehouse_stock_variants 
                    SET quantity = quantity + %s, last_updated = NOW()
                    WHERE product_id = %s AND size_id = %s AND color_id = %s AND branch_id = %s
                    """
                    db.execute_query(
                        update_dest_query,
                        (
                            quantity,
                            product_id,
                            size_id,
                            color_id,
                            destination_branch_id,
                        ),
                    )
                    print("✅ Stock de variante actualizado en destino")
                else:
                    # Crear nuevo registro de variante en destino
                    # Si no tiene barcode, generar uno nuevo
                    if not variant_barcode:
                        try:
                            from services.barcode_service import BarcodeService

                            barcode_service = BarcodeService()
                            variant_barcode = barcode_service.generate_variant_barcode(
                                product_id, size_id, color_id
                            )
                        except Exception as e:
                            print(f"⚠️ Error generando código de barras: {e}")
                            variant_barcode = (
                                f"VAR{product_id:04d}{size_id:03d}{color_id:03d}"
                            )

                    insert_dest_query = """
                    INSERT INTO warehouse_stock_variants 
                    (product_id, size_id, color_id, branch_id, quantity, variant_barcode, last_updated)
                    VALUES (%s, %s, %s, %s, %s, %s, NOW())
                    """
                    db.execute_query(
                        insert_dest_query,
                        (
                            product_id,
                            size_id,
                            color_id,
                            destination_branch_id,
                            quantity,
                            variant_barcode,
                        ),
                    )
                    print("✅ Nueva variante creada en destino")

                # Actualizar también el stock general del producto (warehouse_stock)
                general_stock_dest = """
                SELECT id FROM warehouse_stock WHERE product_id = %s AND branch_id = %s
                """
                dest_stock = db.execute_query(
                    general_stock_dest, (product_id, destination_branch_id)
                )

                if dest_stock:
                    db.execute_query(
                        """
                        UPDATE warehouse_stock 
                        SET quantity = quantity + %s, last_updated = NOW()
                        WHERE product_id = %s AND branch_id = %s
                    """,
                        (quantity, product_id, destination_branch_id),
                    )
                    print("✅ Stock general aumentado en destino")
                else:
                    db.execute_query(
                        """
                        INSERT INTO warehouse_stock (product_id, branch_id, quantity, last_updated)
                        VALUES (%s, %s, %s, NOW())
                    """,
                        (product_id, destination_branch_id, quantity),
                    )
                    print("✅ Nuevo stock general creado en destino")

            print("🎉 Transferencia de stock completada")

        # LÓGICA ESPECIAL: Si el estado cambia a "cancelado", devolver stock al origen
        elif new_status == "cancelado":
            print("↩️ Iniciando devolución de stock al origen...")

            # Obtener todos los movimientos del grupo para devolverlos
            movements_query = """
            SELECT 
                im.product_id,
                im.quantity
            FROM inventory_movements im
            WHERE im.inventory_movements_group_id = %s
            """
            movements = db.execute_query(movements_query, (shipment_id,))

            for movement in movements:
                product_id = movement["product_id"]
                quantity = movement["quantity"]

                print(f"🔄 Devolviendo producto {product_id}, cantidad {quantity}")

                # Devolver stock general al origen
                origin_stock_query = """
                SELECT id FROM warehouse_stock WHERE product_id = %s AND branch_id = %s
                """
                origin_stock = db.execute_query(
                    origin_stock_query, (product_id, origin_branch_id)
                )

                if origin_stock:
                    db.execute_query(
                        """
                        UPDATE warehouse_stock 
                        SET quantity = quantity + %s, last_updated = NOW()
                        WHERE product_id = %s AND branch_id = %s
                    """,
                        (quantity, product_id, origin_branch_id),
                    )
                    print("✅ Stock general devuelto al origen")
                else:
                    db.execute_query(
                        """
                        INSERT INTO warehouse_stock (product_id, branch_id, quantity, last_updated)
                        VALUES (%s, %s, %s, NOW())
                    """,
                        (product_id, origin_branch_id, quantity),
                    )
                    print("✅ Nuevo stock general creado en origen")

            print("🎉 Devolución de stock completada")

        return jsonify(
            {"status": "success", "message": f"Estado actualizado a: {new_status}"}
        ), 200

    except Exception as e:
        print(f"❌ Error actualizando estado: {e}")
        import traceback

        traceback.print_exc()
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
            update_fields.append("description = %s")
            params.append(data["description"])

        if "comments" in data:
            update_fields.append("comments = %s")
            params.append(data["comments"])

        if "cost" in data:
            update_fields.append("cost = %s")
            params.append(float(data["cost"]))

        if "sale_price" in data:
            update_fields.append("sale_price = %s")
            params.append(float(data["sale_price"]))

        # Campos de descuento - los agregamos a la tabla products si no existen
        if "original_price" in data:
            update_fields.append("original_price = %s")
            params.append(float(data["original_price"]))

        if "discount_percentage" in data:
            update_fields.append("discount_percentage = %s")
            params.append(float(data["discount_percentage"]))

        if "discount_amount" in data:
            update_fields.append("discount_amount = %s")
            params.append(float(data["discount_amount"]))

        if "has_discount" in data:
            update_fields.append("has_discount = %s")
            params.append(1 if data["has_discount"] else 0)

        # Actualizar fecha de modificación
        update_fields.append("last_modified_date = CURRENT_TIMESTAMP")

        if update_fields:
            params.append(product_id)
            query = f"UPDATE products SET {', '.join(update_fields)} WHERE id = %s"

            print(f"🔍 Query de actualización: {query}")
            print(f"🔍 Parámetros: {params}")

            result = db.execute_query(query, params)

            if result is not None:
                print(f"✅ Producto actualizado exitosamente")
            else:
                return jsonify(
                    {"status": "error", "message": "Error actualizando producto"}
                ), 500

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
                    SET quantity = ?, last_updated = NOW()
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

                    if variant_result is not None:
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


@inventory_router.route("/product-detail/<int:product_id>", methods=["GET"])
def get_product_detail(product_id):
    """
    Obtiene los detalles completos de un producto específico
    """
    try:
        db = Database()

        query = """
        SELECT 
            p.id,
            p.product_name as name,
            p.sale_price,
            p.cost,
            p.description,
            p.creation_date,
            b.brand_name as brand,
            g.group_name as group_name
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN groups g ON p.group_id = g.id
        WHERE p.id = %s
        """

        result = db.execute_query(query, (product_id,))

        if result:
            product = result[0]
            return jsonify({"status": "success", "data": product}), 200
        else:
            return jsonify(
                {"status": "error", "message": "Producto no encontrado"}
            ), 404

    except Exception as e:
        print(f"❌ Error obteniendo detalles del producto {product_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@inventory_router.route("/product-variants/<int:product_id>", methods=["GET"])
def get_product_variants(product_id):
    """
    Obtiene todas las variantes (talle + color) de un producto con su stock
    Opcionalmente filtra por sucursal específica
    """
    try:
        db = Database()

        # Obtener parámetro opcional de sucursal
        storage_id = request.args.get("storage_id", type=int)

        print(f"🔍 Obteniendo variantes del producto {product_id}")
        if storage_id:
            print(f"📍 Filtrado por sucursal ID: {storage_id}")

        # Query base con filtro opcional por sucursal
        query = """
        SELECT 
            wsv.id,
            wsv.product_id,
            wsv.size_id,
            wsv.color_id,
            wsv.quantity,
            wsv.variant_barcode,
            s.size_name,
            c.color_name,
            c.color_hex,
            st.id as branch_id,
            st.name as branch_name
        FROM warehouse_stock_variants wsv
        JOIN products p ON wsv.product_id = p.id
        LEFT JOIN sizes s ON wsv.size_id = s.id
        LEFT JOIN colors c ON wsv.color_id = c.id
        LEFT JOIN storage st ON wsv.branch_id = st.id
        WHERE wsv.product_id = %s
        AND wsv.quantity > 0
        """

        params = [product_id]

        # Agregar filtro por sucursal si se especifica
        if storage_id:
            query += " AND wsv.branch_id = %s"
            params.append(storage_id)

        query += " ORDER BY s.size_name, c.color_name, st.name"

        variants = db.execute_query(query, tuple(params))

        print(f"✅ Encontradas {len(variants)} variantes")
        if storage_id:
            print(
                f"📍 Todas las variantes pertenecen a la sucursal: {variants[0]['branch_name'] if variants else 'N/A'}"
            )

        return jsonify({"status": "success", "data": variants}), 200

    except Exception as e:
        print(f"❌ Error obteniendo variantes del producto {product_id}: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@inventory_router.route("/print-barcodes", methods=["POST"])
def print_barcodes():
    """
    Procesa la impresión de códigos de barras para variantes específicas
    """
    try:
        data = request.get_json()
        product_id = data.get("productId")
        variants = data.get("variants", [])
        options = data.get("options", {})

        print(f"🖨️ Procesando impresión de códigos de barras para producto {product_id}")
        print(f"📦 Variantes: {len(variants)}")
        print(f"⚙️ Opciones: {options}")

        if not product_id or not variants:
            return jsonify(
                {
                    "status": "error",
                    "message": "Faltan datos requeridos: productId y variants",
                }
            ), 400

        db = Database()

        # Obtener información del producto
        product_query = """
        SELECT p.product_name, b.brand_name, p.sale_price
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE p.id = %s
        """
        product_info = db.execute_query(product_query, (product_id,))

        if not product_info:
            return jsonify(
                {"status": "error", "message": "Producto no encontrado"}
            ), 404

        product = product_info[0]

        # Procesar cada variante para impresión
        print_jobs = []
        total_labels = 0

        for variant_data in variants:
            variant_id = variant_data.get("variantId")
            quantity = variant_data.get("quantity", 1)

            # Obtener detalles de la variante
            variant_query = """
            SELECT 
                wsv.variant_barcode,
                s.size_name,
                c.color_name,
                c.color_hex
            FROM warehouse_stock_variants wsv
            LEFT JOIN sizes s ON wsv.size_id = s.id
            LEFT JOIN colors c ON wsv.color_id = c.id
            WHERE wsv.id = %s
            """
            variant_info = db.execute_query(variant_query, (variant_id,))

            if variant_info:
                variant = variant_info[0]

                # Construir texto para el código de barras según las opciones
                text_lines = []

                if options.get("includeProductName", True):
                    text_lines.append(product["product_name"])

                if options.get("includeSize", True) and variant["size_name"]:
                    text_lines.append(f"Talle: {variant['size_name']}")

                if options.get("includeColor", True) and variant["color_name"]:
                    text_lines.append(f"Color: {variant['color_name']}")

                if options.get("includePrice", True) and product["sale_price"]:
                    text_lines.append(f"${float(product['sale_price']):.2f}")

                if options.get("includeCode", True) and variant["variant_barcode"]:
                    text_lines.append(variant["variant_barcode"])

                # Generar código de barras si no existe
                barcode_code = variant["variant_barcode"]
                if not barcode_code:
                    # Generar código EAN13 válido
                    barcode_code = f"1{product_id:04d}{variant_id:04d}001"
                    # Asegurar que sea de 12 dígitos (EAN13 incluye dígito de control)
                    if len(barcode_code) < 12:
                        barcode_code = barcode_code.ljust(12, "0")
                else:
                    # Si el código existe pero contiene letras, convertir a numérico
                    if not barcode_code.isdigit():
                        # Convertir código alfanumérico a numérico usando hash
                        import hashlib

                        # Crear un hash numérico del código original
                        hash_obj = hashlib.md5(barcode_code.encode())
                        # Tomar los primeros 12 dígitos del hash hexadecimal convertido a decimal
                        hex_hash = hash_obj.hexdigest()[
                            :8
                        ]  # 8 caracteres hex = hasta 32 bits
                        numeric_hash = str(int(hex_hash, 16))[
                            :12
                        ]  # Convertir a decimal y tomar 12 dígitos
                        # Asegurar que tenga exactamente 12 dígitos
                        barcode_code = numeric_hash.ljust(12, "0")[:12]
                        print(
                            f"🔄 Código original '{variant['variant_barcode']}' convertido a numérico: '{barcode_code}'"
                        )

                print_job = {
                    "barcode": barcode_code,
                    "text": text_lines,
                    "quantity": quantity,
                }

                print_jobs.append(print_job)
                total_labels += quantity

                print(f"✅ Variante {variant_id}: {quantity} etiquetas preparadas")

        # Generar e imprimir códigos de barras usando BarcodeGenerator
        try:
            import sys
            import os

            # Agregar el directorio padre al path para importación
            backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            if backend_dir not in sys.path:
                sys.path.insert(0, backend_dir)

            from barcode_generator import BarcodeGenerator

            barcode_generator = BarcodeGenerator()
            all_generated_files = []

            for i, print_job in enumerate(print_jobs):
                # Obtener información de la variante correspondiente
                variant_data = variants[i] if i < len(variants) else {}
                variant_id = variant_data.get("variantId")

                # Obtener detalles adicionales de la variante si es necesario
                variant_details = {}
                if variant_id:
                    variant_query = """
                    SELECT s.size_name, c.color_name
                    FROM warehouse_stock_variants wsv
                    LEFT JOIN sizes s ON wsv.size_id = s.id
                    LEFT JOIN colors c ON wsv.color_id = c.id
                    WHERE wsv.id = %s
                    """
                    variant_result = db.execute_query(variant_query, (variant_id,))
                    if variant_result:
                        variant_details = variant_result[0]

                # Construir información del producto para el generador
                product_info = {
                    "name": product["product_name"],
                    "barcode": barcode_code,
                    "original_barcode": variant[
                        "variant_barcode"
                    ],  # Código original para mostrar
                    "price": product["sale_price"],
                    "size_name": variant_details.get("size_name"),
                    "color_name": variant_details.get("color_name"),
                }

                # Generar archivos de códigos de barras
                generated_files = barcode_generator.generate_barcode_with_text(
                    barcode_code,  # Usar el código numérico para EAN13
                    product_info,
                    options,
                    print_job["quantity"],
                )
                all_generated_files.extend(generated_files)

            # Imprimir todos los archivos
            print_result = barcode_generator.print_barcodes(all_generated_files)

            # Limpiar archivos temporales
            barcode_generator.cleanup_files(all_generated_files)

            if print_result["status"] == "success":
                return jsonify(
                    {
                        "status": "success",
                        "message": f"Se imprimieron {print_result['printed_count']} códigos de barras exitosamente",
                        "data": {
                            "product": product["product_name"],
                            "total_variants": len(print_jobs),
                            "total_labels": total_labels,
                            "printed_count": print_result["printed_count"],
                        },
                    }
                ), 200
            else:
                return jsonify(
                    {
                        "status": "error",
                        "message": f"Error en impresión: {print_result['message']}",
                    }
                ), 500

        except ImportError as e:
            print(f"❌ Error importando BarcodeGenerator: {e}")
            print("🔍 Intentando importación alternativa...")

            # Método alternativo de importación
            try:
                import importlib.util

                spec = importlib.util.spec_from_file_location(
                    "barcode_generator",
                    os.path.join(backend_dir, "barcode_generator.py"),
                )
                barcode_module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(barcode_module)
                BarcodeGenerator = barcode_module.BarcodeGenerator
                print("✅ Importación alternativa exitosa")

                # Continuar con el procesamiento normal
                barcode_generator = BarcodeGenerator()
                all_generated_files = []

                for i, print_job in enumerate(print_jobs):
                    # Obtener información de la variante correspondiente
                    variant_data = variants[i] if i < len(variants) else {}
                    variant_id = variant_data.get("variantId")

                    # Obtener detalles adicionales de la variante si es necesario
                    variant_details = {}
                    if variant_id:
                        variant_query = """
                        SELECT s.size_name, c.color_name
                        FROM warehouse_stock_variants wsv
                        LEFT JOIN sizes s ON wsv.size_id = s.id
                        LEFT JOIN colors c ON wsv.color_id = c.id
                        WHERE wsv.id = %s
                        """
                        variant_result = db.execute_query(variant_query, (variant_id,))
                        if variant_result:
                            variant_details = variant_result[0]

                    # Construir información del producto para el generador
                    product_info = {
                        "name": product["product_name"],
                        "barcode": print_job["barcode"],
                        "price": product["sale_price"],
                        "size_name": variant_details.get("size_name"),
                        "color_name": variant_details.get("color_name"),
                    }

                    # Generar archivos de códigos de barras
                    generated_files = barcode_generator.generate_barcode_with_text(
                        print_job["barcode"],
                        product_info,
                        options,
                        print_job["quantity"],
                    )
                    all_generated_files.extend(generated_files)

                # Imprimir todos los archivos
                print_result = barcode_generator.print_barcodes(all_generated_files)

                # Limpiar archivos temporales
                barcode_generator.cleanup_files(all_generated_files)

                if print_result["status"] == "success":
                    return jsonify(
                        {
                            "status": "success",
                            "message": f"Se imprimieron {print_result['printed_count']} códigos de barras exitosamente",
                            "data": {
                                "product": product["product_name"],
                                "total_variants": len(print_jobs),
                                "total_labels": total_labels,
                                "printed_count": print_result["printed_count"],
                            },
                        }
                    ), 200
                else:
                    return jsonify(
                        {
                            "status": "error",
                            "message": f"Error en impresión: {print_result['message']}",
                        }
                    ), 500

            except Exception as alt_error:
                print(f"❌ Importación alternativa también falló: {alt_error}")
                # Fallback - solo retornar información sin imprimir
                return jsonify(
                    {
                        "status": "success",
                        "message": f"Se procesaron {len(print_jobs)} variantes para imprimir {total_labels} etiquetas (modo simulación - error de importación)",
                        "data": {
                            "product": product["product_name"],
                            "total_variants": len(print_jobs),
                            "total_labels": total_labels,
                            "print_jobs": print_jobs,
                        },
                    }
                ), 200

    except Exception as e:
        print(f"❌ Error procesando impresión de códigos: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@inventory_router.route("/test-barcode-endpoint", methods=["GET", "POST"])
def test_barcode_endpoint():
    """
    Endpoint de prueba para verificar que las rutas funcionan
    """
    return jsonify(
        {
            "status": "success",
            "message": "Endpoint de prueba funcionando correctamente",
            "timestamp": "2025-08-06",
            "method": request.method,
        }
    ), 200


@inventory_router.route("/generate-barcode-preview/<int:variant_id>", methods=["POST"])
def generate_barcode_preview(variant_id):
    """
    Genera una vista previa PNG del código de barras para una variante específica
    """
    try:
        data = request.get_json() or {}
        options = data.get("options", {})

        print(f"🔍 Generando vista previa PNG para variante {variant_id}")
        print(f"⚙️ Opciones: {options}")

        db = Database()

        # Obtener información completa de la variante
        variant_query = """
        SELECT 
            wsv.variant_barcode,
            wsv.product_id,
            wsv.quantity,
            p.product_name,
            p.sale_price,
            b.brand_name,
            s.size_name,
            c.color_name,
            c.color_hex
        FROM warehouse_stock_variants wsv
        LEFT JOIN products p ON wsv.product_id = p.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN sizes s ON wsv.size_id = s.id
        LEFT JOIN colors c ON wsv.color_id = c.id
        WHERE wsv.id = %s
        """
        variant_info = db.execute_query(variant_query, (variant_id,))

        if not variant_info:
            return jsonify(
                {"status": "error", "message": "Variante no encontrada"}
            ), 404

        variant = variant_info[0]

        # Generar código de barras si no existe
        barcode_code = variant["variant_barcode"]
        if not barcode_code:
            barcode_code = f"1{variant['product_id']:04d}{variant_id:04d}001"
            # Asegurar que sea EAN13 válido (12 dígitos + dígito de control)
            if len(barcode_code) < 12:
                barcode_code = barcode_code.ljust(12, "0")
        else:
            # Si el código existe pero contiene letras, convertir a numérico
            if not barcode_code.isdigit():
                # Convertir código alfanumérico a numérico usando hash
                import hashlib

                # Crear un hash numérico del código original
                hash_obj = hashlib.md5(barcode_code.encode())
                # Tomar los primeros 12 dígitos del hash hexadecimal convertido a decimal
                hex_hash = hash_obj.hexdigest()[:8]  # 8 caracteres hex = hasta 32 bits
                numeric_hash = str(int(hex_hash, 16))[
                    :12
                ]  # Convertir a decimal y tomar 12 dígitos
                # Asegurar que tenga exactamente 12 dígitos
                barcode_code = numeric_hash.ljust(12, "0")[:12]
                print(
                    f"🔄 Código original '{variant['variant_barcode']}' convertido a numérico: '{barcode_code}'"
                )

        # Construir información del producto para el generador
        product_info = {
            "name": variant["product_name"],
            "barcode": barcode_code,
            "original_barcode": variant[
                "variant_barcode"
            ],  # Código original para mostrar
            "price": variant["sale_price"],
            "size_name": variant["size_name"],
            "color_name": variant["color_name"],
        }

        # Construir texto según las opciones
        text_lines = []
        if options.get("includeProductName", True) and variant["product_name"]:
            text_lines.append(variant["product_name"])
        if options.get("includeSize", True) and variant["size_name"]:
            text_lines.append(f"Talle: {variant['size_name']}")
        if options.get("includeColor", True) and variant["color_name"]:
            text_lines.append(f"Color: {variant['color_name']}")
        if options.get("includePrice", True) and variant["sale_price"]:
            text_lines.append(f"${float(variant['sale_price']):.2f}")
        if options.get("includeCode", True) and barcode_code:
            text_lines.append(f"Código: {barcode_code}")

        # Generar PNG del código de barras usando el BarcodeGenerator
        try:
            import sys
            import os

            # Agregar el directorio padre al path para importación
            backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            if backend_dir not in sys.path:
                sys.path.insert(0, backend_dir)

            from barcode_generator import BarcodeGenerator
            import base64

            print("🔧 Generando PNG con opciones de texto personalizado")
            print(f"📝 Líneas de texto a incluir: {text_lines}")

            barcode_generator = BarcodeGenerator()

            # Generar el archivo PNG con texto
            generated_files = barcode_generator.generate_barcode_with_text(
                barcode_code,
                product_info,
                options,
                1,  # Solo una imagen para vista previa
            )

            if generated_files:
                # Leer el archivo PNG generado
                png_path = generated_files[0]

                # Convertir a base64 para envío al frontend
                with open(png_path, "rb") as img_file:
                    png_data = img_file.read()
                    png_base64 = base64.b64encode(png_data).decode("utf-8")

                # Limpiar archivo temporal
                barcode_generator.cleanup_files(generated_files)

                print(f"✅ Código de barras PNG generado para variante {variant_id}")

                return jsonify(
                    {
                        "status": "success",
                        "data": {
                            "variant_id": variant_id,
                            "barcode_code": barcode_code,
                            "png_data": png_base64,  # Base64 del PNG
                            "text_lines": text_lines,
                            "variant_info": {
                                "product_name": variant["product_name"],
                                "size_name": variant["size_name"],
                                "color_name": variant["color_name"],
                                "sale_price": variant["sale_price"],
                                "quantity": variant["quantity"],
                            },
                        },
                    }
                ), 200
            else:
                return jsonify(
                    {
                        "status": "error",
                        "message": "Error generando el código de barras PNG",
                    }
                ), 500

        except ImportError as e:
            print(f"❌ Error importando BarcodeGenerator: {e}")
            print("🔍 Intentando importación alternativa...")

            # Método alternativo de importación
            try:
                import importlib.util

                spec = importlib.util.spec_from_file_location(
                    "barcode_generator",
                    os.path.join(backend_dir, "barcode_generator.py"),
                )
                barcode_module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(barcode_module)
                BarcodeGenerator = barcode_module.BarcodeGenerator
                print("✅ Importación alternativa exitosa")

            except Exception as alt_error:
                print(f"❌ Importación alternativa también falló: {alt_error}")
                return jsonify(
                    {
                        "status": "error",
                        "message": "Sistema de generación de códigos de barras no disponible. Verifica que python-barcode[images] esté instalado.",
                    }
                ), 500

        except Exception as barcode_error:
            print(f"❌ Error generando código de barras: {barcode_error}")
            return jsonify(
                {
                    "status": "error",
                    "message": f"Error generando código de barras: {str(barcode_error)}",
                }
            ), 500

    except Exception as e:
        print(f"❌ Error en generate_barcode_preview: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


# ================================
# ENDPOINTS PARA CONFIGURACIONES DE IMPRESIÓN
# ================================


@inventory_router.route("/print-settings", methods=["GET"])
def get_print_settings():
    """
    Obtiene las configuraciones de impresión guardadas
    """
    try:
        user_id = request.args.get("user_id", "default")

        db = Database()

        query = """
        SELECT show_product_name, show_variant_name, show_size, show_color, 
               show_price, show_barcode, print_width, print_height, font_size,
               background_color, text_color
        FROM barcode_print_settings 
        WHERE user_id = %s
        """

        result = db.execute_query(query, (user_id,))

        if result and len(result) > 0:
            settings = result[0]
            return jsonify(
                {
                    "status": "success",
                    "settings": {
                        "showProductName": settings[0],
                        "showVariantName": settings[1],
                        "showSize": settings[2],
                        "showColor": settings[3],
                        "showPrice": settings[4],
                        "showBarcode": settings[5],
                        "printWidth": settings[6],
                        "printHeight": settings[7],
                        "fontSize": settings[8],
                        "backgroundColor": settings[9],
                        "textColor": settings[10],
                    },
                }
            )
        else:
            # Devolver configuración por defecto
            return jsonify(
                {
                    "status": "success",
                    "settings": {
                        "showProductName": True,
                        "showVariantName": True,
                        "showSize": True,
                        "showColor": True,
                        "showPrice": False,
                        "showBarcode": True,
                        "printWidth": 450,
                        "printHeight": 200,
                        "fontSize": 12,
                        "backgroundColor": "#FFFFFF",
                        "textColor": "#000000",
                    },
                }
            )

    except Exception as e:
        print(f"❌ Error obteniendo configuraciones de impresión: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@inventory_router.route("/print-settings", methods=["POST"])
def save_print_settings():
    """
    Guarda las configuraciones de impresión
    """
    try:
        data = request.json
        user_id = data.get("user_id", "default")

        settings = data.get("settings", {})

        db = Database()

        # Verificar si ya existe configuración para este usuario
        check_query = "SELECT id FROM barcode_print_settings WHERE user_id = %s"
        existing = db.execute_query(check_query, (user_id,))

        if existing and len(existing) > 0:
            # Actualizar configuración existente
            update_query = """
            UPDATE barcode_print_settings 
            SET show_product_name = %s, show_variant_name = %s, show_size = %s, 
                show_color = %s, show_price = %s, show_barcode = %s,
                print_width = %s, print_height = %s, font_size = %s,
                background_color = %s, text_color = %s, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = %s
            """

            db.execute_query(
                update_query,
                (
                    settings.get("showProductName", True),
                    settings.get("showVariantName", True),
                    settings.get("showSize", True),
                    settings.get("showColor", True),
                    settings.get("showPrice", False),
                    settings.get("showBarcode", True),
                    settings.get("printWidth", 450),
                    settings.get("printHeight", 200),
                    settings.get("fontSize", 12),
                    settings.get("backgroundColor", "#FFFFFF"),
                    settings.get("textColor", "#000000"),
                    user_id,
                ),
            )
        else:
            # Insertar nueva configuración
            insert_query = """
            INSERT INTO barcode_print_settings 
            (user_id, show_product_name, show_variant_name, show_size, show_color, 
             show_price, show_barcode, print_width, print_height, font_size,
             background_color, text_color)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """

            db.execute_query(
                insert_query,
                (
                    user_id,
                    settings.get("showProductName", True),
                    settings.get("showVariantName", True),
                    settings.get("showSize", True),
                    settings.get("showColor", True),
                    settings.get("showPrice", False),
                    settings.get("showBarcode", True),
                    settings.get("printWidth", 450),
                    settings.get("printHeight", 200),
                    settings.get("fontSize", 12),
                    settings.get("backgroundColor", "#FFFFFF"),
                    settings.get("textColor", "#000000"),
                ),
            )

        print(f"✅ Configuraciones de impresión guardadas para usuario: {user_id}")

        return jsonify(
            {"status": "success", "message": "Configuraciones guardadas exitosamente"}
        )

    except Exception as e:
        print(f"❌ Error guardando configuraciones de impresión: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
