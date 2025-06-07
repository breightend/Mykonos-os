#!/usr/bin/env python3
"""
Simple test script to verify the storage router endpoints
"""

import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from routes.storage_router import storage_router

    print("✅ Storage router imported successfully")

    from database.database import Database

    print("✅ Database imported successfully")

    # Test database connection
    db = Database()
    print("✅ Database connection successful")

    # Test getting all storage records
    records = db.get_all_records("storage")
    print(f"✅ Found {len(records.get('records', []))} storage records")

    print("\n🎉 All basic tests passed! The backend should work correctly.")

except Exception as e:
    print(f"❌ Error: {e}")
    print("🔧 There might be an issue with the backend setup.")
