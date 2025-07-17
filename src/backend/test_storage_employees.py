#!/usr/bin/env python3
"""
Test script to debug the storage employees issue
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import Database
import sqlite3


def test_storage_employees():
    """Test the get_users_by_storage function"""
    print("=== Testing Storage Employees Functionality ===")

    db = Database()

    # First, let's check if the tables exist
    print("\n1. Checking if tables exist...")

    try:
        with db.create_connection() as conn:
            cursor = conn.cursor()

            # Check if tables exist
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in cursor.fetchall()]
            print(f"Available tables: {tables}")

            # Check if the required tables exist
            required_tables = ["users", "storage", "usersxstorage"]
            for table in required_tables:
                if table in tables:
                    print(f"✓ Table '{table}' exists")
                else:
                    print(f"✗ Table '{table}' NOT FOUND")

    except Exception as e:
        print(f"Error checking tables: {e}")
        return

    # Check what storage locations exist
    print("\n2. Checking available storage locations...")
    try:
        storages = db.get_all_records("storage")
        print(f"Found {len(storages)} storage locations:")
        for storage in storages:
            print(
                f"  ID: {storage.get('id', 'N/A')}, Name: {storage.get('name', 'N/A')}"
            )
    except Exception as e:
        print(f"Error getting storage locations: {e}")
        return

    # Check what users exist
    print("\n3. Checking available users...")
    try:
        users = db.get_all_records("users")
        print(f"Found {len(users)} users:")
        for user in users[:5]:  # Show first 5 users
            print(
                f"  ID: {user.get('id', 'N/A')}, Username: {user.get('username', 'N/A')}"
            )
        if len(users) > 5:
            print(f"  ... and {len(users) - 5} more users")
    except Exception as e:
        print(f"Error getting users: {e}")
        return

    # Check user-storage relationships
    print("\n4. Checking user-storage relationships...")
    try:
        with db.create_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM usersxstorage")
            relationships = cursor.fetchall()
            print(f"Found {len(relationships)} user-storage relationships:")
            for rel in relationships:
                print(f"  User ID: {rel[0]}, Storage ID: {rel[1]}")
    except Exception as e:
        print(f"Error getting user-storage relationships: {e}")
        return

    # Test the specific function with a storage ID
    print("\n5. Testing get_users_by_storage function...")
    if storages:
        test_storage_id = storages[0]["id"]
        print(f"Testing with storage ID: {test_storage_id}")

        try:
            employees = db.get_users_by_storage(test_storage_id)
            print(f"Result: {employees}")
            print(f"Found {len(employees)} employees for storage {test_storage_id}")
        except Exception as e:
            print(f"Error in get_users_by_storage: {e}")

        # Also test with raw SQL to see if the query works
        print("\n6. Testing raw SQL query...")
        try:
            with db.create_connection() as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                sql = """
                    SELECT u.*
                    FROM users u
                    INNER JOIN usersxstorage us ON u.id = us.id_user
                    WHERE us.id_storage = ?
                """
                cursor.execute(sql, (test_storage_id,))
                rows = cursor.fetchall()
                print(f"Raw SQL result: {len(rows)} rows")
                for row in rows:
                    print(f"  User: {dict(row)}")
        except Exception as e:
            print(f"Error in raw SQL query: {e}")

    print("\n=== Test Complete ===")


if __name__ == "__main__":
    test_storage_employees()
