import sys

sys.path.append("src/backend")

try:
    from database.database import Database

    db = Database()

    print("=== CHECKING SALES STATUSES ===")

    # Check what status values actually exist
    status_result = db.execute_query("""
        SELECT DISTINCT status, COUNT(*) as count, COALESCE(SUM(total), 0) as total_revenue
        FROM sales 
        GROUP BY status
        ORDER BY count DESC
    """)

    print("Status values in database:")
    for row in status_result:
        if isinstance(row, dict):
            print(
                f"  Status: '{row['status']}' | Count: {row['count']} | Revenue: ${row['total_revenue']}"
            )
        else:
            print(f"  Row: {row}")

    # Check today's sales by status
    print("\n=== TODAY'S SALES BY STATUS ===")
    today_by_status = db.execute_query("""
        SELECT status, COUNT(*) as count, COALESCE(SUM(total), 0) as total_revenue
        FROM sales 
        WHERE DATE(sale_date) = '2025-08-09'
        GROUP BY status
    """)

    print("Today's sales by status:")
    for row in today_by_status:
        if isinstance(row, dict):
            print(
                f"  Status: '{row['status']}' | Count: {row['count']} | Revenue: ${row['total_revenue']}"
            )
        else:
            print(f"  Row: {row}")

except Exception as e:
    print(f"Error: {e}")
    import traceback

    traceback.print_exc()
