import requests
import json


def test_endpoints():
    """
    Prueba los endpoints para ver qué datos devuelven
    """
    base_url = "http://localhost:5000/api/inventory"

    print("🧪 PROBANDO ENDPOINTS DE INVENTARIO\n")

    # Test 1: Debug simple
    print("1. Probando /debug-simple:")
    try:
        response = requests.get(f"{base_url}/debug-simple")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error conectando: {e}")

    # Test 2: Storage list
    print("\n2. Probando /storage-list:")
    try:
        response = requests.get(f"{base_url}/storage-list")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error conectando: {e}")

    # Test 3: Products by storage
    print("\n3. Probando /products-by-storage:")
    try:
        response = requests.get(f"{base_url}/products-by-storage")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error conectando: {e}")


if __name__ == "__main__":
    print("⚠️ Asegúrate de que el servidor backend esté corriendo en localhost:5000")
    print("Ejecuta: python main.py en el directorio backend\n")
    test_endpoints()
