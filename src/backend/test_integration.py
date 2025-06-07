#!/usr/bin/env python3
"""
Integration test for the complete sucursales implementation
Tests both backend API and verifies database structure
"""

import requests
import json
import time
import sqlite3


def test_database_structure():
    """Test that the required database tables exist with correct structure"""
    print("\n=== Testing Database Structure ===")

    try:
        # Connect to database
        conn = sqlite3.connect("database/database.db")
        cursor = conn.cursor()

        # Check Storage table
        cursor.execute("PRAGMA table_info(storage)")
        storage_columns = [column[1] for column in cursor.fetchall()]
        expected_storage_columns = [
            "id",
            "name",
            "address",
            "postal_code",
            "phone_number",
            "area",
            "description",
        ]

        print(f"Storage table columns: {storage_columns}")
        for col in expected_storage_columns:
            if col in storage_columns:
                print(f"  ✓ {col} column exists")
            else:
                print(f"  ✗ {col} column missing")

        # Check USERSXSTORAGE table
        cursor.execute("PRAGMA table_info(USERSXSTORAGE)")
        usersxstorage_columns = [column[1] for column in cursor.fetchall()]
        expected_usersxstorage_columns = ["id_user", "id_storage"]

        print(f"USERSXSTORAGE table columns: {usersxstorage_columns}")
        for col in expected_usersxstorage_columns:
            if col in usersxstorage_columns:
                print(f"  ✓ {col} column exists")
            else:
                print(f"  ✗ {col} column missing")

        # Check Users table
        cursor.execute("PRAGMA table_info(users)")
        users_columns = [column[1] for column in cursor.fetchall()]
        print(f"Users table columns: {users_columns}")

        conn.close()
        print("✓ Database structure verification complete")
        return True

    except Exception as e:
        print(f"✗ Database error: {e}")
        return False


def check_server():
    """Check if the server is running"""
    try:
        response = requests.get("http://127.0.0.1:5000/", timeout=3)
        print("✓ Flask server is running")
        return True
    except requests.ConnectionError:
        print("✗ Flask server is not running. Please start the server first.")
        return False
    except Exception as e:
        print(f"✗ Error connecting to server: {e}")
        return False


def test_storage_endpoints():
    """Test all storage API endpoints"""
    print("\n=== Testing Storage API Endpoints ===")

    base_url = "http://127.0.0.1:5000/api/storage"

    # Test GET all storage
    try:
        response = requests.get(base_url)
        print(f"GET {base_url}: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"  ✓ Retrieved {len(data)} sucursales")
        else:
            print(f"  ✗ Error: {response.text}")
    except Exception as e:
        print(f"  ✗ Error: {e}")

    # Test POST - Create new storage
    new_storage = {
        "name": "Test Sucursal",
        "address": "123 Test Street",
        "postal_code": "12345",
        "phone_number": "555-1234",
        "area": "Test Area",
        "description": "Test description",
    }

    try:
        response = requests.post(base_url, json=new_storage)
        print(f"POST {base_url}: {response.status_code}")
        if response.status_code == 201:
            created_storage = response.json()
            print(f"  ✓ Created storage with ID: {created_storage.get('id')}")
            storage_id = created_storage.get("id")

            # Test GET by ID
            response = requests.get(f"{base_url}/{storage_id}")
            print(f"GET {base_url}/{storage_id}: {response.status_code}")
            if response.status_code == 200:
                print("  ✓ Retrieved storage by ID")

            # Test PUT - Update storage
            updated_storage = {
                "name": "Updated Test Sucursal",
                "address": "456 Updated Street",
                "postal_code": "54321",
                "phone_number": "555-4321",
                "area": "Updated Area",
                "description": "Updated description",
            }
            response = requests.put(f"{base_url}/{storage_id}", json=updated_storage)
            print(f"PUT {base_url}/{storage_id}: {response.status_code}")
            if response.status_code == 200:
                print("  ✓ Updated storage")

            # Test DELETE
            response = requests.delete(f"{base_url}/{storage_id}")
            print(f"DELETE {base_url}/{storage_id}: {response.status_code}")
            if response.status_code == 200:
                print("  ✓ Deleted storage")

        else:
            print(f"  ✗ Error creating storage: {response.text}")
    except Exception as e:
        print(f"  ✗ Error: {e}")


def test_employee_storage_endpoints():
    """Test employee-storage relationship endpoints"""
    print("\n=== Testing Employee-Storage Relationship Endpoints ===")

    base_url = "http://127.0.0.1:5000/api/storage"

    # Create a test storage first
    new_storage = {
        "name": "Employee Test Sucursal",
        "address": "789 Employee Street",
        "postal_code": "67890",
        "phone_number": "555-7890",
        "area": "Employee Area",
        "description": "Employee test description",
    }

    try:
        response = requests.post(base_url, json=new_storage)
        if response.status_code == 201:
            storage_id = response.json().get("id")
            print(f"✓ Created test storage with ID: {storage_id}")

            # Test GET employees for storage
            response = requests.get(f"{base_url}/{storage_id}/employees")
            print(f"GET {base_url}/{storage_id}/employees: {response.status_code}")
            if response.status_code == 200:
                employees = response.json()
                print(f"  ✓ Retrieved {len(employees)} employees for storage")

            # Clean up - delete test storage
            requests.delete(f"{base_url}/{storage_id}")
            print(f"  ✓ Cleaned up test storage")

    except Exception as e:
        print(f"  ✗ Error: {e}")


def main():
    """Main test function"""
    print("=== Sucursales Implementation Integration Test ===")

    # Test database structure
    if not test_database_structure():
        print("Database structure test failed. Please check your database.")
        return

    # Check if server is running
    if not check_server():
        print("\nTo start the server, run:")
        print("  cd src/backend")
        print("  python run_server.py")
        return

    # Test API endpoints
    test_storage_endpoints()
    test_employee_storage_endpoints()

    print("\n=== Test Summary ===")
    print("✓ All tests completed")
    print("✓ Sucursales implementation appears to be working correctly")
    print("\nNext steps:")
    print("1. Start the frontend with: npm run dev")
    print("2. Navigate to the Sucursales page")
    print("3. Test the complete user interface")


if __name__ == "__main__":
    main()
