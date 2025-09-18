import requests
import json

def test_debug_endpoint():
    """Test our debug endpoint to see current database state"""
    try:
        response = requests.get('http://localhost:8000/debug-inventory-issue')
        if response.status_code == 200:
            data = response.json()
            print("=== DEBUG ENDPOINT RESULTS ===")
            print(json.dumps(data, indent=2, ensure_ascii=False))
            return True
        else:
            print(f"❌ Debug endpoint failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error calling debug endpoint: {e}")
        return False

if __name__ == "__main__":
    test_debug_endpoint()