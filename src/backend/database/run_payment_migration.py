#!/usr/bin/env python3

import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import Database


def run_migration():
    """Run the migration to add payment fields to account_movements table"""

    db = Database()

    try:
        print("🔄 Running migration to add payment fields to account_movements...")

        # Read migration SQL
        migration_file = os.path.join(
            os.path.dirname(__file__), "add_payment_fields_migration.sql"
        )
        with open(migration_file, "r") as f:
            migration_sql = f.read()

        # Split into individual statements
        statements = [
            stmt.strip()
            for stmt in migration_sql.split(";")
            if stmt.strip() and not stmt.strip().startswith("--")
        ]

        for statement in statements:
            if statement:
                print(f"   Executing: {statement[:50]}...")
                db.execute_query(statement)

        print("✅ Migration completed successfully!")
        print("   Added columns:")
        print("   - bank_id (INTEGER)")
        print("   - transaction_number (TEXT)")
        print("   - echeq_time (TEXT)")
        print("   - invoice_number (TEXT)")

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

    return True


if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
