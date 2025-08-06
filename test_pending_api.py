import requests
import json


def test_pending_shipments():
    """Test the pending shipments endpoint"""
    try:
        # Test endpoint
        url = "http://localhost:5000/inventory/pending-shipments/1"
        print(f"🔍 Testing endpoint: {url}")

        response = requests.get(url)
        print(f"📊 Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"✅ Response successful")
            print(f"📦 Data: {json.dumps(data, indent=2)}")

            if data.get("status") == "success":
                shipments = data.get("data", [])
                print(f"📋 Found {len(shipments)} pending shipments")

                for i, shipment in enumerate(shipments):
                    print(f"\n[{i + 1}] Shipment ID: {shipment['id']}")
                    print(
                        f"    From: {shipment['fromStorage']} → To: {shipment['toStorage']}"
                    )
                    print(f"    Status: {shipment['status']}")
                    print(f"    Products: {len(shipment['products'])} items")

                    for j, product in enumerate(shipment["products"]):
                        print(f"      [{j + 1}] {product['name']}")
                        print(f"          Brand: {product['brand']}")
                        print(f"          Size: {product['size']}")
                        print(
                            f"          Color: {product['color']} ({product['color_hex']})"
                        )
                        print(f"          Barcode: {product['variant_barcode']}")
                        print(f"          Price: ${product['sale_price']}")
                        print(f"          Quantity: {product['quantity']}")

                if len(shipments) == 0:
                    print("❌ No pending shipments found. Creating test data...")
                    create_test_data()
            else:
                print(f"❌ API Error: {data.get('message')}")
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"📄 Response: {response.text}")

    except Exception as e:
        print(f"❌ Exception: {e}")


def create_test_data():
    """Create test shipments"""
    try:
        url = "http://localhost:5000/inventory/create-test-shipments"
        print(f"🧪 Creating test data at: {url}")

        response = requests.post(url)
        print(f"📊 Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"✅ Test data created successfully")
            print(f"📦 Response: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Error creating test data: {response.status_code}")
            print(f"📄 Response: {response.text}")

    except Exception as e:
        print(f"❌ Exception creating test data: {e}")


if __name__ == "__main__":
    test_pending_shipments()
