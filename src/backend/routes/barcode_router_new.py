from flask import Blueprint, jsonify, request
from services.barcode_service import BarcodeService
from barcode_generator import BarcodeGenerator

barcode_router = Blueprint("barcode", __name__)
barcode_service = BarcodeService()
barcode_generator = BarcodeGenerator()


@barcode_router.route("/gift-barcodes-images", methods=["POST"])
def gift_barcodes_images():
    """
    Devuelve imágenes base64 y textos de códigos de barras de regalos para imprimir desde el frontend.
    Body: {
        "sales_details": [
            { "sales_detail_id": 101, "quantity": 2 },
            { "sales_detail_id": 105, "quantity": 3 }
        ],
        "options": { ... }
    }
    Response: {
        "images": [
            { "png_base64": "...", "text_lines": [...], "sales_detail_id": 101, "quantity": 2 },
            ...
        ]
    }
    """
    try:
        data = request.get_json()
        sales_details = data.get("sales_details", [])
        options = data.get("options", {})
        if not sales_details or not isinstance(sales_details, list):
            return jsonify({"error": "sales_details debe ser un array no vacío"}), 400
        print_options = options or {}
        images = []

        for detail in sales_details:
            sales_detail_id = detail.get("sales_detail_id")
            quantity = detail.get("quantity", 1)
            if not sales_detail_id:
                continue

            from database.database import Database

            db = Database()
            query = """
                SELECT sd.id as sales_detail_id, sd.product_id, sd.variant_id, p.product_name, b.brand_name, p.sale_price,
                v.variant_barcode, s.size_name, c.color_name, c.color_hex
                FROM sales_detail sd
                LEFT JOIN products p ON sd.product_id = p.id
                LEFT JOIN brands b ON p.brand_id = b.id
                LEFT JOIN warehouse_stock_variants v ON sd.variant_id = v.id
                LEFT JOIN sizes s ON v.size_id = s.id
                LEFT JOIN colors c ON v.color_id = c.id
                WHERE sd.id = %s
            """
            result = db.execute_query(query, (sales_detail_id,))
            if not result:
                continue

            info = result[0]
            text_lines = []
            if print_options.get("includeProductName", True):
                text_lines.append(info.get("product_name", ""))
            if print_options.get("includeSize", True) and info.get("size_name"):
                text_lines.append(f"Talle: {info['size_name']}")
            if print_options.get("includeColor", True) and info.get("color_name"):
                text_lines.append(f"Color: {info['color_name']}")
            if print_options.get("includePrice", True) and info.get("sale_price"):
                text_lines.append(f"${float(info['sale_price']):.2f}")

            # Usar sales_detail_id como código de barras para poder rastrear la venta original
            barcode_code = (
                f"GIFT{str(sales_detail_id).zfill(8)}"  # GIFT + 8 dígitos del ID
            )

            if print_options.get("includeCode", True):
                text_lines.append(barcode_code)  # Mostrar el código de regalo

            # Generar PNG base64 (sin imprimir)
            png_base64 = barcode_service.generate_barcode_image(
                barcode_code, barcode_type="code128", format="PNG"
            )
            # Quitar el prefijo data:image/png;base64, si lo tiene
            if png_base64.startswith("data:image/png;base64,"):
                png_base64 = png_base64.split(",", 1)[1]

            images.append(
                {
                    "png_base64": png_base64,
                    "text_lines": text_lines,
                    "sales_detail_id": sales_detail_id,
                    "quantity": quantity,
                }
            )

        if not images:
            return jsonify(
                {"error": "No se pudieron generar imágenes de códigos de barras"}
            ), 400
        return jsonify({"images": images}), 200

    except Exception as e:
        return jsonify(
            {"error": f"Error generando imágenes de códigos de barras: {str(e)}"}
        ), 500


@barcode_router.route("/search-gift/<barcode>", methods=["GET"])
def search_gift_by_barcode(barcode):
    """
    Busca información de una venta por código de barras de regalo
    Para usar cuando se escanea un regalo para devolución
    Devuelve la información original de la venta para obtener el precio real pagado
    """
    try:
        # Validar formato del código de regalo
        if not barcode.startswith("GIFT") or len(barcode) != 12:
            return jsonify(
                {
                    "error": "Formato de código de regalo inválido. Debe ser GIFT + 8 dígitos"
                }
            ), 400

        # Extraer sales_detail_id del código
        sales_detail_id = int(barcode[4:])  # Quitar "GIFT" y convertir a int

        from database.database import Database

        db = Database()

        # Buscar información completa de la venta
        query = """
            SELECT 
                sd.id as sales_detail_id,
                sd.product_id,
                sd.variant_id,
                sd.quantity,
                sd.unit_price,
                sd.subtotal,
                p.product_name,
                b.brand_name,
                v.variant_barcode,
                s.size_name,
                c.color_name,
                c.color_hex,
                sale.id as sale_id,
                sale.sale_date,
                sale.total as sale_total,
                cust.name as customer_name,
                cust.dni as customer_dni
            FROM sales_detail sd
            LEFT JOIN products p ON sd.product_id = p.id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN warehouse_stock_variants v ON sd.variant_id = v.id
            LEFT JOIN sizes s ON v.size_id = s.id
            LEFT JOIN colors c ON v.color_id = c.id
            LEFT JOIN sales sale ON sd.sale_id = sale.id
            LEFT JOIN customers cust ON sale.customer_id = cust.id
            WHERE sd.id = %s
        """

        result = db.execute_query(query, (sales_detail_id,))

        if not result:
            return jsonify(
                {
                    "error": f"No se encontró información para el código de regalo {barcode}"
                }
            ), 404

        info = result[0]

        # Formatear respuesta
        gift_info = {
            "sales_detail_id": info["sales_detail_id"],
            "gift_barcode": barcode,
            "product": {
                "id": info["product_id"],
                "name": info["product_name"],
                "brand": info["brand_name"],
            },
            "variant": {
                "id": info["variant_id"],
                "barcode": info["variant_barcode"],
                "size_name": info["size_name"],
                "color_name": info["color_name"],
                "color_hex": info["color_hex"],
            },
            "sale_info": {
                "quantity": info["quantity"],
                "unit_price": float(info["unit_price"]),  # Precio real pagado
                "subtotal": float(info["subtotal"]),
                "sale_id": info["sale_id"],
                "sale_date": info["sale_date"].isoformat()
                if info["sale_date"]
                else None,
                "sale_total": float(info["sale_total"]) if info["sale_total"] else 0,
            },
            "customer": {"name": info["customer_name"], "dni": info["customer_dni"]}
            if info["customer_name"]
            else None,
        }

        return jsonify(
            {
                "success": True,
                "gift_info": gift_info,
                "message": f"Información encontrada para regalo comprado el {info['sale_date'].strftime('%d/%m/%Y') if info['sale_date'] else 'fecha desconocida'}",
            }
        )

    except ValueError:
        return jsonify(
            {"error": "Código de regalo inválido. No se pudo extraer el ID de venta"}
        ), 400
    except Exception as e:
        return jsonify(
            {"error": f"Error buscando información del regalo: {str(e)}"}
        ), 500


@barcode_router.route("/generate", methods=["POST"])
def generate_barcode():
    """
    Endpoint para generar códigos de barras
    Body: {
        "code": "123456789",
        "type": "code128", // opcional
        "format": "svg" // svg o image
    }
    """
    try:
        data = request.get_json()

        if not data or "code" not in data:
            return jsonify({"error": "Código requerido"}), 400

        code = data["code"]
        barcode_type = data.get("type", "code128")
        format_type = data.get("format", "svg")

        if format_type == "svg":
            svg_content = barcode_service.generate_barcode_svg(code, barcode_type)
            return jsonify(
                {"success": True, "barcode": svg_content, "format": "svg", "code": code}
            )
        else:
            image_base64 = barcode_service.generate_barcode_image(code, barcode_type)
            return jsonify(
                {
                    "success": True,
                    "barcode": image_base64,
                    "format": "image",
                    "code": code,
                }
            )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@barcode_router.route("/generate-variants", methods=["POST"])
def generate_variant_barcodes():
    """
    Genera códigos de barras para variantes específicas de un producto
    Body: {
        "product_id": 123,
        "variants": [
            {"size_id": 1, "color_id": 2},
            {"size_id": 1, "color_id": 3},
            {"size_id": 2, "color_id": 2}
        ]
    }
    """
    try:
        data = request.get_json()

        if not data or "product_id" not in data or "variants" not in data:
            return jsonify({"error": "product_id y variants requeridos"}), 400

        product_id = data["product_id"]
        variants = data["variants"]

        if not isinstance(variants, list) or len(variants) == 0:
            return jsonify({"error": "variants debe ser un array no vacío"}), 400

        # Generar códigos para todas las variantes
        variant_barcodes = barcode_service.generate_variant_barcodes_batch(
            product_id, variants
        )

        return jsonify(
            {
                "success": True,
                "product_id": product_id,
                "variants_count": len(variant_barcodes),
                "variant_barcodes": variant_barcodes,
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@barcode_router.route("/generate-variant", methods=["POST"])
def generate_single_variant_barcode():
    """
    Genera código de barras para una variante específica
    Body: {
        "product_id": 123,
        "size_id": 1,     // opcional
        "color_id": 2     // opcional
    }
    """
    try:
        data = request.get_json()

        if not data or "product_id" not in data:
            return jsonify({"error": "product_id requerido"}), 400

        product_id = data["product_id"]
        size_id = data.get("size_id")
        color_id = data.get("color_id")

        # Generar código único para la variante
        variant_barcode = barcode_service.generate_variant_barcode(
            product_id, size_id, color_id
        )

        # Generar SVG
        svg_content = barcode_service.generate_barcode_svg(variant_barcode)

        return jsonify(
            {
                "success": True,
                "product_id": product_id,
                "size_id": size_id,
                "color_id": color_id,
                "variant_barcode": variant_barcode,
                "barcode_svg": svg_content,
            }
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@barcode_router.route("/parse-variant/<barcode>", methods=["GET"])
def parse_variant_barcode(barcode):
    """
    Parsea un código de barras de variante para obtener los IDs
    """
    try:
        parsed_data = barcode_service.parse_variant_barcode(barcode)

        return jsonify({"success": True, "barcode": barcode, "parsed": parsed_data})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@barcode_router.route("/test", methods=["GET"])
def test_barcode():
    """
    Endpoint de prueba para verificar que todo funciona
    """
    try:
        test_code = "123456789012"
        svg_content = barcode_service.generate_barcode_svg(test_code)

        # También probar variantes
        test_variant_code = barcode_service.generate_variant_barcode(123, 1, 2)
        test_variant_svg = barcode_service.generate_barcode_svg(test_variant_code)

        return jsonify(
            {
                "success": True,
                "message": "Servicio de códigos de barras funcionando correctamente",
                "test_product_code": test_code,
                "product_barcode_svg": svg_content,
                "test_variant_code": test_variant_code,
                "variant_barcode_svg": test_variant_svg,
                "parsed_variant": barcode_service.parse_variant_barcode(
                    test_variant_code
                ),
            }
        )

    except Exception as e:
        return jsonify({"error": f"Error en test: {str(e)}"}), 500
