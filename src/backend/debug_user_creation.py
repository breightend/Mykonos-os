#!/usr/bin/env python3
"""
Debug script to test user creation
"""

import requests
import json

BASE_URL = "http://127.0.0.1:5000/api"


def test_user_creation():
    """Test user creation with simple data"""

    print("🧪 Testing User Creation")
    print("=" * 40)

    # Test data similar to what the frontend sends
    test_user = {
        "nombre": "Test",
        "apellido": "User",
        "username": "TestUser",
        "fullname": "Test User",
        "password": "test123456",
        "email": "test@example.com",
        "phone": "1234567890",
        "domicilio": "Test Address 123",
        "cuit": "12345678901",
        "role": "employee",
        "status": "active",
        "profile_image": "",
        "created_at": "2025-07-01",
        "confirmPassword": "test123456",
    }

    try:
        print("1. Testing user creation...")
        print(f"   Data being sent: {json.dumps(test_user, indent=2)}")

        response = requests.post(f"{BASE_URL}/user/employees", json=test_user)
        print(f"   Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"   ✓ User created successfully!")
            print(f"   Response: {json.dumps(result, indent=2)}")
            return result.get("user_id")
        else:
            print(f"   ❌ User creation failed")
            try:
                error = response.json()
                print(f"   Error: {json.dumps(error, indent=2)}")
            except:
                print(f"   Raw error: {response.text}")

    except Exception as e:
        print(f"   ❌ Exception: {e}")

    return None


def test_storage_assignment(user_id):
    """Test storage assignment"""
    if not user_id:
        print("No user ID to test storage assignment")
        return

    print(f"\n2. Testing storage assignment for user {user_id}...")

    try:
        # Get available storages
        response = requests.get(f"{BASE_URL}/storage")
        if response.status_code == 200:
            storages = response.json()
            if storages:
                storage_id = storages[0]["id"]
                print(f"   Using storage: {storages[0]['name']} (ID: {storage_id})")

                # Assign storage to user
                response = requests.post(
                    f"{BASE_URL}/storage/{storage_id}/employees",
                    json={"user_id": user_id},
                )
                print(f"   Assignment status: {response.status_code}")

                if response.status_code == 200:
                    print(f"   ✓ Storage assigned successfully")
                else:
                    result = response.json()
                    print(f"   Assignment result: {json.dumps(result, indent=2)}")
            else:
                print("   No storages available for testing")
        else:
            print(f"   Failed to get storages: {response.status_code}")

    except Exception as e:
        print(f"   ❌ Exception in storage assignment: {e}")


if __name__ == "__main__":
    user_id = test_user_creation()
    test_storage_assignment(user_id)
