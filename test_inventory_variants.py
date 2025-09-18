#!/usr/bin/env python3
"""
Test script to verify inventory updates with variants
"""
import sys
import os
import requests
import json

# Add the backend directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src', 'backend'))

from database.database import Database

API_BASE_URL = 'http://localhost:5000/api/purchases'

def test_purchase_receiving():
    """Test the complete flow of receiving a purchase with variants"""
    try:
        db = Database()
        
        print("🧪 Testing Purchase Receiving with Variants")
        print("=" * 50)
        
        # 1. Check if we have any purchases to test with
        purchases_query = "SELECT id, status FROM purchases WHERE status = 'Pendiente de entrega' LIMIT 1"
        purchases = db.execute_query(purchases_query)
        
        if not purchases:
            print("❌ No pending purchases found for testing")
            print("💡 Create a purchase first using the UI")
            return False
        
        purchase_id = purchases[0]['id']
        print(f"📦 Testing with purchase ID: {purchase_id}")
        
        # 2. Check purchase details before receiving
        details_query = """
        SELECT pd.*, pr.product_name, s.size_name, c.color_name
        FROM purchases_detail pd
        LEFT JOIN products pr ON pd.product_id = pr.id
        LEFT JOIN sizes s ON pd.size_id = s.id
        LEFT JOIN colors c ON pd.color_id = c.id
        WHERE pd.purchase_id = %s
        """
        details = db.execute_query(details_query, (purchase_id,))
        
        print(f"\n📋 Purchase details:")
        for detail in details:
            variant_info = ""
            if detail.get('size_name') or detail.get('color_name'):
                variant_info = f" ({detail.get('size_name', '')} - {detail.get('color_name', '')})"
            print(f"  - {detail['product_name']}{variant_info}: {detail['quantity']} units")
        
        # 3. Check stock before receiving
        print(f"\n📊 Stock before receiving:")
        for detail in details:
            if detail.get('size_id') or detail.get('color_id'):
                stock_query = """
                SELECT quantity FROM warehouse_stock_variants 
                WHERE product_id = %s AND branch_id = 1
                AND COALESCE(size_id, 0) = COALESCE(%s, 0)
                AND COALESCE(color_id, 0) = COALESCE(%s, 0)
                """
                stock = db.execute_query(stock_query, (detail['product_id'], detail.get('size_id'), detail.get('color_id')))
            else:
                stock_query = """
                SELECT quantity FROM warehouse_stock 
                WHERE product_id = %s AND branch_id = 1
                """
                stock = db.execute_query(stock_query, (detail['product_id'],))
            
            current_stock = stock[0]['quantity'] if stock else 0
            print(f"  - Product {detail['product_id']}: {current_stock} units")
        
        # 4. Test receiving the purchase
        print(f"\n🚀 Receiving purchase...")
        response = requests.post(f"{API_BASE_URL}/{purchase_id}/receive", 
                               json={"storage_id": 1},
                               headers={"Content-Type": "application/json"})
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Purchase received successfully!")
            print(f"📄 Response: {result.get('message')}")
            
            if 'barcodes_generated' in result:
                print(f"\n🏷️ Barcodes generated:")
                for barcode in result['barcodes_generated']:
                    variant_info = ""
                    if barcode.get('size') or barcode.get('color'):
                        variant_info = f" ({barcode.get('size', '')} - {barcode.get('color', '')})"
                    print(f"  - {barcode['product_name']}{variant_info}: {barcode['barcode']} (qty: {barcode['quantity']})")
        else:
            print(f"❌ Error receiving purchase: {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        # 5. Check stock after receiving
        print(f"\n📊 Stock after receiving:")
        for detail in details:
            if detail.get('size_id') or detail.get('color_id'):
                stock_query = """
                SELECT quantity, variant_barcode FROM warehouse_stock_variants 
                WHERE product_id = %s AND branch_id = 1
                AND COALESCE(size_id, 0) = COALESCE(%s, 0)
                AND COALESCE(color_id, 0) = COALESCE(%s, 0)
                """
                stock = db.execute_query(stock_query, (detail['product_id'], detail.get('size_id'), detail.get('color_id')))
                if stock:
                    print(f"  - Product {detail['product_id']} variant: {stock[0]['quantity']} units (barcode: {stock[0]['variant_barcode']})")
            else:
                stock_query = """
                SELECT quantity FROM warehouse_stock 
                WHERE product_id = %s AND branch_id = 1
                """
                stock = db.execute_query(stock_query, (detail['product_id'],))
                if stock:
                    print(f"  - Product {detail['product_id']}: {stock[0]['quantity']} units")
        
        # 6. Test barcode generation
        print(f"\n🏷️ Testing barcode generation...")
        barcode_response = requests.post(f"{API_BASE_URL}/{purchase_id}/barcodes",
                                       headers={"Content-Type": "application/json"})
        
        if barcode_response.status_code == 200:
            barcode_result = barcode_response.json()
            print(f"✅ Barcode generation successful!")
            print(f"📊 Total barcodes: {barcode_result.get('total_barcodes', 0)}")
            
            # Show first few barcodes as example
            barcodes = barcode_result.get('barcodes', [])
            for i, barcode in enumerate(barcodes[:3]):  # Show first 3
                print(f"  - {barcode['product_name']} (#{barcode['copy_number']}): {barcode['barcode']}")
                if barcode.get('variant_info'):
                    print(f"    Variant: {barcode['variant_info']}")
        else:
            print(f"❌ Error generating barcodes: {barcode_response.status_code}")
            print(f"Response: {barcode_response.text}")
        
        print(f"\n🎉 Test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    print("🧪 Starting inventory update test...")
    print("⚠️  Make sure the backend server is running on localhost:5000")
    
    input("Press Enter to continue...")
    
    success = test_purchase_receiving()
    if success:
        print("\n✅ All tests passed!")
    else:
        print("\n❌ Tests failed!")
        sys.exit(1)