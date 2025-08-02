from barcode import Code128, EAN13, UPCA
from barcode.writer import SVGWriter, ImageWriter
from io import BytesIO
import base64


class BarcodeService:
    def __init__(self):
        self.barcode_types = {"code128": Code128, "ean13": EAN13, "upca": UPCA}

    def generate_barcode_svg(self, code, barcode_type="code128"):
        """
        Genera un código de barras en formato SVG
        Args:
            code (str): El código a generar
            barcode_type (str): Tipo de código de barras
        Returns:
            str: SVG como string
        """
        try:
            barcode_class = self.barcode_types.get(barcode_type, Code128)

            # Crear el código de barras con writer SVG
            barcode_instance = barcode_class(code, writer=SVGWriter())

            # Generar SVG en memoria
            buffer = BytesIO()
            barcode_instance.write(buffer)

            # Obtener el contenido SVG
            svg_content = buffer.getvalue().decode("utf-8")
            buffer.close()

            return svg_content

        except Exception as e:
            raise Exception(f"Error generando código de barras SVG: {str(e)}")

    def generate_barcode_image(self, code, barcode_type="code128", format="PNG"):
        """
        Genera un código de barras en formato imagen (PNG/JPEG)
        Args:
            code (str): El código a generar
            barcode_type (str): Tipo de código de barras
            format (str): Formato de imagen
        Returns:
            str: Imagen en base64
        """
        try:
            barcode_class = self.barcode_types.get(barcode_type, Code128)

            # Crear el código de barras con writer de imagen
            barcode_instance = barcode_class(code, writer=ImageWriter())

            # Generar imagen en memoria
            buffer = BytesIO()
            barcode_instance.write(buffer, {"format": format})

            # Convertir a base64 para enviar al frontend
            buffer.seek(0)
            image_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
            buffer.close()

            return f"data:image/{format.lower()};base64,{image_base64}"

        except Exception as e:
            raise Exception(f"Error generando código de barras imagen: {str(e)}")

    def generate_variant_barcode(
        self, product_id, size_id=None, color_id=None, prefix="VAR"
    ):
        """
        Genera un código único para una variante específica (talle + color)
        Args:
            product_id (int): ID del producto
            size_id (int, optional): ID del talle
            color_id (int, optional): ID del color
            prefix (str): Prefijo para el código
        Returns:
            str: Código único para la variante
        """
        # Formato: PREFIX + PRODUCT_ID(4) + SIZE_ID(3) + COLOR_ID(3) = 13 dígitos total
        size_part = str(size_id).zfill(3) if size_id else "000"
        color_part = str(color_id).zfill(3) if color_id else "000"
        product_part = str(product_id).zfill(4)

        return f"{prefix}{product_part}{size_part}{color_part}"

    def parse_variant_barcode(self, barcode):
        """
        Parsea un código de barras de variante para extraer los IDs
        Args:
            barcode (str): Código de barras a parsear
        Returns:
            dict: Diccionario con product_id, size_id, color_id
        """
        try:
            if not barcode.startswith("VAR") or len(barcode) != 13:
                raise ValueError("Formato de código de barras de variante inválido")

            # Extraer partes del código
            code_part = barcode[3:]  # Remover prefijo "VAR"
            product_id = int(code_part[:4])
            size_id = int(code_part[4:7]) if code_part[4:7] != "000" else None
            color_id = int(code_part[7:10]) if code_part[7:10] != "000" else None

            return {"product_id": product_id, "size_id": size_id, "color_id": color_id}
        except Exception as e:
            raise Exception(f"Error parseando código de barras: {str(e)}")

    def generate_variant_barcodes_batch(self, product_id, variants):
        """
        Genera códigos de barras para múltiples variantes de un producto
        Args:
            product_id (int): ID del producto
            variants (list): Lista de diccionarios con size_id y color_id
        Returns:
            list: Lista de diccionarios con la variante y su código de barras
        """
        result = []
        for variant in variants:
            size_id = variant.get("size_id")
            color_id = variant.get("color_id")

            barcode = self.generate_variant_barcode(product_id, size_id, color_id)
            svg_content = self.generate_barcode_svg(barcode)

            result.append(
                {
                    "product_id": product_id,
                    "size_id": size_id,
                    "color_id": color_id,
                    "barcode": barcode,
                    "barcode_svg": svg_content,
                }
            )

        return result
