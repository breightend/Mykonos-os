#!/usr/bin/env python3
from database.database import Database


def check_table_structure():
    try:
        db = Database()
        print("Testing database connection...")

        # Check if account_movements table exists and get its structure
        result = db.execute_query("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'account_movements' 
            ORDER BY ordinal_position
        """)

        if result:
            print("\naccount_movements table columns:")
            for col in result:
                print(
                    f"  {col['column_name']}: {col['data_type']} (nullable: {col['is_nullable']})"
                )
        else:
            print("No columns found for account_movements table")

        # Also check if table exists at all
        table_check = db.execute_query("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'account_movements'
            )
        """)
        print(f"\nTable exists: {table_check[0]['exists'] if table_check else False}")

    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    check_table_structure()
