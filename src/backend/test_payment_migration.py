#!/usr/bin/env python3

from database.database import Database


def test_and_migrate():
    """Test current schema and run migration if needed"""

    db = Database()

    try:
        print("🔍 Checking current account_movements table structure...")

        # Check if new columns exist
        test_query = """
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'account_movements' 
        AND column_name IN ('bank_id', 'transaction_number', 'echeq_time', 'invoice_number')
        """

        existing_columns = db.execute_query(test_query)
        existing_column_names = [
            row[0] if isinstance(row, (list, tuple)) else row["column_name"]
            for row in existing_columns
        ]

        required_columns = [
            "bank_id",
            "transaction_number",
            "echeq_time",
            "invoice_number",
        ]
        missing_columns = [
            col for col in required_columns if col not in existing_column_names
        ]

        if missing_columns:
            print(f"📝 Missing columns: {', '.join(missing_columns)}")
            print("🔄 Running migration...")

            # Add missing columns
            for column in missing_columns:
                if column == "bank_id":
                    alter_sql = "ALTER TABLE account_movements ADD COLUMN IF NOT EXISTS bank_id INTEGER"
                else:
                    alter_sql = f"ALTER TABLE account_movements ADD COLUMN IF NOT EXISTS {column} TEXT"

                print(f"   Adding {column}...")
                db.execute_query(alter_sql)

            print("✅ Migration completed!")
        else:
            print("✅ All columns already exist!")

        # Test inserting a sample payment record
        print("\n🧪 Testing payment insertion...")

        test_payment = {
            "numero_operacion": 999999,
            "entity_id": 1,
            "descripcion": "Test payment with new fields",
            "medio_pago": "transferencia",
            "numero_de_comprobante": "TEST123",
            "debe": 0.0,
            "haber": 100.50,
            "saldo": -100.50,
            "bank_id": 1,
            "transaction_number": "TXN123456",
            "echeq_time": "30_days",
            "invoice_number": "INV-2024-001",
        }

        result = db.add_record("account_movements", test_payment)
        if result["success"]:
            print("✅ Test payment record inserted successfully!")

            # Clean up test record
            cleanup_sql = (
                f"DELETE FROM account_movements WHERE numero_operacion = 999999"
            )
            db.execute_query(cleanup_sql)
            print("🧹 Test record cleaned up")

        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False


if __name__ == "__main__":
    test_and_migrate()
