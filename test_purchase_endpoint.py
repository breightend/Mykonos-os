#!/usr/bin/env python3
"""
Test script to verify the purchase detail endpoint query works correctly
"""

import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "src", "backend"))

from database.database import Database


def test_purchase_query():
    """Test the purchase detail query that was failing"""
    print("🔍 Testing purchase detail query...")

    try:
        db = Database()

        # Use the fixed query with entities table instead of proveedores
        purchase_query = """
        SELECT 
            p.*,
            e.entity_name as provider_name,
            e.cuit as provider_cuit,
            e.phone_number as provider_phone,
            e.email as provider_email,
            fa.file_name as invoice_file_name,
            fa.file_extension as invoice_file_extension
        FROM purchases p
        LEFT JOIN entities e ON p.entity_id = e.id
        LEFT JOIN file_attachments fa ON p.file_id = fa.id
        WHERE p.id = %s
        """

        purchase_id = 16
        print(f"🔍 Executing query for purchase ID: {purchase_id}")
        purchase_result = db.execute_query(purchase_query, (purchase_id,))
        print(
            f"🔍 Query returned {len(purchase_result) if purchase_result else 0} results"
        )

        if purchase_result:
            purchase_data = purchase_result[0]
            print(f"✅ SUCCESS: Found purchase data!")
            print(f"   Purchase ID: {purchase_data.get('id')}")
            print(f"   Total: ${purchase_data.get('total')}")
            print(f"   Provider: {purchase_data.get('provider_name')}")
            print(f"   Date: {purchase_data.get('purchase_date')}")

            # Test products query too
            details_query = """
            SELECT 
                pd.id, pd.purchase_id, pd.product_id, pd.cost_price, pd.quantity, 
                pd.discount, pd.subtotal, pd.metadata,
                pr.product_name, pr.provider_code, pr.cost as current_cost, pr.sale_price as current_sale_price,
                b.brand_name, g.group_name
            FROM purchases_detail pd
            LEFT JOIN products pr ON pd.product_id = pr.id
            LEFT JOIN brands b ON pr.brand_id = b.id
            LEFT JOIN groups g ON pr.group_id = g.id
            WHERE pd.purchase_id = %s
            """
            details = db.execute_query(details_query, (purchase_id,))
            print(f"   Products: {len(details) if details else 0} items")

            return True
        else:
            print(f"❌ FAILED: No purchase found for ID {purchase_id}")
            return False

    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback

        print(f"   Traceback: {traceback.format_exc()}")
        return False


if __name__ == "__main__":
    success = test_purchase_query()
    print(f"\n{'✅ Test PASSED' if success else '❌ Test FAILED'}")
