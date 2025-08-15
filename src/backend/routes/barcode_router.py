
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
        from barcode_generator import BarcodeGenerator
        data = request.get_json()
        sales_details = data.get("sales_details", [])
        options = data.get("options", {})
        if not sales_details or not isinstance(sales_details, list):
            return jsonify({"error": "sales_details debe ser un array no vacío"}), 400
        print_options = options or {}
        barcode_generator = BarcodeGenerator()
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
            if print_options.get("includeCode", True) and info.get("variant_barcode"):
                text_lines.append(info["variant_barcode"])
            barcode_code = info.get("variant_barcode") or str(sales_detail_id)
            if len(barcode_code) < 12:
                barcode_code = barcode_code.zfill(12)
            elif len(barcode_code) > 13:
                barcode_code = barcode_code[:13]
            # Generar PNG base64 (sin imprimir)
            png_base64 = barcode_generator.generate_barcode_image(barcode_code, barcode_type="code128", format="PNG")
            # Quitar el prefijo data:image/png;base64, si lo tiene
            if png_base64.startswith("data:image/png;base64,"):
                png_base64 = png_base64.split(",", 1)[1]
            images.append({
                "png_base64": png_base64,
                "text_lines": text_lines,
                "sales_detail_id": sales_detail_id,
                "quantity": quantity
            })
        if not images:
            return jsonify({"error": "No se pudieron generar imágenes de códigos de barras"}), 400
        return jsonify({"images": images}), 200
    except Exception as e:
        return jsonify({"error": f"Error generando imágenes de códigos de barras: {str(e)}"}), 500

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


@barcode_router.route("/generate-gift-barcode", methods=["POST"])
def generate_gift_barcode():
    """
    Imprime códigos de barras para regalos, recibiendo un array de sales_details y opciones de impresión.
    Body: {
        "sales_details": [
            { "sales_detail_id": 101, "quantity": 2 },
            { "sales_detail_id": 105, "quantity": 3 }
        ],
        "options": { ... }
    }
    """
    try:
        import os, sys, importlib.util
        from barcode_generator import BarcodeGenerator

        data = request.get_json()
        sales_details = data.get("sales_details", [])
        options = data.get("options", {})

        if not sales_details or not isinstance(sales_details, list):
            return jsonify({"error": "sales_details debe ser un array no vacío"}), 400

        # Opciones de impresión
        print_options = options or {}

        # Instanciar generador
        barcode_generator = BarcodeGenerator()
        all_generated_files = []
        total_labels = 0

        # Para cada sales_detail, obtener info y preparar impresión
        for detail in sales_details:
            sales_detail_id = detail.get("sales_detail_id")
            quantity = detail.get("quantity", 1)
            if not sales_detail_id:
                continue

            # Buscar info del detalle de venta (ejemplo: producto, variante, etc)
            # Aquí deberías ajustar según tu modelo de datos
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

            # Construir texto para el código de barras según las opciones
            text_lines = []
            if print_options.get("includeProductName", True):
                text_lines.append(info.get("product_name", ""))
            if print_options.get("includeSize", True) and info.get("size_name"):
                text_lines.append(f"Talle: {info['size_name']}")
            if print_options.get("includeColor", True) and info.get("color_name"):
                text_lines.append(f"Color: {info['color_name']}")
            if print_options.get("includePrice", True) and info.get("sale_price"):
                text_lines.append(f"${float(info['sale_price']):.2f}")
            if print_options.get("includeCode", True) and info.get("variant_barcode"):
                text_lines.append(info["variant_barcode"])

            # Generar código de barras (usar variant_barcode o sales_detail_id como fallback)
            barcode_code = info.get("variant_barcode") or str(sales_detail_id)
            # Asegurar que sea de 12 dígitos para EAN13
            if len(barcode_code) < 12:
                barcode_code = barcode_code.zfill(12)
            elif len(barcode_code) > 13:
                barcode_code = barcode_code[:13]

            print_job = {
                "barcode": barcode_code,
                "text": text_lines,
                "quantity": quantity,
            }
            all_generated_files.extend(
                barcode_generator.generate_barcode_with_text(
                    barcode_code,
                    {
                        "name": info.get("product_name", ""),
                        "barcode": barcode_code,
                        "original_barcode": info.get("variant_barcode"),
                        "price": info.get("sale_price"),
                        "size_name": info.get("size_name"),
                        "color_name": info.get("color_name"),
                    },
                    print_options,
                    quantity,
                )
            )
            total_labels += quantity

        if not all_generated_files:
            return jsonify(
                {"error": "No se pudieron generar códigos de barras de regalos"}
            ), 400

        # Imprimir todos los archivos
        print_result = barcode_generator.print_barcodes(all_generated_files)
        barcode_generator.cleanup_files(all_generated_files)

        if print_result.get("status") == "success":
            return jsonify(
                {
                    "status": "success",
                    "message": f"Se imprimieron {print_result['printed_count']} códigos de barras de regalos exitosamente",
                    "data": {
                        "total_details": len(sales_details),
                        "total_labels": total_labels,
                        "printed_count": print_result["printed_count"],
                    },
                }
            ), 200
        else:
            return jsonify(
                {
                    "status": "error",
                    "message": f"Error en impresión: {print_result.get('message', 'desconocido')}",
                }
            ), 500

    except Exception as e:
        return jsonify(
            {
                "error": f"Error generando/imprimiendo códigos de barras de regalos: {str(e)}"
            }
        ), 500


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
