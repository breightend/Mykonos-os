#!/usr/bin/env python3

import requests
import json


# Test directo de la API de creación de ventas
def test_create_sale():
    url = "http://localhost:5000/api/sales/create-sale"

    # Datos de prueba muy simples
    test_data = {
        "products": [
            {
                "product_id": 1,
                "variant_id": 1,
                "product_name": "Producto de Prueba",
                "size_name": "M",
                "color_name": "Rojo",
                "price": 100.0,
                "quantity": 1,
                "variant_barcode": "TEST123",
            }
        ],
        "payments": [{"method": "Efectivo", "amount": 100.0}],
        "total": 100.0,
        "storage_id": 1,
        "employee_id": 1,
        "cashier_user_id": 1,
    }

    try:
        print("🧪 Probando creación de venta...")
        print(f"📤 URL: {url}")
        print(f"📋 Datos: {json.dumps(test_data, indent=2)}")

        response = requests.post(
            url,
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=10,
        )

        print(f"📨 Status Code: {response.status_code}")
        print(f"📄 Response Headers: {dict(response.headers)}")
        print(f"📝 Response Text: {response.text}")

        if response.status_code == 200:
            print("✅ ¡Venta creada exitosamente!")
            result = response.json()
            print(f"🎯 Resultado: {json.dumps(result, indent=2)}")
        else:
            print("❌ Error en la creación de venta")
            try:
                error_data = response.json()
                print(f"🔥 Error JSON: {json.dumps(error_data, indent=2)}")
            except:
                print(f"🔥 Error Text: {response.text}")

    except requests.exceptions.ConnectionError:
        print("❌ No se puede conectar al servidor. ¿Está corriendo en localhost:5000?")
    except requests.exceptions.Timeout:
        print("⏰ Timeout - El servidor no respondió a tiempo")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    test_create_sale()
