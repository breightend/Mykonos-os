#!/usr/bin/env python3
"""
Test script to debug user creation issues
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import Database
from werkzeug.security import generate_password_hash


def test_user_creation():
    print("Testing user creation...")

    db = Database()

    # Test data
    test_data = {
        "username": "TestUser123",
        "fullname": "Test User",
        "password": generate_password_hash("testpassword123"),
        "email": "test@example.com",
        "phone": "1234567890",
        "domicilio": "Test Address 123",
        "cuit": "20123456789",
        "role": "employee",
        "status": "active",
        "session_token": "",
        "profile_image": b"",
    }

    print(f"Test data: {test_data}")

    # Check if user already exists
    existing_user = db.get_all_records_by_clause(
        "users", "username = ?", test_data["username"]
    )
    if existing_user:
        print(f"User already exists: {existing_user}")
        # Delete existing user for testing
        db.delete_record("users", existing_user[0]["id"])
        print("Deleted existing user")

    # Check if cuit already exists
    existing_cuit = db.get_all_records_by_clause("users", "cuit = ?", test_data["cuit"])
    if existing_cuit:
        print(f"CUIT already exists: {existing_cuit}")
        # Delete existing user for testing
        db.delete_record("users", existing_cuit[0]["id"])
        print("Deleted existing user with same CUIT")

    # Try to create user
    try:
        result = db.add_record("users", test_data)
        print(f"Database result: {result}")

        if result["success"]:
            print("User created successfully!")

            # Verify user was created
            created_user = db.get_record_by_id("users", result["rowid"])
            print(f"Created user: {created_user}")

            # Clean up
            db.delete_record("users", result["rowid"])
            print("Cleaned up test user")

        else:
            print(f"Failed to create user: {result}")

    except Exception as e:
        print(f"Exception during user creation: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    test_user_creation()
