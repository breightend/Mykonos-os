#!/usr/bin/env python3
"""
Test script for database connection - PostgreSQL vs SQLite
"""

import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import Database
from config.config import Config


def test_database_connection():
    """Test database connection and basic operations"""
    print("🔄 Testing Database Connection...")
    print(f"📊 Using PostgreSQL: {Config.USE_POSTGRES}")

    try:
        # Initialize database
        db = Database()
        print("✅ Database initialized successfully")

        # Test connection
        conn = db.create_connection()
        if conn:
            print("✅ Database connection established")

            # Test a simple query
            if db.use_postgres:
                # PostgreSQL test
                cursor = conn.cursor()

                # Test basic connection
                cursor.execute("SELECT version();")
                version = cursor.fetchone()
                print(f"📋 PostgreSQL Version: {version[0]}")

                # Test if our tables exist
                cursor.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    ORDER BY table_name;
                """)
                tables = cursor.fetchall()
                print(f"📊 Tables found: {len(tables)}")
                for i, table in enumerate(tables[:5]):  # Show first 5 tables
                    print(f"   - {table[0]}")
                if len(tables) > 5:
                    print(f"   ... and {len(tables) - 5} more")

                # Test a simple count query on one of our tables
                if tables:
                    first_table = tables[0][0]
                    cursor.execute(f"SELECT COUNT(*) FROM {first_table};")
                    count = cursor.fetchone()
                    print(f"📊 Sample data - {first_table}: {count[0]} records")

            else:
                # SQLite test
                cursor = conn.cursor()
                cursor.execute("SELECT sqlite_version();")
                version = cursor.fetchone()
                print(f"📋 SQLite Version: {version[0]}")

                # Test if our tables exist
                cursor.execute("""
                    SELECT name FROM sqlite_master 
                    WHERE type='table' 
                    ORDER BY name;
                """)
                tables = cursor.fetchall()
                print(f"📊 Tables found: {len(tables)}")
                for table in tables:
                    print(f"   - {table[0]}")

            conn.close()
            print("✅ Database test completed successfully")
            return True

        else:
            print("❌ Failed to establish database connection")
            return False

    except Exception as e:
        print(f"❌ Database test failed: {e}")
        print(f"🔍 Error type: {type(e).__name__}")
        import traceback

        print(f"🔍 Full traceback:")
        traceback.print_exc()
        return False


def main():
    """Main function"""
    print("🚀 Mykonos Database Connection Test")
    print("=" * 50)

    # Show current configuration
    print(f"🔧 Database Configuration:")
    if Config.USE_POSTGRES:
        print(f"   Type: PostgreSQL")
        print(f"   Host: {Config.DB_HOST}")
        print(f"   Port: {Config.DB_PORT}")
        print(f"   Database: {Config.DB_NAME}")
        print(f"   User: {Config.DB_USER}")
    else:
        print(f"   Type: SQLite")
        print(f"   Path: ./database/mykonos.db")

    print("-" * 50)

    # Test connection
    success = test_database_connection()

    print("-" * 50)
    if success:
        print("🎉 All tests passed! Database is ready to use.")
    else:
        print("💥 Tests failed. Please check your configuration.")
        if Config.USE_POSTGRES:
            print("💡 Make sure Docker PostgreSQL container is running:")
            print("   docker-compose up -d")


if __name__ == "__main__":
    main()
