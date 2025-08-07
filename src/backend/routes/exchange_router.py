"""
Exchange Router
API endpoints for product exchanges and returns
"""

from flask import Blueprint, request, jsonify
from services.exchange_service import ExchangeService

exchange_router = Blueprint('exchange', __name__)


@exchange_router.route('/create', methods=['POST'])
def create_exchange():
    """
    Creates a new exchange/return transaction
    
    Expected JSON:
    {
        "customer_id": int (optional - for financial tracking),
        "return_variant_barcode": str,
        "return_quantity": int,
        "new_variant_barcode": str (optional - for exchanges),
        "new_quantity": int (optional),
        "branch_id": int,
        "reason": str (optional),
        "user_id": int (optional)
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['return_variant_barcode', 'return_quantity', 'branch_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    "success": False,
                    "message": f"Campo requerido faltante: {field}"
                }), 400

        # Validate quantity is positive
        if data['return_quantity'] <= 0:
            return jsonify({
                "success": False,
                "message": "La cantidad a devolver debe ser mayor a 0"
            }), 400

        # If new product specified, validate new quantity
        if data.get('new_variant_barcode') and data.get('new_quantity', 0) <= 0:
            return jsonify({
                "success": False,
                "message": "Si especifica producto nuevo, la cantidad debe ser mayor a 0"
            }), 400

        # Process exchange
        exchange_service = ExchangeService()
        result = exchange_service.create_exchange_transaction(data)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error del servidor: {str(e)}"
        }), 500


@exchange_router.route('/history', methods=['GET'])
def get_exchange_history():
    """
    Gets exchange history with optional filters
    
    Query parameters:
    - customer_id: Filter by customer ID
    - branch_id: Filter by branch ID
    - limit: Number of records to return (default: 50)
    """
    try:
        customer_id = request.args.get('customer_id', type=int)
        branch_id = request.args.get('branch_id', type=int)
        limit = request.args.get('limit', default=50, type=int)
        
        exchange_service = ExchangeService()
        result = exchange_service.get_exchange_history(
            customer_id=customer_id,
            branch_id=branch_id,
            limit=limit
        )
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error del servidor: {str(e)}"
        }), 500


@exchange_router.route('/customer/<int:customer_id>/history', methods=['GET'])
def get_customer_exchange_history(customer_id):
    """
    Gets exchange history for a specific customer
    """
    try:
        limit = request.args.get('limit', default=50, type=int)
        
        exchange_service = ExchangeService()
        result = exchange_service.get_exchange_history(
            customer_id=customer_id,
            limit=limit
        )
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error del servidor: {str(e)}"
        }), 500


@exchange_router.route('/validate-return', methods=['POST'])
def validate_return():
    """
    Validates if a product can be returned/exchanged
    
    Expected JSON:
    {
        "variant_barcode": str,
        "quantity": int,
        "branch_id": int
    }
    """
    try:
        data = request.get_json()
        
        if not data.get('variant_barcode'):
            return jsonify({
                "success": False,
                "message": "Código de barras requerido"
            }), 400
            
        exchange_service = ExchangeService()
        product = exchange_service._get_product_by_variant_barcode(
            data['variant_barcode']
        )
        
        if not product:
            return jsonify({
                "success": False,
                "message": "Producto no encontrado"
            }), 404
            
        return jsonify({
            "success": True,
            "product": {
                "product_name": product['product_name'],
                "size_name": product['size_name'],
                "color_name": product['color_name'],
                "sale_price": product['sale_price'],
                "brand_name": product['brand_name'],
                "current_stock": product['stock_disponible']
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error del servidor: {str(e)}"
        }), 500


@exchange_router.route('/validate-new-product', methods=['POST'])
def validate_new_product():
    """
    Validates if a new product is available for exchange
    
    Expected JSON:
    {
        "variant_barcode": str,
        "quantity": int,
        "branch_id": int
    }
    """
    try:
        data = request.get_json()
        
        if not data.get('variant_barcode'):
            return jsonify({
                "success": False,
                "message": "Código de barras requerido"
            }), 400
            
        quantity = data.get('quantity', 1)
        
        exchange_service = ExchangeService()
        product = exchange_service._get_product_by_variant_barcode(
            data['variant_barcode']
        )
        
        if not product:
            return jsonify({
                "success": False,
                "message": "Producto no encontrado"
            }), 404
            
        # Check stock availability
        if product['stock_disponible'] < quantity:
            return jsonify({
                "success": False,
                "message": f"Stock insuficiente. Disponible: {product['stock_disponible']}, Solicitado: {quantity}"
            }), 400
            
        return jsonify({
            "success": True,
            "product": {
                "product_name": product['product_name'],
                "size_name": product['size_name'],
                "color_name": product['color_name'],
                "sale_price": product['sale_price'],
                "brand_name": product['brand_name'],
                "available_stock": product['stock_disponible']
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error del servidor: {str(e)}"
        }), 500
