import requests
import json

# Test de creación de venta simple
test_data = {
    "products": [
        {
            "product_id": 1,
            "variant_id": 1,
            "product_name": "Test Product",
            "size_name": "M",
            "color_name": "Red",
            "price": 100.0,
            "quantity": 1,
            "variant_barcode": "TEST123",
        }
    ],
    "payments": [{"method": "Efectivo", "amount": 100.0}],
    "total": 100.0,
    "storage_id": 1,
    "employee_id": 1,
    "cashier_user_id": 1,
}

try:
    response = requests.post(
        "http://localhost:5000/api/sales/create-sale",
        json=test_data,
        headers={"Content-Type": "application/json"},
    )

    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")

    if response.status_code == 200:
        print("✅ Venta creada exitosamente!")
    else:
        print("❌ Error en la creación de venta")

except requests.exceptions.RequestException as e:
    print(f"Error de conexión: {e}")
except Exception as e:
    print(f"Error: {e}")
