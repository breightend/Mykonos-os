#!/usr/bin/env python3
"""
Script para verificar los estados de productos en la base de datos
"""

import sys
import os

# Agregar el directorio backend al path
backend_path = os.path.join(os.path.dirname(__file__), "src", "backend")
sys.path.append(backend_path)

from database.database import Database


def check_product_states():
    """Verifica los estados de productos en la BD"""
    print("🔍 Verificando estados de productos...")

    db = Database()

    # Consultar todos los estados únicos
    states_query = "SELECT DISTINCT state, COUNT(*) as count FROM products GROUP BY state ORDER BY count DESC"
    states = db.execute_query(states_query)

    print("\n📊 Estados de productos encontrados:")
    print("-" * 40)
    for state in states:
        if isinstance(state, dict):
            print(f"Estado: '{state['state']}' - Cantidad: {state['count']}")
        else:
            print(f"Estado: '{state[0]}' - Cantidad: {state[1]}")

    # Consultar algunos productos con estado 'activo'
    activos_query = (
        "SELECT id, product_name, state FROM products WHERE state = 'activo' LIMIT 5"
    )
    activos = db.execute_query(activos_query)

    print(f"\n✅ Productos con estado 'activo' (primeros 5):")
    print("-" * 50)
    if activos:
        for producto in activos:
            if isinstance(producto, dict):
                print(
                    f"ID: {producto['id']} - '{producto['product_name']}' - Estado: '{producto['state']}'"
                )
            else:
                print(f"ID: {producto[0]} - '{producto[1]}' - Estado: '{producto[2]}'")
    else:
        print("❌ No se encontraron productos con estado 'activo'")

    # Consultar total de productos
    total_query = "SELECT COUNT(*) as total FROM products"
    total = db.execute_query(total_query)

    if total:
        total_count = total[0]["total"] if isinstance(total[0], dict) else total[0][0]
        print(f"\n📈 Total de productos en la BD: {total_count}")


if __name__ == "__main__":
    check_product_states()
