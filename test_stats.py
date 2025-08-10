import sys
import os

sys.path.append("src/backend")

from database.database import Database

db = Database()

# Test the exact query used in sales_router.py
print("Testing stats query with date filter...")

query = """
SELECT 
    COUNT(s.id) as total_sales,
    COALESCE(SUM(s.total), 0) as total_revenue,
    COALESCE(SUM(sd_positive.quantity), 0) as total_products_sold,
    COUNT(DISTINCT s.customer_id) as unique_customers,
    COUNT(CASE WHEN s.notes LIKE '%intercambio%' THEN 1 END) as exchange_sales
FROM sales s
LEFT JOIN (
    SELECT sale_id, SUM(quantity) as quantity
    FROM sales_detail 
    WHERE quantity > 0
    GROUP BY sale_id
) sd_positive ON s.id = sd_positive.sale_id
WHERE DATE(s.sale_date) >= %s
AND DATE(s.sale_date) <= %s
AND s.status = 'Completada'
"""

params = ("2025-08-09", "2025-08-09")
print(f"Query params: {params}")

result = db.execute_query(query, params)
print(f"Result: {result}")

# Also test without status filter to see if that's the issue
print("\nTesting without status filter...")
query_no_status = """
SELECT 
    COUNT(s.id) as total_sales,
    COALESCE(SUM(s.total), 0) as total_revenue
FROM sales s
WHERE DATE(s.sale_date) >= %s
AND DATE(s.sale_date) <= %s
"""

result_no_status = db.execute_query(query_no_status, params)
print(f"Result without status: {result_no_status}")

# Check what statuses exist
print("\nChecking existing statuses...")
status_result = db.execute_query(
    "SELECT DISTINCT status, COUNT(*) FROM sales GROUP BY status"
)
print(f"Status counts: {status_result}")
