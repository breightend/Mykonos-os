#!/usr/bin/env python3
"""
Test script to verify the print settings functionality fix
"""

import requests


def test_get_print_settings():
    """Test that the print settings can be retrieved without KeyError"""

    url = "http://localhost:5000/api/inventory/print-settings"
    params = {"user_id": "default"}

    try:
        # Make GET request to retrieve print settings
        response = requests.get(url, params=params, timeout=10)

        print(f"GET Status Code: {response.status_code}")
        print(f"GET Response: {response.text}")

        if response.status_code == 200:
            print("SUCCESS: Print settings retrieved successfully!")
            return True
        else:
            print(f"ERROR: Got status code {response.status_code}")
            return False

    except requests.exceptions.RequestException as e:
        print(f"REQUEST ERROR: {e}")
        return False
    except Exception as e:
        print(f"UNEXPECTED ERROR: {e}")
        return False


def test_print_settings_save():
    """Test that the print settings can be saved without KeyError"""

    url = "http://localhost:5000/api/inventory/print-settings"

    # Test data for print settings
    test_data = {
        "user_id": "test_user",
        "settings": {
            "showProductName": True,
            "showVariantName": True,
            "showSize": True,
            "showColor": True,
            "showPrice": False,
            "showBarcode": True,
            "printWidth": 450,
            "printHeight": 200,
            "fontSize": 12,
            "backgroundColor": "#FFFFFF",
            "textColor": "#000000",
        },
    }

    try:
        # Make POST request to save print settings
        response = requests.post(
            url,
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=10,
        )

        print(f"POST Status Code: {response.status_code}")
        print(f"POST Response: {response.text}")

        if response.status_code == 200:
            print("SUCCESS: Print settings saved successfully!")
            return True
        else:
            print(f"ERROR: Got status code {response.status_code}")
            return False

    except requests.exceptions.RequestException as e:
        print(f"REQUEST ERROR: {e}")
        return False
    except Exception as e:
        print(f"UNEXPECTED ERROR: {e}")
        return False


if __name__ == "__main__":
    print("Testing print settings functionality...")

    print("\n1. Testing GET print settings...")
    get_success = test_get_print_settings()

    print("\n2. Testing POST print settings...")
    post_success = test_print_settings_save()

    if get_success and post_success:
        print("\nAll tests completed successfully! The KeyError has been fixed.")
    else:
        print(f"\nTests failed. GET: {get_success}, POST: {post_success}")
        print("There may still be issues with the print settings.")
