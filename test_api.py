import requests
import json

# Test simple de la API
url = "http://localhost:5000/api/sales/create-sale"

# Datos mínimos de prueba
test_data = {
    "products": [
        {
            "product_id": 3,
            "variant_id": 6,
            "product_name": "Test Product",
            "description": "Test Product Update",
            "brand": "Marca 5",
            "size_name": "M",
            "color_name": "Rojo",
            "price": 25.99,
            "quantity": 1,
            "variant_barcode": "VAR0003003004",
        }
    ],
    "exchange": None,
    "payments": [{"method": "efectivo", "amount": 25.99}],
    "total": 25.99,
    "storage_id": 1,
    "employee_id": 1,
    "cashier_user_id": 1,
}

try:
    print("🔄 Enviando petición de prueba...")
    print(f"📋 URL: {url}")
    print(f"📋 Datos: {json.dumps(test_data, indent=2)}")

    response = requests.post(url, json=test_data)

    print(f"📊 Status Code: {response.status_code}")
    print(f"📊 Response Headers: {dict(response.headers)}")

    try:
        response_data = response.json()
        print(f"📊 Response JSON: {json.dumps(response_data, indent=2)}")
    except:
        print(f"📊 Response Text: {response.text}")

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback

    traceback.print_exc()
