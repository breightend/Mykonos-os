#!/usr/bin/env python3

from database.database import Database


def test_purchase_details():
    """Test the purchase details directly in the database"""

    db = Database()

    # First, check if purchase ID 13 exists
    print("1. Checking if purchase ID 13 exists...")
    purchase_query = """
    SELECT 
        id, entity_id, purchase_date, subtotal, total, status
    FROM purchases 
    WHERE id = %s
    """
    try:
        purchase = db.execute_query(purchase_query, (13,))
        if purchase:
            print(f"✅ Purchase 13 found: {purchase[0]}")
            print(f"   Data type: {type(purchase[0])}")
        else:
            print("❌ Purchase 13 not found")
            return
    except Exception as e:
        print(f"❌ Error checking purchase: {e}")
        return

    # Next, check purchase details (products) for this purchase
    print("\n2. Checking purchase details for purchase ID 13...")
    details_query = """
    SELECT 
        pd.id, pd.product_id, pd.quantity, pd.cost_price, pd.subtotal,
        pr.product_name, pr.provider_code
    FROM purchases_detail pd
    LEFT JOIN products pr ON pd.product_id = pr.id
    WHERE pd.purchase_id = %s
    """
    try:
        details = db.execute_query(details_query, (13,))
        print(f"   Found {len(details)} products for purchase 13")
        if details:
            for i, detail in enumerate(details):
                print(f"   Product {i + 1}: {detail}")
                print(f"   Data type: {type(detail)}")
        else:
            print("   No products found in purchases_detail table for purchase 13")
    except Exception as e:
        print(f"❌ Error checking purchase details: {e}")

    # Check all purchases that have details
    print("\n3. Checking which purchases have product details...")
    all_details_query = """
    SELECT DISTINCT purchase_id, COUNT(*) as product_count
    FROM purchases_detail 
    GROUP BY purchase_id
    ORDER BY purchase_id
    """
    try:
        all_details = db.execute_query(all_details_query)
        print(f"   Found {len(all_details)} purchases with products:")
        for detail in all_details:
            print(f"   Purchase {detail[0]}: {detail[1]} products")
    except Exception as e:
        print(f"❌ Error checking all purchase details: {e}")


if __name__ == "__main__":
    test_purchase_details()
