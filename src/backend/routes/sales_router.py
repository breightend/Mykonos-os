from flask import Blueprint, request, jsonify
from database.database import Database
from datetime import datetime

sales_router = Blueprint("sales_router", __name__)


@sales_router.route("/product-by-variant-barcode/<variant_barcode>", methods=["GET"])
def get_product_by_variant_barcode(variant_barcode):
    """
    Busca un producto por su código de barras de variante
    Retorna toda la información necesaria para ventas incluyendo talle, color y stock
    """
    try:
        print(
            f"🔍 DEBUG sales: Buscando producto por variant_barcode: {variant_barcode}"
        )

        db = Database()

        # Consulta para obtener información completa del producto por variant_barcode
        query = """
        SELECT 
            p.id as product_id,
            p.product_name,
            p.description,
            p.sale_price,
            b.brand_name,
            g.group_name,
            s.size_name,
            c.color_name,
            c.color_hex,
            st.name as sucursal_nombre,
            st.id as sucursal_id,
            wsv.quantity as stock_disponible,
            wsv.id as variant_id,
            wsv.size_id,
            wsv.color_id,
            wsv.variant_barcode,
            p.tax,
            p.discount
        FROM warehouse_stock_variants wsv
        JOIN products p ON wsv.product_id = p.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN groups g ON p.group_id = g.id
        LEFT JOIN sizes s ON wsv.size_id = s.id
        LEFT JOIN colors c ON wsv.color_id = c.id
        JOIN storage st ON wsv.branch_id = st.id
        WHERE wsv.variant_barcode = %s
        AND wsv.quantity > 0
        """

        result = db.execute_query(query, (variant_barcode,))
        print(f"🔍 DEBUG sales: Resultado query: {result}")

        if not result:
            return jsonify(
                {
                    "status": "error",
                    "message": "Producto no encontrado o sin stock disponible",
                    "error_code": "PRODUCT_NOT_FOUND",
                }
            ), 404

        # Tomar el primer resultado (debería ser único por variant_barcode)
        product_data = result[0]

        # Formatear respuesta
        if isinstance(product_data, dict):
            product_info = {
                "product_id": product_data.get("product_id"),
                "product_name": product_data.get("product_name"),
                "description": product_data.get("description"),
                "sale_price": product_data.get("sale_price"),
                "brand_name": product_data.get("brand_name"),
                "group_name": product_data.get("group_name"),
                "size_name": product_data.get("size_name"),
                "color_name": product_data.get("color_name"),
                "color_hex": product_data.get("color_hex"),
                "sucursal_nombre": product_data.get("sucursal_nombre"),
                "sucursal_id": product_data.get("sucursal_id"),
                "stock_disponible": product_data.get("stock_disponible"),
                "variant_id": product_data.get("variant_id"),
                "size_id": product_data.get("size_id"),
                "color_id": product_data.get("color_id"),
                "variant_barcode": product_data.get("variant_barcode"),
                "tax": product_data.get("tax", 0),
                "discount": product_data.get("discount", 0),
            }
        else:
            product_info = {
                "product_id": product_data[0],
                "product_name": product_data[1],
                "description": product_data[2],
                "sale_price": product_data[3],
                "brand_name": product_data[4],
                "group_name": product_data[5],
                "size_name": product_data[6],
                "color_name": product_data[7],
                "color_hex": product_data[8],
                "sucursal_nombre": product_data[9],
                "sucursal_id": product_data[10],
                "stock_disponible": product_data[11],
                "variant_id": product_data[12],
                "size_id": product_data[13],
                "color_id": product_data[14],
                "variant_barcode": product_data[15],
                "tax": product_data[16] or 0,
                "discount": product_data[17] or 0,
            }

        print(
            f"✅ DEBUG sales: Producto encontrado: {product_info['product_name']} - {product_info['size_name']} - {product_info['color_name']}"
        )

        return jsonify({"status": "success", "data": product_info})

    except Exception as e:
        print(f"❌ ERROR sales: {str(e)}")
        import traceback

        traceback.print_exc()
        return jsonify(
            {
                "status": "error",
                "message": "Error interno del servidor",
                "error": str(e),
            }
        ), 500


@sales_router.route("/variant-stock", methods=["GET"])
def check_variant_stock():
    """
    Verifica el stock disponible de una variante específica
    """
    try:
        product_id = request.args.get("product_id")
        size_id = request.args.get("size_id")
        color_id = request.args.get("color_id")
        branch_id = request.args.get("branch_id")

        if not all([product_id, size_id, color_id, branch_id]):
            return jsonify(
                {"status": "error", "message": "Faltan parámetros requeridos"}
            ), 400

        db = Database()

        query = """
        SELECT quantity, variant_barcode
        FROM warehouse_stock_variants
        WHERE product_id = %s AND size_id = %s AND color_id = %s AND branch_id = %s
        """

        result = db.execute_query(query, (product_id, size_id, color_id, branch_id))

        if not result:
            return jsonify(
                {
                    "status": "success",
                    "data": {"stock_disponible": 0, "variant_barcode": None},
                }
            )

        stock_data = result[0]
        if isinstance(stock_data, dict):
            stock_info = {
                "stock_disponible": stock_data.get("quantity", 0),
                "variant_barcode": stock_data.get("variant_barcode"),
            }
        else:
            stock_info = {
                "stock_disponible": stock_data[0] if stock_data[0] else 0,
                "variant_barcode": stock_data[1],
            }

        return jsonify({"status": "success", "data": stock_info})

    except Exception as e:
        print(f"❌ ERROR checking variant stock: {str(e)}")
        return jsonify(
            {
                "status": "error",
                "message": "Error interno del servidor",
                "error": str(e),
            }
        ), 500


@sales_router.route("/simple-test", methods=["GET", "POST"])
def simple_test():
    """Test muy simple para verificar que el routing funciona"""
    return jsonify(
        {
            "status": "success",
            "message": "Endpoint funcionando correctamente",
            "method": request.method,
            "timestamp": "2025-08-09",
        }
    )


@sales_router.route("/debug-sale", methods=["POST"])
def debug_sale():
    """Endpoint de debug para ver exactamente qué datos llegan"""
    try:
        print("=" * 80)
        print("🔍 DEBUG: Petición recibida")
        print(f"Content-Type: {request.content_type}")
        print(f"Method: {request.method}")
        print(f"URL: {request.url}")
        print(f"Headers: {dict(request.headers)}")

        # Obtener datos crudos
        raw_data = request.get_data()
        print(f"Raw data length: {len(raw_data)}")
        print(f"Raw data (first 500 chars): {raw_data[:500]}")

        # Intentar parsear JSON
        try:
            data = request.get_json()
            print(f"Parsed JSON: {data}")
            print(f"JSON type: {type(data)}")
        except Exception as json_error:
            print(f"❌ Error parsing JSON: {json_error}")
            data = None

        print("=" * 80)

        if data is None:
            return jsonify(
                {
                    "status": "error",
                    "message": "No se pudieron parsear los datos JSON",
                    "debug_info": {
                        "content_type": request.content_type,
                        "raw_data_length": len(raw_data),
                        "raw_data_preview": str(raw_data[:200]),
                    },
                }
            ), 400

        if "products" in data:
            print(f"📦 Products ({len(data['products'])} items):")
            for i, product in enumerate(data["products"]):
                print(f"  Product {i + 1}: {product}")
                print(
                    f"    - product_id: {product.get('product_id')} (type: {type(product.get('product_id'))})"
                )
                print(
                    f"    - variant_id: {product.get('variant_id')} (type: {type(product.get('variant_id'))})"
                )
                print(
                    f"    - product_name: {product.get('product_name')} (type: {type(product.get('product_name'))})"
                )
                print(
                    f"    - price: {product.get('price')} (type: {type(product.get('price'))})"
                )
                print(
                    f"    - quantity: {product.get('quantity')} (type: {type(product.get('quantity'))})"
                )

        if "payments" in data:
            print(f"💳 Payments ({len(data['payments'])} items):")
            for i, payment in enumerate(data["payments"]):
                print(f"  Payment {i + 1}: {payment}")

        print("=" * 80)

        return jsonify(
            {
                "status": "debug_success",
                "message": "Datos registrados en logs del servidor",
                "data_received": {
                    "products_count": len(data.get("products", [])),
                    "payments_count": len(data.get("payments", [])),
                    "has_exchange": data.get("exchange") is not None
                    and data.get("exchange", {}).get("hasExchange", False),
                    "total": data.get("total", 0),
                    "storage_id": data.get("storage_id"),
                    "employee_id": data.get("employee_id"),
                    "cashier_user_id": data.get("cashier_user_id"),
                },
            }
        )

    except Exception as e:
        print(f"❌ Error en debug endpoint: {str(e)}")
        import traceback

        traceback.print_exc()
        return jsonify({"status": "error", "message": f"Error en debug: {str(e)}"}), 500


@sales_router.route("/test-db", methods=["GET"])
def test_database():
    """Endpoint de prueba para verificar la conexión a la base de datos"""
    try:
        db = Database()
        conn = db.create_connection()
        cursor = conn.cursor()

        # Test simple de conexión
        cursor.execute("SELECT 1 as test")
        result = cursor.fetchone()

        # Verificar tabla sales existe
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'sales'
        """)
        sales_columns = cursor.fetchall()

        # Test inserción simple
        cursor.execute(
            """
            INSERT INTO sales (
                employee_id, cashier_user_id, storage_id,
                subtotal, total, payment_method, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id
        """,
            (1, 1, 1, 100.0, 100.0, "efectivo", "Completada"),
        )

        test_id = cursor.fetchone()[0]
        conn.rollback()  # No guardar realmente
        conn.close()

        return jsonify(
            {
                "status": "success",
                "message": "Base de datos funcionando correctamente",
                "data": {
                    "connection_test": result[0],
                    "sales_columns_count": len(sales_columns),
                    "test_insert_id": test_id,
                },
            }
        )

    except Exception as e:
        print(f"❌ ERROR testing database: {str(e)}")
        import traceback

        traceback.print_exc()
        return jsonify(
            {"status": "error", "message": "Error en la base de datos", "error": str(e)}
        ), 500


@sales_router.route("/create-sale", methods=["POST"])
def create_sale():
    """
    Crea una nueva venta, con o sin intercambio

    Expected JSON:
    {
        "customer": {
            "name": str,
            "id": str,
            "contact": str
        } (optional),
        "products": [
            {
                "product_id": int,
                "variant_id": int,
                "product_name": str,
                "description": str,
                "brand": str,
                "size_name": str,
                "color_name": str,
                "price": float,
                "quantity": int,
                "variant_barcode": str
            }
        ],
        "exchange": {
            "hasExchange": bool,
            "returnedProducts": [
                {
                    "product_id": int,
                    "variant_id": int,
                    "product_name": str,
                    "description": str,
                    "brand": str,
                    "size_name": str,
                    "color_name": str,
                    "price": float,
                    "quantity": int,
                    "variant_barcode": str
                }
            ],
            "totalProductsValue": float,
            "totalReturnedValue": float,
            "finalAmount": float
        } (optional),
        "payments": [
            {
                "method": str,
                "amount": float
            }
        ],
        "total": float,
        "storage_id": int,
        "employee_id": int,
        "cashier_user_id": int
    }
    """
    try:
        data = request.get_json()
        print(f"🔍 DEBUG sales: Datos recibidos para crear venta: {data}")

        # Validaciones básicas
        if not data:
            return jsonify(
                {"status": "error", "message": "No se recibieron datos"}
            ), 400

        if not data.get("products") or len(data["products"]) == 0:
            return jsonify(
                {"status": "error", "message": "Debe incluir al menos un producto"}
            ), 400

        # Validar cada producto
        for i, product in enumerate(data["products"]):
            required_fields = [
                "product_id",
                "variant_id",
                "product_name",
                "price",
                "quantity",
            ]
            missing_fields = []

            for field in required_fields:
                if product.get(field) is None:
                    missing_fields.append(field)

            if missing_fields:
                return jsonify(
                    {
                        "status": "error",
                        "message": f"Producto {i + 1} falta campos: {', '.join(missing_fields)}",
                    }
                ), 400

            # Validar tipos de datos
            try:
                int(product["product_id"])
                int(product["variant_id"])
                float(product["price"])
                int(product["quantity"])
            except (ValueError, TypeError) as e:
                return jsonify(
                    {
                        "status": "error",
                        "message": f"Producto {i + 1} tiene tipos de datos inválidos: {str(e)}",
                    }
                ), 400

        if not data.get("payments") or len(data["payments"]) == 0:
            return jsonify(
                {
                    "status": "error",
                    "message": "Debe incluir al menos un método de pago",
                }
            ), 400

        # Valores por defecto para campos requeridos
        storage_id = data.get("storage_id", 1)  # Sucursal por defecto
        employee_id = data.get("employee_id", 1)  # Empleado por defecto
        cashier_user_id = data.get("cashier_user_id", 1)  # Cajero por defecto

        db = Database()

        try:
            # 1. Calcular valores necesarios
            exchange_data = data.get("exchange")
            has_exchange = exchange_data is not None and exchange_data.get(
                "hasExchange", False
            )
            total_sale = (
                exchange_data.get("finalAmount")
                if has_exchange and exchange_data
                else data.get("total", 0)
            )

            # Formatear métodos de pago
            payment_methods = []
            payment_references = []
            for payment in data["payments"]:
                payment_methods.append(payment["method"])
                payment_references.append(payment.get("reference", ""))

            payment_method_str = ", ".join(payment_methods)
            payment_reference_str = ", ".join(payment_references)

            # Nota sobre el intercambio si aplica
            notes = ""
            if has_exchange and exchange_data:
                exchange_info = exchange_data
                notes = f"Venta con intercambio - Productos: ${exchange_info.get('totalProductsValue', 0):.2f}, Devoluciones: ${exchange_info.get('totalReturnedValue', 0):.2f}"

            # 2. Crear conexión manual para manejar transacción
            conn = db.create_connection()
            cursor = conn.cursor()

            # 3. Insertar venta principal
            sales_query = """
            INSERT INTO sales (
                customer_id, employee_id, cashier_user_id, storage_id,
                subtotal, total, payment_method, payment_reference,
                notes, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'Completada')
            RETURNING id
            """

            sales_params = (
                None,  # customer_id (NULL por ahora)
                employee_id,
                cashier_user_id,
                storage_id,
                total_sale,  # subtotal
                total_sale,  # total
                payment_method_str,
                payment_reference_str,
                notes,
            )

            print(f"📝 DEBUG: Creando venta con parámetros: {sales_params}")

            cursor.execute(sales_query, sales_params)
            sale_result = cursor.fetchone()
            sale_id = sale_result[0]

            print(f"✅ DEBUG: Venta creada con ID: {sale_id}")

            # 4. Procesar productos vendidos (productos que se lleva el cliente)
            for i, product in enumerate(data["products"]):
                print(f"🔍 DEBUG: Procesando producto {i + 1}: {product}")

                # Validar que los campos críticos existen
                if not product.get("variant_id"):
                    raise Exception(f"Producto {i + 1} no tiene variant_id válido")
                if not product.get("product_id"):
                    raise Exception(f"Producto {i + 1} no tiene product_id válido")

                # Insertar detalle de venta
                sales_detail_query = """
                INSERT INTO sales_detail (
                    sale_id, product_id, variant_id, product_name, 
                    size_name, color_name, cost_price, sale_price, 
                    quantity, subtotal, total, barcode_scanned
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """

                subtotal = float(product["price"]) * int(product["quantity"])

                sales_detail_params = (
                    sale_id,
                    int(product["product_id"]),
                    int(product["variant_id"]),
                    str(product["product_name"]),
                    str(product.get("size_name", "")),
                    str(product.get("color_name", "")),
                    float(product["price"]),  # cost_price = sale_price por simplicidad
                    float(product["price"]),
                    int(product["quantity"]),
                    subtotal,
                    subtotal,
                    str(product.get("variant_barcode", "")),
                )

                print(f"📝 DEBUG: Parámetros detalle venta: {sales_detail_params}")

                cursor.execute(sales_detail_query, sales_detail_params)
                print(
                    f"✅ DEBUG: Detalle de venta agregado para producto: {product['product_name']}"
                )

                # Reducir stock (productos que sale del inventario)
                print(
                    f"📦 DEBUG: Actualizando stock para variant_id: {product['variant_id']}"
                )
                update_stock_query = """
                UPDATE warehouse_stock_variants 
                SET quantity = quantity - %s
                WHERE id = %s AND quantity >= %s
                """

                cursor.execute(
                    update_stock_query,
                    (
                        int(product["quantity"]),
                        int(product["variant_id"]),
                        int(product["quantity"]),
                    ),
                )

                if cursor.rowcount == 0:
                    raise Exception(
                        f"Stock insuficiente para producto: {product['product_name']} - {product.get('size_name', '')} - {product.get('color_name', '')}"
                    )

                print(
                    f"✅ DEBUG: Stock reducido para variante {product['variant_id']}: -{product['quantity']} unidades"
                )

            # 5. Procesar productos devueltos en el intercambio (si aplica)
            if has_exchange and exchange_data and exchange_data.get("returnedProducts"):
                for returned_product in exchange_data["returnedProducts"]:
                    # Los productos devueltos se registran como devoluciones (cantidad negativa en el detalle)
                    returned_detail_query = """
                    INSERT INTO sales_detail (
                        sale_id, product_id, variant_id, product_name,
                        size_name, color_name, cost_price, sale_price,
                        quantity, subtotal, total, barcode_scanned
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """

                    # Cantidad negativa para representar devolución
                    returned_quantity = -int(returned_product["quantity"])
                    returned_subtotal = (
                        float(returned_product["price"]) * returned_quantity
                    )

                    returned_detail_params = (
                        sale_id,
                        returned_product["product_id"],
                        returned_product["variant_id"],
                        f"DEVOLUCION: {returned_product['product_name']}",
                        returned_product["size_name"],
                        returned_product["color_name"],
                        float(returned_product["price"]),
                        float(returned_product["price"]),
                        returned_quantity,
                        returned_subtotal,
                        returned_subtotal,
                        returned_product["variant_barcode"],
                    )

                    cursor.execute(returned_detail_query, returned_detail_params)
                    print(
                        f"✅ DEBUG: Devolución registrada para producto: {returned_product['product_name']}"
                    )

                    # Aumentar stock (productos que regresan al inventario)
                    increase_stock_query = """
                    UPDATE warehouse_stock_variants 
                    SET quantity = quantity + %s
                    WHERE id = %s
                    """

                    cursor.execute(
                        increase_stock_query,
                        (
                            int(returned_product["quantity"]),
                            returned_product["variant_id"],
                        ),
                    )

                    print(
                        f"✅ DEBUG: Stock aumentado para variante {returned_product['variant_id']}: +{returned_product['quantity']} unidades"
                    )

            # 6. Confirmar transacción
            conn.commit()
            print("✅ DEBUG: Transacción completada exitosamente")

            return jsonify(
                {
                    "status": "success",
                    "message": "Venta creada exitosamente"
                    + (" con intercambio" if has_exchange else ""),
                    "data": {
                        "sale_id": sale_id,
                        "total": total_sale,
                        "has_exchange": has_exchange,
                    },
                }
            )

        except Exception as e:
            # Rollback en caso de error
            conn.rollback()
            raise e

        finally:
            conn.close()

    except Exception as e:
        print(f"❌ ERROR creating sale: {str(e)}")
        import traceback

        traceback.print_exc()
        return jsonify(
            {
                "status": "error",
                "message": "Error interno del servidor",
                "error": str(e),
            }
        ), 500


@sales_router.route("/list", methods=["GET"])
def list_sales():
    """
    Obtiene la lista de ventas con filtros opcionales

    Query parameters:
    - storage_id: Filtrar por sucursal
    - start_date: Fecha de inicio (YYYY-MM-DD)
    - end_date: Fecha de fin (YYYY-MM-DD)
    - limit: Número máximo de resultados (default: 50)
    - offset: Número de resultados a saltar (default: 0)
    """
    try:
        # Obtener parámetros de la URL
        storage_id = request.args.get("storage_id", type=int)
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        limit = request.args.get("limit", default=50, type=int)
        offset = request.args.get("offset", default=0, type=int)
        search = request.args.get("search", "").strip()

        print(
            f"🔍 DEBUG sales list: Parámetros recibidos - storage_id: {storage_id}, start_date: {start_date}, end_date: {end_date}"
        )

        db = Database()

        # Construir query dinámicamente
        where_conditions = []
        params = []

        if storage_id:
            where_conditions.append("s.storage_id = %s")
            params.append(storage_id)

        if start_date:
            where_conditions.append("DATE(s.sale_date) >= %s")
            params.append(start_date)

        if end_date:
            where_conditions.append("DATE(s.sale_date) <= %s")
            params.append(end_date)

        if search:
            where_conditions.append(
                "(s.notes LIKE %s OR s.invoice_number LIKE %s OR s.receipt_number LIKE %s)"
            )
            search_param = f"%{search}%"
            params.extend([search_param, search_param, search_param])

        where_clause = (
            f"WHERE {' AND '.join(where_conditions)}" if where_conditions else ""
        )

        # Query principal para obtener las ventas
        query = f"""
        SELECT 
            s.id,
            s.sale_date,
            s.total,
            s.payment_method,
            s.notes,
            s.status,
            s.invoice_number,
            s.receipt_number,
            st.name as storage_name,
            e.entity_name as customer_name,
            u.username as cashier_name,
            COUNT(sd.id) as total_items,
            SUM(sd.quantity) as total_quantity
        FROM sales s
        LEFT JOIN storage st ON s.storage_id = st.id
        LEFT JOIN entities e ON s.customer_id = e.id
        LEFT JOIN users u ON s.cashier_user_id = u.id
        LEFT JOIN sales_detail sd ON s.id = sd.sale_id AND sd.quantity > 0
        {where_clause}
        GROUP BY s.id, s.sale_date, s.total, s.payment_method, s.notes, s.status, 
                 s.invoice_number, s.receipt_number, st.name, e.entity_name, u.username
        ORDER BY s.sale_date DESC
        LIMIT %s OFFSET %s
        """

        params.extend([limit, offset])

        print(f"🔍 DEBUG sales list: Query: {query}")
        print(f"🔍 DEBUG sales list: Params: {params}")

        result = db.execute_query(query, params)

        # Formatear resultados
        sales_list = []
        for row in result:
            if isinstance(row, dict):
                sale_info = {
                    "id": row.get("id"),
                    "sale_date": row.get("sale_date"),
                    "total": row.get("total"),
                    "payment_method": row.get("payment_method"),
                    "notes": row.get("notes"),
                    "status": row.get("status"),
                    "invoice_number": row.get("invoice_number"),
                    "receipt_number": row.get("receipt_number"),
                    "storage_name": row.get("storage_name"),
                    "customer_name": row.get("customer_name"),
                    "cashier_name": row.get("cashier_name"),
                    "total_items": row.get("total_items", 0),
                    "total_quantity": row.get("total_quantity", 0),
                }
            else:
                sale_info = {
                    "id": row[0],
                    "sale_date": row[1],
                    "total": row[2],
                    "payment_method": row[3],
                    "notes": row[4],
                    "status": row[5],
                    "invoice_number": row[6],
                    "receipt_number": row[7],
                    "storage_name": row[8],
                    "customer_name": row[9],
                    "cashier_name": row[10],
                    "total_items": row[11] or 0,
                    "total_quantity": row[12] or 0,
                }

            sales_list.append(sale_info)

        print(f"✅ DEBUG sales list: Encontradas {len(sales_list)} ventas")

        return jsonify(
            {
                "status": "success",
                "data": sales_list,
                "pagination": {
                    "limit": limit,
                    "offset": offset,
                    "count": len(sales_list),
                },
            }
        )

    except Exception as e:
        print(f"❌ ERROR listing sales: {str(e)}")
        import traceback

        traceback.print_exc()
        return jsonify(
            {
                "status": "error",
                "message": "Error interno del servidor",
                "error": str(e),
            }
        ), 500


@sales_router.route("/<int:sale_id>/details", methods=["GET"])
def get_sale_details(sale_id):
    """
    Obtiene los detalles completos de una venta específica
    """
    try:
        print(f"🔍 DEBUG sale details: Obteniendo detalles para venta ID: {sale_id}")

        db = Database()

        # Query para obtener información general de la venta
        sale_query = """
        SELECT 
            s.id,
            s.sale_date,
            s.subtotal,
            s.total,
            s.payment_method,
            s.payment_reference,
            s.notes,
            s.status,
            s.invoice_number,
            s.receipt_number,
            s.tax_amount,
            s.discount,
            st.name as storage_name,
            e.entity_name as customer_name,
            e.phone_number as customer_phone,
            e.email as customer_email,
            u.username as cashier_name,
            emp.entity_name as employee_name
        FROM sales s
        LEFT JOIN storage st ON s.storage_id = st.id
        LEFT JOIN entities e ON s.customer_id = e.id
        LEFT JOIN users u ON s.cashier_user_id = u.id
        LEFT JOIN entities emp ON s.employee_id = emp.id
        WHERE s.id = %s
        """

        sale_result = db.execute_query(sale_query, (sale_id,))

        if not sale_result:
            return jsonify({"status": "error", "message": "Venta no encontrada"}), 404

        # Query para obtener los detalles de productos
        details_query = """
        SELECT 
            sd.id,
            sd.product_name,
            sd.size_name,
            sd.color_name,
            sd.cost_price,
            sd.sale_price,
            sd.quantity,
            sd.discount_amount,
            sd.tax_amount,
            sd.subtotal,
            sd.total,
            sd.barcode_scanned,
            p.product_name as current_product_name,
            b.brand_name,
            g.group_name
        FROM sales_detail sd
        LEFT JOIN products p ON sd.product_id = p.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN groups g ON p.group_id = g.id
        WHERE sd.sale_id = %s
        ORDER BY sd.id
        """

        details_result = db.execute_query(details_query, (sale_id,))

        # Formatear información de la venta
        sale_data = sale_result[0]
        if isinstance(sale_data, dict):
            sale_info = {
                "id": sale_data.get("id"),
                "sale_date": sale_data.get("sale_date"),
                "subtotal": sale_data.get("subtotal"),
                "total": sale_data.get("total"),
                "payment_method": sale_data.get("payment_method"),
                "payment_reference": sale_data.get("payment_reference"),
                "notes": sale_data.get("notes"),
                "status": sale_data.get("status"),
                "invoice_number": sale_data.get("invoice_number"),
                "receipt_number": sale_data.get("receipt_number"),
                "tax_amount": sale_data.get("tax_amount"),
                "discount": sale_data.get("discount"),
                "storage_name": sale_data.get("storage_name"),
                "customer_name": sale_data.get("customer_name"),
                "customer_phone": sale_data.get("customer_phone"),
                "customer_email": sale_data.get("customer_email"),
                "cashier_name": sale_data.get("cashier_name"),
                "employee_name": sale_data.get("employee_name"),
            }
        else:
            sale_info = {
                "id": sale_data[0],
                "sale_date": sale_data[1],
                "subtotal": sale_data[2],
                "total": sale_data[3],
                "payment_method": sale_data[4],
                "payment_reference": sale_data[5],
                "notes": sale_data[6],
                "status": sale_data[7],
                "invoice_number": sale_data[8],
                "receipt_number": sale_data[9],
                "tax_amount": sale_data[10],
                "discount": sale_data[11],
                "storage_name": sale_data[12],
                "customer_name": sale_data[13],
                "customer_phone": sale_data[14],
                "customer_email": sale_data[15],
                "cashier_name": sale_data[16],
                "employee_name": sale_data[17],
            }

        # Formatear detalles de productos
        products_sold = []
        products_returned = []

        for row in details_result:
            if isinstance(row, dict):
                product_info = {
                    "id": row.get("id"),
                    "product_name": row.get("product_name"),
                    "size_name": row.get("size_name"),
                    "color_name": row.get("color_name"),
                    "cost_price": row.get("cost_price"),
                    "sale_price": row.get("sale_price"),
                    "quantity": row.get("quantity"),
                    "discount_amount": row.get("discount_amount"),
                    "tax_amount": row.get("tax_amount"),
                    "subtotal": row.get("subtotal"),
                    "total": row.get("total"),
                    "barcode_scanned": row.get("barcode_scanned"),
                    "brand_name": row.get("brand_name"),
                    "group_name": row.get("group_name"),
                }
            else:
                product_info = {
                    "id": row[0],
                    "product_name": row[1],
                    "size_name": row[2],
                    "color_name": row[3],
                    "cost_price": row[4],
                    "sale_price": row[5],
                    "quantity": row[6],
                    "discount_amount": row[7],
                    "tax_amount": row[8],
                    "subtotal": row[9],
                    "total": row[10],
                    "barcode_scanned": row[11],
                    "brand_name": row[13],
                    "group_name": row[14],
                }

            # Separar productos vendidos y devueltos
            if product_info["quantity"] > 0:
                products_sold.append(product_info)
            else:
                # Los productos devueltos tienen cantidad negativa
                product_info["quantity"] = abs(product_info["quantity"])
                products_returned.append(product_info)

        # Determinar si es una venta con intercambio
        has_exchange = len(products_returned) > 0

        result = {
            "sale": sale_info,
            "products_sold": products_sold,
            "products_returned": products_returned,
            "has_exchange": has_exchange,
            "totals": {
                "products_sold_count": len(products_sold),
                "products_returned_count": len(products_returned),
                "total_items": len(products_sold) + len(products_returned),
            },
        }

        print(
            f"✅ DEBUG sale details: Detalles obtenidos - {len(products_sold)} productos vendidos, {len(products_returned)} devueltos"
        )

        return jsonify({"status": "success", "data": result})

    except Exception as e:
        print(f"❌ ERROR getting sale details: {str(e)}")
        import traceback

        traceback.print_exc()
        return jsonify(
            {
                "status": "error",
                "message": "Error interno del servidor",
                "error": str(e),
            }
        ), 500


@sales_router.route("/stats", methods=["GET"])
def get_sales_stats():
    """
    Obtiene estadísticas de ventas

    Query parameters:
    - storage_id: Filtrar por sucursal
    - start_date: Fecha de inicio (YYYY-MM-DD)
    - end_date: Fecha de fin (YYYY-MM-DD)
    """
    try:
        # Obtener parámetros
        storage_id = request.args.get("storage_id", type=int)
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        db = Database()

        # Construir condiciones WHERE
        where_conditions = []
        params = []

        if storage_id:
            where_conditions.append("s.storage_id = %s")
            params.append(storage_id)

        if start_date:
            where_conditions.append("DATE(s.sale_date) >= %s")
            params.append(start_date)

        if end_date:
            where_conditions.append("DATE(s.sale_date) <= %s")
            params.append(end_date)

        where_clause = (
            f"WHERE {' AND '.join(where_conditions)}" if where_conditions else ""
        )

        # Query para obtener estadísticas generales
        stats_query = f"""
        SELECT 
            COUNT(s.id) as total_sales,
            COALESCE(SUM(s.total), 0) as total_revenue,
            COALESCE(SUM(sd_positive.quantity), 0) as total_products_sold,
            COUNT(DISTINCT s.customer_id) as unique_customers,
            COUNT(CASE WHEN s.notes LIKE '%intercambio%' THEN 1 END) as exchange_sales
        FROM sales s
        LEFT JOIN (
            SELECT sale_id, SUM(quantity) as quantity
            FROM sales_detail 
            WHERE quantity > 0
            GROUP BY sale_id
        ) sd_positive ON s.id = sd_positive.sale_id
        {where_clause}
        AND s.status = 'Completada'
        """

        result = db.execute_query(stats_query, params)

        if result and len(result) > 0:
            stats_data = result[0]
            if isinstance(stats_data, dict):
                stats = {
                    "total_sales": stats_data.get("total_sales", 0),
                    "total_revenue": float(stats_data.get("total_revenue", 0)),
                    "total_products_sold": stats_data.get("total_products_sold", 0),
                    "unique_customers": stats_data.get("unique_customers", 0),
                    "exchange_sales": stats_data.get("exchange_sales", 0),
                }
            else:
                stats = {
                    "total_sales": stats_data[0] or 0,
                    "total_revenue": float(stats_data[1] or 0),
                    "total_products_sold": stats_data[2] or 0,
                    "unique_customers": stats_data[3] or 0,
                    "exchange_sales": stats_data[4] or 0,
                }
        else:
            stats = {
                "total_sales": 0,
                "total_revenue": 0.0,
                "total_products_sold": 0,
                "unique_customers": 0,
                "exchange_sales": 0,
            }

        return jsonify({"status": "success", "data": stats})

    except Exception as e:
        print(f"❌ ERROR getting sales stats: {str(e)}")
        import traceback

        traceback.print_exc()
        return jsonify(
            {
                "status": "error",
                "message": "Error interno del servidor",
                "error": str(e),
            }
        ), 500
