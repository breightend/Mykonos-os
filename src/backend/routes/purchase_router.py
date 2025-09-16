from flask import Blueprint, request, jsonify
from database.database import Database
from datetime import datetime
import base64

purchase_bp = Blueprint("purchase", __name__)


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
            try:
                invoice_file = data["invoice_file"]
                # Si es un archivo base64, procesarlo
                if isinstance(invoice_file, str):
                    file_content = base64.b64decode(invoice_file)
                    file_data = {
                        "file_name": f"invoice_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf",
                        "file_extension": "pdf",
                        "file_content": file_content,
                        "comment": "Factura de compra",
                    }
                    file_result = db.add_record("file_attachments", file_data)
                    if file_result.get("success"):
                        file_id = file_result.get("rowid")
                    else:
                        print(f"Error saving file: {file_result}")
            except Exception as e:
                print(f"Error processing invoice file: {e}")

        # Crear la compra principal
        purchase_data = {
            "entity_id": data["entity_id"],
            "subtotal": data["subtotal"],
            "discount": data.get("discount", 0),
            "total": data["total"],
            "invoice_number": data.get("invoice_number", ""),
            "notes": data.get("notes", ""),
            "status": data.get("status", "Pendiente de entrega"),
            "file_id": file_id,
            "delivery_date": data.get("delivery_date"),
        }

        # Payment information will be handled separately later
        # keeping payment_method, transaction_number as None for now

        # Filtrar valores None para campos opcionales
        purchase_data = {k: v for k, v in purchase_data.items() if v is not None}

        purchase_result = db.add_record("purchases", purchase_data)

        if not purchase_result.get("success"):
            return jsonify(
                {"status": "error", "message": "Error al crear la compra"}
            ), 500

        purchase_id = purchase_result.get("rowid")

        # Agregar los productos de la compra
        for product in data["products"]:
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
            if not detail_result.get("success"):
                # Si falla algún detalle, eliminar la compra y el archivo
                db.delete_record("purchases", "id = ?", (purchase_id,))
                if file_id:
                    db.delete_record("file_attachments", "id = ?", (file_id,))
                return jsonify(
                    {
                        "status": "error",
                        "message": "Error al agregar productos a la compra",
                    }
                ), 500

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
            bpm.amount as payment_method_amount,
            b.name as bank_name,
            pm.method_name as payment_method_name,
            fa.file_name as invoice_file_name,
            fa.file_extension as invoice_file_extension
        FROM purchases p
        LEFT JOIN entities e ON p.entity_id = e.id
        LEFT JOIN banks_payment_methods bpm ON p.payment_method = bpm.id
        LEFT JOIN banks b ON bpm.bank_id = b.id
        LEFT JOIN payment_methods pm ON bpm.payment_method_id = pm.id
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
            bpm.amount as payment_method_amount,
            b.name as bank_name,
            pm.method_name as payment_method_name,
            fa.file_name as invoice_file_name
        FROM purchases p
        LEFT JOIN entities e ON p.entity_id = e.id
        LEFT JOIN banks_payment_methods bpm ON p.payment_method = bpm.id
        LEFT JOIN banks b ON bpm.bank_id = b.id
        LEFT JOIN payment_methods pm ON bpm.payment_method_id = pm.id
        LEFT JOIN file_attachments fa ON p.file_id = fa.id
        WHERE p.entity_id = ?
        ORDER BY p.purchase_date DESC
        """
        purchases = db.execute_query(query, (provider_id,))
        return jsonify(purchases), 200
    except Exception as e:
        print(f"Error fetching purchases by provider: {e}")
        return jsonify(
            {"status": "error", "message": "Error al obtener las compras del proveedor"}
        ), 500


# Obtener una compra por ID con sus detalles completos
@purchase_bp.route("/<int:purchase_id>", methods=["GET"])
def get_purchase_by_id(purchase_id):
    try:
        db = Database()

        # Obtener datos de la compra con todas las relaciones
        purchase_query = """
        SELECT 
            p.*,
            e.entity_name as provider_name,
            e.cuit as provider_cuit,
            e.razon_social as provider_razon_social,
            e.domicilio_comercial as provider_address,
            e.phone_number as provider_phone,
            e.email as provider_email,
            bpm.amount as payment_method_amount,
            b.name as bank_name,
            b.code as bank_code,
            pm.method_name as payment_method_name,
            fa.file_name as invoice_file_name,
            fa.file_extension as invoice_file_extension,
            fa.file_content as invoice_file_content
        FROM purchases p
        LEFT JOIN entities e ON p.entity_id = e.id
        LEFT JOIN banks_payment_methods bpm ON p.payment_method = bpm.id
        LEFT JOIN banks b ON bpm.bank_id = b.id
        LEFT JOIN payment_methods pm ON bpm.payment_method_id = pm.id
        LEFT JOIN file_attachments fa ON p.file_id = fa.id
        WHERE p.id = ?
        """
        purchase = db.execute_query(purchase_query, (purchase_id,))

        if not purchase:
            return jsonify({"status": "error", "message": "Compra no encontrada"}), 404

        # Obtener detalles de los productos con información completa
        details_query = """
        SELECT 
            pd.*,
            pr.product_name,
            pr.provider_code,
            pr.cost as current_cost,
            pr.sale_price as current_sale_price,
            b.brand_name,
            g.group_name
        FROM purchases_detail pd
        LEFT JOIN products pr ON pd.product_id = pr.id
        LEFT JOIN brands b ON pr.brand_id = b.id
        LEFT JOIN [group] g ON pr.group_id = g.id
        WHERE pd.purchase_id = ?
        """
        details = db.execute_query(details_query, (purchase_id,))

        purchase_data = purchase[0]
        purchase_data["products"] = details

        # Convertir file_content a base64 si existe para envío seguro
        if purchase_data.get("invoice_file_content"):
            purchase_data["invoice_file_content_base64"] = base64.b64encode(
                purchase_data["invoice_file_content"]
            ).decode("utf-8")
            # Remover el contenido binario original
            del purchase_data["invoice_file_content"]

        return jsonify(purchase_data), 200

    except Exception as e:
        print(f"Error fetching purchase by ID: {e}")
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
            b.code as bank_code,
            pm.method_name as payment_method_name,
            pm.method_name || ' - ' || b.name as display_name
        FROM banks_payment_methods bpm
        LEFT JOIN banks b ON bpm.bank_id = b.id
        LEFT JOIN payment_methods pm ON bpm.payment_method_id = pm.id
        WHERE b.is_active = 1
        ORDER BY pm.method_name, b.name
        """
        payment_methods = db.execute_query(payment_methods_query)

        # También obtener bancos separados por si se necesitan
        banks_query = """
        SELECT id, name, code 
        FROM banks 
        WHERE is_active = 1
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
        WHERE p.id = ? AND fa.id IS NOT NULL
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
        WHERE id = ?
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

        # Compras por método de pago
        by_payment_method_query = """
        SELECT 
            pm.method_name || ' - ' || b.name as payment_method,
            COUNT(p.id) as purchase_count,
            SUM(p.total) as total_amount
        FROM purchases p
        LEFT JOIN banks_payment_methods bpm ON p.payment_method = bpm.id
        LEFT JOIN banks b ON bpm.bank_id = b.id
        LEFT JOIN payment_methods pm ON bpm.payment_method_id = pm.id
        GROUP BY p.payment_method, pm.method_name, b.name
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
            strftime('%Y-%m', pur.purchase_date) as month,
            SUM(pd.quantity) as quantity,
            SUM(pd.subtotal) as total_spent
        FROM purchases_detail pd
        LEFT JOIN purchases pur ON pd.purchase_id = pur.id
        LEFT JOIN products p ON pd.product_id = p.id
        LEFT JOIN groups g ON p.group_id = g.id
        WHERE g.group_name IS NOT NULL 
            AND pur.purchase_date >= date('now', '-6 months')
        GROUP BY g.id, g.group_name, strftime('%Y-%m', pur.purchase_date)
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
        result = db.delete_record("purchases", "id = ?", (purchase_id,))

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
