from flask import Blueprint, request, jsonify
from database.database import Database
from datetime import datetime

purchase_bp = Blueprint("purchase", __name__)


# Crear una nueva compra con sus productos
@purchase_bp.route("/", methods=["POST"])
def create_purchase():
    try:
        data = request.get_json()

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

        # Crear la compra principal
        purchase_data = {
            "entity_id": data["entity_id"],
            "subtotal": data["subtotal"],
            "discount": data.get("discount", 0),
            "total": data["total"],
            "payment_method": data.get("payment_method", ""),
            "transaction_number": data.get("transaction_number", ""),
            "invoice_number": data.get("invoice_number", ""),
            "notes": data.get("notes", ""),
            "status": data.get("status", "Pendiente de entrega"),
        }

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

            detail_result = db.add_record("purchases_detail", product_detail)
            if not detail_result.get("success"):
                # Si falla algún detalle, eliminar la compra
                db.delete_record("purchases", "id = ?", (purchase_id,))
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


# Obtener todas las compras
@purchase_bp.route("/", methods=["GET"])
def get_purchases():
    try:
        db = Database()
        purchases = db.fetch_all_with_relations("purchases")
        return jsonify(purchases), 200
    except Exception as e:
        print(f"Error fetching purchases: {e}")
        return jsonify(
            {"status": "error", "message": "Error al obtener las compras"}
        ), 500


# Obtener compras por proveedor
@purchase_bp.route("/provider/<int:provider_id>", methods=["GET"])
def get_purchases_by_provider(provider_id):
    try:
        db = Database()
        query = """
        SELECT p.*, e.entity_name as provider_name
        FROM purchases p
        LEFT JOIN entities e ON p.entity_id = e.id
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


# Obtener una compra por ID con sus detalles
@purchase_bp.route("/<int:purchase_id>", methods=["GET"])
def get_purchase_by_id(purchase_id):
    try:
        db = Database()

        # Obtener datos de la compra
        purchase_query = """
        SELECT p.*, e.entity_name as provider_name
        FROM purchases p
        LEFT JOIN entities e ON p.entity_id = e.id
        WHERE p.id = ?
        """
        purchase = db.execute_query(purchase_query, (purchase_id,))

        if not purchase:
            return jsonify({"status": "error", "message": "Compra no encontrada"}), 404

        # Obtener detalles de los productos
        details_query = """
        SELECT pd.*, pr.product_name, pr.barcode
        FROM purchases_detail pd
        LEFT JOIN products pr ON pd.product_id = pr.id
        WHERE pd.purchase_id = ?
        """
        details = db.execute_query(details_query, (purchase_id,))

        purchase_data = purchase[0]
        purchase_data["products"] = details

        return jsonify(purchase_data), 200

    except Exception as e:
        print(f"Error fetching purchase by ID: {e}")
        return jsonify(
            {"status": "error", "message": "Error al obtener la compra"}
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

        success = db.update_data("purchases", purchase_id, update_data)

        if success:
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
        purchase = db.fetch_by_id("purchases", purchase_id)
        if not purchase:
            return jsonify({"status": "error", "message": "Compra no encontrada"}), 404

        if purchase["status"] != "Pendiente de entrega":
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
                db.update_data(
                    "warehouse_stock",
                    existing_stock[0]["id"],
                    {
                        "quantity": new_quantity,
                        "last_updated": datetime.now().isoformat(),
                    },
                )
            else:
                # Crear nuevo registro de stock
                stock_data = {
                    "product_id": product_id,
                    "branch_id": storage_id,
                    "quantity": quantity,
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
        purchase = db.fetch_by_id("purchases", purchase_id)
        if not purchase:
            return jsonify({"status": "error", "message": "Compra no encontrada"}), 404

        # No permitir eliminar compras recibidas
        if purchase["status"] == "Recibido":
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
