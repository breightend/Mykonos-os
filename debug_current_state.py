#!/usr/bin/env python3

import sys
import os

# Add src/backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src', 'backend'))

from database.database import Database

def debug_current_state():
    """Debug current database state"""
    try:
        db = Database()
        
        print("=== CURRENT DATABASE STATE ===\n")
        
        # 1. Check recent products and their states
        print("🔍 Recent Products:")
        products = db.execute_query('SELECT id, product_name, state FROM products ORDER BY id DESC LIMIT 5')
        for p in products:
            product_id = p[0] if isinstance(p, (list, tuple)) else p['id']
            product_name = p[1] if isinstance(p, (list, tuple)) else p['product_name']
            state = p[2] if isinstance(p, (list, tuple)) else p['state']
            print(f"  Product {product_id}: {product_name} - State: {state}")
        
        # 2. Check warehouse_stock
        print("\n📦 Warehouse Stock:")
        stock = db.execute_query('SELECT product_id, branch_id, quantity FROM warehouse_stock ORDER BY product_id DESC LIMIT 5')
        for s in stock:
            product_id = s[0] if isinstance(s, (list, tuple)) else s['product_id']
            branch_id = s[1] if isinstance(s, (list, tuple)) else s['branch_id']
            quantity = s[2] if isinstance(s, (list, tuple)) else s['quantity']
            print(f"  Product {product_id}: Branch {branch_id} = {quantity} units")
        
        # 3. Check warehouse_stock_variants
        print("\n🎨 Warehouse Stock Variants:")
        try:
            variants = db.execute_query('SELECT product_id, size_id, color_id, quantity FROM warehouse_stock_variants ORDER BY product_id DESC LIMIT 5')
            for v in variants:
                product_id = v[0] if isinstance(v, (list, tuple)) else v['product_id']
                size_id = v[1] if isinstance(v, (list, tuple)) else v['size_id']
                color_id = v[2] if isinstance(v, (list, tuple)) else v['color_id']
                quantity = v[3] if isinstance(v, (list, tuple)) else v['quantity']
                print(f"  Product {product_id}: Size {size_id}, Color {color_id} = {quantity} units")
        except Exception as e:
            print(f"  Error accessing variants: {str(e)}")
        
        # 4. Check recent purchases
        print("\n🛒 Recent Purchases:")
        purchases = db.execute_query('SELECT id, status, delivery_date FROM purchases ORDER BY id DESC LIMIT 3')
        for p in purchases:
            purchase_id = p[0] if isinstance(p, (list, tuple)) else p['id']
            status = p[1] if isinstance(p, (list, tuple)) else p['status']
            delivery_date = p[2] if isinstance(p, (list, tuple)) else p['delivery_date']
            print(f"  Purchase {purchase_id}: {status} - Delivered: {delivery_date}")
        
        # 5. Test inventory query (what frontend sees)
        print("\n🏪 Current Inventory (enTienda filter):")
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
        if inventory:
            for i in inventory:
                product_id = i[0] if isinstance(i, (list, tuple)) else i['id']
                name = i[1] if isinstance(i, (list, tuple)) else i['producto']
                state = i[2] if isinstance(i, (list, tuple)) else i['state']
                total_stock = i[3] if isinstance(i, (list, tuple)) else i['cantidad_total']
                print(f"  {product_id}: {name} ({state}) = {total_stock} units")
        else:
            print("  No products found with state 'enTienda'")
        
        # 6. Check ALL products regardless of state
        print("\n🌍 ALL Products (no filter):")
        all_products_query = """
        SELECT p.id, p.product_name, p.state, COALESCE(SUM(ws.quantity), 0) as total_stock
        FROM products p
        LEFT JOIN warehouse_stock ws ON p.id = ws.product_id
        GROUP BY p.id, p.product_name, p.state
        ORDER BY p.id DESC
        LIMIT 5
        """
        all_products = db.execute_query(all_products_query)
        for ap in all_products:
            product_id = ap[0] if isinstance(ap, (list, tuple)) else ap['id']
            name = ap[1] if isinstance(ap, (list, tuple)) else ap['product_name']
            state = ap[2] if isinstance(ap, (list, tuple)) else ap['state']
            total_stock = ap[3] if isinstance(ap, (list, tuple)) else ap['total_stock']
            print(f"  {product_id}: {name} ({state}) = {total_stock} units")
        
        print("\n=== END DEBUG ===")
        
    except Exception as e:
        print(f"❌ Error in debug: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_current_state()