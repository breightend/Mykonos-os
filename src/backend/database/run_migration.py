#!/usr/bin/env python3
"""
Script to fix integer overflow issues in PostgreSQL database
Changes product_id columns from INTEGER to BIGINT to support large timestamp-based IDs
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import Database


def run_migration():
    """Run the integer overflow fix migration"""
    try:
        db = Database()

        print("🔧 Starting integer overflow fix migration...")

        # Read the migration SQL file
        migration_file = os.path.join(
            os.path.dirname(__file__), "fix_integer_overflow.sql"
        )

        with open(migration_file, "r") as f:
            sql_commands = f.read()

        # Split into individual commands and execute them
        commands = [
            cmd.strip()
            for cmd in sql_commands.split(";")
            if cmd.strip() and not cmd.strip().startswith("--")
        ]

        for i, command in enumerate(commands):
            if command:
                print(f"🔧 Executing migration step {i + 1}/{len(commands)}")
                print(f"SQL: {command[:100]}...")

                result = db.execute_query(command)

                if result.get("success"):
                    print(f"✅ Step {i + 1} completed successfully")
                else:
                    print(
                        f"❌ Step {i + 1} failed: {result.get('error', 'Unknown error')}"
                    )
                    return False

        print("✅ Migration completed successfully!")
        print("🔄 Product ID columns changed from INTEGER to BIGINT")
        return True

    except Exception as e:
        print(f"❌ Migration failed with error: {e}")
        return False


if __name__ == "__main__":
    if run_migration():
        print(
            "✅ Database migration completed. You can now create purchases with large product IDs."
        )
    else:
        print("❌ Migration failed. Please check the errors above.")
