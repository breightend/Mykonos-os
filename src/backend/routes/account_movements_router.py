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
                {"success": False, "message": "entity_id y amount son requeridos"}
            ), 400
        service = AccountMovementsService()
        result = service.create_provider_debit_movement(
            entity_id=data.get("entity_id"),
            amount=float(data.get("amount")),
            description=data.get("description", "Compra a proveedor - deuda pendiente"),
            purchase_id=data.get("purchase_id"),
            partial_payment=float(data.get("partial_payment", 0.0)),
            partial_payment_method=data.get("partial_payment_method", "efectivo"),
            bank_id=data.get("bank_id"),
            transaction_number=data.get("transaction_number"),
            echeq_time=data.get("echeq_time"),
            invoice_number=data.get("invoice_number"),
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
        "numero_de_comprobante": str (optional),
        "bank_id": int (optional),
        "transaction_number": str (optional),
        "echeq_time": str (optional),
        "invoice_number": str (optional),
        "invoice_file": file (optional)
    }
    """
    try:
        data = request.json
        print(f"🔍 Received data: {data}")

        if not data.get("entity_id") or not data.get("amount"):
            return jsonify(
                {"success": False, "message": "entity_id y amount son requeridos"}
            ), 400

        print("🔍 Creating AccountMovementsService...")
        service = AccountMovementsService()

        print(
            f"🔍 Calling create_provider_credit_movement with entity_id={data.get('entity_id')}, amount={data.get('amount')}"
        )
        result = service.create_provider_credit_movement(
            entity_id=data.get("entity_id"),
            amount=float(data.get("amount")),
            description=data.get("description", "Pago a proveedor"),
            medio_pago=data.get("medio_pago", "efectivo"),
            numero_de_comprobante=data.get("numero_de_comprobante"),
            bank_id=data.get("bank_id"),
            transaction_number=data.get("transaction_number"),
            echeq_time=data.get("echeq_time"),
            invoice_number=data.get("invoice_number"),
            invoice_file=data.get("invoice_file"),
        )

        print(f"🔍 Service result: {result}")

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
        balance = service.get_provider_balance(entity_id)

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

        # Get all movements with client names, purchase details, and payment information
        query = """
        SELECT 
            am.*,
            e.entity_name as client_name,
            e.cuit as client_cuit,
            p.id as purchase_info_id,
            p.subtotal as purchase_subtotal,
            p.discount as purchase_discount,
            p.total as purchase_total,
            p.status as purchase_status,
            p.delivery_date as purchase_delivery_date,
            p.notes as purchase_notes,
            p.invoice_number as purchase_invoice_number,
            p.purchase_date as purchase_date,
            -- Purchase payments summary
            pp_summary.total_payments,
            pp_summary.payment_count,
            pp_summary.last_payment_date,
            pp_summary.payment_methods
        FROM account_movements am
        JOIN entities e ON am.entity_id = e.id
        LEFT JOIN purchases p ON am.purchase_id = p.id
        LEFT JOIN (
            SELECT 
                purchase_id,
                SUM(amount) as total_payments,
                COUNT(*) as payment_count,
                MAX(payment_date) as last_payment_date,
                STRING_AGG(DISTINCT payment_method, ', ') as payment_methods
            FROM purchases_payments 
            GROUP BY purchase_id
        ) pp_summary ON p.id = pp_summary.purchase_id
        ORDER BY am.created_at DESC
        """

        result = service.db.execute_query(query)

        if result.get("success"):
            movements = result.get("data", [])
            return jsonify({"success": True, "movements": movements}), 200
        else:
            return jsonify(
                {"success": False, "message": "Error fetching movements"}
            ), 500

    except Exception as e:
        return jsonify({"success": False, "message": f"Error en el servidor: {e}"}), 500
