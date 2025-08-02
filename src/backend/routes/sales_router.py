from flask import Blueprint, request, jsonify
from database.database import Database

sales_router = Blueprint("sales_router", __name__)


@sales_router.route("/product-by-variant-barcode/<variant_barcode>", methods=["GET"])
def get_product_by_variant_barcode(variant_barcode):
    """
    Busca un producto por su código de barras de variante
    Retorna toda la información necesaria para ventas incluyendo talle, color y stock
    """
    try:
        print(
            f"🔍 DEBUG sales: Buscando producto por variant_barcode: {variant_barcode}"
        )

        db = Database()

        # Consulta para obtener información completa del producto por variant_barcode
        query = """
        SELECT 
            p.id as product_id,
            p.product_name,
            p.description,
            p.sale_price,
            b.brand_name,
            g.group_name,
            s.size_name,
            c.color_name,
            c.color_hex,
            st.name as sucursal_nombre,
            st.id as sucursal_id,
            wsv.quantity as stock_disponible,
            wsv.id as variant_id,
            wsv.size_id,
            wsv.color_id,
            wsv.variant_barcode,
            p.tax,
            p.discount
        FROM warehouse_stock_variants wsv
        JOIN products p ON wsv.product_id = p.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN groups g ON p.group_id = g.id
        LEFT JOIN sizes s ON wsv.size_id = s.id
        LEFT JOIN colors c ON wsv.color_id = c.id
        JOIN storage st ON wsv.branch_id = st.id
        WHERE wsv.variant_barcode = ?
        AND wsv.quantity > 0
        """

        result = db.execute_query(query, (variant_barcode,))
        print(f"🔍 DEBUG sales: Resultado query: {result}")

        if not result:
            return jsonify(
                {
                    "status": "error",
                    "message": "Producto no encontrado o sin stock disponible",
                    "error_code": "PRODUCT_NOT_FOUND",
                }
            ), 404

        # Tomar el primer resultado (debería ser único por variant_barcode)
        product_data = result[0]

        # Formatear respuesta
        if isinstance(product_data, dict):
            product_info = {
                "product_id": product_data.get("product_id"),
                "product_name": product_data.get("product_name"),
                "description": product_data.get("description"),
                "sale_price": product_data.get("sale_price"),
                "brand_name": product_data.get("brand_name"),
                "group_name": product_data.get("group_name"),
                "size_name": product_data.get("size_name"),
                "color_name": product_data.get("color_name"),
                "color_hex": product_data.get("color_hex"),
                "sucursal_nombre": product_data.get("sucursal_nombre"),
                "sucursal_id": product_data.get("sucursal_id"),
                "stock_disponible": product_data.get("stock_disponible"),
                "variant_id": product_data.get("variant_id"),
                "size_id": product_data.get("size_id"),
                "color_id": product_data.get("color_id"),
                "variant_barcode": product_data.get("variant_barcode"),
                "tax": product_data.get("tax", 0),
                "discount": product_data.get("discount", 0),
            }
        else:
            product_info = {
                "product_id": product_data[0],
                "product_name": product_data[1],
                "description": product_data[2],
                "sale_price": product_data[3],
                "brand_name": product_data[4],
                "group_name": product_data[5],
                "size_name": product_data[6],
                "color_name": product_data[7],
                "color_hex": product_data[8],
                "sucursal_nombre": product_data[9],
                "sucursal_id": product_data[10],
                "stock_disponible": product_data[11],
                "variant_id": product_data[12],
                "size_id": product_data[13],
                "color_id": product_data[14],
                "variant_barcode": product_data[15],
                "tax": product_data[16] or 0,
                "discount": product_data[17] or 0,
            }

        print(
            f"✅ DEBUG sales: Producto encontrado: {product_info['product_name']} - {product_info['size_name']} - {product_info['color_name']}"
        )

        return jsonify({"status": "success", "data": product_info})

    except Exception as e:
        print(f"❌ ERROR sales: {str(e)}")
        import traceback

        traceback.print_exc()
        return jsonify(
            {
                "status": "error",
                "message": "Error interno del servidor",
                "error": str(e),
            }
        ), 500


@sales_router.route("/variant-stock", methods=["GET"])
def check_variant_stock():
    """
    Verifica el stock disponible de una variante específica
    """
    try:
        product_id = request.args.get("product_id")
        size_id = request.args.get("size_id")
        color_id = request.args.get("color_id")
        branch_id = request.args.get("branch_id")

        if not all([product_id, size_id, color_id, branch_id]):
            return jsonify(
                {"status": "error", "message": "Faltan parámetros requeridos"}
            ), 400

        db = Database()

        query = """
        SELECT quantity, variant_barcode
        FROM warehouse_stock_variants
        WHERE product_id = ? AND size_id = ? AND color_id = ? AND branch_id = ?
        """

        result = db.execute_query(query, (product_id, size_id, color_id, branch_id))

        if not result:
            return jsonify(
                {
                    "status": "success",
                    "data": {"stock_disponible": 0, "variant_barcode": None},
                }
            )

        stock_data = result[0]
        if isinstance(stock_data, dict):
            stock_info = {
                "stock_disponible": stock_data.get("quantity", 0),
                "variant_barcode": stock_data.get("variant_barcode"),
            }
        else:
            stock_info = {
                "stock_disponible": stock_data[0] if stock_data[0] else 0,
                "variant_barcode": stock_data[1],
            }

        return jsonify({"status": "success", "data": stock_info})

    except Exception as e:
        print(f"❌ ERROR checking variant stock: {str(e)}")
        return jsonify(
            {
                "status": "error",
                "message": "Error interno del servidor",
                "error": str(e),
            }
        ), 500
