#!/usr/bin/env python3
"""
Test script to verify that all routes work correctly
"""

import requests
import json

BASE_URL = "http://localhost:5000"


def test_routes():
    print("Testing routes...")

    # Test user routes
    print("\n=== Testing User Routes ===")

    # Test GET /api/user/employees
    try:
        response = requests.get(f"{BASE_URL}/api/user/employees")
        print(f"GET /api/user/employees: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"  Returned {len(data)} employees")
            if data:
                print(f"  First employee: {data[0].get('fullname', 'No name')}")
        else:
            print(f"  Error: {response.text}")
    except Exception as e:
        print(f"  Error: {e}")

    # Test storage routes
    print("\n=== Testing Storage Routes ===")

    # Test GET /api/storage/
    try:
        response = requests.get(f"{BASE_URL}/api/storage/")
        print(f"GET /api/storage/: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"  Returned {len(data)} storages")
            if data:
                print(f"  First storage: {data[0].get('name', 'No name')}")
                storage_id = data[0].get("id")

                # Test GET /api/storage/<id>
                if storage_id:
                    response = requests.get(f"{BASE_URL}/api/storage/{storage_id}")
                    print(f"GET /api/storage/{storage_id}: {response.status_code}")
                    if response.status_code == 200:
                        storage_data = response.json()
                        print(f"  Storage data: {storage_data.get('name', 'No name')}")

                    # Test GET /api/storage/<id>/employees
                    response = requests.get(
                        f"{BASE_URL}/api/storage/{storage_id}/employees"
                    )
                    print(
                        f"GET /api/storage/{storage_id}/employees: {response.status_code}"
                    )
                    if response.status_code == 200:
                        employees_data = response.json()
                        print(f"  Returned {len(employees_data)} employees for storage")
        else:
            print(f"  Error: {response.text}")
    except Exception as e:
        print(f"  Error: {e}")


if __name__ == "__main__":
    test_routes()
