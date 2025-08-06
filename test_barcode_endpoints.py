#!/usr/bin/env python3
"""
Test rápido de los endpoints de códigos de barras
"""

import requests
import json

base_url = "http://localhost:8080"


def test_endpoints():
    print("🧪 TESTING ENDPOINTS DE CÓDIGOS DE BARRAS")
    print("=" * 50)

    try:
        # Test 1: Obtener detalles de un producto
        print("\n1️⃣ Test product-detail:")
        response = requests.get(f"{base_url}/api/inventory/product-detail/1")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Producto encontrado: {data.get('name', 'N/A')}")
            print(f"   Precio: ${data.get('sale_price', 'N/A')}")
        else:
            print(f"❌ Error {response.status_code}: {response.text}")

        # Test 2: Obtener variantes de un producto
        print("\n2️⃣ Test product-variants:")
        response = requests.get(f"{base_url}/api/inventory/product-variants/1")
        if response.status_code == 200:
            variants = response.json()
            print(f"✅ Encontradas {len(variants)} variantes")
            for i, variant in enumerate(variants[:3]):  # Solo primeras 3
                print(
                    f"   Variante {i + 1}: {variant.get('size_name', 'N/A')} - {variant.get('color_name', 'N/A')} (Stock: {variant.get('current_stock', 0)})"
                )
        else:
            print(f"❌ Error {response.status_code}: {response.text}")

        # Test 3: Simular impresión (sin datos reales)
        print("\n3️⃣ Test print-barcodes (simulación):")
        test_data = {
            "variants": [{"variant_id": 1, "quantity": 2}],
            "options": {
                "includeProductName": True,
                "includeSize": True,
                "includeColor": True,
                "includePrice": False,
            },
        }

        response = requests.post(
            f"{base_url}/api/inventory/print-barcodes",
            json=test_data,
            headers={"Content-Type": "application/json"},
        )

        if response.status_code == 200:
            result = response.json()
            print(f"✅ Respuesta de impresión: {result.get('message', 'N/A')}")
        else:
            print(f"❌ Error {response.status_code}: {response.text}")

    except requests.exceptions.ConnectionError:
        print("❌ No se puede conectar al servidor. ¿Está corriendo en puerto 8080?")
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    test_endpoints()
