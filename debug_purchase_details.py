import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "src", "backend"))

from database.database import Database

db = Database()

# Check if purchase ID 13 exists in purchases table
print("Checking purchase ID 13 in purchases table...")
purchase_query = "SELECT id, entity_id, total_cost FROM purchases WHERE id = 13"
try:
    purchase_result = db.execute_query(purchase_query)
    print(f"Purchase found: {len(purchase_result)} records")
    for row in purchase_result:
        print(f"ID: {row[0]}, Entity ID: {row[1]}, Total: {row[2]}")
except Exception as e:
    print(f"Error checking purchase: {e}")

# Check if there are purchase details for purchase ID 13
print("\nChecking purchase details for purchase ID 13...")
details_query = "SELECT * FROM purchases_detail WHERE purchase_id = 13"
try:
    details_result = db.execute_query(details_query)
    print(f"Purchase details found: {len(details_result)} records")
    for row in details_result:
        print(
            f"Detail ID: {row[0]}, Purchase ID: {row[1]}, Product ID: {row[2]}, Quantity: {row[4]}, Cost: {row[3]}"
        )
except Exception as e:
    print(f"Error checking purchase details: {e}")

# Check all purchase details to see what's available
print("\nChecking all purchase details...")
all_details_query = "SELECT purchase_id, COUNT(*) as product_count FROM purchases_detail GROUP BY purchase_id ORDER BY purchase_id DESC LIMIT 5"
try:
    all_details_result = db.execute_query(all_details_query)
    print(f"Recent purchase details summary:")
    for row in all_details_result:
        print(f"Purchase ID: {row[0]}, Product count: {row[1]}")
except Exception as e:
    print(f"Error checking all purchase details: {e}")
