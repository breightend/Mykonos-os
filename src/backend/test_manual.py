import requests


def test_storage_api():
    base_url = "http://127.0.0.1:5000/api/storage"

    print("Testing Storage API...")

    # Test 1: GET all storages
    try:
        response = requests.get(base_url)
        print(f"GET /api/storage - Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Found {len(data)} storages")
            for storage in data:
                print(f"  - {storage}")
        else:
            print(f"Error response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

    print("\n" + "=" * 50)

    # Test 2: POST new storage
    try:
        test_data = {
            "name": "Sucursal Test API",
            "address": "Calle Test 123",
            "postal_code": "1234",
            "phone_number": "123-456-7890",
            "area": "Centro",
            "description": "Sucursal de prueba creada via API",
        }

        response = requests.post(base_url, json=test_data)
        print(f"POST /api/storage - Status: {response.status_code}")
        if response.status_code == 201:
            print("Storage created successfully!")
            print(f"Response: {response.json()}")
        else:
            print(f"Error response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    test_storage_api()
