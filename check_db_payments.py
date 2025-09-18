#!/usr/bin/env python3

import psycopg2

try:
    # Connect to PostgreSQL
    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        database="mykonos_db",
        user="mykonos_user",
        password="mykonos_password",
    )
    cur = conn.cursor()

    print("=== CHECKING PAYMENT METHODS TABLES ===")

    # Check if banks_payment_methods table exists
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name LIKE '%payment%'
    """)
    tables = cur.fetchall()
    print("\nPayment-related tables:")
    for table in tables:
        print(f"  - {table[0]}")

    # Check banks_payment_methods structure
    try:
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'banks_payment_methods'
        """)
        cols = cur.fetchall()
        print(f"\nbanks_payment_methods columns:")
        for col in cols:
            print(f"  - {col[0]}: {col[1]}")

        # Check data
        cur.execute("SELECT * FROM banks_payment_methods LIMIT 5")
        rows = cur.fetchall()
        print(f"\nSample data from banks_payment_methods:")
        for row in rows:
            print(f"  {row}")

    except Exception as e:
        print(f"Error checking banks_payment_methods: {e}")

    # Check account_movements foreign keys
    try:
        cur.execute("""
            SELECT 
                tc.constraint_name, 
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name='account_movements'
        """)
        fks = cur.fetchall()
        print(f"\naccount_movements foreign keys:")
        for fk in fks:
            print(f"  {fk[1]}.{fk[2]} -> {fk[3]}.{fk[4]}")

    except Exception as e:
        print(f"Error checking foreign keys: {e}")

    conn.close()
    print("\nDatabase check complete!")

except Exception as e:
    print(f"Database connection error: {e}")
