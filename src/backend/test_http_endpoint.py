#!/usr/bin/env python3
"""
Script simple para probar endpoint de detalles de producto
"""

import requests
import json


def test_product_endpoint():
    """Probar endpoint via HTTP request"""
    base_url = "http://localhost:5000"  # Puerto actual del backend
    product_id = 3

    try:
        # Probar conexión al servidor
        print("🔗 Probando conexión al servidor...")
        response = requests.get(f"{base_url}/health", timeout=5)
        print(f"   Servidor respondió: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ No se puede conectar al servidor: {e}")
        print("   Asegúrate de que el servidor esté corriendo en puerto 8000")
        return

    try:
        # Probar endpoint de detalles
        print(f"📋 Probando endpoint de detalles para producto ID {product_id}...")
        url = f"{base_url}/api/inventory/product-details/{product_id}"
        response = requests.get(url, timeout=10)

        print(f"   Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print("✅ Respuesta exitosa!")

            if "data" in data and "product_image" in data["data"]:
                image_data = data["data"]["product_image"]
                if image_data:
                    print(f"✅ Imagen encontrada! Tamaño: {len(image_data)} caracteres")
                    print(f"   Tipo de datos: {type(image_data)}")
                    if isinstance(image_data, str):
                        print(f"   Primeros 50 caracteres: {image_data[:50]}...")
                    print("✅ ¡La imagen debería mostrarse en el frontend!")
                else:
                    print("❌ Campo product_image está vacío")
            else:
                print("❌ No se encontró campo product_image en la respuesta")
                print(f"   Claves disponibles: {list(data.get('data', {}).keys())}")
        else:
            print(f"❌ Error HTTP: {response.status_code}")
            print(f"   Respuesta: {response.text}")

    except requests.exceptions.RequestException as e:
        print(f"❌ Error en request: {e}")
    except json.JSONDecodeError as e:
        print(f"❌ Error decodificando JSON: {e}")


if __name__ == "__main__":
    test_product_endpoint()
