#!/usr/bin/env python3
"""
Simple test to check if the sucursales API is working
Run this after starting the Flask server
"""

import requests
import time


def check_server():
    """Check if the server is running"""
    try:
        response = requests.get("http://127.0.0.1:5000/", timeout=3)
        print("✓ Flask server is running")
        return True
    except requests.ConnectionError:
        print("✗ Flask server is not running")
        return False
    except Exception as e:
        print(f"✗ Error connecting to server: {e}")
        return False


def test_storage_api():
    """Test the storage API endpoints"""
    base_url = "http://127.0.0.1:5000/api/storage"

    print("\n=== Testing Storage API ===")

    try:
        # Test GET all storages
        print("Testing GET /api/storage...")
        response = requests.get(base_url, timeout=5)
        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"✓ Found {len(data)} sucursales")
            return True
        else:
            print(f"✗ Error: {response.text}")
            return False

    except Exception as e:
        print(f"✗ Exception: {e}")
        return False


def main():
    print("Testing Sucursales Backend API")
    print("=" * 40)

    # Check if server is running
    if not check_server():
        print("\nPlease start the Flask server first:")
        print("cd backend && python main.py")
        return

    # Test the storage API
    success = test_storage_api()

    if success:
        print("\n✓ API is working correctly!")
        print("\nYou can now test the frontend components")
    else:
        print("\n✗ API test failed")
        print("Check the server logs for errors")


if __name__ == "__main__":
    main()
