#!/usr/bin/env python3
"""
Script simple para probar la creación de una categoría
"""

import requests


def test_create_category():
    url = "http://localhost:5000/api/product/category"
    data = {"category_name": "Test Ropa", "permanent": 1}

    try:
        print("🧪 Probando crear categoría...")
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")

        # Ahora verificar si se puede obtener
        print("\n🔍 Verificando si se puede obtener la categoría...")
        get_response = requests.get(url)
        print(f"Status Code: {get_response.status_code}")
        categories = get_response.json()
        print(f"Categorías encontradas: {categories}")
        print(f"Total categorías: {len(categories)}")

    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    test_create_category()
