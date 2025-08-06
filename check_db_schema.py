#!/usr/bin/env python3

import sys
import os

# Add the src/backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "src", "backend"))

from database.database import Database

try:
    print("🔍 Checking database schema...")
    db = Database()

    # Check inventory_movements table structure
    result = db.execute_query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = %s ORDER BY ordinal_position",
        ("inventory_movements",),
    )

    if result:
        print("✅ inventory_movements table columns:")
        for r in result:
            print(f"  - {r['column_name']}")
    else:
        print("❌ No columns found for inventory_movements table")

    # Check if table exists
    table_check = db.execute_query(
        "SELECT table_name FROM information_schema.tables WHERE table_name = %s",
        ("inventory_movements",),
    )

    if table_check:
        print("✅ inventory_movements table exists")
    else:
        print("❌ inventory_movements table does not exist")

    # Check if variant_id column exists
    variant_col_check = db.execute_query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = %s AND column_name = %s",
        ("inventory_movements", "variant_id"),
    )

    if variant_col_check:
        print("✅ variant_id column exists in inventory_movements")
    else:
        print("❌ variant_id column MISSING from inventory_movements")
        print("🔧 Need to add variant_id column")

except Exception as e:
    print(f"❌ Error checking database: {e}")
    import traceback

    traceback.print_exc()
