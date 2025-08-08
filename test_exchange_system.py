#!/usr/bin/env python3
"""
Test script for Exchange System
Tests the complete exchange/return functionality
"""

import requests
import json
from datetime import datetime

API_BASE = "http://localhost:5000/api/exchange"


def print_response(title, response):
    """Helper function to print API responses nicely"""
    print(f"\n{'=' * 50}")
    print(f"🧪 {title}")
    print(f"{'=' * 50}")

    try:
        if response.status_code == 200:
            print(f"✅ Status: {response.status_code}")
            print(
                f"📋 Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}"
            )
        else:
            print(f"❌ Status: {response.status_code}")
            print(f"💥 Error: {response.text}")
    except Exception as e:
        print(f"🔥 Exception: {e}")
        print(f"Raw response: {response.text}")


def test_exchange_system():
    """Test the complete exchange system"""
    print("🚀 Starting Exchange System Tests")
    print(f"🕒 Test time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Test 1: Get exchange history (should work even if empty)
    try:
        response = requests.get(f"{API_BASE}/history", timeout=10)
        print_response("TEST 1: Get Exchange History", response)
    except Exception as e:
        print(f"❌ TEST 1 Failed: {e}")

    # Test 2: Validate return product (using known barcode)
    test_barcode = "VAR0003002003"
    try:
        payload = {"variant_barcode": test_barcode, "quantity": 1, "branch_id": 1}
        response = requests.post(
            f"{API_BASE}/validate-return",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10,
        )
        print_response(f"TEST 2: Validate Return Product ({test_barcode})", response)
    except Exception as e:
        print(f"❌ TEST 2 Failed: {e}")

    # Test 3: Validate new product (using different barcode)
    new_test_barcode = "VAR0003003004"
    try:
        payload = {"variant_barcode": new_test_barcode, "quantity": 1, "branch_id": 1}
        response = requests.post(
            f"{API_BASE}/validate-new-product",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10,
        )
        print_response(f"TEST 3: Validate New Product ({new_test_barcode})", response)
    except Exception as e:
        print(f"❌ TEST 3 Failed: {e}")

    # Test 4: Create exchange (return only - no new product)
    try:
        exchange_data = {
            "return_variant_barcode": test_barcode,
            "return_quantity": 1,
            "branch_id": 1,
            "reason": "Test return - sistema de pruebas",
            "user_id": 1,
        }
        response = requests.post(
            f"{API_BASE}/create",
            json=exchange_data,
            headers={"Content-Type": "application/json"},
            timeout=15,
        )
        print_response("TEST 4: Create Return (no exchange)", response)
    except Exception as e:
        print(f"❌ TEST 4 Failed: {e}")

    # Test 5: Create full exchange (return + new product)
    try:
        exchange_data = {
            "return_variant_barcode": test_barcode,
            "return_quantity": 1,
            "new_variant_barcode": new_test_barcode,
            "new_quantity": 1,
            "branch_id": 1,
            "reason": "Test exchange - cambio de producto",
            "user_id": 1,
            "customer_id": 1,  # Add customer for financial tracking
        }
        response = requests.post(
            f"{API_BASE}/create",
            json=exchange_data,
            headers={"Content-Type": "application/json"},
            timeout=15,
        )
        print_response("TEST 5: Create Full Exchange", response)
    except Exception as e:
        print(f"❌ TEST 5 Failed: {e}")

    # Test 6: Check history after exchanges
    try:
        response = requests.get(f"{API_BASE}/history?limit=5", timeout=10)
        print_response("TEST 6: Check Exchange History After Tests", response)
    except Exception as e:
        print(f"❌ TEST 6 Failed: {e}")

    print(f"\n{'=' * 50}")
    print("🏁 Exchange System Tests Complete")
    print(f"{'=' * 50}")


if __name__ == "__main__":
    try:
        test_exchange_system()
    except KeyboardInterrupt:
        print("\n⚡ Tests interrupted by user")
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
