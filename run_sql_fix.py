import psycopg2
from psycopg2.extras import RealDictCursor


def run_sql_fix():
    """Run the SQL fix for inventory_movements table"""
    try:
        # Database connection parameters (same as in config.py)
        conn = psycopg2.connect(
            host="localhost",
            port=5432,
            database="mykonos_db",
            user="mykonos_user",
            password="mykonos_password",
            cursor_factory=RealDictCursor,
        )

        print("✅ Connected to PostgreSQL")

        # Read and execute the SQL fix
        with open("fix_inventory_movements.sql", "r") as f:
            sql_script = f.read()

        cursor = conn.cursor()
        cursor.execute(sql_script)
        conn.commit()

        print("✅ SQL fix executed successfully")

        # Verify the changes
        cursor.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'inventory_movements' 
            ORDER BY ordinal_position
        """)

        columns = cursor.fetchall()
        print("\n📋 Updated inventory_movements columns:")
        for col in columns:
            print(f"  - {col['column_name']}: {col['data_type']}")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    run_sql_fix()
