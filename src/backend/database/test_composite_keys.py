#!/usr/bin/env python3
# Test script for composite primary keys functionality

import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import Database, TABLES


def test_composite_primary_keys():
    """Test the composite primary key functionality for PROVEEDORXMARCA table"""

    print("Testing composite primary keys functionality...")

    # Initialize database
    db = Database("./test_composite.db")

    # Test 1: Add some test entities (providers)
    print("\n1. Adding test providers...")
    provider1_data = {
        "entity_name": "Test Provider 1",
        "entity_type": "proveedor",
        "razon_social": "Test Provider 1 S.A.",
        "responsabilidad_iva": 1,
        "domicilio_comercial": "Test Address 1",
        "cuit": "20-12345678-9",
    }

    provider2_data = {
        "entity_name": "Test Provider 2",
        "entity_type": "proveedor",
        "razon_social": "Test Provider 2 S.A.",
        "responsabilidad_iva": 1,
        "domicilio_comercial": "Test Address 2",
        "cuit": "20-87654321-9",
    }

    result1 = db.add_record(TABLES.ENTITIES.value, provider1_data)
    result2 = db.add_record(TABLES.ENTITIES.value, provider2_data)

    if result1["success"] and result2["success"]:
        provider1_id = result1["rowid"]
        provider2_id = result2["rowid"]
        print(f"✓ Providers added successfully. IDs: {provider1_id}, {provider2_id}")
    else:
        print(f"✗ Failed to add providers: {result1['message']}, {result2['message']}")
        return False

    # Test 2: Add some test brands
    print("\n2. Adding test brands...")
    brand1_data = {"brand_name": "Test Brand 1", "description": "First test brand"}

    brand2_data = {"brand_name": "Test Brand 2", "description": "Second test brand"}

    result1 = db.add_record(TABLES.BRANDS.value, brand1_data)
    result2 = db.add_record(TABLES.BRANDS.value, brand2_data)

    if result1["success"] and result2["success"]:
        brand1_id = result1["rowid"]
        brand2_id = result2["rowid"]
        print(f"✓ Brands added successfully. IDs: {brand1_id}, {brand2_id}")
    else:
        print(f"✗ Failed to add brands: {result1['message']}, {result2['message']}")
        return False

    # Test 3: Test composite primary key relationships
    print("\n3. Testing composite primary key relationships...")

    # Add provider-brand relationships
    result1 = db.add_provider_brand_relationship(provider1_id, brand1_id)
    result2 = db.add_provider_brand_relationship(provider1_id, brand2_id)
    result3 = db.add_provider_brand_relationship(provider2_id, brand1_id)

    if result1["success"] and result2["success"] and result3["success"]:
        print("✓ Provider-brand relationships added successfully")
    else:
        print(
            f"✗ Failed to add relationships: {result1['message']}, {result2['message']}, {result3['message']}"
        )
        return False

    # Test 4: Try to add duplicate relationship (should fail due to composite primary key)
    print("\n4. Testing duplicate relationship prevention...")
    duplicate_result = db.add_provider_brand_relationship(provider1_id, brand1_id)

    if not duplicate_result["success"]:
        print("✓ Duplicate relationship correctly prevented by composite primary key")
    else:
        print("✗ Duplicate relationship was incorrectly allowed")
        return False

    # Test 5: Test utility methods
    print("\n5. Testing utility methods...")

    # Get brands by provider
    brands_for_provider1 = db.get_brands_by_provider(provider1_id)
    print(f"✓ Provider 1 has {len(brands_for_provider1)} brands")

    # Get providers by brand
    providers_for_brand1 = db.get_providers_by_brand(brand1_id)
    print(f"✓ Brand 1 has {len(providers_for_brand1)} providers")

    # Get all relationships
    all_relationships = db.get_provider_brands_relationships()
    print(f"✓ Total relationships: {len(all_relationships)}")

    # Test relationship existence check
    exists_result = db.check_provider_brand_relationship_exists(provider1_id, brand1_id)
    if exists_result["exists"]:
        print("✓ Relationship existence check works correctly")
    else:
        print("✗ Relationship existence check failed")
        return False

    # Test 6: Remove relationship
    print("\n6. Testing relationship removal...")
    remove_result = db.remove_provider_brand_relationship(provider1_id, brand1_id)

    if remove_result["success"]:
        print("✓ Relationship removed successfully")

        # Verify removal
        exists_after_removal = db.check_provider_brand_relationship_exists(
            provider1_id, brand1_id
        )
        if not exists_after_removal["exists"]:
            print("✓ Relationship removal verified")
        else:
            print("✗ Relationship still exists after removal")
            return False
    else:
        print(f"✗ Failed to remove relationship: {remove_result['message']}")
        return False

    print(
        "\n🎉 All tests passed! Composite primary key functionality is working correctly."
    )

    # Clean up test database
    try:
        os.remove("./test_composite.db")
        print("✓ Test database cleaned up")
    except:
        pass

    return True


if __name__ == "__main__":
    success = test_composite_primary_keys()
    sys.exit(0 if success else 1)
