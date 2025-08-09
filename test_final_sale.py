import requests

# Datos de prueba para una venta simple
test_data = {
    "products": [
        {
            "product_id": 1,
            "variant_id": 1,
            "product_name": "Producto Test",
            "size_name": "M",
            "color_name": "Azul",
            "quantity": 1,
            "price": 100.0,
            "cost_price": 50.0,
        }
    ],
    "employeeId": 1,
    "cashierId": 1,
    "storageId": 1,
    "paymentMethods": [{"method": "Efectivo", "amount": 100.0, "reference": ""}],
    "totalSale": 100.0,
    "exchange": None,
}

try:
    print("🚀 Probando endpoint de debug...")
    response = requests.post(
        "http://localhost:5000/api/sales/debug-create-sale",
        json=test_data,
        headers={"Content-Type": "application/json"},
    )

    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")

    if response.status_code == 200:
        print("✅ DEBUG SUCCESSFUL!")
        print("Probando endpoint real...")

        # Probar endpoint real
        response_real = requests.post(
            "http://localhost:5000/api/sales/create-sale",
            json=test_data,
            headers={"Content-Type": "application/json"},
        )

        print(f"Real endpoint - Status Code: {response_real.status_code}")
        print(f"Real endpoint - Response: {response_real.text}")

        if response_real.status_code == 201:
            print("✅ VENTA CREADA EXITOSAMENTE!")
        else:
            print("❌ Error en el endpoint real")
    else:
        print("❌ Error en debug endpoint")

except Exception as e:
    print(f"Error: {e}")
