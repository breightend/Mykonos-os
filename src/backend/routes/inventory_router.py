from flask import Blueprint, request, jsonify
from database.database import Database

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
                COALESCE(p.last_modified_date, datetime('now')) as fecha_edicion,
                COUNT(DISTINCT ws.branch_id) as sucursales_con_stock
            FROM products p
            LEFT JOIN warehouse_stock ws ON p.id = ws.product_id AND ws.branch_id = ?
            LEFT JOIN brands b ON p.brand_id = b.id
            GROUP BY p.id, p.product_name, b.brand_name, p.last_modified_date
            HAVING cantidad_total > 0
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
                COALESCE(p.last_modified_date, datetime('now')) as fecha_edicion,
                COUNT(DISTINCT ws.branch_id) as sucursales_con_stock
            FROM products p
            LEFT JOIN warehouse_stock ws ON p.id = ws.product_id
            LEFT JOIN brands b ON p.brand_id = b.id
            GROUP BY p.id, p.product_name, b.brand_name, p.last_modified_date
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
                        }
                    else:
                        product_item = {
                            "id": p[0],
                            "producto": p[1],
                            "marca": p[2],
                            "cantidad_total": p[3],
                            "fecha_edicion": p[4],
                            "sucursales_con_stock": p[5],
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
            p.barcode,
            p.provider_code,
            p.product_name,
            p.description,
            p.cost,
            p.sale_price,
            p.tax,
            p.discount,
            p.comments,
            p.last_modified_date,
            p.images_ids,
            b.brand_name,
            b.description as brand_description
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE p.id = ?
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
                    "barcode": row.get("barcode"),
                    "provider_code": row.get("provider_code"),
                    "product_name": row.get("product_name"),
                    "description": row.get("description"),
                    "cost": row.get("cost"),
                    "sale_price": row.get("sale_price"),
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
                    "barcode": row[1],
                    "provider_code": row[2],
                    "product_name": row[3],
                    "description": row[4],
                    "cost": row[5],
                    "sale_price": row[6],
                    "tax": row[7],
                    "discount": row[8],
                    "comments": row[9],
                    "last_modified_date": row[10],
                    "images_ids": row[11],
                    "brand_name": row[12],
                    "brand_description": row[13],
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
        WHERE ws.product_id = ?
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
        SELECT c.id, c.color_name
        FROM product_colors pc
        JOIN colors c ON pc.color_id = c.id
        WHERE pc.product_id = ?
        """
        colors_data = db.execute_query(colors_query, (product_id,))
        print(f"🔍 DEBUG product-details: Colors data: {colors_data}")

        product_data["colores"] = []
        if colors_data:
            for c in colors_data:
                try:
                    if isinstance(c, dict):
                        color_item = {"id": c.get("id"), "nombre": c.get("color_name")}
                    else:
                        color_item = {"id": c[0], "nombre": c[1]}
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
            WHERE ps.product_id = ?
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

        # Calcular totales
        total_stock = sum([s["cantidad"] for s in product_data["stock_por_sucursal"]])
        product_data["stock_total"] = total_stock
        product_data["sucursales_con_stock"] = len(
            [s for s in product_data["stock_por_sucursal"] if s["cantidad"] > 0]
        )

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
                COALESCE(p.last_modified_date, datetime('now')) as fecha,
                COALESCE(GROUP_CONCAT(c.color_name, ', '), 'Sin colores') as colores
            FROM warehouse_stock ws
            JOIN products p ON ws.product_id = p.id
            JOIN storage s ON ws.branch_id = s.id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN product_colors pc ON p.id = pc.product_id
            LEFT JOIN colors c ON pc.color_id = c.id
            WHERE ws.branch_id = ?
            GROUP BY p.id, ws.branch_id
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
                COALESCE(p.last_modified_date, datetime('now')) as fecha,
                COALESCE(GROUP_CONCAT(c.color_name, ', '), 'Sin colores') as colores
            FROM warehouse_stock ws
            JOIN products p ON ws.product_id = p.id
            JOIN storage s ON ws.branch_id = s.id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN product_colors pc ON p.id = pc.product_id
            LEFT JOIN colors c ON pc.color_id = c.id
            GROUP BY p.id, ws.branch_id
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
        WHERE p.id = ?
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
        WHERE product_id = ? AND branch_id = ?
        """
        existing = db.execute_query(check_query, (product_id, storage_id))

        if existing:
            # Actualizar registro existente usando execute_query
            update_query = """
            UPDATE warehouse_stock 
            SET quantity = ?, last_updated = datetime('now', 'localtime')
            WHERE product_id = ? AND branch_id = ?
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
                GROUP_CONCAT(DISTINCT c.color_name, ', ') as colores
            FROM warehouse_stock ws
            JOIN products p ON ws.product_id = p.id
            JOIN storage s ON ws.branch_id = s.id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN product_colors pc ON p.id = pc.product_id
            LEFT JOIN colors c ON pc.color_id = c.id
            GROUP BY p.id, ws.branch_id
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
