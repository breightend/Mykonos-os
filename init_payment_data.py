#!/usr/bin/env python3
"""
Script to initialize payment methods and banks_payment_methods tables
with default data to fix foreign key constraint errors.
"""

import sqlite3
import os
import sys


def initialize_payment_data():
    """Initialize payment methods and banks_payment_methods with default data"""

    # Get database path
    db_path = os.path.join("src", "backend", "database", "mykonos.db")

    if not os.path.exists(db_path):
        print(f"❌ Database not found at {db_path}")
        return False

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print("🔍 Checking current database state...")

        # Check if payment_methods table exists
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='payment_methods'"
        )
        if not cursor.fetchone():
            print("📋 Creating payment_methods table...")
            cursor.execute("""
                CREATE TABLE payment_methods (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    method_name TEXT NOT NULL UNIQUE,
                    display_name TEXT NOT NULL,
                    description TEXT,
                    is_active BOOLEAN NOT NULL DEFAULT 1,
                    requires_reference BOOLEAN NOT NULL DEFAULT 0,
                    icon_name TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    provider_use_it BOOLEAN DEFAULT 1,
                    client_use_it BOOLEAN DEFAULT 1
                )
            """)

        # Check if banks table exists
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='banks'"
        )
        if not cursor.fetchone():
            print("🏦 Creating banks table...")
            cursor.execute("""
                CREATE TABLE banks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    swift_code TEXT
                )
            """)

        # Check if banks_payment_methods table exists
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='banks_payment_methods'"
        )
        if not cursor.fetchone():
            print("🔗 Creating banks_payment_methods table...")
            cursor.execute("""
                CREATE TABLE banks_payment_methods (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    bank_id INTEGER NOT NULL,
                    payment_method_id INTEGER NOT NULL,
                    amount REAL NOT NULL DEFAULT 0.00,
                    FOREIGN KEY (bank_id) REFERENCES banks (id),
                    FOREIGN KEY (payment_method_id) REFERENCES payment_methods (id)
                )
            """)

        # Insert default payment methods
        payment_methods = [
            ("efectivo", "Efectivo", "Pago en efectivo", 1, 0, "cash"),
            (
                "tarjeta_credito",
                "Tarjeta de Crédito",
                "Pago con tarjeta de crédito",
                1,
                1,
                "credit-card",
            ),
            (
                "tarjeta_debito",
                "Tarjeta de Débito",
                "Pago con tarjeta de débito",
                1,
                1,
                "debit-card",
            ),
            (
                "transferencia",
                "Transferencia Bancaria",
                "Transferencia bancaria",
                1,
                1,
                "bank-transfer",
            ),
            ("cheque", "Cheque", "Pago con cheque", 1, 1, "check"),
        ]

        print("💳 Inserting default payment methods...")
        for method in payment_methods:
            cursor.execute(
                """
                INSERT OR IGNORE INTO payment_methods 
                (method_name, display_name, description, is_active, requires_reference, icon_name)
                VALUES (?, ?, ?, ?, ?, ?)
            """,
                method,
            )

        # Insert default bank
        cursor.execute("""
            INSERT OR IGNORE INTO banks (name, swift_code) 
            VALUES ('Banco Genérico', 'GENERICO')
        """)

        # Link payment methods to bank (banks_payment_methods)
        print("🔗 Creating bank-payment method associations...")
        cursor.execute("SELECT id FROM banks WHERE name = 'Banco Genérico'")
        bank_id = cursor.fetchone()[0]

        cursor.execute("SELECT id, method_name FROM payment_methods")
        payment_methods_data = cursor.fetchall()

        for pm_id, method_name in payment_methods_data:
            cursor.execute(
                """
                INSERT OR IGNORE INTO banks_payment_methods 
                (bank_id, payment_method_id, amount) 
                VALUES (?, ?, 0.00)
            """,
                (bank_id, pm_id),
            )

        conn.commit()

        # Verify the data was inserted
        cursor.execute("SELECT COUNT(*) FROM payment_methods")
        pm_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM banks_payment_methods")
        bpm_count = cursor.fetchone()[0]

        print(
            f"✅ Success! Created {pm_count} payment methods and {bpm_count} bank-payment associations"
        )

        # Show the IDs for reference
        cursor.execute(
            "SELECT id, method_name, display_name FROM payment_methods ORDER BY id"
        )
        methods = cursor.fetchall()
        print("\n📋 Available payment methods:")
        for method in methods:
            print(f"  ID {method[0]}: {method[1]} ({method[2]})")

        cursor.execute("""
            SELECT bpm.id, b.name, pm.method_name 
            FROM banks_payment_methods bpm
            JOIN banks b ON bpm.bank_id = b.id
            JOIN payment_methods pm ON bpm.payment_method_id = pm.id
            ORDER BY bpm.id
        """)
        associations = cursor.fetchall()
        print("\n🔗 Bank-Payment Method Associations:")
        for assoc in associations:
            print(f"  ID {assoc[0]}: {assoc[1]} -> {assoc[2]}")

        conn.close()
        return True

    except Exception as e:
        print(f"❌ Error initializing payment data: {e}")
        return False


if __name__ == "__main__":
    print("🚀 Initializing payment methods database...")
    if initialize_payment_data():
        print("\n✅ Payment system initialization completed successfully!")
        print("💡 You can now use payment_method IDs 1-5 in your account_movements")
    else:
        print("\n❌ Failed to initialize payment system")
        sys.exit(1)
