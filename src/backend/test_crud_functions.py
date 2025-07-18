#!/usr/bin/env python3

import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__)))

from database.database import Database


def test_crud_operations():
    """Test the CRUD operations of the Database class."""
    print("Testing Database CRUD operations...")

    # Initialize database
    db = Database()

    # Test get_all_records_by_clause
    print("\n1. Testing get_all_records_by_clause...")
    try:
        providers = db.get_all_records_by_clause(
            "entities", "entity_type LIKE ?", "provider"
        )
        print(f"✓ get_all_records_by_clause works. Found {len(providers)} providers.")
    except Exception as e:
        print(f"✗ get_all_records_by_clause failed: {e}")

    # Test get_all_records
    print("\n2. Testing get_all_records...")
    try:
        brands = db.get_all_records("brands")
        print(f"✓ get_all_records works. Found {len(brands)} brands.")
    except Exception as e:
        print(f"✗ get_all_records failed: {e}")

    # Test add_record
    print("\n3. Testing add_record...")
    try:
        result = db.add_record(
            "brands", {"brand_name": "Test Brand", "description": "Test Description"}
        )
        if result["success"]:
            print(f"✓ add_record works. Created brand with ID: {result['rowid']}")
            test_brand_id = result["rowid"]
        else:
            print(f"✗ add_record failed: {result['message']}")
            test_brand_id = None
    except Exception as e:
        print(f"✗ add_record failed: {e}")
        test_brand_id = None

    # Test get_record_by_id
    if test_brand_id:
        print("\n4. Testing get_record_by_id...")
        try:
            result = db.get_record_by_id("brands", test_brand_id)
            if result["success"]:
                print(
                    f"✓ get_record_by_id works. Found brand: {result['record']['brand_name']}"
                )
            else:
                print(f"✗ get_record_by_id failed: {result['message']}")
        except Exception as e:
            print(f"✗ get_record_by_id failed: {e}")

    # Test update_record
    if test_brand_id:
        print("\n5. Testing update_record...")
        try:
            result = db.update_record(
                "brands",
                {
                    "id": test_brand_id,
                    "brand_name": "Updated Test Brand",
                    "description": "Updated Description",
                },
            )
            if result["success"]:
                print(f"✓ update_record works: {result['message']}")
            else:
                print(f"✗ update_record failed: {result['message']}")
        except Exception as e:
            print(f"✗ update_record failed: {e}")

    # Test delete_record
    if test_brand_id:
        print("\n6. Testing delete_record...")
        try:
            result = db.delete_record("brands", "id = ?", test_brand_id)
            if result["success"]:
                print(f"✓ delete_record works: {result['message']}")
            else:
                print(f"✗ delete_record failed: {result['message']}")
        except Exception as e:
            print(f"✗ delete_record failed: {e}")

    # Test execute_query
    print("\n7. Testing execute_query...")
    try:
        result = db.execute_query("SELECT COUNT(*) as count FROM brands")
        if result:
            print(f"✓ execute_query works. Found {result[0]['count']} brands.")
        else:
            print("✓ execute_query works but returned empty result.")
    except Exception as e:
        print(f"✗ execute_query failed: {e}")

    # Test get_join_records_tres_tables
    print("\n8. Testing get_join_records_tres_tables...")
    try:
        result = db.get_join_records_tres_tables(
            "brands", "proveedorxmarca", "entities", "id", "id_brand", "id_provider"
        )
        print(f"✓ get_join_records_tres_tables works. Found {len(result)} records.")
    except Exception as e:
        print(f"✗ get_join_records_tres_tables failed: {e}")

    print("\n✅ All CRUD tests completed!")


if __name__ == "__main__":
    test_crud_operations()
