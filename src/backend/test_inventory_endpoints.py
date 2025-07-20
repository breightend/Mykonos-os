"""
Script de prueba para verificar que los endpoints del inventario funcionan correctamente
"""

import requests
import json

BASE_URL = "http://localhost:5000/api/inventory"


def test_endpoints():
    """Prueba todos los endpoints del inventario"""

    print("🧪 Probando endpoints del inventario...")

    try:
        # 1. Probar lista de sucursales
        print("\n1. Probando GET /storage-list")
        response = requests.get(f"{BASE_URL}/storage-list")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Sucursales encontradas: {len(data.get('data', []))}")
            for storage in data.get("data", [])[:3]:  # Mostrar solo las primeras 3
                print(f"   - {storage['name']}")
        else:
            print(f"   Error: {response.text}")

    except requests.exceptions.ConnectionError:
        print(
            "❌ No se pudo conectar al servidor. Asegúrate de que el backend esté ejecutándose en http://localhost:5000"
        )
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

    try:
        # 2. Probar productos por sucursal (todos)
        print("\n2. Probando GET /products-by-storage (todas las sucursales)")
        response = requests.get(f"{BASE_URL}/products-by-storage")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Productos encontrados: {len(data.get('data', []))}")
            for product in data.get("data", [])[:3]:  # Mostrar solo los primeros 3
                print(
                    f"   - {product['producto']} en {product['sucursal']}: {product['cantidad']} unidades"
                )
        else:
            print(f"   Error: {response.text}")

    except Exception as e:
        print(f"❌ Error: {e}")

    try:
        # 3. Probar productos por sucursal específica
        print("\n3. Probando GET /products-by-storage?storage_id=1")
        response = requests.get(f"{BASE_URL}/products-by-storage?storage_id=1")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Productos en sucursal 1: {len(data.get('data', []))}")
        else:
            print(f"   Error: {response.text}")

    except Exception as e:
        print(f"❌ Error: {e}")

    try:
        # 4. Probar stock de producto específico
        print("\n4. Probando GET /product-stock/1")
        response = requests.get(f"{BASE_URL}/product-stock/1")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Stock del producto 1 en sucursales: {len(data.get('data', []))}")
        else:
            print(f"   Error: {response.text}")

    except Exception as e:
        print(f"❌ Error: {e}")

    try:
        # 5. Probar stock total de producto
        print("\n5. Probando GET /total-stock/1")
        response = requests.get(f"{BASE_URL}/total-stock/1")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(
                f"   Stock total del producto 1: {data.get('data', {}).get('stock_total', 0)} unidades"
            )
        else:
            print(f"   Error: {response.text}")

    except Exception as e:
        print(f"❌ Error: {e}")

    try:
        # 6. Probar actualización de stock
        print("\n6. Probando PUT /update-stock")
        update_data = {"product_id": 1, "storage_id": 1, "quantity": 999}
        response = requests.put(f"{BASE_URL}/update-stock", json=update_data)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Resultado: {data.get('message', 'Stock actualizado')}")
        else:
            print(f"   Error: {response.text}")

    except Exception as e:
        print(f"❌ Error: {e}")

    print("\n✅ Pruebas completadas!")
    return True


if __name__ == "__main__":
    test_endpoints()
