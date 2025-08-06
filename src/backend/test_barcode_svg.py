#!/usr/bin/env python3
"""
Script para probar la generación de códigos de barras SVG
"""

import requests
import json


def test_barcode_svg():
    """
    Prueba el endpoint de generación de SVG
    """
    print("🧪 Probando endpoint de generación de código de barras SVG...")

    url = "http://localhost:5000/api/inventory/generate-barcode-svg/1"

    # Datos de prueba
    test_data = {
        "options": {
            "includeProductName": True,
            "includeSize": True,
            "includeColor": True,
            "includePrice": True,
            "includeCode": True,
        }
    }

    try:
        response = requests.post(url, json=test_data)

        print(f"📊 Status code: {response.status_code}")
        print(f"📝 Response headers: {dict(response.headers)}")

        if response.status_code == 200:
            data = response.json()
            print(f"✅ Respuesta exitosa:")
            print(f"   - Status: {data.get('status')}")
            print(f"   - Código de barras: {data.get('data', {}).get('barcode_code')}")
            print(f"   - Líneas de texto: {data.get('data', {}).get('text_lines')}")
            print(
                f"   - SVG content length: {len(data.get('data', {}).get('svg_content', ''))}"
            )

            # Mostrar parte del SVG
            svg_content = data.get("data", {}).get("svg_content", "")
            if svg_content:
                print(f"📄 Primeros 200 caracteres del SVG:")
                print(f"   {svg_content[:200]}...")

        else:
            print(f"❌ Error {response.status_code}:")
            try:
                error_data = response.json()
                print(f"   {json.dumps(error_data, indent=2)}")
            except:
                print(f"   {response.text}")

    except requests.exceptions.ConnectionError:
        print(
            "❌ Error de conexión: El servidor no está ejecutándose en localhost:5000"
        )
    except Exception as e:
        print(f"❌ Error inesperado: {e}")


if __name__ == "__main__":
    test_barcode_svg()
