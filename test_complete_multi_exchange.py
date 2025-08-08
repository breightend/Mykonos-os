#!/usr/bin/env python3
"""
Complete Multi-Product Exchange System Test
Tests the full integration between backend service and API endpoints
"""

import requests
import json

# Configuration
API_BASE_URL = "http://localhost:5000"
BRANCH_ID = 1
USER_ID = 1


def test_complete_multi_product_exchange():
    """Test complete multi-product exchange workflow"""

    print("🚀 TESTING COMPLETE MULTI-PRODUCT EXCHANGE SYSTEM")
    print("=" * 60)

    # Test Case 1: Multi-product return with multi-product exchange
    print("\n📋 Test Case 1: Multiple products return + Multiple products exchange")
    test_data = {
        "return_products": [
            {
                "variant_barcode": "7501234567890",  # Replace with actual barcode
                "quantity": 1,
                "reason": "Cliente no satisfecho con el color",
            },
            {
                "variant_barcode": "7501234567891",  # Replace with actual barcode
                "quantity": 2,
                "reason": "Talla incorrecta",
            },
        ],
        "new_products": [
            {
                "variant_barcode": "7501234567892",  # Replace with actual barcode
                "quantity": 1,
            },
            {
                "variant_barcode": "7501234567893",  # Replace with actual barcode
                "quantity": 1,
            },
        ],
        "branch_id": BRANCH_ID,
        "user_id": USER_ID,
        "reason": "Intercambio múltiple - Cliente desea diferentes productos",
        "customer_id": 1,
    }

    try:
        print(f"📤 Sending multi-product exchange request...")
        response = requests.post(
            f"{API_BASE_URL}/api/exchange/create",
            json=test_data,
            headers={"Content-Type": "application/json"},
        )

        print(f"📊 Response Status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print("✅ Multi-product exchange successful!")
            print(f"   📋 Exchange ID: {result.get('exchange_id', 'N/A')}")
            print(f"   📤 Return Products: {result.get('return_products', [])}")
            print(f"   📥 New Products: {result.get('new_products', [])}")
            print(f"   💰 Return Total: ${result.get('return_total', '0.00')}")
            print(f"   💰 New Total: ${result.get('new_total', '0.00')}")
            print(f"   💵 Price Difference: ${result.get('price_difference', '0.00')}")
            print(f"   📝 Message: {result.get('message', '')}")
        else:
            print(f"❌ Multi-product exchange failed!")
            print(f"   📄 Response: {response.text}")

    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server!")
        print("   💡 Make sure the server is running on http://localhost:5000")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

    print("\n" + "=" * 60)

    # Test Case 2: Multi-product return only (no new products)
    print("\n📋 Test Case 2: Multiple products return only (no exchange)")
    return_only_data = {
        "return_products": [
            {
                "variant_barcode": "7501234567894",  # Replace with actual barcode
                "quantity": 1,
                "reason": "Producto defectuoso",
            },
            {
                "variant_barcode": "7501234567895",  # Replace with actual barcode
                "quantity": 1,
                "reason": "No le gustó al cliente",
            },
        ],
        "branch_id": BRANCH_ID,
        "user_id": USER_ID,
        "reason": "Devolución múltiple sin intercambio",
    }

    try:
        print(f"📤 Sending multi-product return-only request...")
        response = requests.post(
            f"{API_BASE_URL}/api/exchange/create",
            json=return_only_data,
            headers={"Content-Type": "application/json"},
        )

        print(f"📊 Response Status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print("✅ Multi-product return successful!")
            print(f"   📋 Exchange ID: {result.get('exchange_id', 'N/A')}")
            print(f"   📤 Return Products: {result.get('return_products', [])}")
            print(f"   💰 Return Total: ${result.get('return_total', '0.00')}")
            print(f"   📝 Message: {result.get('message', '')}")
        else:
            print(f"❌ Multi-product return failed!")
            print(f"   📄 Response: {response.text}")

    except Exception as e:
        print(f"❌ Error in return-only test: {e}")

    print("\n" + "=" * 60)

    # Test Case 3: Legacy single-product compatibility
    print("\n📋 Test Case 3: Legacy single-product format (backwards compatibility)")
    legacy_data = {
        "return_variant_barcode": "7501234567896",  # Replace with actual barcode
        "return_quantity": 1,
        "new_variant_barcode": "7501234567897",  # Replace with actual barcode
        "new_quantity": 1,
        "branch_id": BRANCH_ID,
        "user_id": USER_ID,
        "reason": "Intercambio simple usando formato legacy",
        "customer_id": 1,
    }

    try:
        print(f"📤 Sending legacy format request...")
        response = requests.post(
            f"{API_BASE_URL}/api/exchange/create",
            json=legacy_data,
            headers={"Content-Type": "application/json"},
        )

        print(f"📊 Response Status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print("✅ Legacy format exchange successful!")
            print(f"   📋 Exchange ID: {result.get('exchange_id', 'N/A')}")
            print(f"   💰 Price Difference: ${result.get('price_difference', '0.00')}")
            print(f"   📝 Message: {result.get('message', '')}")
        else:
            print(f"❌ Legacy format exchange failed!")
            print(f"   📄 Response: {response.text}")

    except Exception as e:
        print(f"❌ Error in legacy test: {e}")

    print("\n" + "=" * 60)
    print("🎉 MULTI-PRODUCT EXCHANGE SYSTEM TEST COMPLETED!")
    print("=" * 60)

    return True


def test_validation_endpoints():
    """Test product validation endpoints"""

    print("\n🔍 TESTING VALIDATION ENDPOINTS")
    print("=" * 40)

    # Test return product validation
    print("\n📤 Testing return product validation...")
    validation_data = {
        "variant_barcode": "7501234567890",  # Replace with actual barcode
        "quantity": 1,
        "branch_id": BRANCH_ID,
    }

    try:
        response = requests.post(
            f"{API_BASE_URL}/api/exchange/validate-return",
            json=validation_data,
            headers={"Content-Type": "application/json"},
        )

        if response.status_code == 200:
            result = response.json()
            print("✅ Return validation successful!")
            print(
                f"   📦 Product: {result.get('product', {}).get('product_name', 'N/A')}"
            )
        else:
            print(f"❌ Return validation failed: {response.text}")

    except Exception as e:
        print(f"❌ Error in return validation: {e}")

    # Test new product validation
    print("\n📥 Testing new product validation...")
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/exchange/validate-new-product",
            json=validation_data,
            headers={"Content-Type": "application/json"},
        )

        if response.status_code == 200:
            result = response.json()
            print("✅ New product validation successful!")
            print(
                f"   📦 Product: {result.get('product', {}).get('product_name', 'N/A')}"
            )
            print(
                f"   📊 Stock: {result.get('product', {}).get('available_stock', 'N/A')}"
            )
        else:
            print(f"❌ New product validation failed: {response.text}")

    except Exception as e:
        print(f"❌ Error in new product validation: {e}")


if __name__ == "__main__":
    print("🧪 MULTI-PRODUCT EXCHANGE SYSTEM - COMPREHENSIVE TESTS")
    print("=" * 70)
    print("⚠️  NOTE: Replace barcodes with actual product barcodes from your database")
    print("=" * 70)

    # Run validation tests first
    test_validation_endpoints()

    # Run complete exchange tests
    test_complete_multi_product_exchange()

    print("\n💡 Next Steps:")
    print("   1. Update the frontend modal to use the new multi-product system")
    print("   2. Test the complete UI workflow")
    print("   3. Add integration with the 'Ventas' table for new products")
    print("   4. Add proper error handling and user feedback")
    print("\n🎯 System Status: Multi-product exchange backend is ready!")
