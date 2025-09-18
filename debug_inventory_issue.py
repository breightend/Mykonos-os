#!/usr/bin/env python3

import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "src", "backend"))

from database.database import Database

db = Database()

print('🔍 DEBUGGING INVENTORY ISSUE')
print('='*50)

print('\n1. Checking recent products and their states:')
products = db.execute_query('SELECT id, product_name, state FROM products ORDER BY id DESC LIMIT 5')
for p in products:
    print(f'   Product {p[0]}: {p[1]} - State: {p[2]}')

print('\n2. Checking warehouse_stock:')
stock = db.execute_query('SELECT product_id, branch_id, quantity FROM warehouse_stock ORDER BY product_id DESC LIMIT 5') 
for s in stock:
    print(f'   Product {s[0]}: Branch {s[1]} = {s[2]} units')

print('\n3. Checking warehouse_stock_variants:')
try:
    variants = db.execute_query('SELECT product_id, size_id, color_id, quantity FROM warehouse_stock_variants ORDER BY product_id DESC LIMIT 5')
    for v in variants:
        print(f'   Product {v[0]}: Size {v[1]}, Color {v[2]} = {v[3]} units')
except Exception as e:
    print(f'   Error checking variants: {e}')

print('\n4. Checking recent purchases:')
purchases = db.execute_query('SELECT id, status, delivery_date FROM purchases ORDER BY id DESC LIMIT 3')
for p in purchases:
    print(f'   Purchase {p[0]}: {p[1]} - Delivered: {p[2]}')

print('\n5. Checking purchase details:')
try:
    details = db.execute_query('SELECT purchase_id, product_id, quantity, metadata FROM purchases_detail ORDER BY purchase_id DESC LIMIT 5')
    for d in details:
        print(f'   Purchase {d[0]}: Product {d[1]} x{d[2]} - Metadata: {d[3] if d[3] else "None"}')
except Exception as e:
    print(f'   Error checking purchase details: {e}')

print('\n6. Test inventory query (same as frontend):')
try:
    inventory_query = """
    SELECT 
        p.id,
        COALESCE(p.product_name, 'Sin nombre') as producto,
        COALESCE(b.brand_name, 'Sin marca') as marca,
        COALESCE(SUM(ws.quantity), 0) as cantidad_total,
        COALESCE(p.last_modified_date, NOW()) as fecha_edicion,
        COUNT(DISTINCT ws.branch_id) as sucursales_con_stock,
        COALESCE(g.group_name, 'Sin grupo') as grupo,
        p.group_id,
        p.sale_price,
        p.state
    FROM products p
    LEFT JOIN warehouse_stock ws ON p.id = ws.product_id
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN groups g ON p.group_id = g.id
    WHERE p.state = 'enTienda'
    GROUP BY p.id, p.product_name, b.brand_name, p.last_modified_date, g.group_name, p.group_id, p.sale_price, p.state
    ORDER BY p.product_name
    """
    inventory = db.execute_query(inventory_query)
    print(f'   Found {len(inventory)} products in inventory with state=enTienda')
    for i in inventory:
        print(f'   - {i[1]} (ID: {i[0]}) - Quantity: {i[3]} - State: {i[9]}')
except Exception as e:
    print(f'   Error running inventory query: {e}')

print('\n7. Checking ALL products regardless of state:')
try:
    all_products_query = """
    SELECT p.id, p.product_name, p.state, COALESCE(SUM(ws.quantity), 0) as total_stock
    FROM products p
    LEFT JOIN warehouse_stock ws ON p.id = ws.product_id
    GROUP BY p.id, p.product_name, p.state
    ORDER BY p.id DESC
    LIMIT 10
    """
    all_products = db.execute_query(all_products_query)
    print(f'   Found {len(all_products)} recent products (any state):')
    for ap in all_products:
        print(f'   - {ap[1]} (ID: {ap[0]}) - State: {ap[2]} - Stock: {ap[3]}')
except Exception as e:
    print(f'   Error checking all products: {e}')

print('\n' + '='*50)
print('DEBUG COMPLETE')