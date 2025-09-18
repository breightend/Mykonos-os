#!/usr/bin/env python3
"""
Script to populate banks_payment_methods table with initial data
This table is a bridge between banks and payment_methods
"""

import sys
import os

# Add parent directory to path for importing modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import psycopg2
from config.config import Config


def get_db_connection():
    """Get PostgreSQL database connection"""
    config = Config()
    return psycopg2.connect(**config.postgres_config)


def populate_banks_payment_methods():
    """Populate banks_payment_methods table with initial data"""
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        print("🔍 Checking existing data...")

        # Check if we have banks
        cursor.execute("SELECT COUNT(*) FROM banks")
        banks_count = cursor.fetchone()[0]
        print(f"Banks available: {banks_count}")

        # Check if we have payment methods
        cursor.execute("SELECT COUNT(*) FROM payment_methods")
        payment_methods_count = cursor.fetchone()[0]
        print(f"Payment methods available: {payment_methods_count}")

        # Check current banks_payment_methods data
        cursor.execute("SELECT COUNT(*) FROM banks_payment_methods")
        bridge_count = cursor.fetchone()[0]
        print(f"Current banks_payment_methods records: {bridge_count}")

        if bridge_count > 0:
            print("✅ banks_payment_methods already has data")
            # Show existing data
            cursor.execute("""
                SELECT bpm.id, b.name as bank_name, pm.method_name, pm.display_name
                FROM banks_payment_methods bpm
                JOIN banks b ON bpm.bank_id = b.id
                JOIN payment_methods pm ON bpm.payment_method_id = pm.id
                ORDER BY bpm.id
            """)
            existing_records = cursor.fetchall()
            print("Existing records:")
            for record in existing_records:
                print(f"  ID {record[0]}: {record[1]} - {record[3]} ({record[2]})")
            return

        if banks_count == 0:
            print("❌ No banks found. Creating sample banks...")
            # Insert sample banks
            banks_data = [
                ("Galicia", "BGARAR"),
                ("Naranja X", "NARNAR"),
                ("Santander", "SANTAN"),
            ]

            for bank_name, swift_code in banks_data:
                cursor.execute(
                    """
                    INSERT INTO banks (name, swift_code) 
                    VALUES (%s, %s)
                    ON CONFLICT (name) DO NOTHING
                """,
                    (bank_name, swift_code),
                )

            conn.commit()
            print("✅ Sample banks created")

        if payment_methods_count == 0:
            print(
                "❌ No payment methods found. This should be populated by payment_methods migration."
            )
            return

        # Get all banks and payment methods
        cursor.execute("SELECT id, name FROM banks ORDER BY id")
        banks = cursor.fetchall()

        cursor.execute(
            "SELECT id, method_name, display_name FROM payment_methods ORDER BY id"
        )
        payment_methods = cursor.fetchall()

        print(
            f"Creating bridge records for {len(banks)} banks and {len(payment_methods)} payment methods..."
        )

        # Create combinations of banks and payment methods
        for bank_id, bank_name in banks:
            for pm_id, pm_method, pm_display in payment_methods:
                cursor.execute(
                    """
                    INSERT INTO banks_payment_methods (bank_id, payment_method_id, amount)
                    VALUES (%s, %s, %s)
                """,
                    (bank_id, pm_id, 0.00),
                )

                print(f"  ✓ Created: {bank_name} + {pm_display}")

        conn.commit()

        # Verify the created records
        cursor.execute("SELECT COUNT(*) FROM banks_payment_methods")
        final_count = cursor.fetchone()[0]
        print(f"🎉 Successfully created {final_count} banks_payment_methods records!")

        # Show the first few records with details
        cursor.execute("""
            SELECT bpm.id, b.name as bank_name, pm.method_name, pm.display_name
            FROM banks_payment_methods bpm
            JOIN banks b ON bpm.bank_id = b.id
            JOIN payment_methods pm ON bpm.payment_method_id = pm.id
            ORDER BY bpm.id
            LIMIT 10
        """)
        sample_records = cursor.fetchall()
        print("\nSample records created:")
        for record in sample_records:
            print(f"  ID {record[0]}: {record[1]} - {record[3]} ({record[2]})")

    except Exception as e:
        print(f"❌ Error populating banks_payment_methods: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


if __name__ == "__main__":
    populate_banks_payment_methods()
