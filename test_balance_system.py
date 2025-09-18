#!/usr/bin/env python3
"""
Test script to validate and fix provider balance system.
This script helps ensure that the running balance (saldo) is calculated correctly.
"""

import sys
import os

# Add src/backend to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src", "backend"))

from services.account_movements_service import AccountMovementsService


def test_provider_balance_system():
    """
    Test the provider balance system for a specific provider
    """
    print("🧪 Testing Provider Balance System")
    print("=" * 50)

    service = AccountMovementsService()

    # You can change this to test with a specific provider ID
    provider_id = 1  # Change this to a real provider ID in your system

    print(f"Testing provider ID: {provider_id}")
    print()

    # 1. Check current balance
    print("1️⃣ Current Balance Check:")
    current_balance = service.get_provider_balance(provider_id)
    print(f"   Current balance: ${current_balance:.2f}")
    if current_balance > 0:
        print("   ➡️ You owe money to this provider")
    elif current_balance < 0:
        print("   ➡️ Provider has credit with you")
    else:
        print("   ➡️ No debt")
    print()

    # 2. Validate balance integrity
    print("2️⃣ Balance Integrity Validation:")
    validation = service.validate_provider_balance_integrity(provider_id)

    if validation["success"]:
        print(f"   ✅ Validation completed")
        print(f"   📊 Total movements: {validation['movements_count']}")
        print(f"   💰 Final balance: ${validation['final_balance']:.2f}")

        if validation["is_valid"]:
            print("   ✅ All balances are correct!")
        else:
            print(f"   ⚠️ Found {len(validation['inconsistencies'])} inconsistencies:")
            for inc in validation["inconsistencies"]:
                print(f"      Movement #{inc['position']} (ID: {inc['movement_id']})")
                print(f"        Description: {inc['description']}")
                print(f"        Stored: ${inc['stored_balance']:.2f}")
                print(f"        Should be: ${inc['calculated_balance']:.2f}")
                print(f"        Difference: ${inc['difference']:.2f}")
            print()

            # 3. Offer to fix inconsistencies
            print("3️⃣ Fix Inconsistencies:")
            user_input = input(
                "   Do you want to fix the balance inconsistencies? (y/N): "
            )

            if user_input.lower() in ["y", "yes"]:
                print("   🔧 Recalculating balances...")
                fix_result = service.recalculate_provider_balances(provider_id)

                if fix_result["success"]:
                    print(f"   ✅ {fix_result['message']}")
                    print(f"   💰 Final balance: ${fix_result['final_balance']:.2f}")
                    print(f"   📝 Updated {fix_result['updates_count']} movements")
                else:
                    print(f"   ❌ Error fixing balances: {fix_result['message']}")
            else:
                print("   ⏭️ Skipping balance fix")
    else:
        print(f"   ❌ Validation failed: {validation['message']}")

    print()
    print("=" * 50)
    print("🎯 Balance System Summary:")
    print()
    print("📋 How the system works:")
    print("   • Each purchase creates a DEBIT movement (+debe, increases debt)")
    print("   • Each payment creates a CREDIT movement (+haber, decreases debt)")
    print("   • Running balance = previous_balance + debe - haber")
    print("   • Positive balance = You owe the provider")
    print("   • Negative balance = Provider has credit with you")
    print()
    print("🔧 Available operations:")
    print("   • Purchase: Creates debit, increases your debt to provider")
    print("   • Payment: Creates credit, decreases your debt to provider")
    print("   • Balance shown in UI: Latest saldo from most recent movement")


def list_providers_with_movements():
    """
    List all providers that have account movements
    """
    print("📋 Providers with Account Movements:")
    print("=" * 40)

    service = AccountMovementsService()

    try:
        # Get all unique provider IDs from account_movements
        result = service.db.execute_query("""
            SELECT DISTINCT entity_id, COUNT(*) as movement_count
            FROM account_movements 
            GROUP BY entity_id 
            ORDER BY entity_id
        """)

        if result:
            for row in result:
                entity_id = row["entity_id"]
                movement_count = row["movement_count"]
                balance = service.get_provider_balance(entity_id)

                print(f"Provider ID: {entity_id}")
                print(f"  Movements: {movement_count}")
                print(f"  Balance: ${balance:.2f}")
                print(
                    f"  Status: {'You owe' if balance > 0 else 'Provider owes' if balance < 0 else 'Even'}"
                )
                print()
        else:
            print("No providers with movements found.")

    except Exception as e:
        print(f"Error listing providers: {e}")


if __name__ == "__main__":
    print("🏦 Provider Balance System Tester")
    print("=" * 50)

    print("Choose an option:")
    print("1. List all providers with movements")
    print("2. Test specific provider balance system")
    print("3. Exit")

    choice = input("\nEnter your choice (1-3): ").strip()

    if choice == "1":
        list_providers_with_movements()
    elif choice == "2":
        provider_id = input("Enter provider ID to test: ").strip()
        try:
            provider_id = int(provider_id)
            test_provider_balance_system()
        except ValueError:
            print("❌ Invalid provider ID. Please enter a number.")
    elif choice == "3":
        print("👋 Goodbye!")
    else:
        print("❌ Invalid choice. Please run the script again.")
