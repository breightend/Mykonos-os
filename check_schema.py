import sqlite3
import os

# Connect to database
db_path = os.path.join("src", "backend", "database", "mykonos.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("=== CHECKING DATABASE SCHEMA ===")

# Check payment-related tables
cursor.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%payment%'"
)
payment_tables = cursor.fetchall()
print("\nPayment-related tables:")
for table in payment_tables:
    print(f"  - {table[0]}")

# Check account_movements foreign keys
print("\n=== ACCOUNT_MOVEMENTS FOREIGN KEYS ===")
cursor.execute("PRAGMA foreign_key_list(account_movements)")
account_fks = cursor.fetchall()
for fk in account_fks:
    print(f"  Column: {fk[3]} -> Table: {fk[2]}.{fk[4]}")

# Check purchases_payments foreign keys
print("\n=== PURCHASES_PAYMENTS FOREIGN KEYS ===")
cursor.execute("PRAGMA foreign_key_list(purchases_payments)")
purchases_fks = cursor.fetchall()
for fk in purchases_fks:
    print(f"  Column: {fk[3]} -> Table: {fk[2]}.{fk[4]}")

# Check data in payment tables
for table_name in ["payment_methods", "banks_payment_methods", "bank_payment_methods"]:
    try:
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        print(f"\n{table_name}: {count} records")
        if count > 0 and count < 10:
            cursor.execute(f"SELECT * FROM {table_name}")
            rows = cursor.fetchall()
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = [col[1] for col in cursor.fetchall()]
            print(f"  Columns: {columns}")
            for row in rows:
                print(f"  Data: {row}")
    except sqlite3.OperationalError:
        print(f"\n{table_name}: Table does not exist")

conn.close()
