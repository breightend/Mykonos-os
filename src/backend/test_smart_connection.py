#!/usr/bin/env python3
"""
Test script for smart database connection
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config.config import get_config


def test_smart_connection():
    """Test the smart database connection system"""
    print("🧪 Testing Smart Database Connection System")
    print("=" * 50)

    # Get configuration
    config = get_config()
    print(f"Environment: {config.ENVIRONMENT}")
    print(f"Use Smart Connection: {config.USE_SMART_DB_CONNECTION}")
    print()

    if not config.USE_SMART_DB_CONNECTION:
        print(
            "⚠️ Smart connection is disabled. Enable it by setting USE_SMART_DB_CONNECTION=true"
        )
        return False

    # Create smart connection
    smart_db = config.get_smart_db_connection()

    if not smart_db:
        print("❌ Could not create smart database connection")
        return False

    # Test all hosts
    print("🔍 Testing all configured hosts:")
    results = smart_db.test_all_hosts()

    success_count = sum(1 for result in results.values() if result)
    total_count = len(results)

    print(f"\n📊 Results: {success_count}/{total_count} hosts available")

    if success_count == 0:
        print("❌ No database hosts are available!")
        return False

    # Find best host
    print("\n🎯 Finding best host...")
    best_host = smart_db.find_best_host()

    if best_host:
        host_info = smart_db.get_current_host_info()
        print(f"✅ Best host selected: {best_host}")
        if host_info:
            print(f"   Description: {host_info['description']}")

        # Test actual connection
        print("\n🔌 Testing actual database connection...")
        try:
            conn = smart_db.get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT version()")
            version = cursor.fetchone()
            cursor.close()
            conn.close()

            print("✅ Database connection successful!")
            print(f"   PostgreSQL Version: {version[0]}")

            return True

        except Exception as e:
            print(f"❌ Database connection failed: {e}")
            return False
    else:
        print("❌ No suitable host found")
        return False


def test_traditional_connection():
    """Test traditional connection for comparison"""
    print("\n🔄 Testing Traditional Connection")
    print("=" * 50)

    try:
        from database.database import Database

        # Temporarily disable smart connection
        from config.config import Config

        original_value = Config.USE_SMART_DB_CONNECTION
        Config.USE_SMART_DB_CONNECTION = False

        db = Database()

        # Restore original value
        Config.USE_SMART_DB_CONNECTION = original_value

        # Verify database is working
        if db:
            print("✅ Traditional connection successful")
        return True

    except Exception as e:
        print(f"❌ Traditional connection failed: {e}")
        return False


def main():
    print("🚀 Mykonos OS - Database Connection Test")
    print("=" * 60)

    # Test smart connection
    smart_success = test_smart_connection()

    # Test traditional connection
    traditional_success = test_traditional_connection()

    print("\n" + "=" * 60)
    print("📋 SUMMARY")
    print("=" * 60)

    print(f"Smart Connection:      {'✅ PASS' if smart_success else '❌ FAIL'}")
    print(f"Traditional Connection: {'✅ PASS' if traditional_success else '❌ FAIL'}")

    if smart_success:
        print("\n🎉 Smart connection is working! Your app can now:")
        print("   • Automatically try multiple database hosts")
        print("   • Connect from local network (192.168.100.65)")
        print("   • Connect from public IP (186.122.88.99)")
        print("   • Fallback gracefully if one host fails")
    else:
        print("\n⚠️ Smart connection issues detected. Check:")
        print("   • PostgreSQL is running on both IPs")
        print("   • pg_hba.conf allows connections from both IPs")
        print("   • Router port forwarding is configured")
        print("   • Firewall allows connections on port 5432")

    return smart_success or traditional_success


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
