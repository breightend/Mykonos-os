#!/usr/bin/env python3
"""
Test PostgreSQL connection to remote server
"""

import psycopg2
from config.config import Config


def test_connection():
    config = Config()

    print("Testing PostgreSQL connection...")
    print(f"Host: {config.DB_HOST}")
    print(f"Port: {config.DB_PORT}")
    print(f"Database: {config.DB_NAME}")
    print(f"User: {config.DB_USER}")

    try:
        # Test connection
        conn = psycopg2.connect(
            host=config.DB_HOST,
            port=config.DB_PORT,
            database=config.DB_NAME,
            user=config.DB_USER,
            password=config.DB_PASSWORD,
        )

        # Test a simple query
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()

        print("✅ Connection successful!")
        print(f"PostgreSQL version: {version[0]}")

        cursor.close()
        conn.close()

        return True

    except psycopg2.Error as e:
        print(f"❌ Connection failed: {e}")
        return False


if __name__ == "__main__":
    test_connection()
