#!/usr/bin/env python3

import os
import sys

# Add the backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), "src", "backend")
sys.path.insert(0, backend_path)

try:
    from database.database import Database

    print("Creating database connection...")
    db = Database()

    # Test basic connection
    print("Testing basic query...")
    test_query = "SELECT COUNT(*) as total FROM purchases"
    result = db.execute_query(test_query)
    print(f"Total purchases in database: {result[0][0]}")

    # Check recent purchases
    print("\nRecent purchases:")
    recent_query = "SELECT id, entity_id, total, purchase_date FROM purchases ORDER BY id DESC LIMIT 5"
    recent_purchases = db.execute_query(recent_query)
    for p in recent_purchases:
        print(f"  ID: {p[0]}, Entity: {p[1]}, Total: {p[2]}, Date: {p[3]}")

    # Check purchase details
    print("\nPurchase details:")
    details_query = "SELECT pd.purchase_id, pd.product_id, pd.quantity, pd.cost_price FROM purchases_detail pd ORDER BY pd.purchase_id DESC LIMIT 10"
    purchase_details = db.execute_query(details_query)
    for d in purchase_details:
        print(f"  Purchase: {d[0]}, Product: {d[1]}, Qty: {d[2]}, Cost: {d[3]}")

    # Check if purchase 13 exists
    print(f"\nChecking purchase ID 13:")
    check_query = "SELECT * FROM purchases WHERE id = 13"
    purchase_13 = db.execute_query(check_query)
    if purchase_13:
        print(f"  Found purchase 13: {purchase_13[0]}")

        # Check its details
        details_13_query = "SELECT * FROM purchases_detail WHERE purchase_id = 13"
        details_13 = db.execute_query(details_13_query)
        print(f"  Purchase 13 has {len(details_13)} products:")
        for detail in details_13:
            print(f"    Detail: {detail}")
    else:
        print("  Purchase 13 not found")

except Exception as e:
    print(f"Error: {e}")
    import traceback

    traceback.print_exc()
