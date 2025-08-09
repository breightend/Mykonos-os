#!/usr/bin/env python3
"""Test directo de la API de ventas"""

import requests
import json
import sys


def test_create_sale_api():
    """Test básico del endpoint de crear venta"""

    # URL del endpoint
    url = "http://localhost:5000/api/sales/create-sale"

    # Datos de prueba mínimos
    test_data = {
        "products": [
            {
                "product_id": 1,
                "variant_id": 1,
                "product_name": "Test Product",
                "size_name": "M",
                "color_name": "Red",
                "price": 50.0,
                "quantity": 1,
                "variant_barcode": "TEST001",
            }
        ],
        "payments": [{"method": "Efectivo", "amount": 50.0}],
        "total": 50.0,
        "storage_id": 1,
        "employee_id": 1,
        "cashier_user_id": 1,
    }

    try:
        print("🔍 Testeando API de ventas...")
        print(f"📍 URL: {url}")
        print(f"📦 Payload: {json.dumps(test_data, indent=2)}")
        print("=" * 50)

        # Hacer la petición
        response = requests.post(
            url,
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=30,
        )

        print(f"📊 Status: {response.status_code}")
        print(f"🔤 Headers: {dict(response.headers)}")
        print("=" * 50)
        print(f"📄 Response Body: {response.text}")

        if response.status_code == 200:
            print("✅ ¡ÉXITO! Venta creada correctamente")
        else:
            print("❌ ERROR en la creación de venta")

            # Intentar parsear el error JSON
            try:
                error_json = response.json()
                print(f"🔥 Error JSON: {json.dumps(error_json, indent=2)}")
            except:
                print(f"🔥 Error texto: {response.text}")

    except requests.exceptions.ConnectionError:
        print("❌ ERROR: No se puede conectar al servidor")
        print("   Verifica que el servidor esté corriendo en localhost:5000")
        return False
    except requests.exceptions.Timeout:
        print("❌ ERROR: Timeout - El servidor no respondió")
        return False
    except Exception as e:
        print(f"❌ ERROR inesperado: {e}")
        return False

    return response.status_code == 200


if __name__ == "__main__":
    success = test_create_sale_api()
    sys.exit(0 if success else 1)
