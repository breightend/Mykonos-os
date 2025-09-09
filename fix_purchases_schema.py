#!/usr/bin/env python3
"""
Script to fix the database schema for purchases table.
"""

import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "src", "backend"))

from database.database import Database


def fix_purchases_schema():
    db = Database()

    try:
        # Check current constraint
        query = """
        SELECT column_name, is_nullable, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'purchases' AND column_name = 'payment_method'
        """
        result = db.execute_query(query)
        print("Current payment_method column info:", result)

        # Make payment_method nullable
        alter_query = "ALTER TABLE purchases ALTER COLUMN payment_method DROP NOT NULL"
        db.execute_query(alter_query)
        print("Successfully made payment_method nullable")

        # Verify the change
        result = db.execute_query(query)
        print("Updated payment_method column info:", result)

    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    fix_purchases_schema()
