import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:5000/api/account"


def test_account_movements_api():
    """
    Test the Account Movements API endpoints
    """
    print("🧪 Testing Account Movements API...")

    # Test data for creating a debit movement
    test_debit_data = {
        "entity_id": 1,  # Assuming client with ID 1 exists
        "amount": 150.50,
        "description": "Test debit movement - Venta a cuenta corriente",
    }

    try:
        # Test creating a debit movement
        print("\n1. Testing debit movement creation...")
        response = requests.post(f"{BASE_URL}/debit", json=test_debit_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")

        if response.status_code == 200:
            print("✅ Debit movement created successfully!")

            # Test getting client balance
            print("\n2. Testing get client balance...")
            balance_response = requests.get(f"{BASE_URL}/balance/1")
            print(f"Status Code: {balance_response.status_code}")
            print(f"Response: {json.dumps(balance_response.json(), indent=2)}")

            # Test getting client movements
            print("\n3. Testing get client movements...")
            movements_response = requests.get(f"{BASE_URL}/movements/1")
            print(f"Status Code: {movements_response.status_code}")
            print(f"Response: {json.dumps(movements_response.json(), indent=2)}")

            # Test getting all movements
            print("\n4. Testing get all movements...")
            all_movements_response = requests.get(f"{BASE_URL}/all")
            print(f"Status Code: {all_movements_response.status_code}")
            print(f"Response: {json.dumps(all_movements_response.json(), indent=2)}")

        else:
            print(f"❌ Failed to create debit movement: {response.text}")

    except requests.exceptions.ConnectionError:
        print(
            "❌ Could not connect to the API. Make sure the backend server is running on port 5000."
        )
    except Exception as e:
        print(f"❌ Error testing API: {e}")


if __name__ == "__main__":
    test_account_movements_api()
