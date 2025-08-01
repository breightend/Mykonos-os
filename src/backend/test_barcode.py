# Test para verificar que las librerías funcionan correctamente

try:
    from barcode import Code128
    from barcode.writer import SVGWriter
    from io import BytesIO

    print("✅ Librerías importadas correctamente")

    # Crear un código de barras de prueba
    code = "123456789012"
    barcode_instance = Code128(code, writer=SVGWriter())

    # Generar SVG en memoria
    buffer = BytesIO()
    barcode_instance.write(buffer)

    # Obtener el contenido SVG
    svg_content = buffer.getvalue().decode("utf-8")
    buffer.close()

    print(f"✅ Código de barras generado exitosamente para: {code}")
    print(f"Tamaño del SVG: {len(svg_content)} caracteres")

    # Guardar el SVG en un archivo para verificar
    with open("test_barcode.svg", "w") as f:
        f.write(svg_content)

    print("✅ SVG guardado como 'test_barcode.svg'")
    print("\n🎉 Todo funciona correctamente!")

except ImportError as e:
    print(f"❌ Error de importación: {e}")
    print("Ejecuta: pip install python-barcode pillow")

except Exception as e:
    print(f"❌ Error inesperado: {e}")
