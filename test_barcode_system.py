#!/usr/bin/env python3
"""
Script de prueba para el sistema de códigos de barras
Verifica que todas las dependencias estén instaladas correctamente
"""


def test_barcode_system():
    print("🧪 Iniciando pruebas del sistema de códigos de barras...")

    try:
        # Probar importaciones
        print("📦 Probando importaciones...")
        import barcode
        from barcode.writer import ImageWriter
        from PIL import Image, ImageDraw, ImageFont
        import tempfile
        import os

        print("✅ Todas las librerías importadas correctamente")

        # Probar generación básica de código de barras
        print("🔢 Probando generación de código de barras...")
        EAN = barcode.get_barcode_class("ean13")
        test_barcode = EAN("1234567890123", writer=ImageWriter())

        # Crear archivo temporal
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_file:
            test_path = tmp_file.name
            test_barcode.write(tmp_file)

        print(f"✅ Código de barras generado: {test_path}")

        # Probar manipulación de imagen
        print("🖼️ Probando manipulación de imágenes...")
        img = Image.open(test_path)
        width, height = img.size

        # Crear imagen con texto
        final_img = Image.new("RGB", (width, height + 100), "white")
        final_img.paste(img, (0, 0))

        draw = ImageDraw.Draw(final_img)
        draw.text((10, height + 10), "Producto de Prueba", fill="black")
        draw.text((10, height + 40), "Precio: $25.99", fill="black")

        # Guardar imagen final
        final_path = test_path.replace(".png", "_with_text.png")
        final_img.save(final_path)

        print(f"✅ Imagen con texto creada: {final_path}")

        # Limpiar archivos temporales
        os.unlink(test_path)
        os.unlink(final_path)

        print("🎉 ¡Todas las pruebas pasaron exitosamente!")
        print("📋 El sistema de códigos de barras está listo para usar")

        return True

    except ImportError as e:
        print(f"❌ Error de importación: {e}")
        print(
            "💡 Instala las dependencias con: pip install python-barcode[images] Pillow"
        )
        return False

    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False


if __name__ == "__main__":
    success = test_barcode_system()
    exit(0 if success else 1)
