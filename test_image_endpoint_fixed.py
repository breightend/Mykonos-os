#!/usr/bin/env python3
"""
Script para probar el endpoint de imagen corregido
"""

import requests
import sys


def test_image_endpoint():
    """Prueba el endpoint de imagen para el producto 14"""

    product_id = 14
    url = f"http://localhost:5000/api/product/{product_id}/image"

    print(f"Probando endpoint: {url}")

    try:
        response = requests.get(url, timeout=10)

        print(f"Status Code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type', 'N/A')}")
        print(f"Content-Length: {response.headers.get('Content-Length', 'N/A')}")

        if response.status_code == 200:
            content_type = response.headers.get("Content-Type", "")
            if content_type.startswith("image/"):
                print("✅ SUCCESS: Imagen devuelta correctamente")
                print(f"   Tamaño de imagen: {len(response.content)} bytes")

                # Verificar que es realmente una imagen
                if len(response.content) > 0:
                    # Verificar headers típicos de JPEG
                    if response.content.startswith(b"\xff\xd8\xff"):
                        print("   ✅ Formato JPEG válido detectado")
                    else:
                        print("   ⚠️  El contenido no parece ser JPEG válido")
                        print(f"   Primeros bytes: {response.content[:10].hex()}")
                else:
                    print("   ❌ Contenido vacío")
            else:
                print(f"❌ ERROR: Content-Type incorrecto: {content_type}")
                print("Contenido de respuesta:")
                print(response.text[:500])
        else:
            print(f"❌ ERROR: Status code {response.status_code}")
            print("Contenido de respuesta:")
            print(response.text[:500])

    except requests.exceptions.RequestException as e:
        print(f"❌ ERROR de conexión: {e}")
        return False

    return response.status_code == 200


if __name__ == "__main__":
    success = test_image_endpoint()
    sys.exit(0 if success else 1)
