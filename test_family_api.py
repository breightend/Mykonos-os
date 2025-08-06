#!/usr/bin/env python3
"""
Test script for family products API endpoints
"""
import requests

BASE_URL = "http://localhost:8000"

def test_get_family_products():
    """Test GET /api/family_products endpoint"""
    print("🔍 Testing GET /api/family_products...")
    try:
        response = requests.get(f"{BASE_URL}/api/family_products")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ GET Success - Found {len(data)} family products")
            return data
        else:
            print(f"❌ GET Failed with status {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ GET Error: {e}")
        return None

def test_post_family_product():
    """Test POST /api/family_products endpoint"""
    print("\n📤 Testing POST /api/family_products...")
    
    test_data = {
        "group_name": "Test Family API",
        "parent_group_id": None,
        "marked_as_root": 1
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/family_products",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        if response.status_code == 201:
            data = response.json()
            print(f"✅ POST Success - Created family: {data}")
            return data
        else:
            print(f"❌ POST Failed with status {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ POST Error: {e}")
        return None

def main():
    print("🚀 Starting Family Products API Tests")
    print("=" * 50)
    
    # Test GET endpoint first
    test_get_family_products()
    
    # Test POST endpoint
    new_family = test_post_family_product()
    
    # Test GET again to see the new family
    if new_family:
        print("\n🔄 Testing GET again after creation...")
        test_get_family_products()
    
    print("\n" + "=" * 50)
    print("🏁 Family Products API Tests Complete")

if __name__ == "__main__":
    main()
