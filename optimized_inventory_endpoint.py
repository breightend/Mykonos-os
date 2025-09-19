"""
Optimized Inventory Endpoint
This replaces the N+1 query problem with a single optimized query
"""


@inventory_router.route("/variants-by-storage/<int:storage_id>", methods=["GET"])
def get_variants_by_storage(storage_id):
    """
    Get all product variants with stock for a specific storage in a single optimized query.
    This replaces the N+1 query problem in the frontend.
    """
    try:
        db = Database()

        # Single optimized query that gets all the data needed for moveInventory component
        query = """
        SELECT 
            wsv.id as variant_id,
            p.id as product_id,
            p.product_name,
            b.brand_name,
            s.size_name,
            c.color_name,
            c.color_hex,
            wsv.variant_barcode,
            wsv.quantity as available_stock,
            wsv.size_id,
            wsv.color_id,
            st.name as sucursal_nombre,
            st.id as sucursal_id
        FROM warehouse_stock_variants wsv
        INNER JOIN products p ON wsv.product_id = p.id
        INNER JOIN storage st ON wsv.branch_id = st.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN sizes s ON wsv.size_id = s.id
        LEFT JOIN colors c ON wsv.color_id = c.id
        WHERE wsv.branch_id = %s 
          AND wsv.quantity > 0
          AND wsv.variant_barcode IS NOT NULL
          AND wsv.variant_barcode != ''
        ORDER BY p.product_name, s.size_name, c.color_name
        """

        variants = db.execute_query(query, (storage_id,))

        if not variants:
            return jsonify({"status": "success", "data": []}), 200

        # Process results
        processed_variants = []
        for variant in variants:
            if isinstance(variant, dict):
                variant_item = {
                    "variant_id": variant.get("variant_id"),
                    "product_id": variant.get("product_id"),
                    "product_name": variant.get("product_name"),
                    "brand_name": variant.get("brand_name"),
                    "size_name": variant.get("size_name"),
                    "color_name": variant.get("color_name"),
                    "color_hex": variant.get("color_hex"),
                    "variant_barcode": variant.get("variant_barcode"),
                    "available_stock": variant.get("available_stock"),
                    "size_id": variant.get("size_id"),
                    "color_id": variant.get("color_id"),
                    "sucursal_nombre": variant.get("sucursal_nombre"),
                    "sucursal_id": variant.get("sucursal_id"),
                }
            else:
                variant_item = {
                    "variant_id": variant[0],
                    "product_id": variant[1],
                    "product_name": variant[2],
                    "brand_name": variant[3],
                    "size_name": variant[4],
                    "color_name": variant[5],
                    "color_hex": variant[6],
                    "variant_barcode": variant[7],
                    "available_stock": variant[8],
                    "size_id": variant[9],
                    "color_id": variant[10],
                    "sucursal_nombre": variant[11],
                    "sucursal_id": variant[12],
                }
            processed_variants.append(variant_item)

        return jsonify(
            {
                "status": "success",
                "data": processed_variants,
                "count": len(processed_variants),
            }
        ), 200

    except Exception as e:
        print(f"❌ Error in get_variants_by_storage: {e}")
        import traceback

        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500
