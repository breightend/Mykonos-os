import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:5000/api"


def test_simple_endpoints():
    """
    Test basic API endpoints
    """
    print("🧪 Testing basic API endpoints...")

    try:
        # Test the basic endpoint
        print("\n1. Testing basic endpoint...")
        response = requests.get(f"{BASE_URL.replace('/api', '')}/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")

        # Test getting all clients
        print("\n2. Testing get all clients...")
        clients_response = requests.get(f"{BASE_URL}/client/")
        print(f"Status Code: {clients_response.status_code}")
        clients_data = clients_response.json()
        print(f"Clients found: {len(clients_data)}")

        if len(clients_data) > 0:
            client_id = clients_data[0]["id"]
            print(f"Using client ID: {client_id}")

            # Now test account movements with a real client
            print("\n3. Testing account movements with real client...")
            debit_data = {
                "entity_id": client_id,
                "amount": 150.50,
                "description": "Test debit movement - Venta a cuenta corriente",
            }

            debit_response = requests.post(f"{BASE_URL}/account/debit", json=debit_data)
            print(f"Debit movement - Status Code: {debit_response.status_code}")
            print(f"Response: {json.dumps(debit_response.json(), indent=2)}")

        else:
            print("No clients found to test with")

    except requests.exceptions.ConnectionError:
        print(
            "❌ Could not connect to the API. Make sure the backend server is running on port 5000."
        )
    except Exception as e:
        print(f"❌ Error testing API: {e}")


if __name__ == "__main__":
    test_simple_endpoints()
