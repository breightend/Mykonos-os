#!/usr/bin/env python3
"""
Lista todas las rutas disponibles en el servidor Flask
"""

import requests


def list_flask_routes():
    """
    Intenta obtener información de las rutas del servidor
    """
    print("🔍 Verificando rutas disponibles en el servidor Flask...")

    # Primero verificar si el servidor está corriendo
    try:
        response = requests.get("http://localhost:5000/", timeout=5)
        print(f"✅ Servidor respondió: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("❌ No se puede conectar al servidor en localhost:5000")
        return
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return

    # Probar algunas rutas conocidas
    test_routes = [
        "http://localhost:5000/api/inventory/storage-list",
        "http://localhost:5000/api/inventory/products-by-storage",
        "http://localhost:5000/api/inventory/generate-barcode-svg/1",
    ]

    print("\n🧪 Probando rutas específicas:")
    for url in test_routes:
        try:
            if "generate-barcode-svg" in url:
                # Para este endpoint necesitamos hacer POST
                response = requests.post(url, json={"options": {}}, timeout=5)
            else:
                response = requests.get(url, timeout=5)

            print(f"   {response.status_code} - {url}")

            if response.status_code == 404:
                print("      ❌ RUTA NO ENCONTRADA")
            elif response.status_code == 200:
                print("      ✅ RUTA DISPONIBLE")
            else:
                print(f"      ⚠️  RESPUESTA: {response.status_code}")

        except requests.exceptions.Timeout:
            print(f"   ⏱️  TIMEOUT - {url}")
        except Exception as e:
            print(f"   ❌ ERROR - {url}: {e}")


if __name__ == "__main__":
    list_flask_routes()
