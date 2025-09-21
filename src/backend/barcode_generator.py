"""
Sistema de generación e impresión de códigos de barras
Genera imágenes PNG con códigos de barras y texto personalizado
"""

import barcode
from barcode.writer import ImageWriter
from PIL import Image, ImageDraw, ImageFont
import tempfile
import os
import subprocess
from typing import Dict, List
import platform


class BarcodeGenerator:
    def __init__(self):
        self.temp_dir = tempfile.gettempdir()
        self.default_font_size = 24
        self.small_font_size = 18

    def generate_barcode_with_text(
        self,
        barcode_data: str,
        product_info: Dict,
        print_options: Dict,
        quantity: int = 1,
    ) -> List[str]:
        """
        Genera códigos de barras con texto personalizado

        Args:
            barcode_data: Código de barras (EAN13, etc.)
            product_info: Información del producto
            print_options: Opciones de qué texto incluir
            quantity: Cantidad de códigos a generar

        Returns:
            Lista de rutas de archivos temporales generados
        """
        generated_files = []

        try:
            # Configurar el generador de código de barras
            EAN = barcode.get_barcode_class("ean13")

            for i in range(quantity):
                # Asegurar que el código de barras sea numérico para EAN13
                clean_barcode_data = barcode_data

                # Si contiene letras o caracteres no numéricos, convertir a numérico
                if not barcode_data.isdigit():
                    import hashlib

                    # Crear un hash numérico del código original
                    hash_obj = hashlib.md5(barcode_data.encode())
                    hex_hash = hash_obj.hexdigest()[:8]
                    clean_barcode_data = str(int(hex_hash, 16))[:12]
                    print(
                        f"🔄 Código '{barcode_data}' convertido a '{clean_barcode_data}' para EAN13"
                    )

                # EAN13 necesita exactamente 12 dígitos (el 13º es calculado automáticamente)
                if len(clean_barcode_data) < 12:
                    clean_barcode_data = clean_barcode_data.ljust(12, "0")
                elif len(clean_barcode_data) > 12:
                    clean_barcode_data = clean_barcode_data[:12]

                # Generar el código de barras base (sin texto automático)
                barcode_instance = EAN(clean_barcode_data, writer=ImageWriter())

                # Configurar opciones para imagen limpia
                options = {
                    "module_width": 0.4,
                    "module_height": 15.0,
                    "font_size": 0,  # Sin texto automático
                    "text_distance": 0,
                    "background": "white",
                    "foreground": "black",
                    "write_text": False,  # No escribir texto automáticamente
                    "quiet_zone": 6.5,
                }

                # Crear archivo temporal para el código de barras
                with tempfile.NamedTemporaryFile(
                    suffix=".png", delete=False
                ) as tmp_barcode:
                    barcode_instance.write(tmp_barcode, options=options)
                    barcode_path = tmp_barcode.name

                # Abrir la imagen del código de barras
                barcode_img = Image.open(barcode_path)

                # Crear una imagen más grande para incluir texto
                final_img = self._add_text_to_barcode(
                    barcode_img, product_info, print_options
                )

                # Guardar la imagen final
                final_path = tempfile.mktemp(suffix=f"_barcode_final_{i + 1}.png")
                final_img.save(final_path, "PNG", dpi=(300, 300))

                generated_files.append(final_path)

                # Limpiar archivo temporal del código de barras base
                os.unlink(barcode_path)

        except Exception as e:
            # Limpiar archivos en caso de error
            for file_path in generated_files:
                if os.path.exists(file_path):
                    os.unlink(file_path)
            raise Exception(f"Error generando códigos de barras: {str(e)}")

        return generated_files

    def _add_text_to_barcode(
        self, barcode_img: Image.Image, product_info: Dict, print_options: Dict
    ) -> Image.Image:
        """
        Añade texto personalizado a la imagen del código de barras con mejor espaciado
        """
        # Obtener dimensiones del código de barras
        barcode_width, barcode_height = barcode_img.size

        # Calcular textos a mostrar
        text_lines = self._build_text_lines(product_info, print_options)

        # Configuración mejorada del espaciado
        line_height = 28  # Más espacio entre líneas
        padding_top = 30  # Más espacio arriba del código de barras
        padding_bottom = 20  # Espacio al final
        text_spacing = 35  # Más espacio entre código de barras y texto

        # Calcular altura necesaria para el texto
        text_height = len(text_lines) * line_height + text_spacing + padding_bottom

        # Crear imagen final más grande con mejor proporción
        final_width = max(barcode_width + 60, 450)  # Más ancho para mejor legibilidad
        final_height = barcode_height + text_height + padding_top

        final_img = Image.new("RGB", (final_width, final_height), "white")

        # Pegar el código de barras centrado con más espacio superior
        barcode_x = (final_width - barcode_width) // 2
        final_img.paste(barcode_img, (barcode_x, padding_top))

        # Añadir texto con mejor espaciado
        draw = ImageDraw.Draw(final_img)

        try:
            # Intentar cargar fuente del sistema con tamaños mejorados
            if platform.system() == "Windows":
                font_path = "C:/Windows/Fonts/arial.ttf"
            else:
                font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

            # Fuentes con mejor tamaño para legibilidad
            title_font = ImageFont.truetype(font_path, 26)  # Más grande para título
            normal_font = ImageFont.truetype(
                font_path, 22
            )  # Más grande para texto normal
            small_font = ImageFont.truetype(font_path, 18)  # Más grande para detalles

        except Exception:
            # Usar fuente por defecto si no se encuentra la fuente del sistema
            title_font = ImageFont.load_default()
            normal_font = ImageFont.load_default()
            small_font = ImageFont.load_default()

        # Dibujar cada línea de texto con mejor posicionamiento
        text_y = (
            barcode_height + padding_top + text_spacing
        )  # Comenzar después del código con espacio

        for i, line in enumerate(text_lines):
            # Seleccionar fuente según el tipo de línea
            if i == 0:  # Primera línea (nombre del producto)
                current_font = title_font
                text_color = "black"
            elif "Precio:" in line or "$" in line:  # Líneas de precio
                current_font = normal_font
                text_color = "#1565C0"  # Azul para precio
            elif "Talle:" in line or "Color:" in line:  # Info de variante
                current_font = normal_font
                text_color = "#424242"  # Gris oscuro
            elif "Código:" in line:  # Código alfanumérico
                current_font = small_font
                text_color = "#666666"  # Gris medio
            else:
                current_font = normal_font
                text_color = "black"

            # Calcular posición centrada para el texto
            text_bbox = draw.textbbox((0, 0), line, font=current_font)
            text_width = text_bbox[2] - text_bbox[0]
            text_x = (final_width - text_width) // 2

            # Dibujar texto con sombra sutil para mejor legibilidad
            # Sombra
            draw.text((text_x + 1, text_y + 1), line, fill="#E0E0E0", font=current_font)
            # Texto principal
            draw.text((text_x, text_y), line, fill=text_color, font=current_font)

            text_y += line_height

        return final_img

    def _build_text_lines(self, product_info: Dict, print_options: Dict) -> List[str]:
        """
        Construye las líneas de texto según las opciones seleccionadas
        """
        lines = []

        # Nombre del producto (siempre se muestra si está habilitado)
        if print_options.get("includeProductName", True) and product_info.get("name"):
            lines.append(product_info["name"])

        # Talle
        if print_options.get("includeSize", True) and product_info.get("size_name"):
            lines.append(f"Talle: {product_info['size_name']}")

        # Color
        if print_options.get("includeColor", True) and product_info.get("color_name"):
            lines.append(f"Color: {product_info['color_name']}")

        # Precio
        if print_options.get("includePrice", True) and product_info.get("price"):
            try:
                # Convertir a float si es string
                price_value = float(product_info["price"])
                lines.append(f"Precio: ${price_value:,.2f}")
            except (ValueError, TypeError):
                # Si no se puede convertir, mostrar como string
                lines.append(f"Precio: ${product_info['price']}")

        # Código
        if print_options.get("includeCode", True) and product_info.get("barcode"):
            original_barcode = product_info.get(
                "original_barcode", product_info["barcode"]
            )
            if original_barcode != product_info["barcode"]:
                # Mostrar código original si es diferente al numérico
                lines.append(f"Código: {original_barcode}")
            else:
                lines.append(f"Código: {product_info['barcode']}")

        return lines

    def print_barcodes(self, file_data: List) -> Dict:
        """
        Imprime los archivos de códigos de barras
        file_data puede ser una lista de strings (rutas) o una lista de dicts con file_path y quantity
        """
        try:
            printed_count = 0

            # Normalizar los datos - convertir a formato uniforme
            normalized_files = []
            if file_data and isinstance(file_data[0], str):
                # Formato antiguo: lista de rutas
                normalized_files = [
                    {"file_path": path, "quantity": 1, "variant_id": None}
                    for path in file_data
                ]
            else:
                # Formato nuevo: lista de dicts con file_path, quantity, variant_id
                normalized_files = file_data

            total_variants = len(normalized_files)
            total_labels = sum(item["quantity"] for item in normalized_files)

            print(
                f"🖨️ Iniciando impresión de {total_variants} variantes ({total_labels} etiquetas total)"
            )

            if total_variants == 0:
                return {"status": "error", "message": "No hay archivos para imprimir"}

            # Para Windows, imprimir cada archivo individualmente con su cantidad
            if platform.system() == "Windows":
                for i, file_info in enumerate(normalized_files, 1):
                    file_path = file_info["file_path"]
                    quantity = file_info["quantity"]
                    variant_id = file_info.get("variant_id", "desconocida")

                    if os.path.exists(file_path):
                        print(
                            f"📄 Imprimiendo variante {variant_id}: {quantity} copias"
                        )
                        print(f"    Archivo: {os.path.basename(file_path)}")

                        try:
                            # Método preferido: usar os.startfile que es más confiable en Windows
                            print(f"🖨️ Abriendo diálogo de impresión para: {file_path}")
                            os.startfile(file_path, "print")
                            printed_count += 1
                            print(
                                f"✅ Diálogo de impresión abierto para variante {variant_id}"
                            )
                            print(
                                "   👤 Usuario debe especificar cantidad en el diálogo de Windows"
                            )

                        except Exception as e:
                            print(f"❌ Error abriendo diálogo de impresión: {e}")
                            print(
                                "   Verifica que el archivo PNG se pueda abrir y que tengas una impresora configurada"
                            )

                        # Pausa entre diálogos de impresión para evitar saturación
                        if i < total_variants:  # No pausar después del último
                            import time

                            time.sleep(
                                2
                            )  # Pausa para que el usuario pueda manejar cada diálogo

                    else:
                        print(f"❌ Archivo no encontrado: {file_path}")

            else:
                # Para Linux/Mac - usar lpr con cantidad
                for file_info in normalized_files:
                    file_path = file_info["file_path"]
                    quantity = file_info["quantity"]

                    if os.path.exists(file_path):
                        try:
                            # lpr con opción de cantidad
                            subprocess.run(
                                ["lpr", f"-#{quantity}", file_path], check=False
                            )
                            printed_count += 1
                            print(f"✅ Archivo enviado a impresión ({quantity} copias)")
                        except Exception as e:
                            print(f"❌ Error imprimiendo archivo: {e}")

            print(
                f"🎯 Impresión completada: {printed_count}/{total_variants} variantes procesadas"
            )
            print(
                "👤 El usuario debe especificar las cantidades en los diálogos de Windows"
            )

            if printed_count > 0:
                return {
                    "status": "success",
                    "message": f"{printed_count} diálogos de impresión abiertos para {total_labels} etiquetas total",
                    "printed_count": printed_count,
                }
            else:
                return {
                    "status": "error",
                    "message": "No se pudo abrir ningún diálogo de impresión",
                }

        except Exception as e:
            print(f"❌ Error general al imprimir: {str(e)}")
            return {"status": "error", "message": f"Error al imprimir: {str(e)}"}

    def _create_composite_sheet(self, file_paths: List[str]) -> str:
        """
        Crea una hoja con múltiples códigos de barras para impresión más eficiente
        """
        try:
            # Configuración de la hoja - optimizada para etiquetas
            codes_per_row = 2  # Menos códigos por fila para mejor legibilidad
            margin = 30
            code_width = 300
            code_height = 200

            # Calcular dimensiones de la hoja
            total_codes = len(file_paths)
            rows_needed = (total_codes + codes_per_row - 1) // codes_per_row

            sheet_width = codes_per_row * code_width + (codes_per_row + 1) * margin
            sheet_height = rows_needed * code_height + (rows_needed + 1) * margin

            # Crear imagen de la hoja con fondo blanco
            sheet = Image.new("RGB", (sheet_width, sheet_height), "white")

            print(
                f"📋 Creando hoja compuesta: {sheet_width}x{sheet_height} px, {rows_needed} filas"
            )

            codes_added = 0
            for i, file_path in enumerate(file_paths):
                if os.path.exists(file_path):
                    try:
                        # Cargar imagen del código
                        code_img = Image.open(file_path)

                        # Redimensionar manteniendo proporción
                        code_img.thumbnail(
                            (code_width - 20, code_height - 20),
                            Image.Resampling.LANCZOS,
                        )

                        # Calcular posición en la grilla
                        row = codes_added // codes_per_row
                        col = codes_added % codes_per_row

                        # Centrar el código en su celda
                        cell_x = col * code_width + (col + 1) * margin
                        cell_y = row * code_height + (row + 1) * margin

                        # Centrar la imagen en la celda
                        img_x = cell_x + (code_width - code_img.width) // 2
                        img_y = cell_y + (code_height - code_img.height) // 2

                        # Pegar en la hoja
                        sheet.paste(code_img, (img_x, img_y))
                        codes_added += 1

                    except Exception as e:
                        print(f"⚠️ Error procesando imagen {file_path}: {e}")
                        continue

            # Guardar hoja compuesta con alta calidad
            composite_path = tempfile.mktemp(suffix="_composite_barcodes.png")
            sheet.save(composite_path, "PNG", dpi=(300, 300), optimize=False)

            print(
                f"✅ Hoja compuesta creada con {codes_added} códigos: {composite_path}"
            )
            return composite_path

        except Exception as e:
            print(f"❌ Error creando hoja compuesta: {e}")
            return None

        except Exception as e:
            print(f"❌ Error creando hoja compuesta: {e}")
            return None

    def cleanup_files(self, file_paths: List[str]) -> None:
        """
        Limpia los archivos temporales
        """
        for file_path in file_paths:
            try:
                if os.path.exists(file_path):
                    os.unlink(file_path)
            except Exception:
                pass  # Ignorar errores de limpieza

    def generate_simple_barcode(
        self,
        barcode_data: str,
        quantity: int = 1,
        barcode_type: str = "ean13",
    ) -> list:
        """
        Genera códigos de barras simples (sin texto adicional).

        Args:
            barcode_data: El dato a codificar (idealmente el sales_detail.id o el identificador único que decidas).
            quantity: Cuántos códigos generar.
            barcode_type: Tipo de código (por defecto EAN13).

        Returns:
            Lista de rutas de archivos PNG generados.
        """
        generated_files = []
        try:
            BARCODE_CLASS = barcode.get_barcode_class(barcode_type)

            for i in range(quantity):
                clean_barcode_data = barcode_data

                # Si no es numérico, convertir a hash numérico (igual que en tu otro método)
                if not barcode_data.isdigit():
                    import hashlib

                    hash_obj = hashlib.md5(barcode_data.encode())
                    hex_hash = hash_obj.hexdigest()[:8]
                    clean_barcode_data = str(int(hex_hash, 16))[:12]

                # EAN13 necesita 12 dígitos
                if len(clean_barcode_data) < 12:
                    clean_barcode_data = clean_barcode_data.ljust(12, "0")
                elif len(clean_barcode_data) > 12:
                    clean_barcode_data = clean_barcode_data[:12]

                barcode_instance = BARCODE_CLASS(
                    clean_barcode_data, writer=ImageWriter()
                )

                options = {
                    "module_width": 0.4,
                    "module_height": 15.0,
                    "font_size": 0,  # Sin texto
                    "text_distance": 0,
                    "background": "white",
                    "foreground": "black",
                    "write_text": False,  # No texto
                    "quiet_zone": 6.5,
                }

                with tempfile.NamedTemporaryFile(
                    suffix=".png", delete=False
                ) as tmp_barcode:
                    barcode_instance.write(tmp_barcode, options=options)
                    barcode_path = tmp_barcode.name

                generated_files.append(barcode_path)

        except Exception as e:
            for file_path in generated_files:
                if os.path.exists(file_path):
                    os.unlink(file_path)
            raise Exception(f"Error generando código de barras simple: {str(e)}")

        return generated_files
