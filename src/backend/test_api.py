import requests
import json

# Test the storage API endpoints
base_url = "http://127.0.0.1:5000/api/storage"


def test_get_all_sucursales():
    """Test GET all sucursales"""
    try:
        response = requests.get(base_url)
        print(f"GET /api/storage - Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error testing GET all sucursales: {e}")
        return False


def test_create_sucursal():
    """Test POST new sucursal"""
    try:
        test_data = {
            "nombre": "Sucursal Test",
            "ubicacion": "Test Location",
            "telefono": "123456789",
        }
        response = requests.post(base_url, json=test_data)
        print(f"POST /api/storage - Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 201
    except Exception as e:
        print(f"Error testing POST sucursal: {e}")
        return False


if __name__ == "__main__":
    print("Testing Storage API endpoints...")
    print("=" * 50)

    print("\n1. Testing GET all sucursales:")
    test_get_all_sucursales()

    print("\n2. Testing POST new sucursal:")
    test_create_sucursal()

    print("\n3. Testing GET all sucursales again:")
    test_get_all_sucursales()
