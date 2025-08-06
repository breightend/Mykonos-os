#!/usr/bin/env python3
"""
Script para debuggear el problema de creación de categorías
"""

import requests


def debug_category_creation():
    url = "http://localhost:5000/api/product/category"

    # Primero verificar que el servidor responde
    print("🔍 1. Verificando que el servidor esté disponible...")
    try:
        response = requests.get(url)
        print(f"   ✅ GET Status: {response.status_code}")
        print(f"   📄 GET Response: {response.json()}")
    except Exception as e:
        print(f"   ❌ Error en GET: {e}")
        return

    # Ahora probar diferentes formatos de datos para el POST
    test_cases = [
        {"category_name": "Test1", "permanent": 1},
        {"category_name": "Test2", "permanent": True},
        {"category_name": "Test3", "permanent": "1"},
        {"category_name": "Test4", "permanent": 0},
        {"category_name": "Test5", "permanent": False},
    ]

    for i, data in enumerate(test_cases, 1):
        print(f"\n🧪 {i}. Probando con datos: {data}")
        try:
            response = requests.post(url, json=data, timeout=10)
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text}")

            if response.status_code == 200:
                print("   ✅ ÉXITO!")
                break
            else:
                print("   ❌ FALLÓ")

        except Exception as e:
            print(f"   ❌ Error: {e}")


if __name__ == "__main__":
    debug_category_creation()
