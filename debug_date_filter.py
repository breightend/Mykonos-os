#!/usr/bin/env python3

import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "src", "backend"))

from database.database import Database


def debug_date_filtering():
    print("=== DEBUG DATE FILTERING ===")

    try:
        db = Database()

        # 1. Check total sales without filters
        print("\n1. Total sales (no filters):")
        result = db.execute_query("""
            SELECT 
                COUNT(s.id) as total_sales,
                COALESCE(SUM(s.total), 0) as total_revenue
            FROM sales s
            WHERE s.status = 'Completada'
        """)
        print(f"Result: {result}")

        # 2. Check actual dates in database
        print("\n2. Actual sale dates:")
        result = db.execute_query("""
            SELECT id, sale_date, total, status 
            FROM sales 
            ORDER BY sale_date DESC 
            LIMIT 5
        """)
        print(f"Recent sales: {result}")

        # 3. Test date filtering with PostgreSQL DATE() function
        print("\n3. Testing DATE() function filter for 2025-08-09:")
        result = db.execute_query(
            """
            SELECT 
                COUNT(s.id) as total_sales,
                COALESCE(SUM(s.total), 0) as total_revenue,
                MIN(s.sale_date) as earliest_date,
                MAX(s.sale_date) as latest_date
            FROM sales s
            WHERE s.status = 'Completada'
            AND DATE(s.sale_date) >= %s
            AND DATE(s.sale_date) <= %s
        """,
            ("2025-08-09", "2025-08-09"),
        )
        print(f"Result with date filter: {result}")

        # 4. Test what DATE() function returns for our timestamps
        print("\n4. Testing DATE() extraction:")
        result = db.execute_query(
            """
            SELECT 
                id, 
                sale_date, 
                DATE(sale_date) as date_only,
                DATE(sale_date) >= %s as matches_start,
                DATE(sale_date) <= %s as matches_end
            FROM sales 
            WHERE status = 'Completada'
            ORDER BY sale_date DESC 
            LIMIT 5
        """,
            ("2025-08-09", "2025-08-09"),
        )
        print(f"Date extraction test: {result}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    debug_date_filtering()
