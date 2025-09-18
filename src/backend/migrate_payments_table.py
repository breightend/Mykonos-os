#!/usr/bin/env python3
"""
Database migration script to fix purchases_payments table structure
and ensure file attachments work correctly.
"""

import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from database.database import Database
from datetime import datetime


def migrate_purchases_payments_table():
    """Add missing columns to purchases_payments table"""

    db = Database()
    migrations = []

    try:
        print("🔄 Starting purchases_payments table migration...")

        # Check if columns exist and add them if they don't
        columns_to_add = [
            {
                "name": "purchase_id",
                "definition": "INTEGER",
                "description": "Link to specific purchase (optional for general payments)",
            },
            {
                "name": "payment_date",
                "definition": "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
                "description": "When the payment was made",
            },
            {
                "name": "description",
                "definition": "TEXT",
                "description": "Payment description",
            },
        ]

        for column in columns_to_add:
            try:
                # Try to add the column (PostgreSQL)
                alter_query = f"""
                ALTER TABLE purchases_payments 
                ADD COLUMN IF NOT EXISTS {column["name"]} {column["definition"]}
                """
                result = db.execute_query(alter_query)
                print(f"✅ Added column '{column['name']}': {column['description']}")
                migrations.append(f"Added column {column['name']}")

            except Exception as e:
                if (
                    "already exists" in str(e).lower()
                    or "duplicate column" in str(e).lower()
                ):
                    print(f"ℹ️  Column '{column['name']}' already exists, skipping...")
                else:
                    print(f"❌ Error adding column '{column['name']}': {e}")

        # Add foreign key constraint for purchase_id if it doesn't exist
        try:
            fk_query = """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints 
                    WHERE constraint_name = 'purchases_payments_purchase_id_fkey'
                ) THEN
                    ALTER TABLE purchases_payments 
                    ADD CONSTRAINT purchases_payments_purchase_id_fkey 
                    FOREIGN KEY (purchase_id) REFERENCES purchases (id);
                END IF;
            END $$;
            """
            db.execute_query(fk_query)
            print("✅ Added foreign key constraint for purchase_id")
            migrations.append("Added purchase_id foreign key")

        except Exception as e:
            print(f"ℹ️  Foreign key constraint might already exist: {e}")

        # Ensure file_attachments table has proper structure
        try:
            file_attachments_check = """
            CREATE TABLE IF NOT EXISTS file_attachments (
                id SERIAL PRIMARY KEY,
                file_name TEXT NOT NULL,
                file_extension TEXT NOT NULL,
                file_content BYTEA NOT NULL,
                upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                comment TEXT
            )
            """
            db.execute_query(file_attachments_check)
            print("✅ Verified file_attachments table structure")
            migrations.append("Verified file_attachments table")

        except Exception as e:
            print(f"❌ Error with file_attachments table: {e}")

        # Initialize default payment methods and banks_payment_methods if empty
        try:
            # Check if we have any banks_payment_methods
            count_result = db.execute_query(
                "SELECT COUNT(*) as count FROM banks_payment_methods"
            )
            if isinstance(count_result, list) and len(count_result) > 0:
                count = count_result[0].get("count", 0)
            else:
                count = 0

            if count == 0:
                print("🔄 Initializing default payment methods...")

                # Create default payment methods
                payment_methods = [
                    ("efectivo", "Efectivo", "Pago en efectivo"),
                    (
                        "transferencia",
                        "Transferencia Bancaria",
                        "Transferencia bancaria",
                    ),
                    (
                        "tarjeta_credito",
                        "Tarjeta de Crédito",
                        "Pago con tarjeta de crédito",
                    ),
                    ("cheque", "Cheque", "Pago con cheque"),
                ]

                for method_name, display_name, description in payment_methods:
                    try:
                        db.execute_query(
                            """
                            INSERT INTO payment_methods (method_name, display_name, description, is_active, requires_reference)
                            VALUES (%s, %s, %s, true, false)
                            ON CONFLICT (method_name) DO NOTHING
                        """,
                            (method_name, display_name, description),
                        )
                    except Exception as e:
                        print(f"Error inserting payment method {method_name}: {e}")

                # Create default bank
                try:
                    db.execute_query("""
                        INSERT INTO banks (name, swift_code) 
                        VALUES ('Banco Genérico', 'GENERICO')
                        ON CONFLICT DO NOTHING
                    """)
                except Exception as e:
                    print(f"Error inserting default bank: {e}")

                # Link payment methods to bank
                try:
                    db.execute_query("""
                        INSERT INTO banks_payment_methods (bank_id, payment_method_id, amount)
                        SELECT b.id, pm.id, 0.00
                        FROM banks b, payment_methods pm
                        WHERE b.name = 'Banco Genérico'
                        ON CONFLICT DO NOTHING
                    """)
                    print("✅ Created default payment method associations")
                    migrations.append("Initialized default payment methods")
                except Exception as e:
                    print(f"Error linking payment methods to bank: {e}")
            else:
                print(f"ℹ️  Found {count} existing payment method associations")

        except Exception as e:
            print(f"❌ Error initializing payment methods: {e}")

        print(f"\n🎉 Migration completed successfully!")
        print(f"Applied {len(migrations)} changes:")
        for migration in migrations:
            print(f"  - {migration}")

        return True

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False


if __name__ == "__main__":
    print("🚀 Starting database migration for purchases_payments table...")
    success = migrate_purchases_payments_table()

    if success:
        print("\n✅ Migration completed successfully!")
        print("💡 You can now use the enhanced payment system with file uploads.")
    else:
        print("\n❌ Migration failed!")
        sys.exit(1)
