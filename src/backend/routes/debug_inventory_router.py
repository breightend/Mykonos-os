from flask import Blueprint, jsonify
from database.database import Database

debug_inventory_bp = Blueprint("debug_inventory_bp", __name__)

@debug_inventory_bp.route("/debug-inventory-issue", methods=["GET"])
def debug_inventory_issue():
    """Debug endpoint to check inventory issues"""
    try:
        db = Database()
        debug_info = {}
        
        # 1. Check recent products and their states
        products = db.execute_query('SELECT id, product_name, state FROM products ORDER BY id DESC LIMIT 5')
        debug_info["recent_products"] = [{"id": p[0], "name": p[1], "state": p[2]} for p in products]
        
        # 2. Check warehouse_stock
        stock = db.execute_query('SELECT product_id, branch_id, quantity FROM warehouse_stock ORDER BY product_id DESC LIMIT 5')
        debug_info["warehouse_stock"] = [{"product_id": s[0], "branch_id": s[1], "quantity": s[2]} for s in stock]
        
        # 3. Check warehouse_stock_variants
        try:
            variants = db.execute_query('SELECT product_id, size_id, color_id, quantity FROM warehouse_stock_variants ORDER BY product_id DESC LIMIT 5')
            debug_info["warehouse_variants"] = [{"product_id": v[0], "size_id": v[1], "color_id": v[2], "quantity": v[3]} for v in variants]
        except Exception as e:
            debug_info["warehouse_variants"] = f"Error: {str(e)}"
        
        # 4. Check recent purchases
        purchases = db.execute_query('SELECT id, status, delivery_date FROM purchases ORDER BY id DESC LIMIT 3')
        debug_info["recent_purchases"] = [{"id": p[0], "status": p[1], "delivery_date": p[2]} for p in purchases]
        
        # 5. Test inventory query (same as frontend)
        inventory_query = """
        SELECT 
            p.id,
            COALESCE(p.product_name, 'Sin nombre') as producto,
            p.state,
            COALESCE(SUM(ws.quantity), 0) as cantidad_total
        FROM products p
        LEFT JOIN warehouse_stock ws ON p.id = ws.product_id
        WHERE p.state = 'enTienda'
        GROUP BY p.id, p.product_name, p.state
        ORDER BY p.product_name
        """
        inventory = db.execute_query(inventory_query)
        debug_info["inventory_enTienda"] = [{"id": i[0], "name": i[1], "state": i[2], "total_stock": i[3]} for i in inventory]
        
        # 6. Check ALL products regardless of state
        all_products_query = """
        SELECT p.id, p.product_name, p.state, COALESCE(SUM(ws.quantity), 0) as total_stock
        FROM products p
        LEFT JOIN warehouse_stock ws ON p.id = ws.product_id
        GROUP BY p.id, p.product_name, p.state
        ORDER BY p.id DESC
        LIMIT 10
        """
        all_products = db.execute_query(all_products_query)
        debug_info["all_products"] = [{"id": ap[0], "name": ap[1], "state": ap[2], "total_stock": ap[3]} for ap in all_products]
        
        return jsonify({
            "status": "success",
            "debug_info": debug_info
        }), 200
        
    except Exception as e:
        return jsonify({
            "status": "error", 
            "message": str(e)
        }), 500