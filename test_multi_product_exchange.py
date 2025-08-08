#!/usr/bin/env python3
"""
Test Multi-Product Exchange System
Tests the new multiple products exchange functionality
"""

import requests
import json
from datetime import datetime

API_BASE = "http://localhost:5000/api/exchange"


def test_multi_product_exchange():
    """Test the multi-product exchange system"""
    print("🚀 TESTING MULTI-PRODUCT EXCHANGE SYSTEM")
    print("=" * 50)
    print(f"🕒 Test time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Test 1: Multi-product return (no new products)
    print("\n🧪 TEST 1: Multiple Products Return")
    print("-" * 30)

    multi_return_data = {
        "return_products": [
            {
                "variant_barcode": "VAR0003002003",
                "quantity": 2,
                "reason": "Talla incorrecta",
            },
            {
                "variant_barcode": "VAR0003003004",
                "quantity": 1,
                "reason": "Color no deseado",
            },
        ],
        "branch_id": 1,
        "reason": "Cliente insatisfecho con múltiples productos",
        "user_id": 1,
        "customer_id": 1,
    }

    try:
        response = requests.post(
            f"{API_BASE}/create", json=multi_return_data, timeout=15
        )
        print(f"Status: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2, ensure_ascii=False)}")
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test 2: Multi-product exchange (multiple returns + multiple new)
    print("\n🧪 TEST 2: Multiple Products Exchange")
    print("-" * 30)

    multi_exchange_data = {
        "return_products": [
            {
                "variant_barcode": "VAR0003002003",
                "quantity": 1,
                "reason": "Cambio por otros productos",
            }
        ],
        "new_products": [{"variant_barcode": "VAR0003003004", "quantity": 2}],
        "branch_id": 1,
        "reason": "Cliente quiere más cantidad del otro producto",
        "user_id": 1,
        "customer_id": 1,
    }

    try:
        response = requests.post(
            f"{API_BASE}/create", json=multi_exchange_data, timeout=15
        )
        print(f"Status: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2, ensure_ascii=False)}")
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test 3: Complex multi-product exchange (many-to-many)
    print("\n🧪 TEST 3: Complex Multi-Product Exchange")
    print("-" * 30)

    complex_exchange_data = {
        "return_products": [
            {
                "variant_barcode": "VAR0003002003",
                "quantity": 2,
                "reason": "Devolución parcial",
            }
        ],
        "new_products": [{"variant_barcode": "VAR0003003004", "quantity": 1}],
        "branch_id": 1,
        "reason": "Intercambio complejo con diferencia de precio",
        "user_id": 1,
        "customer_id": 1,
    }

    try:
        response = requests.post(
            f"{API_BASE}/create", json=complex_exchange_data, timeout=15
        )
        print(f"Status: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2, ensure_ascii=False)}")

        if result.get("success"):
            print(f"\n✅ Exchange Summary:")
            print(f"   📤 Returned: {', '.join(result.get('return_products', []))}")
            print(f"   📥 New: {', '.join(result.get('new_products', []))}")
            print(f"   💰 Return Total: ${result.get('return_total', '0.00')}")
            print(f"   💰 New Total: ${result.get('new_total', '0.00')}")
            print(f"   💵 Difference: ${result.get('price_difference', '0.00')}")

    except Exception as e:
        print(f"❌ Error: {e}")

    # Test 4: Test backwards compatibility with legacy format
    print("\n🧪 TEST 4: Legacy Format Compatibility")
    print("-" * 30)

    legacy_data = {
        "return_variant_barcode": "VAR0003002003",
        "return_quantity": 1,
        "new_variant_barcode": "VAR0003003004",
        "new_quantity": 1,
        "branch_id": 1,
        "reason": "Test legacy format",
        "user_id": 1,
        "customer_id": 1,
    }

    try:
        response = requests.post(f"{API_BASE}/create", json=legacy_data, timeout=15)
        print(f"Status: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2, ensure_ascii=False)}")
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test 5: Check exchange history
    print("\n🧪 TEST 5: Exchange History After Multi-Product Tests")
    print("-" * 30)

    try:
        response = requests.get(f"{API_BASE}/history?limit=10", timeout=10)
        print(f"Status: {response.status_code}")
        result = response.json()
        print(f"History: {json.dumps(result, indent=2, ensure_ascii=False)}")
    except Exception as e:
        print(f"❌ Error: {e}")

    print("\n" + "=" * 50)
    print("🏁 MULTI-PRODUCT EXCHANGE TESTS COMPLETED")
    print("=" * 50)


if __name__ == "__main__":
    try:
        test_multi_product_exchange()
    except KeyboardInterrupt:
        print("\n⚡ Tests interrupted by user")
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
