"""
Test script to validate the provider and brand endpoints
"""

import requests
import json
from datetime import datetime

# Base URL for the API
BASE_URL = "http://localhost:5000/api/provider"


def test_endpoints():
    """Test the provider and brand endpoints"""

    # Test 1: Create a brand
    print("Testing brand creation...")
    brand_data = {
        "brand_name": "Test Brand",
        "description": "Test brand description",
        "creation_date": datetime.now().isoformat(),
        "last_modified_date": datetime.now().isoformat(),
    }

    try:
        response = requests.post(f"{BASE_URL}/brand", json=brand_data)
        print(f"Brand creation response: {response.status_code}")
        print(f"Response body: {response.text}")
    except Exception as e:
        print(f"Error creating brand: {e}")

    # Test 2: Get all brands
    print("\nTesting get all brands...")
    try:
        response = requests.get(f"{BASE_URL}/brand")
        print(f"Get all brands response: {response.status_code}")
        brands = response.json()
        print(f"Number of brands: {len(brands)}")
        if brands:
            print(f"First brand: {brands[0]}")
    except Exception as e:
        print(f"Error getting brands: {e}")

    # Test 3: Get all providers
    print("\nTesting get all providers...")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Get all providers response: {response.status_code}")
        providers = response.json()
        print(f"Number of providers: {len(providers)}")
        if providers:
            print(f"First provider columns: {list(providers[0].keys())}")
    except Exception as e:
        print(f"Error getting providers: {e}")

    # Test 4: Test provider-brand relationships
    print("\nTesting provider-brand relationships...")
    try:
        response = requests.get(f"{BASE_URL}/providerJoinMarca")
        print(f"Provider-brand join response: {response.status_code}")
        relationships = response.json()
        print(f"Number of relationships: {len(relationships)}")
        if relationships:
            print(f"First relationship columns: {list(relationships[0].keys())}")
    except Exception as e:
        print(f"Error getting provider-brand relationships: {e}")


if __name__ == "__main__":
    test_endpoints()
