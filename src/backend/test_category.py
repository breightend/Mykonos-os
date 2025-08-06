#!/usr/bin/env python3
import requests


def test_create_category():
    url = "http://localhost:5000/api/product/category"

    # Test data with different boolean formats
    test_cases = [
        {"name": "Test Cat 1", "permanent": 1},
        {"name": "Test Cat 2", "permanent": True},
        {"name": "Test Cat 3", "permanent": "1"},
        {"name": "Test Cat 4", "permanent": 0},
        {"name": "Test Cat 5", "permanent": False},
    ]

    print("🔍 Testing category creation with different boolean formats...")

    for i, data in enumerate(test_cases, 1):
        print(f"\n--- Test {i}: {data} ---")
        try:
            response = requests.post(url, json=data, timeout=10)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                print(f"Success: {response.json()}")
            else:
                print(f"Error: {response.text}")
        except Exception as e:
            print(f"Exception: {e}")


if __name__ == "__main__":
    test_create_category()
