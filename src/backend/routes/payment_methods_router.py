from flask import Blueprint, request, jsonify

from services.payment_methods_service import PaymentMethodsService

payment_methods_router = Blueprint("payment_methods", __name__)


@payment_methods_router.route("/", methods=["GET"])
def get_payment_methods():
    """
    Gets all payment methods
    Query params:
    - active_only: boolean (optional) - if true, only returns active methods
    """
    try:
        active_only = request.args.get("active_only", "false").lower() == "true"

        service = PaymentMethodsService()
        payment_methods = service.get_all_payment_methods(active_only=active_only)

        return jsonify(
            {
                "success": True,
                "payment_methods": payment_methods,
                "total": len(payment_methods),
            }
        ), 200

    except Exception as e:
        return jsonify(
            {"success": False, "message": f"Error obteniendo métodos de pago: {e}"}
        ), 500

@payment_methods_router.route("/client_use_it", methods=["GET"])
def get_client_use_it():
    """
    Gets all payment methods that clients can use
    """
    try:
        service = PaymentMethodsService()
        payment_methods = service.get_client_use_it()

        return jsonify(
            {
                "success": True,
                "payment_methods": payment_methods,
                "total": len(payment_methods),
            }
        ), 200

    except Exception as e:
        return jsonify(
            {"success": False, "message": f"Error obteniendo métodos de pago: {e}"}
        ), 500
    
@payment_methods_router.route("/provider_use_it", methods=["GET"])
def get_provider_use_it():
    """
    Gets all payment methods that providers can use
    """
    try:
        service = PaymentMethodsService()
        payment_methods = service.get_provider_use_it()

        return jsonify(
            {
                "success": True,
                "payment_methods": payment_methods,
                "total": len(payment_methods),
            }
        ), 200

    except Exception as e:
        return jsonify(
            {"success": False, "message": f"Error obteniendo métodos de pago: {e}"}
        ), 500

@payment_methods_router.route("/<int:payment_method_id>", methods=["GET"])
def get_payment_method(payment_method_id):
    """
    Gets a specific payment method by ID
    """
    try:
        service = PaymentMethodsService()
        payment_method = service.get_payment_method_by_id(payment_method_id)

        if payment_method:
            return jsonify({"success": True, "payment_method": payment_method}), 200
        else:
            return jsonify(
                {"success": False, "message": "Método de pago no encontrado"}
            ), 404

    except Exception as e:
        return jsonify(
            {"success": False, "message": f"Error obteniendo método de pago: {e}"}
        ), 500


@payment_methods_router.route("/", methods=["POST"])
def create_payment_method():
    """
    Creates a new payment method
    Expected JSON:
    {
        "method_name": str,
        "display_name": str,
        "description": str (optional),
        "requires_reference": bool (optional),
        "icon_name": str (optional)
    }
    """
    try:
        data = request.json

        # Validate required fields
        if not data.get("method_name") or not data.get("display_name"):
            return jsonify(
                {
                    "success": False,
                    "message": "method_name y display_name son requeridos",
                }
            ), 400

        service = PaymentMethodsService()

        result = service.create_payment_method(
            method_name=data.get("method_name"),
            display_name=data.get("display_name"),
            description=data.get("description"),
            requires_reference=data.get("requires_reference", False),
            icon_name=data.get("icon_name"),
        )

        if result["success"]:
            return jsonify(result), 201
        else:
            return jsonify(result), 400

    except Exception as e:
        return jsonify(
            {"success": False, "message": f"Error creando método de pago: {e}"}
        ), 500


@payment_methods_router.route("/<int:payment_method_id>", methods=["PUT"])
def update_payment_method(payment_method_id):
    """
    Updates a payment method
    Expected JSON: any fields to update
    """
    try:
        data = request.json
        service = PaymentMethodsService()

        result = service.update_payment_method(payment_method_id, **data)

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        return jsonify(
            {"success": False, "message": f"Error actualizando método de pago: {e}"}
        ), 500


@payment_methods_router.route("/<int:payment_method_id>", methods=["DELETE"])
def delete_payment_method(payment_method_id):
    """
    Deactivates a payment method (soft delete)
    """
    try:
        service = PaymentMethodsService()
        result = service.delete_payment_method(payment_method_id)

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        return jsonify(
            {"success": False, "message": f"Error eliminando método de pago: {e}"}
        ), 500


@payment_methods_router.route("/<int:payment_method_id>/activate", methods=["POST"])
def activate_payment_method(payment_method_id):
    """
    Activates a payment method
    """
    try:
        service = PaymentMethodsService()
        result = service.activate_payment_method(payment_method_id)

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400

    except Exception as e:
        return jsonify(
            {"success": False, "message": f"Error activando método de pago: {e}"}
        ), 500


@payment_methods_router.route("/initialize", methods=["POST"])
def initialize_default_payment_methods():
    """
    Creates default payment methods if they don't exist
    """
    try:
        service = PaymentMethodsService()
        results = service.initialize_default_payment_methods()

        return jsonify(
            {
                "success": True,
                "message": "Métodos de pago predeterminados inicializados",
                "results": results,
            }
        ), 200

    except Exception as e:
        return jsonify(
            {"success": False, "message": f"Error inicializando métodos de pago: {e}"}
        ), 500


@payment_methods_router.route("/by-name/<method_name>", methods=["GET"])
def get_payment_method_by_name(method_name):
    """
    Gets a payment method by its internal name
    """
    try:
        service = PaymentMethodsService()
        payment_method = service.get_payment_method_by_name(method_name)

        if payment_method:
            return jsonify({"success": True, "payment_method": payment_method}), 200
        else:
            return jsonify(
                {"success": False, "message": "Método de pago no encontrado"}
            ), 404

    except Exception as e:
        return jsonify(
            {"success": False, "message": f"Error obteniendo método de pago: {e}"}
        ), 500

