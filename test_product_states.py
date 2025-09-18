#!/usr/bin/env python3

import sys
import os
import requests
import json

# Add the src/backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src', 'backend'))

def test_product_states():
    """Test the product state management system"""
    
    base_url = "http://localhost:5000/api"
    
    print("🧪 Testing Product State Management System")
    print("=" * 50)
    
    # Test 1: Check products by state endpoint
    print("\n1. Testing products-by-state endpoint...")
    try:
        response = requests.get(f"{base_url}/inventory/products-by-state")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Products by state endpoint working")
            print(f"   - State counts: {data.get('state_counts', {})}")
            
            # Show some examples from each state
            for state, products in data.get('products_by_state', {}).items():
                if products:
                    print(f"   - {state}: {len(products)} products")
                    if len(products) > 0:
                        print(f"     Example: {products[0].get('product_name', 'N/A')}")
        else:
            print(f"❌ Products by state endpoint failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Error testing products by state: {e}")
    
    # Test 2: Check inventory endpoint (should only show 'enTienda' products)
    print("\n2. Testing inventory products-summary endpoint...")
    try:
        response = requests.get(f"{base_url}/inventory/products-summary")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Inventory products-summary working")
            print(f"   - Total products in inventory: {len(data) if isinstance(data, list) else 'Unknown'}")
        else:
            print(f"❌ Inventory products-summary failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Error testing inventory: {e}")
    
    # Test 3: Check purchases endpoint
    print("\n3. Testing purchases endpoint...")
    try:
        response = requests.get(f"{base_url}/purchases/")
        if response.status_code == 200:
            purchases = response.json()
            print(f"✅ Purchases endpoint working")
            print(f"   - Total purchases: {len(purchases) if isinstance(purchases, list) else 'Unknown'}")
            
            # Find a purchase with 'Pendiente de entrega' status for testing
            pending_purchases = [p for p in purchases if p.get('status') == 'Pendiente de entrega'] if isinstance(purchases, list) else []
            if pending_purchases:
                purchase_id = pending_purchases[0]['id']
                print(f"   - Found pending purchase for testing: ID {purchase_id}")
                return purchase_id
            else:
                print("   - No pending purchases found for testing")
        else:
            print(f"❌ Purchases endpoint failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing purchases: {e}")
    
    return None

def test_receive_purchase(purchase_id):
    """Test receiving a purchase"""
    
    if not purchase_id:
        print("\n⚠️ No purchase ID available for testing receive functionality")
        return
    
    base_url = "http://localhost:5000/api"
    
    print(f"\n4. Testing receive purchase {purchase_id}...")
    try:
        # Get purchase details first
        response = requests.get(f"{base_url}/purchases/{purchase_id}")
        if response.status_code == 200:
            purchase = response.json()
            print(f"✅ Purchase details retrieved")
            print(f"   - Status: {purchase.get('status')}")
            print(f"   - Products: {len(purchase.get('products', []))}")
            
            if purchase.get('status') == 'Pendiente de entrega':
                # Test receive endpoint
                receive_data = {"storage_id": 1}
                response = requests.post(
                    f"{base_url}/purchases/{purchase_id}/receive",
                    json=receive_data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"✅ Purchase received successfully!")
                    print(f"   - Message: {result.get('message')}")
                    print(f"   - Products processed: {result.get('products_processed')}")
                    print(f"   - Products updated: {len(result.get('products_updated', []))}")
                    
                    # Show which products were updated
                    for product in result.get('products_updated', []):
                        print(f"     - {product.get('product_name')}: {product.get('quantity')} units")
                else:
                    print(f"❌ Receive purchase failed: {response.status_code}")
                    print(f"   Response: {response.text}")
            else:
                print(f"⚠️ Purchase is not pending delivery, status: {purchase.get('status')}")
        else:
            print(f"❌ Could not get purchase details: {response.status_code}")
    except Exception as e:
        print(f"❌ Error testing receive purchase: {e}")

if __name__ == "__main__":
    print("🚀 Starting Product State Management Tests")
    
    # Run basic tests
    pending_purchase_id = test_product_states()
    
    # Test receive functionality if we have a pending purchase
    test_receive_purchase(pending_purchase_id)
    
    print("\n🎉 Test completed!")
    print("\nNext steps:")
    print("1. Try clicking 'Recibir' button in the UI")
    print("2. Check that products appear in inventory after receiving")
    print("3. Verify that inventory only shows 'enTienda' products")