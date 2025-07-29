#!/usr/bin/env python3
"""
Script para verificar datos de stock de variantes en la base de datos
"""

import sqlite3

def check_database():
    conn = sqlite3.connect('database/mykonos.db')
    cursor = conn.cursor()

    print('=== PRODUCTOS RECIENTES ===')
    cursor.execute('SELECT id, name FROM products ORDER BY id DESC LIMIT 5')
    products = cursor.fetchall()
    for p in products:
        print(f'ID: {p[0]}, Nombre: {p[1]}')

    print('\n=== WAREHOUSE_STOCK ===')
    cursor.execute('SELECT product_id, branch_id, quantity FROM warehouse_stock ORDER BY product_id DESC LIMIT 10')
    stock = cursor.fetchall()
    for s in stock:
        print(f'Producto: {s[0]}, Sucursal: {s[1]}, Cantidad: {s[2]}')

    print('\n=== WAREHOUSE_STOCK_VARIANTS ===')
    cursor.execute('SELECT product_id, size_id, color_id, quantity FROM warehouse_stock_variants ORDER BY product_id DESC LIMIT 10')
    variants = cursor.fetchall()
    for v in variants:
        print(f'Producto: {v[0]}, Talle: {v[1]}, Color: {v[2]}, Cantidad: {v[3]}')

    # Detalles del último producto
    if products:
        last_product_id = products[0][0]
        print(f'\n=== DETALLES DEL PRODUCTO {last_product_id} ===')
        
        cursor.execute('SELECT * FROM warehouse_stock WHERE product_id = ?', (last_product_id,))
        product_stock = cursor.fetchall()
        print(f'Stock general: {product_stock}')
        
        cursor.execute('SELECT * FROM warehouse_stock_variants WHERE product_id = ?', (last_product_id,))
        product_variants = cursor.fetchall()
        print(f'Variantes ({len(product_variants)} registros):')
        for v in product_variants:
            print(f'  - Talle {v[2]}, Color {v[3]}: {v[4]} unidades')

    conn.close()

if __name__ == "__main__":
    check_database()
