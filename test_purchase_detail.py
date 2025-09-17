import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "src", "backend"))

from database.database import Database

db = Database()

# Test the purchase detail query for purchase ID 13
print("Testing purchase detail query for ID 13...")
query = """
SELECT 
    p.id as purchase_id,
    p.entity_id,
    p.total_cost,
    p.purchase_date,
    p.due_date,
    p.payment_method_id,
    p.payment_bank_id,
    p.notes,
    p.created_at,
    e.name as entity_name,
    e.entity_type,
    pm.method_name as payment_method_name,
    b.name as bank_name,
    b.swift_code
FROM purchases p
LEFT JOIN entities e ON p.entity_id = e.id
LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
LEFT JOIN banks b ON p.payment_bank_id = b.id
WHERE p.id = 13
"""

try:
    result = db.execute_query(query)
    print(f"Query successful! Found {len(result)} records:")
    for row in result:
        print(f"Purchase ID: {row[0]}, Entity: {row[9]}, Total: {row[2]}")
except Exception as e:
    print(f"Error: {e}")

# Also test if purchase ID 13 exists
print("\nChecking if purchase ID 13 exists...")
check_query = "SELECT id, total_cost FROM purchases WHERE id = 13"
try:
    check_result = db.execute_query(check_query)
    print(f"Purchase check: Found {len(check_result)} records")
    for row in check_result:
        print(f"ID: {row[0]}, Total: {row[1]}")
except Exception as e:
    print(f"Error checking purchase: {e}")
