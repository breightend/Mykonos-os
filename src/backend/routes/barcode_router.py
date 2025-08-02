from flask import Blueprint, jsonify, request
from services.barcode_service import BarcodeService

barcode_router = Blueprint("barcode", __name__)
barcode_service = BarcodeService()


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
            return jsonify({"error": "product_id y variants son requeridos"}), 400

        product_id = data["product_id"]
        variants = data["variants"]

        if not isinstance(variants, list) or len(variants) == 0:
            return jsonify({"error": "variants debe ser una lista no vacía"}), 400

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
            return jsonify({"error": "product_id es requerido"}), 400

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
