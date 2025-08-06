#!/usr/bin/env python3
"""
Test script to debug the brand-provider assignment issue
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import Database
import json


def test_assignment():
    print("🧪 Testing brand-provider assignment...")

    # Initialize database
    db = Database()

    # Test data
    test_data = {
        "id_provider": 1,  # Should exist based on dump_postgres.sql
        "id_brand": 1,  # Should exist based on dump_postgres.sql
    }

    print(f"📊 Test data: {test_data}")

    # Try to add the record
    try:
        result = db.add_record("proveedorxmarca", test_data)
        print(f"✅ Result: {json.dumps(result, indent=2)}")

        if result["success"]:
            print("🎉 Assignment successful!")
        else:
            print(f"❌ Assignment failed: {result.get('message', 'Unknown error')}")

    except Exception as e:
        print(f"💥 Exception occurred: {str(e)}")
        import traceback

        traceback.print_exc()


def test_existing_data():
    print("\n🔍 Checking existing data...")

    db = Database()

    # Check brands
    print("📋 Brands:")
    brands = db.get_all_records("brands")
    print(json.dumps(brands, indent=2))

    # Check entities (providers)
    print("\n📋 Entities (Providers):")
    entities = db.get_all_records_by_clause(
        "entities", "entity_type LIKE ?", "provider"
    )
    print(json.dumps(entities, indent=2))

    # Check existing assignments
    print("\n📋 Existing assignments:")
    assignments = db.get_all_records("proveedorxmarca")
    print(json.dumps(assignments, indent=2))


if __name__ == "__main__":
    test_existing_data()
    test_assignment()
