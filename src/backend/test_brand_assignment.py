"""
Test script to validate the assignBrandToProvider functionality
"""

import requests
import json
from datetime import datetime

# Base URL for the API
BASE_URL = "http://localhost:5000/api/provider"


def test_brand_assignment():
    """Test the brand assignment functionality"""

    print("=== Testing Brand Assignment Functionality ===\n")

    # Step 1: Create a test brand
    print("Step 1: Creating a test brand...")
    brand_data = {
        "brand_name": f"Test Brand {datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "description": "Test brand for assignment testing",
        "creation_date": datetime.now().isoformat(),
        "last_modified_date": datetime.now().isoformat(),
    }

    try:
        response = requests.post(f"{BASE_URL}/brand", json=brand_data)
        print(f"Brand creation response: {response.status_code}")
        brand_result = response.json()
        print(f"Brand creation result: {brand_result}")

        if response.status_code == 200 and brand_result.get("brand_id"):
            brand_id = brand_result["brand_id"]
            print(f"✓ Brand created successfully with ID: {brand_id}")
        else:
            print("✗ Failed to create brand")
            return

    except Exception as e:
        print(f"✗ Error creating brand: {e}")
        return

    # Step 2: Get a provider to assign the brand to
    print("\nStep 2: Getting available providers...")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Get providers response: {response.status_code}")
        providers = response.json()

        if providers and len(providers) > 0:
            provider_id = providers[0]["id"]
            provider_name = providers[0]["entity_name"]
            print(f"✓ Using provider: {provider_name} (ID: {provider_id})")
        else:
            print("✗ No providers found. Please create a provider first.")
            return

    except Exception as e:
        print(f"✗ Error getting providers: {e}")
        return

    # Step 3: Assign the brand to the provider
    print("\nStep 3: Assigning brand to provider...")
    assignment_data = {"id_provider": provider_id, "id_brand": brand_id}

    try:
        response = requests.post(f"{BASE_URL}/providerXbrand", json=assignment_data)
        print(f"Brand assignment response: {response.status_code}")
        assignment_result = response.json()
        print(f"Assignment result: {assignment_result}")

        if response.status_code == 200:
            print("✓ Brand assigned to provider successfully")
        else:
            print(f"✗ Failed to assign brand: {assignment_result}")
            return

    except Exception as e:
        print(f"✗ Error assigning brand: {e}")
        return

    # Step 4: Verify the assignment by getting brands for the provider
    print("\nStep 4: Verifying brand assignment...")
    try:
        response = requests.get(f"{BASE_URL}/brand/by-provider/{provider_id}")
        print(f"Get provider brands response: {response.status_code}")
        provider_brands = response.json()

        assigned_brand = None
        for brand in provider_brands:
            if brand["id"] == brand_id:
                assigned_brand = brand
                break

        if assigned_brand:
            print(
                f"✓ Brand assignment verified! Brand '{assigned_brand['brand_name']}' is now assigned to provider '{provider_name}'"
            )
        else:
            print("✗ Brand assignment verification failed")

    except Exception as e:
        print(f"✗ Error verifying assignment: {e}")
        return

    # Step 5: Test the joined view
    print("\nStep 5: Testing provider-brand joined view...")
    try:
        response = requests.get(f"{BASE_URL}/providerJoinMarca")
        print(f"Provider-brand join response: {response.status_code}")
        relationships = response.json()

        found_relationship = False
        for rel in relationships:
            if (
                rel.get("id_brand") == brand_id
                and rel.get("id_provider") == provider_id
            ):
                found_relationship = True
                print(f"✓ Relationship found in joined view: {rel}")
                break

        if not found_relationship:
            print("✗ Relationship not found in joined view")

    except Exception as e:
        print(f"✗ Error testing joined view: {e}")

    print("\n=== Test Complete ===")


if __name__ == "__main__":
    test_brand_assignment()
