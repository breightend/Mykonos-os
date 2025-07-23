#!/usr/bin/env python3
"""
Script para probar el endpoint storage-list via HTTP
"""

import requests
import json


def test_storage_list_endpoint():
    """Probar endpoint storage-list"""
    base_url = "http://localhost:5000"

    try:
        print("🏪 Probando endpoint storage-list...")
        url = f"{base_url}/api/inventory/storage-list"
        print(f"🌐 URL: {url}")

        response = requests.get(url, timeout=10)
        print(f"📡 Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print("✅ Respuesta exitosa!")
            print(f"📊 Estructura: {json.dumps(data, indent=2, ensure_ascii=False)}")

            if data.get("status") == "success" and "data" in data:
                storages = data["data"]
                print(f"🏪 Encontradas {len(storages)} sucursales:")
                for storage in storages:
                    if isinstance(storage, list) and len(storage) >= 2:
                        print(f"   - ID: {storage[0]}, Nombre: {storage[1]}")
                    else:
                        print(f"   - Formato inesperado: {storage}")
            else:
                print("❌ Formato de respuesta inesperado")
        else:
            print(f"❌ Error HTTP: {response.status_code}")
            print(f"   Respuesta: {response.text}")

    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión: {e}")
        print("   Asegúrate de que el servidor esté corriendo")
    except json.JSONDecodeError as e:
        print(f"❌ Error decodificando JSON: {e}")


if __name__ == "__main__":
    test_storage_list_endpoint()
