import requests
import json

# Hacer una petición al endpoint de envíos realizados
response = requests.get("http://localhost:5000/api/inventory/sent-shipments/1")

if response.status_code == 200:
    data = response.json()
    print("✅ Respuesta exitosa!")
    print(f"Estado: {data['status']}")
    print(f"Envíos encontrados: {len(data['data'])}")

    # Mostrar detalles del primer envío que tenga productos
    for shipment in data["data"]:
        if len(shipment["products"]) > 0:
            print(f"\n📦 Envío ID: {shipment['id']}")
            print(f"Estado: {shipment['status']}")
            print(f"Desde: {shipment['fromStorage']}")
            print(f"Hacia: {shipment['toStorage']}")
            print(f"Productos: {len(shipment['products'])}")

            # Mostrar detalles del primer producto
            product = shipment["products"][0]
            print(f"\n🏷️ Primer producto:")
            for key, value in product.items():
                print(f"  {key}: {value}")
            break
else:
    print(f"❌ Error: {response.status_code}")
    print(response.text)
