from flask import Blueprint, request, jsonify
from database.database import Database
from services.account_movements_service import AccountMovementsService
from datetime import datetime
import base64
import traceback

purchase_bp = Blueprint("purchase", __name__)


# Simple test route
@purchase_bp.route("/debug-file-save", methods=["GET"])
def debug_file_save():
    """Simple debug endpoint to test file saving"""
    try:
        db = Database()
        
        # Test with simple text content
        test_content = "Hello World - Test File"
        test_bytes = test_content.encode('utf-8')
        
        # For PostgreSQL, handle binary data properly
        if db.use_postgres:
            import psycopg2
            test_bytes_for_db = psycopg2.Binary(test_bytes)
            print(f"🗂️ Using psycopg2.Binary for PostgreSQL")
        else:
            test_bytes_for_db = test_bytes
            print(f"🗂️ Using raw bytes for SQLite")
        
        file_data = {
            "file_name": "debug_test.txt",
            "file_extension": ".txt", 
            "file_content": test_bytes_for_db,
            "comment": "Debug test file",
        }
        
        print(f"🗂️ Attempting to save debug file: {list(file_data.keys())}")
        result = db.add_record("file_attachments", file_data)
        print(f"🗂️ Debug file save result: {result}")
        
        if result.get("success"):
            file_id = result.get("rowid")
            print(f"✅ Debug file saved with ID: {file_id}")
            
            # Try to retrieve it
            retrieve_query = "SELECT id, file_name, file_extension FROM file_attachments WHERE id = %s"
            retrieved = db.execute_query(retrieve_query, (file_id,))
            print(f"🗂️ Retrieved debug file: {retrieved}")
            
            return jsonify({
                "status": "success",
                "message": "Debug file save successful",
                "file_id": file_id,
                "retrieved": retrieved
            }), 200
        else:
            return jsonify({
                "status": "error",
                "message": "Debug file save failed",
                "details": result
            }), 500
            
    except Exception as e:
        print(f"❌ Debug file save error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": f"Debug error: {str(e)}"
        }), 500


@purchase_bp.route("/test-file-upload", methods=["POST"])
def test_file_upload():
    """Test endpoint to debug file upload functionality"""
    try:
        data = request.get_json()
        print(f"🧪 Test file upload data: {data}")
        
        db = Database()
        
        # Create a simple test file
        test_content = "Test file content for debugging"
        test_bytes = test_content.encode('utf-8')
        
        # For PostgreSQL, handle binary data properly
        if db.use_postgres:
            import psycopg2
            test_bytes_for_db = psycopg2.Binary(test_bytes)
        else:
            test_bytes_for_db = test_bytes
        
        file_data = {
            "file_name": "test_file.txt",
            "file_extension": ".txt", 
            "file_content": test_bytes_for_db,
            "comment": "Test file for debugging",
        }
        
        print(f"🧪 Attempting to save test file: {file_data}")
        result = db.add_record("file_attachments", file_data)
        print(f"🧪 Test file save result: {result}")
        
        if result.get("success"):
            # Try to retrieve the file
            file_id = result.get("rowid")
            retrieve_query = "SELECT * FROM file_attachments WHERE id = %s"
            retrieved = db.execute_query(retrieve_query, (file_id,))
            print(f"🧪 Retrieved file: {retrieved}")
            
            return jsonify({
                "status": "success",
                "message": "Test file upload successful",
                "file_id": file_id,
                "save_result": result,
                "retrieved_data": retrieved
            }), 200
        else:
            return jsonify({
                "status": "error", 
                "message": "Test file upload failed",
                "details": result
            }), 500
            
    except Exception as e:
        print(f"🧪 Test file upload error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": f"Test file upload exception: {str(e)}"
        }), 500


@purchase_bp.route("/test-file-system", methods=["GET"])
def test_route():
    print(f"🟢 TEST ROUTE HIT: /api/purchases/test")
    return jsonify({"status": "success", "message": "Purchase router is working!"}), 200


# Crear una nueva compra con sus productos
@purchase_bp.route("/", methods=["POST"])
def create_purchase():
    try:
        data = request.get_json()
        print(f"🔍 Received purchase data: {data}")
        print(f"🔍 Request headers: {dict(request.headers)}")
        print(f"🔍 Request method: {request.method}")
        print(f"🔍 Request URL: {request.url}")

        # Validar datos requeridos
        required_fields = ["entity_id", "subtotal", "total", "products"]
        for field in required_fields:
            if field not in data:
                return jsonify(
                    {"status": "error", "message": f"Campo requerido: {field}"}
                ), 400

        if not data["products"] or len(data["products"]) == 0:
            return jsonify(
                {"status": "error", "message": "Debe incluir al menos un producto"}
            ), 400

        db = Database()
        file_id = None

        # Procesar archivo adjunto si existe
        if data.get("invoice_file"):
            print("🗂️ Processing invoice file...")
            try:
                invoice_file = data["invoice_file"]
                print(f"🗂️ Invoice file type: {type(invoice_file)}")
                print(f"🗂️ Invoice file length: {len(invoice_file) if isinstance(invoice_file, str) else 'N/A'}")
                
                # Si es un archivo base64, procesarlo
                if isinstance(invoice_file, str):
                    try:
                        file_content = base64.b64decode(invoice_file)
                        print(f"🗂️ Decoded file content length: {len(file_content)} bytes")
                    except Exception as decode_error:
                        print(f"❌ Error decoding base64: {decode_error}")
                        raise decode_error
                    
                    # For PostgreSQL, handle binary data properly
                    if db.use_postgres:
                        import psycopg2
                        file_content_for_db = psycopg2.Binary(file_content)
                    else:
                        file_content_for_db = file_content
                    
                    file_data = {
                        "file_name": f"invoice_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf",
                        "file_extension": ".pdf",  # Make sure it has the dot
                        "file_content": file_content_for_db,
                        "comment": "Factura de compra",
                    }
                    print(f"🗂️ Attempting to save file data: {list(file_data.keys())}")
                    
                    file_result = db.add_record("file_attachments", file_data)
                    print(f"🗂️ File save result: {file_result}")
                    
                    if file_result.get("success"):
                        file_id = file_result.get("rowid")
                        print(f"✅ File saved successfully with ID: {file_id}")
                    else:
                        print(f"❌ Error saving file: {file_result}")
                else:
                    print(f"❌ Invoice file is not a string: {type(invoice_file)}")
            except Exception as e:
                print(f"❌ Error processing invoice file: {e}")
                import traceback
                traceback.print_exc()
        else:
            print("🗂️ No invoice file provided in request data")

        # Crear la compra principal
        purchase_data = {
            "entity_id": data["entity_id"],
            "purchase_date": data.get("purchase_date"),  # Let DB set if not provided
            "subtotal": data["subtotal"],
            "discount": data.get("discount", 0),
            "total": data["total"],
            "invoice_number": data.get("invoice_number", ""),
            "notes": data.get("notes", ""),
            "status": data.get("status", "Pendiente de entrega"),
            "file_id": file_id,
            "delivery_date": data.get("delivery_date"),
        }

        # Filtrar valores None para campos opcionales
        purchase_data = {k: v for k, v in purchase_data.items() if v is not None}

        purchase_result = db.add_record("purchases", purchase_data)

        if not purchase_result.get("success"):
            return jsonify(
                {"status": "error", "message": "Error al crear la compra"}
            ), 500

        purchase_id = purchase_result.get("rowid")
        print(f"DEBUG: Created purchase with ID: {purchase_id}")

        # Agregar los productos de la compra
        for product in data["products"]:
            print(
                f"DEBUG: Processing product - ID: {product.get('product_id')}, Quantity: {product.get('quantity')}, Cost: {product.get('cost_price')}"
            )

            product_detail = {
                "purchase_id": purchase_id,
                "product_id": product["product_id"],
                "cost_price": product["cost_price"],
                "quantity": product["quantity"],
                "discount": product.get("discount", 0),
                "subtotal": product["subtotal"],
            }

            # Agregar metadata si existe información adicional
            if product.get("stock_variants"):
                product_detail["metadata"] = str(product["stock_variants"])

            detail_result = db.add_record("purchases_detail", product_detail)
            print(
                f"DEBUG: Product detail save result - Success: {detail_result.get('success')}, ID: {detail_result.get('rowid')}"
            )

            if not detail_result.get("success"):
                # Si falla algún detalle, eliminar la compra y el archivo
                db.delete_record("purchases", "id = %s", (purchase_id,))
                if file_id:
                    db.delete_record("file_attachments", "id = %s", (file_id,))
                return jsonify(
                    {
                        "status": "error",
                        "message": "Error al agregar productos a la compra",
                    }
                ), 500

        # CREATE ACCOUNT MOVEMENT (DEBIT) FOR THE PROVIDER
        # This creates the debt for the purchase
        try:
            account_service = AccountMovementsService()

            # Create debit movement for the provider (increases debt)
            movement_result = account_service.create_provider_debit_movement(
                entity_id=data["entity_id"],
                amount=data["total"],
                description=f"Compra - Factura: {data.get('invoice_number', 'N/A')}",
                purchase_id=purchase_id,
                partial_payment=0.0,  # No partial payment for now
                partial_payment_method="efectivo",
            )

            if not movement_result.get("success"):
                print(
                    f"⚠️ WARNING: Could not create account movement for purchase {purchase_id}: {movement_result.get('message')}"
                )
                # Don't fail the purchase creation, but log the error
            else:
                print(
                    f"✅ Created account movement for purchase {purchase_id}, new balance: ${movement_result.get('new_balance', 0)}"
                )

        except Exception as e:
            print(
                f"⚠️ WARNING: Error creating account movement for purchase {purchase_id}: {e}"
            )
            # Don't fail the purchase creation, but log the error

        return jsonify(
            {
                "status": "éxito",
                "message": "Compra creada exitosamente",
                "purchase_id": purchase_id,
            }
        ), 201

    except Exception as e:
        print(f"Error creating purchase: {e}")
        return jsonify(
            {"status": "error", "message": "Error interno del servidor"}
        ), 500


# Obtener todas las compras con relaciones completas
# TODO: sumar los productos que se compraron
@purchase_bp.route("/", methods=["GET"])
def get_purchases():
    try:
        db = Database()
        query = """
        SELECT 
            p.*,
            e.entity_name as provider_name,
            e.cuit as provider_cuit,
            e.phone_number as provider_phone,
            e.email as provider_email,
            fa.file_name as invoice_file_name,
            fa.file_extension as invoice_file_extension
        FROM purchases p
        LEFT JOIN entities e ON p.entity_id = e.id
        LEFT JOIN file_attachments fa ON p.file_id = fa.id
        ORDER BY p.purchase_date DESC
        """
        purchases = db.execute_query(query)
        return jsonify(purchases), 200
    except Exception as e:
        print(f"Error fetching purchases: {e}")
        return jsonify(
            {"status": "error", "message": "Error al obtener las compras"}
        ), 500


# Obtener compras por proveedor con información completa
@purchase_bp.route("/provider/<int:provider_id>", methods=["GET"])
def get_purchases_by_provider(provider_id):
    try:
        db = Database()
        query = """
        SELECT 
            p.*,
            e.entity_name as provider_name,
            e.cuit as provider_cuit,
            e.razon_social as provider_razon_social,
            fa.file_name as invoice_file_name
        FROM purchases p
        LEFT JOIN entities e ON p.entity_id = e.id
        LEFT JOIN file_attachments fa ON p.file_id = fa.id
        WHERE p.entity_id = %s
        ORDER BY p.purchase_date DESC
        """
        purchases = db.execute_query(query, (provider_id,))
        return jsonify(purchases), 200
    except Exception as e:
        print(f"Error fetching purchases by provider: {e}")
        return jsonify(
            {"status": "error", "message": "Error al obtener las compras del proveedor"}
        ), 500


# Test endpoint to debug routing issues
@purchase_bp.route("/test-debug", methods=["GET"])
def test_debug():
    import sys

    print("🚨🚨🚨 TEST DEBUG ENDPOINT HIT!")
    sys.stdout.flush()
    return jsonify({"status": "success", "message": "Test endpoint working"}), 200


# Obtener una compra por ID con sus detalles completos
@purchase_bp.route("/<int:purchase_id>", methods=["GET"])
def get_purchase_by_id(purchase_id):
    print(f"🔍🔍🔍 PURCHASE DETAIL API CALL: GET /api/purchases/{purchase_id} - START")
    print(f"🔍🔍🔍 Purchase ID type: {type(purchase_id)}, value: {purchase_id}")
    try:
        db = Database()

        # Use the same working query structure as the purchases list
        purchase_query = """
        SELECT 
            p.*,
            e.entity_name as provider_name,
            e.cuit as provider_cuit,
            e.phone_number as provider_phone,
            e.email as provider_email,
            fa.file_name as invoice_file_name,
            fa.file_extension as invoice_file_extension
        FROM purchases p
        LEFT JOIN entities e ON p.entity_id = e.id
        LEFT JOIN file_attachments fa ON p.file_id = fa.id
        WHERE p.id = %s
        """

        print(f"🔍🔍🔍 Executing query with purchase_id: {purchase_id}")
        purchase_result = db.execute_query(purchase_query, (purchase_id,))
        print(
            f"🔍🔍🔍 Purchase query returned {len(purchase_result) if purchase_result else 0} results"
        )

        if not purchase_result:
            print(f"🔍🔍🔍 No purchase found for ID: {purchase_id}")
            return jsonify({"status": "error", "message": "Compra no encontrada"}), 404

        purchase_data = purchase_result[0]
        print(f"🔍🔍🔍 Found purchase data: {purchase_data}")

        # Get purchase details/products
        details_query = """
        SELECT 
            pd.id, pd.purchase_id, pd.product_id, pd.cost_price, pd.quantity, 
            pd.discount, pd.subtotal, pd.metadata,
            pr.product_name, pr.provider_code, pr.cost as current_cost, pr.sale_price as current_sale_price,
            b.brand_name, g.group_name
        FROM purchases_detail pd
        LEFT JOIN products pr ON pd.product_id = pr.id
        LEFT JOIN brands b ON pr.brand_id = b.id
        LEFT JOIN groups g ON pr.group_id = g.id
        WHERE pd.purchase_id = %s
        """
        details = db.execute_query(details_query, (purchase_id,))
        print(
            f"🔍🔍🔍 Purchase details query returned {len(details) if details else 0} products"
        )

        # Add products to purchase data
        purchase_data["products"] = details or []

        print(f"🔍🔍🔍 Returning successful response for purchase {purchase_id}")
        return jsonify(purchase_data), 200

    except Exception as e:
        print(f"🔍🔍🔍 ERROR in get_purchase_by_id: {e}")
        print(f"🔍🔍🔍 Full traceback: {traceback.format_exc()}")
        return jsonify(
            {"status": "error", "message": "Error al obtener la compra"}
        ), 500


# Obtener información de métodos de pago y bancos para compras
@purchase_bp.route("/payment-info", methods=["GET"])
def get_payment_info():
    try:
        db = Database()

        # Obtener combinaciones de bancos y métodos de pago desde BANKS_PAYMENT_METHODS
        payment_methods_query = """
        SELECT 
            bpm.id,
            bpm.amount,
            b.name as bank_name,
            b.swift_code as bank_code,
            pm.method_name as payment_method_name,
            pm.method_name || ' - ' || b.name as display_name
        FROM banks_payment_methods bpm
        LEFT JOIN banks b ON bpm.bank_id = b.id
        LEFT JOIN payment_methods pm ON bpm.payment_method_id = pm.id
        ORDER BY pm.method_name, b.name
        """
        payment_methods = db.execute_query(payment_methods_query)

        # También obtener bancos separados por si se necesitan
        banks_query = """
        SELECT id, name, swift_code as code 
        FROM banks 
        ORDER BY name
        """
        banks = db.execute_query(banks_query)

        # Y métodos de pago básicos
        basic_payment_methods_query = """
        SELECT id, method_name
        FROM payment_methods
        ORDER BY method_name
        """
        basic_payment_methods = db.execute_query(basic_payment_methods_query)

        return jsonify(
            {
                "payment_methods": payment_methods,
                "banks": banks,
                "basic_payment_methods": basic_payment_methods,
            }
        ), 200

    except Exception as e:
        print(f"Error fetching payment info: {e}")
        return jsonify(
            {"status": "error", "message": "Error al obtener información de pagos"}
        ), 500


# Obtener archivos adjuntos de una compra
@purchase_bp.route("/<int:purchase_id>/attachments", methods=["GET"])
def get_purchase_attachments(purchase_id):
    try:
        db = Database()

        query = """
        SELECT fa.id, fa.file_name, fa.file_extension, fa.upload_date, fa.comment
        FROM purchases p
        LEFT JOIN file_attachments fa ON p.file_id = fa.id
        WHERE p.id = %s AND fa.id IS NOT NULL
        """
        attachments = db.execute_query(query, (purchase_id,))

        return jsonify(attachments), 200

    except Exception as e:
        print(f"Error fetching purchase attachments: {e}")
        return jsonify(
            {"status": "error", "message": "Error al obtener archivos adjuntos"}
        ), 500


# Descargar archivo adjunto
@purchase_bp.route("/attachment/<int:file_id>", methods=["GET"])
def download_attachment(file_id):
    try:
        db = Database()

        query = """
        SELECT file_name, file_extension, file_content
        FROM file_attachments
        WHERE id = %s
        """
        file_data = db.execute_query(query, (file_id,))

        if not file_data:
            return jsonify({"status": "error", "message": "Archivo no encontrado"}), 404

        file_info = file_data[0]
        file_content_base64 = base64.b64encode(file_info["file_content"]).decode(
            "utf-8"
        )

        return jsonify(
            {
                "file_name": file_info["file_name"],
                "file_extension": file_info["file_extension"],
                "file_content": file_content_base64,
            }
        ), 200

    except Exception as e:
        print(f"Error downloading attachment: {e}")
        return jsonify(
            {"status": "error", "message": "Error al descargar archivo"}
        ), 500


# Obtener resumen de compras (estadísticas)
@purchase_bp.route("/summary", methods=["GET"])
def get_purchases_summary():
    try:
        db = Database()

        # Resumen general
        summary_query = """
        SELECT 
            COUNT(*) as total_purchases,
            SUM(total) as total_amount,
            SUM(CASE WHEN status = 'Pendiente de entrega' THEN 1 ELSE 0 END) as pending_purchases,
            SUM(CASE WHEN status = 'Recibido' THEN 1 ELSE 0 END) as received_purchases,
            SUM(CASE WHEN status = 'Cancelado' THEN 1 ELSE 0 END) as cancelled_purchases
        FROM purchases
        """
        summary = db.execute_query(summary_query)

        # Compras por proveedor (top 5)
        by_provider_query = """
        SELECT 
            e.entity_name as provider_name,
            COUNT(p.id) as purchase_count,
            SUM(p.total) as total_amount
        FROM purchases p
        LEFT JOIN entities e ON p.entity_id = e.id
        GROUP BY p.entity_id, e.entity_name
        ORDER BY total_amount DESC
        LIMIT 5
        """
        by_provider = db.execute_query(by_provider_query)

        # Provider payment summary (separate from purchases)
        by_payment_method_query = """
        SELECT 
            pm.method_name || ' - ' || b.name as payment_method,
            COUNT(pp.id) as payment_count,
            SUM(pp.amount) as total_amount
        FROM purchases_payments pp
        LEFT JOIN banks_payment_methods bpm ON pp.payment_method_id = bpm.id
        LEFT JOIN banks b ON bpm.bank_id = b.id
        LEFT JOIN payment_methods pm ON bpm.payment_method_id = pm.id
        GROUP BY pm.method_name, b.name
        ORDER BY total_amount DESC
        """
        by_payment_method = db.execute_query(by_payment_method_query)

        return jsonify(
            {
                "summary": summary[0] if summary else {},
                "by_provider": by_provider,
                "by_payment_method": by_payment_method,
            }
        ), 200

    except Exception as e:
        print(f"Error fetching purchases summary: {e}")
        return jsonify(
            {"status": "error", "message": "Error al obtener resumen de compras"}
        ), 500


# Obtener estadísticas de productos por grupos
@purchase_bp.route("/product-stats", methods=["GET"])
def get_product_statistics():
    try:
        db = Database()

        # Productos más comprados por grupo
        products_by_group_query = """
        SELECT 
            g.group_name,
            COUNT(pd.id) as purchase_count,
            SUM(pd.quantity) as total_quantity,
            SUM(pd.subtotal) as total_spent,
            AVG(pd.cost_price) as avg_cost_price,
            COUNT(DISTINCT p.id) as unique_products
        FROM purchases_detail pd
        LEFT JOIN products p ON pd.product_id = p.id
        LEFT JOIN groups g ON p.group_id = g.id
        WHERE g.group_name IS NOT NULL
        GROUP BY g.id, g.group_name
        ORDER BY total_quantity DESC
        """
        products_by_group = db.execute_query(products_by_group_query)

        # Top productos más comprados con su grupo
        top_products_query = """
        SELECT 
            p.product_name,
            g.group_name,
            SUM(pd.quantity) as total_quantity,
            SUM(pd.subtotal) as total_spent,
            COUNT(pd.id) as purchase_frequency,
            AVG(pd.cost_price) as avg_cost_price
        FROM purchases_detail pd
        LEFT JOIN products p ON pd.product_id = p.id
        LEFT JOIN groups g ON p.group_id = g.id
        WHERE p.product_name IS NOT NULL
        GROUP BY p.id, p.product_name, g.group_name
        ORDER BY total_quantity DESC
        LIMIT 10
        """
        top_products = db.execute_query(top_products_query)

        # Estadísticas por marca dentro de cada grupo
        brands_by_group_query = """
        SELECT 
            g.group_name,
            b.brand_name,
            SUM(pd.quantity) as total_quantity,
            SUM(pd.subtotal) as total_spent,
            COUNT(DISTINCT p.id) as unique_products
        FROM purchases_detail pd
        LEFT JOIN products p ON pd.product_id = p.id
        LEFT JOIN groups g ON p.group_id = g.id
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE g.group_name IS NOT NULL AND b.brand_name IS NOT NULL
        GROUP BY g.id, g.group_name, b.id, b.brand_name
        ORDER BY g.group_name, total_quantity DESC
        """
        brands_by_group = db.execute_query(brands_by_group_query)

        # Resumen general de productos
        product_summary_query = """
        SELECT 
            COUNT(DISTINCT p.id) as total_unique_products,
            COUNT(DISTINCT g.id) as total_groups,
            COUNT(DISTINCT b.id) as total_brands,
            SUM(pd.quantity) as total_products_purchased,
            SUM(pd.subtotal) as total_products_value
        FROM purchases_detail pd
        LEFT JOIN products p ON pd.product_id = p.id
        LEFT JOIN groups g ON p.group_id = g.id
        LEFT JOIN brands b ON p.brand_id = b.id
        """
        product_summary = db.execute_query(product_summary_query)

        # Evolución mensual de compras por grupo (últimos 6 meses)
        monthly_by_group_query = """
        SELECT 
            g.group_name,
            TO_CHAR(pur.purchase_date, 'YYYY-MM') as month,
            SUM(pd.quantity) as quantity,
            SUM(pd.subtotal) as total_spent
        FROM purchases_detail pd
        LEFT JOIN purchases pur ON pd.purchase_id = pur.id
        LEFT JOIN products p ON pd.product_id = p.id
        LEFT JOIN groups g ON p.group_id = g.id
        WHERE g.group_name IS NOT NULL 
            AND pur.purchase_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY g.id, g.group_name, TO_CHAR(pur.purchase_date, 'YYYY-MM')
        ORDER BY month DESC, quantity DESC
        """
        monthly_by_group = db.execute_query(monthly_by_group_query)

        return jsonify(
            {
                "product_summary": product_summary[0] if product_summary else {},
                "products_by_group": products_by_group,
                "top_products": top_products,
                "brands_by_group": brands_by_group,
                "monthly_by_group": monthly_by_group,
            }
        ), 200

    except Exception as e:
        print(f"Error fetching product statistics: {e}")
        return jsonify(
            {"status": "error", "message": "Error al obtener estadísticas de productos"}
        ), 500


# Actualizar el estado de una compra
@purchase_bp.route("/<int:purchase_id>/status", methods=["PUT"])
def update_purchase_status(purchase_id):
    try:
        data = request.get_json()

        if "status" not in data:
            return jsonify({"status": "error", "message": "Estado requerido"}), 400

        db = Database()

        update_data = {"status": data["status"]}

        if data.get("delivery_date"):
            update_data["delivery_date"] = data["delivery_date"]
        elif data["status"] == "Recibido":
            update_data["delivery_date"] = datetime.now().isoformat()

        # Add the id to the data for the update_record method
        update_data["id"] = purchase_id
        success = db.update_record("purchases", update_data)

        if success.get("success"):
            return jsonify(
                {"status": "éxito", "message": "Estado actualizado exitosamente"}
            ), 200
        else:
            return jsonify(
                {"status": "error", "message": "Error al actualizar el estado"}
            ), 500

    except Exception as e:
        print(f"Error updating purchase status: {e}")
        return jsonify(
            {"status": "error", "message": "Error interno del servidor"}
        ), 500


# Recibir compra y actualizar inventario
@purchase_bp.route("/<int:purchase_id>/receive", methods=["POST"])
def receive_purchase(purchase_id):
    try:
        data = request.get_json()
        storage_id = data.get("storage_id")

        if not storage_id:
            return jsonify(
                {"status": "error", "message": "ID de almacén requerido"}
            ), 400

        db = Database()

        # Verificar que la compra existe y está pendiente
        purchase = db.get_record_by_id("purchases", purchase_id)
        if not purchase.get("success") or not purchase.get("record"):
            return jsonify({"status": "error", "message": "Compra no encontrada"}), 404

        purchase_data = purchase["record"]
        if purchase_data["status"] != "Pendiente de entrega":
            return jsonify(
                {"status": "error", "message": "La compra ya fue procesada"}
            ), 400

        # Obtener productos de la compra
        details_query = """
        SELECT pd.product_id, pd.quantity
        FROM purchases_detail pd
        WHERE pd.purchase_id = ?
        """
        product_details = db.execute_query(details_query, (purchase_id,))

        # Actualizar stock para cada producto
        for detail in product_details:
            product_id = detail["product_id"]
            quantity = detail["quantity"]

            # Verificar si ya existe stock para este producto en este almacén
            existing_stock_query = """
            SELECT id, quantity FROM warehouse_stock 
            WHERE product_id = ? AND branch_id = ?
            """
            existing_stock = db.execute_query(
                existing_stock_query, (product_id, storage_id)
            )

            if existing_stock:
                # Actualizar stock existente
                new_quantity = existing_stock[0]["quantity"] + quantity
                update_stock_data = {
                    "id": existing_stock[0]["id"],
                    "quantity": new_quantity,
                    "last_updated": datetime.now().isoformat(),
                }
                db.update_record("warehouse_stock", update_stock_data)
            else:
                # Crear nuevo registro de stock
                stock_data = {
                    "product_id": product_id,
                    "branch_id": storage_id,
                    "quantity": quantity,
                    "provider_id": purchase_data[
                        "entity_id"
                    ],  # Add provider_id from purchase
                }
                db.add_record("warehouse_stock", stock_data)

        # Actualizar estado de la compra
        update_data = {
            "id": purchase_id,
            "status": "Recibido",
            "delivery_date": datetime.now().isoformat(),
        }
        db.update_record("purchases", update_data)

        return jsonify(
            {
                "status": "éxito",
                "message": "Compra recibida e inventario actualizado exitosamente",
            }
        ), 200

    except Exception as e:
        print(f"Error receiving purchase: {e}")
        return jsonify(
            {"status": "error", "message": "Error interno del servidor"}
        ), 500


# Generar códigos de barras para productos de una compra
@purchase_bp.route("/<int:purchase_id>/barcodes", methods=["POST"])
def generate_barcodes(purchase_id):
    try:
        db = Database()

        # Obtener productos de la compra
        details_query = """
        SELECT pd.product_id, pd.quantity, pr.product_name, pr.barcode
        FROM purchases_detail pd
        LEFT JOIN products pr ON pd.product_id = pr.id
        WHERE pd.purchase_id = ?
        """
        products = db.execute_query(details_query, (purchase_id,))

        if not products:
            return jsonify(
                {
                    "status": "error",
                    "message": "No se encontraron productos en la compra",
                }
            ), 404

        # Aquí podrías integrar con una librería de generación de códigos de barras
        # Por ahora solo devolvemos la información de los productos
        barcodes_info = []
        for product in products:
            for i in range(product["quantity"]):
                barcodes_info.append(
                    {
                        "product_name": product["product_name"],
                        "barcode": product["barcode"],
                        "copy_number": i + 1,
                    }
                )

        return jsonify(
            {
                "status": "éxito",
                "message": "Códigos de barras generados",
                "barcodes": barcodes_info,
            }
        ), 200

    except Exception as e:
        print(f"Error generating barcodes: {e}")
        return jsonify(
            {"status": "error", "message": "Error interno del servidor"}
        ), 500


# Eliminar una compra
@purchase_bp.route("/<int:purchase_id>", methods=["DELETE"])
def delete_purchase(purchase_id):
    try:
        db = Database()

        # Verificar que la compra existe
        purchase = db.get_record_by_id("purchases", purchase_id)
        if not purchase.get("success") or not purchase.get("record"):
            return jsonify({"status": "error", "message": "Compra no encontrada"}), 404

        purchase_data = purchase["record"]
        # No permitir eliminar compras recibidas
        if purchase_data["status"] == "Recibido":
            return jsonify(
                {
                    "status": "error",
                    "message": "No se puede eliminar una compra recibida",
                }
            ), 400

        # Eliminar detalles de la compra primero
        delete_details_query = "DELETE FROM purchases_detail WHERE purchase_id = ?"
        db.execute_query(delete_details_query, (purchase_id,))

        # Eliminar la compra
        result = db.delete_record("purchases", "id = %s", (purchase_id,))

        if result.get("success"):
            return jsonify(
                {"status": "éxito", "message": "Compra eliminada exitosamente"}
            ), 200
        else:
            return jsonify(
                {"status": "error", "message": "Error al eliminar la compra"}
            ), 500

    except Exception as e:
        print(f"Error deleting purchase: {e}")
        return jsonify(
            {"status": "error", "message": "Error interno del servidor"}
        ), 500


# Create sample test data for development
@purchase_bp.route("/create-sample-data", methods=["POST"])
def create_sample_data():
    """
    Development endpoint to create sample data for testing
    """
    try:
        from datetime import datetime, timedelta
        import random

        db = Database()

        # Create payment methods if they don't exist
        payment_methods = [
            {
                "method_name": "efectivo",
                "display_name": "Efectivo",
                "description": "Pago en efectivo",
            },
            {
                "method_name": "transferencia",
                "display_name": "Transferencia",
                "description": "Transferencia bancaria",
            },
        ]

        for method in payment_methods:
            existing = db.get_record_by_clause(
                "payment_methods", "method_name = ?", method["method_name"]
            )
            if not (existing.get("success") and existing.get("record")):
                db.add_record("payment_methods", method)

        # Create banks if they don't exist
        banks = [
            {"name": "Banco Nación", "swift_code": "NACNAR01"},
            {"name": "Banco Santander", "swift_code": "BSCHERAR"},
        ]

        for bank in banks:
            existing = db.get_record_by_clause("banks", "name = ?", bank["name"])
            if not (existing.get("success") and existing.get("record")):
                db.add_record("banks", bank)

        # Create bank-payment combinations
        bank_records = db.get_all_records("banks")
        payment_records = db.get_all_records("payment_methods")

        bank_payment_id = None
        if bank_records and payment_records:
            combination = {
                "bank_id": bank_records[0]["id"],
                "payment_method_id": payment_records[0]["id"],
                "amount": 0.00,
            }
            existing = db.get_all_records_by_clause(
                "banks_payment_methods",
                "bank_id = ? AND payment_method_id = ?",
                (combination["bank_id"], combination["payment_method_id"]),
            )
            if not existing:
                result = db.add_record("banks_payment_methods", combination)
                if result.get("success"):
                    bank_payment_id = result.get("rowid")
            else:
                bank_payment_id = existing[0]["id"]

        # Create providers
        providers = [
            {
                "entity_name": "Proveedor ABC S.A.",
                "entity_type": "proveedor",
                "razon_social": "ABC Sociedad Anónima",
                "responsabilidad_iva": 1,
                "domicilio_comercial": "Av. Corrientes 1234, CABA",
                "cuit": "20-12345678-9",
                "contact_name": "Juan Pérez",
                "phone_number": "+54 11 1234-5678",
                "email": "contacto@proveedorabc.com.ar",
            }
        ]

        provider_id = None
        for provider in providers:
            existing = db.get_record_by_clause("entities", "cuit = ?", provider["cuit"])
            if not (existing.get("success") and existing.get("record")):
                result = db.add_record("entities", provider)
                if result.get("success"):
                    provider_id = result.get("rowid")
            else:
                provider_id = existing["record"]["id"]

        # Create products
        products = [
            {
                "product_name": "Jean Básico Azul",
                "provider_code": "JBA001",
                "description": "Jean básico color azul",
                "cost": 15000.00,
                "sale_price": 25000.00,
                "provider_id": provider_id,
                "state": "activo",
            }
        ]

        product_id = None
        for product in products:
            existing = db.get_record_by_clause(
                "products", "provider_code = ?", product["provider_code"]
            )
            if not (existing.get("success") and existing.get("record")):
                result = db.add_record("products", product)
                if result.get("success"):
                    product_id = result.get("rowid")
            else:
                product_id = existing["record"]["id"]

        # Create sample purchases
        if provider_id and product_id:
            statuses = ["Pendiente de entrega", "Recibido", "Cancelado"]
            base_date = datetime.now() - timedelta(days=60)

            for i in range(3):
                purchase_date = base_date + timedelta(days=i * 20)
                status = statuses[i]

                subtotal = 45000.00
                discount = 2250.00 if i == 0 else 0.00
                total = subtotal - discount

                purchase_data = {
                    "entity_id": provider_id,
                    "purchase_date": purchase_date.isoformat(),
                    "subtotal": subtotal,
                    "discount": discount,
                    "total": total,
                    "invoice_number": f"FAC-{2024000 + i + 1}",
                    "transaction_number": f"TXN{purchase_date.strftime('%Y%m%d')}{i:03d}",
                    "notes": f"Compra de prueba #{i + 1} - {status}",
                    "status": status,
                }

                # Only add payment method if we have one
                if bank_payment_id:
                    purchase_data["payment_method"] = bank_payment_id

                if status == "Recibido":
                    purchase_data["delivery_date"] = (
                        purchase_date + timedelta(days=7)
                    ).isoformat()

                # Check if purchase already exists
                existing = db.get_record_by_clause(
                    "purchases", "invoice_number = ?", purchase_data["invoice_number"]
                )
                if not (existing.get("success") and existing.get("record")):
                    result = db.add_record("purchases", purchase_data)
                    if result.get("success"):
                        purchase_id = result.get("rowid")

                        # Add purchase detail
                        detail_data = {
                            "purchase_id": purchase_id,
                            "product_id": product_id,
                            "cost_price": 15000.00,
                            "quantity": 3,
                            "discount": 0.0,
                            "subtotal": 45000.00,
                        }

                        db.add_record("purchases_detail", detail_data)

        return jsonify(
            {"status": "success", "message": "Sample data created successfully"}
        ), 200

    except Exception as e:
        print(f"Error creating sample data: {e}")
        return jsonify(
            {"status": "error", "message": f"Error creating sample data: {str(e)}"}
        ), 500


# ============================================================================
# PURCHASE PAYMENTS ENDPOINTS
# ============================================================================


@purchase_bp.route("/<int:purchase_id>/payments", methods=["POST"])
def create_purchase_payment(purchase_id):
    """Create a new payment for a purchase"""
    try:
        db = Database()
        data = request.get_json()

        # Validate required fields
        required_fields = ["payment_method", "amount"]
        for field in required_fields:
            if field not in data:
                return jsonify(
                    {"status": "error", "message": f"Field '{field}' is required"}
                ), 400

        # Verify purchase exists
        purchase_query = "SELECT id FROM purchases WHERE id = %s"
        purchase_result = db.execute_query(purchase_query, (purchase_id,))

        if not purchase_result.get("success") or not purchase_result.get("data"):
            return jsonify({"status": "error", "message": "Purchase not found"}), 404

        # Prepare payment data
        payment_data = {
            "purchase_id": purchase_id,
            "payment_method": data["payment_method"],
            "amount": data["amount"],
            "payment_date": data.get(
                "payment_date"
            ),  # Optional, will use CURRENT_TIMESTAMP if not provided
            "notes": data.get("notes", ""),
        }

        # Create payment record
        result = db.add_record("purchases_payments", payment_data)

        if result.get("success"):
            return jsonify(
                {
                    "status": "success",
                    "message": "Payment created successfully",
                    "payment_id": result.get("id"),
                }
            ), 201
        else:
            return jsonify(
                {"status": "error", "message": "Error creating payment"}
            ), 500

    except Exception as e:
        print(f"Error creating purchase payment: {e}")
        return jsonify(
            {"status": "error", "message": f"Error creating payment: {str(e)}"}
        ), 500


@purchase_bp.route("/<int:purchase_id>/payments", methods=["GET"])
def get_purchase_payments(purchase_id):
    """Get all payments for a specific purchase"""
    try:
        db = Database()

        # Verify purchase exists
        purchase_query = "SELECT id FROM purchases WHERE id = %s"
        purchase_result = db.execute_query(purchase_query, (purchase_id,))

        if not purchase_result:
            return jsonify({"status": "error", "message": "Purchase not found"}), 404

        # Get all payments for the purchase
        payments_query = """
        SELECT 
            id,
            purchase_id,
            payment_method,
            amount,
            payment_date,
            notes,
            created_at
        FROM purchases_payments 
        WHERE purchase_id = %s 
        ORDER BY payment_date DESC, created_at DESC
        """

        payments_result = db.execute_query(payments_query, (purchase_id,))

        return jsonify({"status": "success", "payments": payments_result or []}), 200

    except Exception as e:
        print(f"Error getting purchase payments: {e}")
        return jsonify(
            {"status": "error", "message": f"Error retrieving payments: {str(e)}"}
        ), 500


@purchase_bp.route(
    "/purchases/<int:purchase_id>/payments/<int:payment_id>", methods=["PUT"]
)
def update_purchase_payment(purchase_id, payment_id):
    """Update a specific payment"""
    try:
        db = Database()
        data = request.get_json()

        # Verify payment exists and belongs to the purchase
        payment_query = """
        SELECT id FROM purchases_payments 
        WHERE id = %s AND purchase_id = %s
        """
        payment_result = db.execute_query(payment_query, (payment_id, purchase_id))

        if not payment_result.get("success") or not payment_result.get("data"):
            return jsonify({"status": "error", "message": "Payment not found"}), 404

        # Prepare update data (only include fields that are provided)
        update_data = {}
        allowed_fields = ["payment_method", "amount", "payment_date", "notes"]

        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]

        if not update_data:
            return jsonify(
                {"status": "error", "message": "No valid fields to update"}
            ), 400

        # Update payment
        result = db.update_record(
            "purchases_payments", update_data, "id = %s", (payment_id,)
        )

        if result.get("success"):
            return jsonify(
                {"status": "success", "message": "Payment updated successfully"}
            ), 200
        else:
            return jsonify(
                {"status": "error", "message": "Error updating payment"}
            ), 500

    except Exception as e:
        print(f"Error updating purchase payment: {e}")
        return jsonify(
            {"status": "error", "message": f"Error updating payment: {str(e)}"}
        ), 500


@purchase_bp.route(
    "/purchases/<int:purchase_id>/payments/<int:payment_id>", methods=["DELETE"]
)
def delete_purchase_payment(purchase_id, payment_id):
    """Delete a specific payment"""
    try:
        db = Database()

        # Verify payment exists and belongs to the purchase
        payment_query = """
        SELECT id FROM purchases_payments 
        WHERE id = %s AND purchase_id = %s
        """
        payment_result = db.execute_query(payment_query, (payment_id, purchase_id))

        if not payment_result.get("success") or not payment_result.get("data"):
            return jsonify({"status": "error", "message": "Payment not found"}), 404

        # Delete payment
        result = db.delete_record("purchases_payments", "id = %s", (payment_id,))

        if result.get("success"):
            return jsonify(
                {"status": "success", "message": "Payment deleted successfully"}
            ), 200
        else:
            return jsonify(
                {"status": "error", "message": "Error deleting payment"}
            ), 500

    except Exception as e:
        print(f"Error deleting purchase payment: {e}")
        return jsonify(
            {"status": "error", "message": f"Error deleting payment: {str(e)}"}
        ), 500


@purchase_bp.route("/payments", methods=["GET"])
def get_all_payments():
    """Get all payments across all purchases with filtering options"""
    try:
        db = Database()

        # Get query parameters for filtering
        payment_method = request.args.get("payment_method")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        purchase_id = request.args.get("purchase_id")

        # Build query with joins to get purchase information
        base_query = """
        SELECT 
            pp.id,
            pp.purchase_id,
            pp.payment_method,
            pp.amount,
            pp.payment_date,
            pp.notes,
            pp.created_at,
            p.supplier,
            p.total_amount as purchase_total
        FROM purchases_payments pp
        JOIN purchases p ON pp.purchase_id = p.id
        WHERE 1=1
        """

        params = []

        # Add filters
        if payment_method:
            base_query += " AND pp.payment_method = %s"
            params.append(payment_method)

        if start_date:
            base_query += " AND pp.payment_date >= %s"
            params.append(start_date)

        if end_date:
            base_query += " AND pp.payment_date <= %s"
            params.append(end_date)

        if purchase_id:
            base_query += " AND pp.purchase_id = %s"
            params.append(purchase_id)

        base_query += " ORDER BY pp.payment_date DESC, pp.created_at DESC"

        result = db.execute_query(base_query, params)

        if result.get("success"):
            return jsonify(
                {"status": "success", "payments": result.get("data", [])}
            ), 200
        else:
            return jsonify(
                {"status": "error", "message": "Error retrieving payments"}
            ), 500

    except Exception as e:
        print(f"Error getting all payments: {e}")
        return jsonify(
            {"status": "error", "message": f"Error retrieving payments: {str(e)}"}
        ), 500
