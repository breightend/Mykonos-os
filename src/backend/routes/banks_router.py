from flask import Blueprint, request, jsonify
from services.bank_service import BankService

banks_router = Blueprint("banks", __name__)
service = BankService()

@banks_router.route("/", methods=["GET"])
def get_banks():
    try:
        banks = service.list_banks()
        return jsonify({"success": True, "banks": banks}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@banks_router.route("/<int:bank_id>", methods=["GET"])
def get_bank(bank_id):
    try:
        bank = service.get_bank_by_id(bank_id)
        if bank:
            return jsonify({"success": True, "bank": bank}), 200
        else:
            return jsonify({"success": False, "message": "Banco no encontrado"}), 404
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@banks_router.route("/", methods=["POST"])
def create_bank():
    try:
        data = request.json
        result = service.create_bank(data.get("name"), data.get("swift_code"))
        return jsonify(result), 201 if result["success"] else 400
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@banks_router.route("/<int:bank_id>", methods=["PUT"])
def update_bank(bank_id):
    try:
        data = request.json
        result = service.update_bank(bank_id, **data)
        return jsonify(result), 200 if result["success"] else 400
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@banks_router.route("/<int:bank_id>", methods=["DELETE"])
def delete_bank(bank_id):
    try:
        result = service.delete_bank(bank_id)
        return jsonify(result), 200 if result["success"] else 400
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# Endpoints para la tabla puente
@banks_router.route("/link-method", methods=["POST"])
def link_bank_payment_method():
    try:
        data = request.json
        result = service.add_bank_payment_method(data["bank_id"], data["payment_method_id"])
        return jsonify(result), 201 if result["success"] else 400
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@banks_router.route("/bank-payment-methods", methods=["GET"])
def get_bank_payment_methods():
    try:
        result = service.list_bank_payment_methods()
        return jsonify({"success": True, "bank_payment_methods": result}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@banks_router.route("/bank-payment-methods/<int:bpm_id>", methods=["DELETE"])
def delete_bank_payment_method(bpm_id):
    try:
        result = service.delete_bank_payment_method(bpm_id)
        return jsonify(result), 200 if result["success"] else 400
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500