#!/usr/bin/env python3
"""
Fix missing account movements for existing purchases.
This script creates debit movements for purchases that don't have corresponding account movements.
"""

import sys
import os

# Add src/backend to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src", "backend"))

from database.database import Database
from services.account_movements_service import AccountMovementsService


def fix_missing_purchase_movements():
    """
    Find purchases that don't have corresponding account movements and create them
    """
    print("🔧 Fixing Missing Purchase Account Movements")
    print("=" * 60)

    db = Database()
    account_service = AccountMovementsService()

    try:
        # Get all purchases with their provider info
        purchases_query = """
            SELECT 
                p.id as purchase_id,
                p.entity_id as provider_id,
                p.total,
                p.purchase_date,
                p.invoice_number,
                p.notes,
                pr.nombre as provider_name
            FROM purchases p
            LEFT JOIN proveedores pr ON p.entity_id = pr.id
            ORDER BY p.purchase_date ASC, p.id ASC
        """

        purchases = db.execute_query(purchases_query)

        if not purchases:
            print("❌ No purchases found in database")
            return

        print(f"📋 Found {len(purchases)} total purchases")
        print()

        # Check which purchases already have account movements
        missing_movements = []

        for purchase in purchases:
            # Check if this purchase already has an account movement
            existing_movement = db.execute_query(
                "SELECT id FROM account_movements WHERE purchase_id = %s",
                (purchase["purchase_id"],),
            )

            if not existing_movement:
                missing_movements.append(purchase)

        if not missing_movements:
            print("✅ All purchases already have account movements!")
            return

        print(f"⚠️ Found {len(missing_movements)} purchases without account movements:")
        print()

        for i, purchase in enumerate(missing_movements):
            print(f"{i + 1}. Purchase ID: {purchase['purchase_id']}")
            print(
                f"   Provider: {purchase['provider_name']} (ID: {purchase['provider_id']})"
            )
            print(f"   Amount: ${purchase['total']:.2f}")
            print(f"   Date: {purchase['purchase_date']}")
            print(f"   Invoice: {purchase['invoice_number'] or 'N/A'}")
            print()

        # Ask user if they want to create the missing movements
        user_input = input(
            "Do you want to create account movements for these purchases? (y/N): "
        )

        if user_input.lower() not in ["y", "yes"]:
            print("❌ Operation cancelled")
            return

        print()
        print("🔧 Creating missing account movements...")
        print()

        created_count = 0
        failed_count = 0

        for purchase in missing_movements:
            try:
                # Create the debit movement for this purchase
                description = f"Compra - Factura: {purchase['invoice_number'] or 'N/A'}"
                if purchase["notes"]:
                    description += f" - {purchase['notes']}"

                result = account_service.create_provider_debit_movement(
                    entity_id=purchase["provider_id"],
                    amount=purchase["total"],
                    description=description,
                    purchase_id=purchase["purchase_id"],
                    partial_payment=0.0,
                    partial_payment_method="efectivo",
                )

                if result.get("success"):
                    created_count += 1
                    print(
                        f"✅ Created movement for purchase {purchase['purchase_id']} - Balance: ${result.get('new_balance', 0):.2f}"
                    )
                else:
                    failed_count += 1
                    print(
                        f"❌ Failed to create movement for purchase {purchase['purchase_id']}: {result.get('message')}"
                    )

            except Exception as e:
                failed_count += 1
                print(
                    f"❌ Error creating movement for purchase {purchase['purchase_id']}: {e}"
                )

        print()
        print("=" * 60)
        print(f"📊 Summary:")
        print(f"   ✅ Successfully created: {created_count} movements")
        print(f"   ❌ Failed: {failed_count} movements")
        print(f"   📈 Total processed: {len(missing_movements)} purchases")

        if created_count > 0:
            print()
            print("🎯 Next steps:")
            print("   1. Refresh your provider pages to see updated balances")
            print("   2. Use the 'Validar' button to verify balance calculations")
            print("   3. Check that debt amounts now show correctly")

    except Exception as e:
        print(f"❌ Error during operation: {e}")
        import traceback

        traceback.print_exc()


def show_provider_balance_summary():
    """
    Show current balance summary for all providers
    """
    print("📊 Provider Balance Summary")
    print("=" * 40)

    db = Database()
    account_service = AccountMovementsService()

    try:
        # Get all providers that have purchases
        providers_query = """
            SELECT DISTINCT 
                p.entity_id as provider_id,
                pr.nombre as provider_name
            FROM purchases p
            LEFT JOIN proveedores pr ON p.entity_id = pr.id
            WHERE pr.nombre IS NOT NULL
            ORDER BY pr.nombre
        """

        providers = db.execute_query(providers_query)

        if not providers:
            print("❌ No providers with purchases found")
            return

        print(f"Found {len(providers)} providers with purchases:")
        print()

        total_debt = 0

        for provider in providers:
            provider_id = provider["provider_id"]
            provider_name = provider["provider_name"]
            balance = account_service.get_provider_balance(provider_id)

            # Get movement count
            movements = db.execute_query(
                "SELECT COUNT(*) as count FROM account_movements WHERE entity_id = %s",
                (provider_id,),
            )
            movement_count = movements[0]["count"] if movements else 0

            status = (
                "You owe" if balance > 0 else "Provider owes" if balance < 0 else "Even"
            )

            print(f"📍 {provider_name} (ID: {provider_id})")
            print(f"   Balance: ${balance:.2f} ({status})")
            print(f"   Movements: {movement_count}")
            print()

            if balance > 0:
                total_debt += balance

        print("=" * 40)
        print(f"💰 Total debt across all providers: ${total_debt:.2f}")

    except Exception as e:
        print(f"❌ Error getting provider summary: {e}")


if __name__ == "__main__":
    print("🏦 Purchase Account Movement Fixer")
    print("=" * 50)

    print("Choose an option:")
    print("1. Show provider balance summary")
    print("2. Fix missing purchase account movements")
    print("3. Exit")

    choice = input("\nEnter your choice (1-3): ").strip()

    if choice == "1":
        show_provider_balance_summary()
    elif choice == "2":
        fix_missing_purchase_movements()
    elif choice == "3":
        print("👋 Goodbye!")
    else:
        print("❌ Invalid choice. Please run the script again.")
