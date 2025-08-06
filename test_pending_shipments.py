#!/usr/bin/env python3
"""
Script para crear datos de prueba para envíos pendientes.
Como la estructura actual de inventory_movements no incluye información de variantes,
vamos a crear datos básicos que funcionen.
"""

import requests
import json


def create_test_data_via_api():
    """Create test data using the existing API"""
    try:
        print("🧪 Creando datos de prueba para envíos pendientes...")

        # Use the existing create-test-shipments endpoint
        url = "http://localhost:5000/inventory/create-test-shipments"
        response = requests.post(url)

        if response.status_code == 200:
            data = response.json()
            print("✅ Datos de prueba creados exitosamente")
            print(f"📦 Respuesta: {json.dumps(data, indent=2)}")

            # Now test the pending shipments endpoint
            print("\n🔍 Probando endpoint de envíos pendientes...")
            test_url = "http://localhost:5000/inventory/pending-shipments/1"
            test_response = requests.get(test_url)

            if test_response.status_code == 200:
                test_data = test_response.json()
                print("✅ Endpoint de envíos pendientes funciona")

                if test_data.get("status") == "success":
                    shipments = test_data.get("data", [])
                    print(f"📋 Encontrados {len(shipments)} envíos pendientes")

                    for i, shipment in enumerate(shipments):
                        print(f"\n[{i + 1}] Envío ID: {shipment['id']}")
                        print(
                            f"    De: {shipment['fromStorage']} → A: {shipment['toStorage']}"
                        )
                        print(f"    Estado: {shipment['status']}")
                        print(f"    Productos: {len(shipment['products'])} items")

                        for j, product in enumerate(shipment["products"]):
                            print(f"      [{j + 1}] {product['name']}")
                            print(f"          Marca: {product['brand']}")
                            print(f"          Talle: {product['size']}")
                            print(f"          Color: {product['color']}")
                            print(f"          Cantidad: {product['quantity']}")
                            print(f"          Precio: ${product['sale_price']}")
                else:
                    print(f"❌ Error en API: {test_data.get('message')}")
            else:
                print(f"❌ Error probando endpoint: {test_response.status_code}")
                print(f"📄 Respuesta: {test_response.text}")

        else:
            print(f"❌ Error creando datos de prueba: {response.status_code}")
            print(f"📄 Respuesta: {response.text}")

    except requests.exceptions.ConnectionError:
        print(
            "❌ No se pudo conectar al servidor backend. ¿Está corriendo en localhost:5000?"
        )
    except Exception as e:
        print(f"❌ Error: {e}")


def check_server_status():
    """Check if backend server is running"""
    try:
        response = requests.get("http://localhost:5000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Servidor backend está corriendo")
            return True
    except:
        pass

    print("❌ Servidor backend no está corriendo o no responde")
    print(
        "   Asegúrate de que el servidor esté iniciado con: cd src/backend && uv run python main.py"
    )
    return False


if __name__ == "__main__":
    print("🚀 === TEST ENVÍOS PENDIENTES ===")

    if check_server_status():
        create_test_data_via_api()
    else:
        print("\n💡 Para iniciar el servidor:")
        print("   1. Abre una terminal")
        print("   2. cd src/backend")
        print("   3. uv run python main.py")
