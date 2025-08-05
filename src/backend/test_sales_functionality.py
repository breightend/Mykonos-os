#!/usr/bin/env python3
"""
Test script to demonstrate sales functionality in the database.
This script shows how to save a complete sale with multiple products.
"""

from database.database import Database, TABLES
from datetime import datetime
import json


def test_sales_functionality():
    """Test the sales functionality by creating a sample sale."""
    db = Database()

    print("🛒 Testing Sales Functionality")
    print("=" * 50)

    # Sample sale data
    sale_data = {
        "customer_id": None,  # Can be NULL for walk-in customers
        "employee_id": 1,  # Assuming employee with ID 1 exists
        "cashier_user_id": 1,  # Assuming user with ID 1 exists
        "storage_id": 1,  # Assuming storage with ID 1 exists
        "subtotal": 150.00,
        "tax_amount": 22.50,
        "discount": 10.00,
        "total": 162.50,
        "payment_method": "tarjeta_credito",
        "payment_reference": "TXN123456789",
        "receipt_number": "REC-2025-001",
        "notes": "Sale created via test script",
        "status": "Completada",
    }

    # Create the sale
    print("📝 Creating new sale...")
    sale_result = db.add_record("sales", sale_data)

    if sale_result["success"]:
        sale_id = sale_result["rowid"]
        print(f"✅ Sale created successfully with ID: {sale_id}")

        # Sample sale details (products sold)
        sale_details = [
            {
                "sale_id": sale_id,
                "product_id": 1,  # Assuming product with ID 1 exists
                "variant_id": 1,  # Assuming variant with ID 1 exists
                "product_name": "Remera Nike Deportiva",
                "product_code": "NIKE-001",
                "size_name": "M",
                "color_name": "Azul",
                "cost_price": 50.00,
                "sale_price": 80.00,
                "quantity": 1,
                "discount_percentage": 0.0,
                "discount_amount": 0.0,
                "tax_percentage": 21.0,
                "tax_amount": 16.80,
                "subtotal": 80.00,
                "total": 80.00,
                "profit_margin": 30.00,
                "barcode_scanned": "7891234567890",
            },
            {
                "sale_id": sale_id,
                "product_id": 2,  # Assuming product with ID 2 exists
                "variant_id": 2,  # Assuming variant with ID 2 exists
                "product_name": "Pantalón Adidas Running",
                "product_code": "ADIDAS-002",
                "size_name": "L",
                "color_name": "Negro",
                "cost_price": 40.00,
                "sale_price": 70.00,
                "quantity": 1,
                "discount_percentage": 14.29,
                "discount_amount": 10.00,
                "tax_percentage": 21.0,
                "tax_amount": 5.70,
                "subtotal": 70.00,
                "total": 65.70,
                "profit_margin": 30.00,
                "barcode_scanned": "7891234567891",
            },
        ]

        print(f"📦 Adding {len(sale_details)} products to the sale...")

        for i, detail in enumerate(sale_details, 1):
            detail_result = db.add_record("sales_detail", detail)
            if detail_result["success"]:
                print(
                    f"  ✅ Product {i}: {detail['product_name']} - ${detail['total']}"
                )
            else:
                print(f"  ❌ Failed to add product {i}: {detail_result['message']}")

        # Query the complete sale information
        print("\n📊 Sale Summary:")
        print("-" * 30)

        # Get sale header
        sale_query = """
        SELECT s.*, u.username as cashier_name, st.name as storage_name,
               e.entity_name as customer_name
        FROM sales s
        LEFT JOIN users u ON s.cashier_user_id = u.id
        LEFT JOIN storage st ON s.storage_id = st.id  
        LEFT JOIN entities e ON s.customer_id = e.id
        WHERE s.id = ?
        """

        sale_info = db.execute_query(sale_query, (sale_id,))

        if sale_info:
            sale = sale_info[0]
            print(f"Sale ID: {sale['id']}")
            print(f"Date: {sale['sale_date']}")
            print(f"Cashier: {sale['cashier_name']}")
            print(f"Storage: {sale['storage_name']}")
            print(f"Customer: {sale['customer_name'] or 'Walk-in customer'}")
            print(f"Payment Method: {sale['payment_method']}")
            print(f"Total: ${sale['total']}")
            print(f"Status: {sale['status']}")

        # Get sale details
        details_query = """
        SELECT sd.*, p.product_name as current_product_name
        FROM sales_detail sd
        LEFT JOIN products p ON sd.product_id = p.id
        WHERE sd.sale_id = ?
        ORDER BY sd.id
        """

        details_info = db.execute_query(details_query, (sale_id,))

        if details_info:
            print(f"\nProducts Sold ({len(details_info)} items):")
            for detail in details_info:
                print(
                    f"  • {detail['product_name']} ({detail['size_name']}, {detail['color_name']})"
                )
                print(
                    f"    Qty: {detail['quantity']} x ${detail['sale_price']} = ${detail['total']}"
                )
                print(f"    Profit: ${detail['profit_margin']}")

        print(f"\n🎉 Sales functionality test completed successfully!")
        return True

    else:
        print(f"❌ Failed to create sale: {sale_result['message']}")
        return False


if __name__ == "__main__":
    test_sales_functionality()
