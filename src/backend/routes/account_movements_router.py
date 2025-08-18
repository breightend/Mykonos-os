from flask import Blueprint, request, jsonify
from services.account_movements_service import AccountMovementsService

account_movements_router = Blueprint("account_movements", __name__)


@account_movements_router.route("/debit", methods=["POST"])
def create_debit_movement():
    """
    Creates a debit movement (when client buys on credit)
    Expected JSON:
    {
        "entity_id": int,
        "amount": float,
        "description": str (optional),
        "purchase_id": int,
        "payment_method": int,
        "partial_payment": float (optional),
        "partial_payment_method": str (optional)
    }
    """
    try:
        data = request.json

        # Validate required fields
        if not data.get("entity_id") or not data.get("amount"):
            return jsonify(
                {"success": False, "message": "entity_id y amount son requeridos"}
            ), 400

        service = AccountMovementsService()

        result = service.create_debit_movement(
            entity_id=data.get("entity_id"),
            amount=float(data.get("amount")),
            description=data.get("description", "Venta a cuenta corriente"),
            purchase_id=data.get("purchase_id"),
            partial_payment=float(data.get("partial_payment", 0.0)),
            partial_payment_method=data.get("partial_payment_method", "efectivo"),
        )

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500

    except Exception as e:
        return jsonify({"success": False, "message": f"Error en el servidor: {e}"}), 500


@account_movements_router.route("/credit", methods=["POST"])
def create_credit_movement():
    """
    Creates a credit movement (when client makes a payment)
    Expected JSON:
    {
        "entity_id": int,
        "amount": float,
        "description": str (optional),
        "medio_pago": str (optional),
        "numero_de_comprobante": str (optional)
    }
    """
    try:
        data = request.json

        # Validate required fields
        if not data.get("entity_id") or not data.get("amount"):
            return jsonify(
                {"success": False, "message": "entity_id y amount son requeridos"}
            ), 400

        service = AccountMovementsService()

        result = service.create_credit_movement(
            entity_id=data.get("entity_id"),
            amount=float(data.get("amount")),
            description=data.get("description", "Pago de cliente"),
            medio_pago=data.get("medio_pago", "efectivo"),
            numero_de_comprobante=data.get("numero_de_comprobante"),
        )

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500

    except Exception as e:
        return jsonify({"success": False, "message": f"Error en el servidor: {e}"}), 500


@account_movements_router.route("/provider/debit", methods=["POST"])
def create_provider_debit_movement():
    """
    Creates a debit movement for a provider (when we owe them money from a purchase)
    Expected JSON:
    {
        "entity_id": int,
        "amount": float,
        "description": str (optional),
        "purchase_id": int (optional),
        "partial_payment": float (optional),
        "partial_payment_method": str (optional)
    }
    """
    try:
        data = request.json
        # Validate required fields
        if not data.get("entity_id") or not data.get("amount"):
            return jsonify(
                {"success": False, "message": "entity_id y amount son requeridos"}), 400
        service = AccountMovementsService()
        result = service.create_debit_movement(
            entity_id=data.get("entity_id"),
            amount=float(data.get("amount")),
            description=data.get("description", "Compra a proveedor - deuda pendiente"),
            purchase_id=data.get("purchase_id"),
            partial_payment=float(data.get("partial_payment", 0.0)),
            partial_payment_method=data.get("partial_payment_method", "efectivo"),
        )
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
    except Exception as e:
        return jsonify({"success": False, "message": f"Error en el servidor: {e}"}), 500


@account_movements_router.route("/provider/credit", methods=["POST"])
def create_provider_credit_movement():
    """
    Creates a credit movement for a provider (when we pay them)
    Expected JSON:
    {
        "entity_id": int,
        "amount": float,
        "description": str (optional),
        "medio_pago": str (optional),
        "numero_de_comprobante": str (optional)
    }
    """
    try:
        data = request.json
        if not data.get("entity_id") or not data.get("amount"):
            return jsonify(
                {"success": False, "message": "entity_id y amount son requeridos"}
            ), 400
        service = AccountMovementsService()
        result = service.create_credit_movement(
            entity_id=data.get("entity_id"),
            amount=float(data.get("amount")),
            description=data.get("description", "Pago a proveedor"),
            medio_pago=data.get("medio_pago", "efectivo"),
            numero_de_comprobante=data.get("numero_de_comprobante"),
        )
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
    except Exception as e:
        return jsonify({"success": False, "message": f"Error en el servidor: {e}"}), 500


@account_movements_router.route("/balance/<int:entity_id>", methods=["GET"])
def get_client_balance(entity_id):
    """
    Gets the current balance for a client
    """
    try:
        service = AccountMovementsService()
        balance = service.get_client_balance(entity_id)

        return jsonify(
            {"success": True, "entity_id": entity_id, "balance": balance}
        ), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Error en el servidor: {e}"}), 500

@account_movements_router.route("/provider/balance/<int:entity_id>", methods=["GET"])
def get_provider_balance(entity_id):
    """
    Gets the current balance for a provider
    """
    try:
        service = AccountMovementsService()
        balance = service.get_client_balance(entity_id)

        return jsonify(
            {"success": True, "entity_id": entity_id, "balance": balance}
        ), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Error en el servidor: {e}"}), 500

@account_movements_router.route("/movements/<int:entity_id>", methods=["GET"])
def get_client_movements(entity_id):
    """
    Gets all movements for a specific client
    """
    try:
        service = AccountMovementsService()
        movements = service.get_client_movements(entity_id)

        return jsonify(
            {"success": True, "entity_id": entity_id, "movements": movements}
        ), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Error en el servidor: {e}"}), 500
    

@account_movements_router.route("/provider/movements/<int:entity_id>", methods=["GET"])
def get_provider_movements(entity_id):
    """
    Gets all movements for a specific provider
    """
    try:
        service = AccountMovementsService()
        movements = service.get_client_movements(entity_id)

        return jsonify(
            {"success": True, "entity_id": entity_id, "movements": movements}
        ), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Error en el servidor: {e}"}), 500

@account_movements_router.route("/all", methods=["GET"])
def get_all_movements():
    """
    Gets all account movements with client information
    """
    try:
        service = AccountMovementsService()

        # Get all movements with client names
        query = """
        SELECT 
            am.*,
            e.entity_name as client_name,
            e.cuit as client_cuit
        FROM account_movements am
        JOIN entities e ON am.entity_id = e.id
        ORDER BY am.created_at DESC
        """

        movements = service.db.execute_query(query)

        return jsonify({"success": True, "movements": movements}), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Error en el servidor: {e}"}), 500
