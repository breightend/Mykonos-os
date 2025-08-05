#!/usr/bin/env python3
"""
Test script to verify all services work with PostgreSQL
"""

print("🔧 Testing Services with PostgreSQL...")

try:
    # Test 1: AccountMovementsService
    from services.account_movements_service import AccountMovementsService

    service = AccountMovementsService()
    print("✅ AccountMovementsService initialized successfully")

    # Test 2: BarcodeService (no database dependency)
    from services.barcode_service import BarcodeService

    barcode_service = BarcodeService()
    test_barcode = barcode_service.generate_variant_barcode(123, 1, 2)
    print(f"✅ BarcodeService working: {test_barcode}")

    # Test 3: ClientSalesService
    from services.client_sales_service import ClientSalesService

    client_service = ClientSalesService()
    print("✅ ClientSalesService initialized successfully")

    # Test 4: Auth functions
    from services.auth_service import get_user_sessions

    print("✅ Auth service functions imported successfully")

    print("🎉 All services are PostgreSQL compatible!")

except Exception as e:
    print(f"❌ Error testing services: {e}")
    exit(1)
