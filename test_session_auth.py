#!/usr/bin/env python3
"""
Test script to verify the print settings work with session authentication
"""

import requests


def test_print_settings_with_session():
    """Test the print settings with proper session authentication"""

    base_url = "http://localhost:5000/api"

    # First, let's try to login and get a session token
    login_data = {
        "username": "admin",  # Assuming there's an admin user
        "password": "admin",  # Assuming this is the password
        "storage_id": 1,  # Assuming storage ID 1 exists
    }

    try:
        # Step 1: Login to get session token
        print("Step 1: Attempting login...")
        login_response = requests.post(
            f"{base_url}/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=10,
        )

        print(f"Login Status: {login_response.status_code}")
        print(f"Login Response: {login_response.text}")

        if login_response.status_code != 200:
            print("❌ Login failed, cannot test print settings")
            return False

        login_result = login_response.json()
        if not login_result.get("success"):
            print("❌ Login unsuccessful")
            return False

        session_token = login_result["session_data"]["session_token"]
        user_id = login_result["session_data"]["user_id"]
        print(
            f"✅ Login successful! User ID: {user_id}, Session: {session_token[:10]}..."
        )

        # Step 2: Test saving print settings
        print("\nStep 2: Testing save print settings...")
        save_data = {
            "session_token": session_token,
            "settings": {
                "showProductName": True,
                "showColor": False,
                "showSize": True,
                "showPrice": False,
                "showBarcode": True,
                "printWidth": 400,
                "printHeight": 180,
            },
        }

        save_response = requests.post(
            f"{base_url}/inventory/print-settings",
            json=save_data,
            headers={"Content-Type": "application/json"},
            timeout=10,
        )

        print(f"Save Status: {save_response.status_code}")
        print(f"Save Response: {save_response.text}")

        if save_response.status_code != 200:
            print("❌ Save failed")
            return False

        # Step 3: Test getting print settings
        print("\nStep 3: Testing get print settings...")
        get_response = requests.get(
            f"{base_url}/inventory/print-settings",
            params={"session_token": session_token},
            timeout=10,
        )

        print(f"Get Status: {get_response.status_code}")
        print(f"Get Response: {get_response.text}")

        if get_response.status_code != 200:
            print("❌ Get failed")
            return False

        # Step 4: Verify the data
        get_result = get_response.json()
        if get_result.get("status") == "success":
            retrieved_settings = get_result.get("settings", {})
            original_settings = save_data["settings"]

            print("\nStep 4: Verifying data...")
            all_match = True
            for key, expected_value in original_settings.items():
                retrieved_value = retrieved_settings.get(key)
                if retrieved_value == expected_value:
                    print(f"✅ {key}: {expected_value}")
                else:
                    print(f"❌ {key}: Expected {expected_value}, Got {retrieved_value}")
                    all_match = False

            return all_match
        else:
            print("❌ Get response format error")
            return False

    except Exception as e:
        print(f"Error: {e}")
        return False


if __name__ == "__main__":
    print("Testing print settings with session authentication...")
    success = test_print_settings_with_session()

    if success:
        print("\n🎉 All tests passed! Print settings work with session authentication.")
    else:
        print("\n❌ Tests failed. There are still issues.")
