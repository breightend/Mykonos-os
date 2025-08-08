from database.database import Database

try:
    db = Database()
    print("🔍 GETTING REAL BARCODES FROM DATABASE")
    print("=" * 50)

    # Get some real barcodes for testing
    query = """
    SELECT 
        wsv.variant_barcode,
        p.product_name,
        p.sale_price,
        wsv.quantity as stock,
        wsv.branch_id
    FROM warehouse_stock_variants wsv
    JOIN products p ON wsv.product_id = p.id
    WHERE wsv.quantity > 0 
    LIMIT 10
    """

    results = db.execute_query(query)
    if results:
        for i, product in enumerate(results):
            print(
                f"{i + 1:2d}. {product['variant_barcode']} - {product['product_name']} - ${product['sale_price']} (Stock: {product['stock']})"
            )
    else:
        print("❌ No products found in database")

except Exception as e:
    print(f"❌ Error: {e}")
