import requests
import json

# Simple test to check if the API is responding
try:
    print("🔍 Testing API connectivity...")
    response = requests.get("http://localhost:5000/api/exchange/history", timeout=5)
    print(f"✅ API Status: {response.status_code}")
    print(f"📋 Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"❌ Error: {e}")

# Test product validation
try:
    print("\n🔍 Testing product validation...")
    data = {"variant_barcode": "VAR0003002003", "quantity": 1, "branch_id": 1}
    response = requests.post(
        "http://localhost:5000/api/exchange/validate-return", json=data, timeout=5
    )
    print(f"✅ Validation Status: {response.status_code}")
    print(f"📋 Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
except Exception as e:
    print(f"❌ Validation Error: {e}")
