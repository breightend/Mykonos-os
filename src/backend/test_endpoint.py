#!/usr/bin/env python3
"""
Simple test to verify the storage employees endpoint
"""

import requests
import json


def test_storage_employees_endpoint():
    """Test the storage employees endpoint directly"""
    print("=== Testing Storage Employees Endpoint ===")

    base_url = "http://localhost:5000/api/storage"

    # First check if server is running
    try:
        response = requests.get(f"{base_url}/", timeout=5)
        print(f"✓ Server is running. Status: {response.status_code}")
        storages = response.json()
        print(f"Found {len(storages)} storage locations")
    except requests.exceptions.RequestException as e:
        print(f"✗ Server is not running or not accessible: {e}")
        print("Please start the backend server first:")
        print("cd src/backend && python run_server.py")
        return

    # Test the employees endpoint for each storage
    for storage in storages:
        storage_id = storage.get("id")
        storage_name = storage.get("name", "Unknown")

        print(f"\nTesting employees for storage {storage_id} ({storage_name}):")

        try:
            response = requests.get(f"{base_url}/{storage_id}/employees", timeout=5)
            print(f"  Status: {response.status_code}")

            if response.status_code == 200:
                employees = response.json()
                print(f"  ✓ Found {len(employees)} employees")
                for emp in employees:
                    print(
                        f"    - {emp.get('username', 'N/A')} ({emp.get('fullname', 'N/A')})"
                    )
            else:
                print(f"  ✗ Error: {response.text}")

        except requests.exceptions.RequestException as e:
            print(f"  ✗ Request failed: {e}")


if __name__ == "__main__":
    test_storage_employees_endpoint()
