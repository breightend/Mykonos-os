from flask import Blueprint, request, jsonify
from services.client_sales_service import ClientSalesService

client_sales_router = Blueprint("client_sales", __name__)


@client_sales_router.route("/history/<int:entity_id>", methods=["GET"])
def get_client_sales_history(entity_id):
    """
    Gets the sales history for a specific client
    """
    try:
        service = ClientSalesService()
        sales_history = service.get_client_sales_history(entity_id)

        return jsonify(
            {"success": True, "entity_id": entity_id, "sales": sales_history}
        ), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Error en el servidor: {e}"}), 500


@client_sales_router.route("/return", methods=["POST"])
def create_return():
    """
    Creates a return transaction
    Expected JSON:
    {
        "entity_id": int,
        "original_sale_id": int,
        "return_amount": float,
        "return_reason": str,
        "products_returned": list (optional)
    }
    """
    try:
        data = request.json

        # Validate required fields
        if (
            not data.get("entity_id")
            or not data.get("original_sale_id")
            or not data.get("return_amount")
        ):
            return jsonify(
                {
                    "success": False,
                    "message": "entity_id, original_sale_id y return_amount son requeridos",
                }
            ), 400

        service = ClientSalesService()

        result = service.create_return_transaction(
            entity_id=data.get("entity_id"),
            original_sale_id=data.get("original_sale_id"),
            return_amount=float(data.get("return_amount")),
            return_reason=data.get("return_reason", ""),
            products_returned=data.get("products_returned", []),
        )

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500

    except Exception as e:
        return jsonify({"success": False, "message": f"Error en el servidor: {e}"}), 500


@client_sales_router.route("/exchange", methods=["POST"])
def create_exchange():
    """
    Creates an exchange transaction
    Expected JSON:
    {
        "entity_id": int,
        "original_sale_id": int,
        "exchange_details": {
            "original_amount": float,
            "new_amount": float,
            "reason": str,
            "original_products": list,
            "new_products": list
        }
    }
    """
    try:
        data = request.json

        # Validate required fields
        if (
            not data.get("entity_id")
            or not data.get("original_sale_id")
            or not data.get("exchange_details")
        ):
            return jsonify(
                {
                    "success": False,
                    "message": "entity_id, original_sale_id y exchange_details son requeridos",
                }
            ), 400

        service = ClientSalesService()

        result = service.create_exchange_transaction(
            entity_id=data.get("entity_id"),
            original_sale_id=data.get("original_sale_id"),
            exchange_details=data.get("exchange_details"),
        )

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500

    except Exception as e:
        return jsonify({"success": False, "message": f"Error en el servidor: {e}"}), 500


@client_sales_router.route("/details/<int:sale_id>", methods=["GET"])
def get_sale_details(sale_id):
    """
    Gets detailed information about a specific sale
    """
    try:
        service = ClientSalesService()
        sale_details = service.get_sale_details(sale_id)

        if sale_details:
            return jsonify({"success": True, "sale": sale_details}), 200
        else:
            return jsonify({"success": False, "message": "Venta no encontrada"}), 404

    except Exception as e:
        return jsonify({"success": False, "message": f"Error en el servidor: {e}"}), 500


@client_sales_router.route("/all", methods=["GET"])
def get_all_sales():
    """
    Gets all sales with client information
    """
    try:
        service = ClientSalesService()

        # Get all sales movements with client names
        query = """
        SELECT 
            am.*,
            e.entity_name as client_name,
            e.cuit as client_cuit
        FROM account_movements am
        JOIN entities e ON am.entity_id = e.id
        WHERE am.debe > 0
        ORDER BY am.created_at DESC
        """

        sales = service.db.execute_query(query)

        return jsonify({"success": True, "sales": sales}), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Error en el servidor: {e}"}), 500
