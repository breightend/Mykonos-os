from flask import Blueprint, jsonify, request
from database.database import Database
from datetime import datetime, timedelta

statistics_bp = Blueprint("statistics", __name__)


def get_date_range_from_params():
    """Helper function to get date range from request parameters"""
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    storage_id = request.args.get("storage_id", type=int)

    # Default to current month if no dates provided
    if not start_date or not end_date:
        today = datetime.now()
        start_date = today.replace(day=1).strftime("%Y-%m-%d")
        end_date = today.strftime("%Y-%m-%d")

    return start_date, end_date, storage_id


@statistics_bp.route("/dashboard", methods=["GET"])
def get_dashboard_stats():
    """
    Get comprehensive dashboard statistics including sales, purchases, and inventory
    """
    try:
        start_date, end_date, storage_id = get_date_range_from_params()
        db = Database()

        # Build filters
        filters = []
        params = []

        if storage_id:
            filters.append("storage_id = %s")
            params.append(storage_id)
        if start_date:
            filters.append("sale_date >= %s")
            params.append(start_date)
        if end_date:
            filters.append("sale_date <= %s")
            params.append(end_date)

        sales_where = (
            f"WHERE {' AND '.join(filters + ['status = %s'])}"
            if filters
            else "WHERE status = %s"
        )
        sales_params = params + ["Completada"]

        # 1. Sales Overview
        sales_overview = {}

        # Total sales and revenue
        sales_query = f"""
            SELECT 
                COUNT(*) as total_sales,
                COALESCE(SUM(total), 0) as total_revenue,
                COALESCE(AVG(total), 0) as avg_sale_value
            FROM sales 
            {sales_where}
        """
        sales_result = db.execute_query(sales_query, sales_params)
        if sales_result:
            row = sales_result[0]
            sales_overview = {
                "total_sales": row.get("total_sales", 0)
                if isinstance(row, dict)
                else row[0],
                "total_revenue": float(
                    row.get("total_revenue", 0) if isinstance(row, dict) else row[1]
                ),
                "avg_sale_value": float(
                    row.get("avg_sale_value", 0) if isinstance(row, dict) else row[2]
                ),
            }

        # Products sold
        products_query = f"""
            SELECT COALESCE(SUM(sd.quantity), 0) as total_products_sold
            FROM sales_detail sd
            JOIN sales s ON sd.sale_id = s.id
            {sales_where} AND sd.quantity > 0
        """
        products_result = db.execute_query(products_query, sales_params)
        if products_result:
            sales_overview["total_products_sold"] = (
                products_result[0].get("total_products_sold", 0)
                if isinstance(products_result[0], dict)
                else products_result[0][0]
            )

        # 2. Purchases Overview
        purchase_filters = []
        purchase_params = []

        if start_date:
            purchase_filters.append("purchase_date >= %s")
            purchase_params.append(start_date)
        if end_date:
            purchase_filters.append("purchase_date <= %s")
            purchase_params.append(end_date)

        purchase_where = (
            f"WHERE {' AND '.join(purchase_filters)}" if purchase_filters else ""
        )

        purchases_query = f"""
            SELECT 
                COUNT(*) as total_purchases,
                COALESCE(SUM(total), 0) as total_spent,
                COALESCE(AVG(total), 0) as avg_purchase_value
            FROM purchases 
            {purchase_where}
        """
        purchases_result = db.execute_query(purchases_query, purchase_params)
        purchases_overview = {}
        if purchases_result:
            row = purchases_result[0]
            purchases_overview = {
                "total_purchases": row.get("total_purchases", 0)
                if isinstance(row, dict)
                else row[0],
                "total_spent": float(
                    row.get("total_spent", 0) if isinstance(row, dict) else row[1]
                ),
                "avg_purchase_value": float(
                    row.get("avg_purchase_value", 0)
                    if isinstance(row, dict)
                    else row[2]
                ),
            }

        # 3. Inventory Overview
        inventory_query = """
            SELECT 
                COUNT(DISTINCT wsv.product_id) as total_products,
                COALESCE(SUM(wsv.quantity), 0) as total_stock_units,
                COUNT(wsv.id) as total_variants
            FROM warehouse_stock_variants wsv
        """
        if storage_id:
            inventory_query += " WHERE wsv.branch_id = %s"
            inventory_params = [storage_id]
        else:
            inventory_params = []

        inventory_result = db.execute_query(inventory_query, inventory_params)
        inventory_overview = {}
        if inventory_result:
            row = inventory_result[0]
            inventory_overview = {
                "total_products": row.get("total_products", 0)
                if isinstance(row, dict)
                else row[0],
                "total_stock_units": row.get("total_stock_units", 0)
                if isinstance(row, dict)
                else row[1],
                "total_variants": row.get("total_variants", 0)
                if isinstance(row, dict)
                else row[2],
            }

        return jsonify(
            {
                "status": "success",
                "data": {
                    "sales": sales_overview,
                    "purchases": purchases_overview,
                    "inventory": inventory_overview,
                    "date_range": {
                        "start_date": start_date,
                        "end_date": end_date,
                        "storage_id": storage_id,
                    },
                },
            }
        )

    except Exception as e:
        print(f"Error getting dashboard stats: {e}")
        import traceback

        traceback.print_exc()
        return jsonify(
            {
                "status": "error",
                "message": "Error interno del servidor",
                "error": str(e),
            }
        ), 500


@statistics_bp.route("/sales-by-month", methods=["GET"])
def get_sales_by_month():
    """
    Get sales data grouped by month for the last 12 months
    """
    try:
        storage_id = request.args.get("storage_id", type=int)
        db = Database()

        # Get last 12 months
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365)

        filters = ["status = %s"]
        params = ["Completada"]

        if storage_id:
            filters.append("storage_id = %s")
            params.append(storage_id)

        filters.append("sale_date >= %s")
        params.append(start_date.strftime("%Y-%m-%d"))

        where_clause = f"WHERE {' AND '.join(filters)}"

        query = f"""
            SELECT 
                SUBSTR(s.sale_date, 1, 7) as month,
                COUNT(*) as sales_count,
                COALESCE(SUM(s.total), 0) as total_revenue,
                COALESCE(SUM(sd.quantity), 0) as products_sold
            FROM sales s
            LEFT JOIN sales_detail sd ON s.id = sd.sale_id AND sd.quantity > 0
            {where_clause}
            GROUP BY SUBSTR(s.sale_date, 1, 7)
            ORDER BY month
        """

        result = db.execute_query(query, params)

        # Format results
        monthly_data = []
        for row in result:
            if isinstance(row, dict):
                month_str = row.get("month")
                if isinstance(month_str, str) and len(month_str) >= 7:
                    # month_str is in format YYYY-MM, add day to make it parseable
                    month_date = datetime.strptime(month_str + "-01", "%Y-%m-%d")
                else:
                    month_date = None

                monthly_data.append(
                    {
                        "month": month_date.strftime("%b %Y")
                        if month_date
                        else "Unknown",
                        "month_short": month_date.strftime("%b")
                        if month_date
                        else "Unknown",
                        "sales_count": row.get("sales_count", 0),
                        "total_revenue": float(row.get("total_revenue", 0)),
                        "products_sold": row.get("products_sold", 0),
                    }
                )
            else:
                month_str = row[0]
                if isinstance(month_str, str) and len(month_str) >= 7:
                    month_date = datetime.strptime(month_str + "-01", "%Y-%m-%d")
                else:
                    month_date = None

                monthly_data.append(
                    {
                        "month": month_date.strftime("%b %Y")
                        if month_date
                        else "Unknown",
                        "month_short": month_date.strftime("%b")
                        if month_date
                        else "Unknown",
                        "sales_count": row[1],
                        "total_revenue": float(row[2]),
                        "products_sold": row[3] or 0,
                    }
                )

        return jsonify({"status": "success", "data": monthly_data})

    except Exception as e:
        print(f"Error getting sales by month: {e}")
        import traceback

        traceback.print_exc()
        return jsonify(
            {
                "status": "error",
                "message": "Error interno del servidor",
                "error": str(e),
            }
        ), 500


@statistics_bp.route("/sales-by-category", methods=["GET"])
def get_sales_by_category():
    """
    Get sales data grouped by product categories (groups)
    """
    try:
        start_date, end_date, storage_id = get_date_range_from_params()
        db = Database()

        filters = ["s.status = %s"]
        params = ["Completada"]

        if storage_id:
            filters.append("s.storage_id = %s")
            params.append(storage_id)
        if start_date:
            filters.append("s.sale_date >= %s")
            params.append(start_date)
        if end_date:
            filters.append("s.sale_date <= %s")
            params.append(end_date)

        where_clause = f"WHERE {' AND '.join(filters)}"

        query = f"""
            SELECT 
                COALESCE(g.group_name, 'Sin Categoría') as category,
                COUNT(DISTINCT s.id) as sales_count,
                COALESCE(SUM(sd.quantity), 0) as products_sold,
                COALESCE(SUM(sd.total), 0) as total_revenue
            FROM sales s
            JOIN sales_detail sd ON s.id = sd.sale_id AND sd.quantity > 0
            LEFT JOIN products p ON sd.product_id = p.id
            LEFT JOIN groups g ON p.group_id = g.id
            {where_clause}
            GROUP BY g.group_name
            ORDER BY total_revenue DESC
        """

        result = db.execute_query(query, params)

        # Define colors for categories
        colors = [
            "#ff8c42",
            "#6366f1",
            "#06b6d4",
            "#10b981",
            "#f59e0b",
            "#ef4444",
            "#8b5cf6",
            "#0ea5e9",
            "#ec4899",
            "#84cc16",
            "#f97316",
            "#06b6d4",
        ]

        category_data = []
        for i, row in enumerate(result):
            if isinstance(row, dict):
                category_data.append(
                    {
                        "name": row.get("category", "Sin Categoría"),
                        "sales_count": row.get("sales_count", 0),
                        "products_sold": row.get("products_sold", 0),
                        "value": float(row.get("total_revenue", 0)),
                        "color": colors[i % len(colors)],
                    }
                )
            else:
                category_data.append(
                    {
                        "name": row[0] or "Sin Categoría",
                        "sales_count": row[1],
                        "products_sold": row[2],
                        "value": float(row[3]),
                        "color": colors[i % len(colors)],
                    }
                )

        return jsonify({"status": "success", "data": category_data})

    except Exception as e:
        print(f"Error getting sales by category: {e}")
        import traceback

        traceback.print_exc()
        return jsonify(
            {
                "status": "error",
                "message": "Error interno del servidor",
                "error": str(e),
            }
        ), 500


@statistics_bp.route("/top-products", methods=["GET"])
def get_top_products():
    """
    Get top selling products
    """
    try:
        start_date, end_date, storage_id = get_date_range_from_params()
        limit = request.args.get("limit", default=10, type=int)
        db = Database()

        filters = ["s.status = %s", "sd.quantity > 0"]
        params = ["Completada"]

        if storage_id:
            filters.append("s.storage_id = %s")
            params.append(storage_id)
        if start_date:
            filters.append("s.sale_date >= %s")
            params.append(start_date)
        if end_date:
            filters.append("s.sale_date <= %s")
            params.append(end_date)

        where_clause = f"WHERE {' AND '.join(filters)}"

        query = f"""
            SELECT 
                p.product_name,
                COALESCE(b.brand_name, 'Sin Marca') as brand_name,
                COALESCE(g.group_name, 'Sin Categoría') as group_name,
                SUM(sd.quantity) as total_quantity,
                COUNT(DISTINCT s.id) as times_sold,
                COALESCE(SUM(sd.total), 0) as total_revenue,
                COALESCE(AVG(sd.sale_price), 0) as avg_price
            FROM sales s
            JOIN sales_detail sd ON s.id = sd.sale_id
            LEFT JOIN products p ON sd.product_id = p.id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN groups g ON p.group_id = g.id
            {where_clause}
            GROUP BY p.id, p.product_name, b.brand_name, g.group_name
            ORDER BY total_quantity DESC
            LIMIT %s
        """

        params.append(limit)
        result = db.execute_query(query, params)

        top_products = []
        for row in result:
            if isinstance(row, dict):
                top_products.append(
                    {
                        "product_name": row.get("product_name", "Producto Desconocido"),
                        "brand_name": row.get("brand_name", "Sin Marca"),
                        "group_name": row.get("group_name", "Sin Categoría"),
                        "total_quantity": row.get("total_quantity", 0),
                        "times_sold": row.get("times_sold", 0),
                        "total_revenue": float(row.get("total_revenue", 0)),
                        "avg_price": float(row.get("avg_price", 0)),
                    }
                )
            else:
                top_products.append(
                    {
                        "product_name": row[0] or "Producto Desconocido",
                        "brand_name": row[1] or "Sin Marca",
                        "group_name": row[2] or "Sin Categoría",
                        "total_quantity": row[3],
                        "times_sold": row[4],
                        "total_revenue": float(row[5]),
                        "avg_price": float(row[6]),
                    }
                )

        return jsonify({"status": "success", "data": top_products})

    except Exception as e:
        print(f"Error getting top products: {e}")
        import traceback

        traceback.print_exc()
        return jsonify(
            {
                "status": "error",
                "message": "Error interno del servidor",
                "error": str(e),
            }
        ), 500


@statistics_bp.route("/sales-vs-purchases", methods=["GET"])
def get_sales_vs_purchases():
    """
    Compare sales vs purchases by month
    """
    try:
        storage_id = request.args.get("storage_id", type=int)
        db = Database()

        # Get last 12 months
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365)

        # Sales by month
        sales_filters = ["status = %s"]
        sales_params = ["Completada"]

        if storage_id:
            sales_filters.append("storage_id = %s")
            sales_params.append(storage_id)

        sales_filters.append("sale_date >= %s")
        sales_params.append(start_date.strftime("%Y-%m-%d"))

        sales_where = f"WHERE {' AND '.join(sales_filters)}"

        sales_query = f"""
            SELECT 
                SUBSTR(sale_date, 1, 7) as month,
                COALESCE(SUM(total), 0) as sales_revenue
            FROM sales
            {sales_where}
            GROUP BY SUBSTR(sale_date, 1, 7)
            ORDER BY month
        """

        sales_result = db.execute_query(sales_query, sales_params)

        # Purchases by month
        purchase_filters = ["purchase_date >= %s"]
        purchase_params = [start_date.strftime("%Y-%m-%d")]

        purchase_where = f"WHERE {' AND '.join(purchase_filters)}"

        purchase_query = f"""
            SELECT 
                DATE_TRUNC('month', purchase_date) as month,
                COALESCE(SUM(total), 0) as purchase_cost
            FROM purchases
            {purchase_where}
            GROUP BY DATE_TRUNC('month', purchase_date)
            ORDER BY month
        """

        purchase_result = db.execute_query(purchase_query, purchase_params)

        # Combine data
        monthly_comparison = {}

        # Process sales
        for row in sales_result:
            if isinstance(row, dict):
                month = row.get("month")
                if isinstance(month, str):
                    month = datetime.strptime(month + "-01", "%Y-%m-%d")
                month_key = month.strftime("%Y-%m")
                monthly_comparison[month_key] = {
                    "month": month.strftime("%b %Y"),
                    "month_short": month.strftime("%b"),
                    "sales": float(row.get("sales_revenue", 0)),
                    "purchases": 0,
                }
            else:
                month = row[0]
                if isinstance(month, str):
                    month = datetime.strptime(month + "-01", "%Y-%m-%d")
                month_key = month.strftime("%Y-%m")
                monthly_comparison[month_key] = {
                    "month": month.strftime("%b %Y"),
                    "month_short": month.strftime("%b"),
                    "sales": float(row[1]),
                    "purchases": 0,
                }

        # Process purchases
        for row in purchase_result:
            if isinstance(row, dict):
                month = row.get("month")
                if isinstance(month, str):
                    # Handle both YYYY-MM format and YYYY-MM-DD format
                    if len(month) == 7:  # YYYY-MM format
                        month = datetime.strptime(month + "-01", "%Y-%m-%d")
                    else:  # Full date format
                        month = datetime.strptime(month, "%Y-%m-%d")
                elif hasattr(month, "strftime"):
                    # Already a datetime object from TIMESTAMP field
                    pass
                else:
                    continue  # Skip invalid month data

                month_key = month.strftime("%Y-%m")
                if month_key in monthly_comparison:
                    monthly_comparison[month_key]["purchases"] = float(
                        row.get("purchase_cost", 0)
                    )
                else:
                    monthly_comparison[month_key] = {
                        "month": month.strftime("%b %Y"),
                        "month_short": month.strftime("%b"),
                        "sales": 0,
                        "purchases": float(row.get("purchase_cost", 0)),
                    }
            else:
                month = row[0]
                if isinstance(month, str):
                    # Handle both YYYY-MM format and YYYY-MM-DD format
                    if len(month) == 7:  # YYYY-MM format
                        month = datetime.strptime(month + "-01", "%Y-%m-%d")
                    else:  # Full date format
                        month = datetime.strptime(month, "%Y-%m-%d")
                elif hasattr(month, "strftime"):
                    # Already a datetime object from TIMESTAMP field
                    pass
                else:
                    continue  # Skip invalid month data

                month_key = month.strftime("%Y-%m")
                if month_key in monthly_comparison:
                    monthly_comparison[month_key]["purchases"] = float(row[1])
                else:
                    monthly_comparison[month_key] = {
                        "month": month.strftime("%b %Y"),
                        "month_short": month.strftime("%b"),
                        "sales": 0,
                        "purchases": float(row[1]),
                    }

        # Convert to list and sort
        comparison_data = list(monthly_comparison.values())
        comparison_data.sort(key=lambda x: datetime.strptime(x["month"], "%b %Y"))

        return jsonify({"status": "success", "data": comparison_data})

    except Exception as e:
        print(f"Error getting sales vs purchases: {e}")
        import traceback

        traceback.print_exc()
        return jsonify(
            {
                "status": "error",
                "message": "Error interno del servidor",
                "error": str(e),
            }
        ), 500


@statistics_bp.route("/profit-analysis", methods=["GET"])
def get_profit_analysis():
    """
    Get profit analysis comparing sales revenue vs product costs
    """
    try:
        start_date, end_date, storage_id = get_date_range_from_params()
        db = Database()

        filters = ["s.status = %s", "sd.quantity > 0"]
        params = ["Completada"]

        if storage_id:
            filters.append("s.storage_id = %s")
            params.append(storage_id)
        if start_date:
            filters.append("s.sale_date >= %s")
            params.append(start_date)
        if end_date:
            filters.append("s.sale_date <= %s")
            params.append(end_date)

        where_clause = f"WHERE {' AND '.join(filters)}"

        query = f"""
            SELECT 
                COALESCE(SUM(sd.total), 0) as total_revenue,
                COALESCE(SUM(sd.cost_price * sd.quantity), 0) as total_cost,
                COALESCE(SUM(sd.total) - SUM(sd.cost_price * sd.quantity), 0) as total_profit,
                COUNT(DISTINCT s.id) as total_sales,
                COALESCE(SUM(sd.quantity), 0) as total_units_sold
            FROM sales s
            JOIN sales_detail sd ON s.id = sd.sale_id
            {where_clause}
        """

        result = db.execute_query(query, params)

        if result:
            row = result[0]
            if isinstance(row, dict):
                total_revenue = float(row.get("total_revenue", 0))
                total_cost = float(row.get("total_cost", 0))
                total_profit = float(row.get("total_profit", 0))
                profit_data = {
                    "total_revenue": total_revenue,
                    "total_cost": total_cost,
                    "total_profit": total_profit,
                    "profit_margin": (total_profit / total_revenue * 100)
                    if total_revenue > 0
                    else 0,
                    "total_sales": row.get("total_sales", 0),
                    "total_units_sold": row.get("total_units_sold", 0),
                }
            else:
                total_revenue = float(row[0])
                total_cost = float(row[1])
                total_profit = float(row[2])
                profit_data = {
                    "total_revenue": total_revenue,
                    "total_cost": total_cost,
                    "total_profit": total_profit,
                    "profit_margin": (total_profit / total_revenue * 100)
                    if total_revenue > 0
                    else 0,
                    "total_sales": row[3],
                    "total_units_sold": row[4],
                }
        else:
            profit_data = {
                "total_revenue": 0,
                "total_cost": 0,
                "total_profit": 0,
                "profit_margin": 0,
                "total_sales": 0,
                "total_units_sold": 0,
            }

        return jsonify({"status": "success", "data": profit_data})

    except Exception as e:
        print(f"Error getting profit analysis: {e}")
        import traceback

        traceback.print_exc()
        return jsonify(
            {
                "status": "error",
                "message": "Error interno del servidor",
                "error": str(e),
            }
        ), 500


@statistics_bp.route("/purchases-by-month", methods=["GET"])
def get_purchases_by_month():
    """
    Get purchases data grouped by month for the last 12 months
    """
    try:
        db = Database()

        # Get last 12 months
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365)

        filters = []
        params = []

        filters.append("purchase_date >= %s")
        params.append(start_date.strftime("%Y-%m-%d"))

        where_clause = f"WHERE {' AND '.join(filters)}"

        query = f"""
            SELECT 
                DATE_TRUNC('month', p.purchase_date) as month,
                COUNT(*) as purchase_count,
                COALESCE(SUM(p.total), 0) as total_spent,
                COALESCE(SUM(pd.quantity), 0) as products_purchased
            FROM purchases p
            LEFT JOIN purchases_detail pd ON p.id = pd.purchase_id AND pd.quantity > 0
            {where_clause}
            GROUP BY DATE_TRUNC('month', p.purchase_date)
            ORDER BY month
        """

        result = db.execute_query(query, params)

        # Format results
        monthly_data = []
        for row in result:
            if isinstance(row, dict):
                month_date = row.get("month")
                if isinstance(month_date, str):
                    month_date = datetime.strptime(month_date, "%Y-%m-%d")

                monthly_data.append(
                    {
                        "month": month_date.strftime("%b %Y")
                        if month_date
                        else "Unknown",
                        "month_short": month_date.strftime("%b")
                        if month_date
                        else "Unknown",
                        "purchase_count": row.get("purchase_count", 0),
                        "total_spent": float(row.get("total_spent", 0)),
                        "products_purchased": row.get("products_purchased", 0),
                    }
                )
            else:
                month_date = row[0]
                if isinstance(month_date, str):
                    month_date = datetime.strptime(month_date, "%Y-%m-%d")

                monthly_data.append(
                    {
                        "month": month_date.strftime("%b %Y")
                        if month_date
                        else "Unknown",
                        "month_short": month_date.strftime("%b")
                        if month_date
                        else "Unknown",
                        "purchase_count": row[1] if len(row) > 1 else 0,
                        "total_spent": float(row[2]) if len(row) > 2 else 0,
                        "products_purchased": row[3] if len(row) > 3 else 0,
                    }
                )

        return jsonify({"status": "success", "data": monthly_data})

    except Exception as e:
        print(f"Error in get_purchases_by_month: {e}")
        import traceback

        traceback.print_exc()
        return jsonify(
            {
                "status": "error",
                "message": "Error interno del servidor",
                "error": str(e),
            }
        ), 500
