from flask import Blueprint, jsonify, request
from services.barcode_service import BarcodeService
from barcode_generator import BarcodeGenerator

barcode_router = Blueprint("barcode", __name__)
barcode_service = BarcodeService()
barcode_generator = BarcodeGenerator()


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


@barcode_router.route("/print", methods=["POST"])
def print_barcodes():
    """
    Endpoint para generar e imprimir códigos de barras con texto personalizado
    Body: {
        "variants": [
            {
                "barcode": "1234567890123",
                "product_info": {
                    "name": "Nombre del Producto",
                    "brand": "Marca",
                    "size_name": "M",
                    "color_name": "Rojo",
                    "price": 25.99
                },
                "quantity": 2
            }
        ],
        "print_options": {
            "includeProductName": true,
            "includeSize": true,
            "includeColor": true,
            "includePrice": true,
            "includeCode": true
        }
    }
    """
    try:
        data = request.get_json()

        if not data or "variants" not in data:
            return jsonify({"error": "variants es requerido"}), 400

        variants = data["variants"]
        print_options = data.get("print_options", {})

        if not isinstance(variants, list) or len(variants) == 0:
            return jsonify({"error": "variants debe ser una lista no vacía"}), 400

        all_generated_files = []
        total_printed = 0

        # Generar códigos de barras para cada variante
        for variant in variants:
            barcode_data = variant.get("barcode")
            product_info = variant.get("product_info", {})
            quantity = variant.get("quantity", 1)

            if not barcode_data:
                continue

            # Validar que el código de barras tenga el formato correcto para EAN13
            if len(barcode_data) < 13:
                # Rellenar con ceros a la izquierda hasta 13 dígitos
                barcode_data = barcode_data.zfill(13)
            elif len(barcode_data) > 13:
                # Truncar a 13 dígitos
                barcode_data = barcode_data[:13]

            # Generar imágenes con texto
            generated_files = barcode_generator.generate_barcode_with_text(
                barcode_data=barcode_data,
                product_info=product_info,
                print_options=print_options,
                quantity=quantity,
            )

            all_generated_files.extend(generated_files)
            total_printed += len(generated_files)

        if not all_generated_files:
            return jsonify({"error": "No se pudieron generar códigos de barras"}), 400

        # Imprimir todos los códigos generados
        print_result = barcode_generator.print_barcodes(all_generated_files)

        # Limpiar archivos temporales después de un breve retraso
        # (en una implementación real, podrías usar una tarea en segundo plano)
        import threading
        import time

        def cleanup_after_delay():
            time.sleep(10)  # Esperar 10 segundos antes de limpiar
            barcode_generator.cleanup_files(all_generated_files)

        cleanup_thread = threading.Thread(target=cleanup_after_delay)
        cleanup_thread.daemon = True
        cleanup_thread.start()

        return jsonify(
            {
                "status": "success",
                "message": f"Códigos de barras enviados a impresión",
                "total_variants": len(variants),
                "total_printed": total_printed,
                "print_result": print_result,
            }
        )

    except Exception as e:
        # Limpiar archivos en caso de error
        if "all_generated_files" in locals():
            barcode_generator.cleanup_files(all_generated_files)

        return jsonify({"error": f"Error al imprimir códigos de barras: {str(e)}"}), 500
