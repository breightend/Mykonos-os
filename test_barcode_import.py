#!/usr/bin/env python3
"""
Prueba rápida del sistema de códigos de barras
"""

import sys
import os

# Agregar src/backend al path
backend_path = os.path.join(os.path.dirname(__file__), 'src', 'backend')
sys.path.insert(0, backend_path)

try:
    from barcode_generator import BarcodeGenerator
    print("✅ BarcodeGenerator importado exitosamente")
    
    # Probar crear instancia
    generator = BarcodeGenerator()
    print("✅ Instancia de BarcodeGenerator creada")
    
    # Probar generar un código de barras simple
    print("🔧 Probando generación de código de barras...")
    
    test_product_info = {
        'name': 'Producto de Prueba',
        'barcode': '123456789012',
        'price': '99.99',
        'size_name': 'M',
        'color_name': 'Azul'
    }
    
    test_options = {
        'includeProductName': True,
        'includeSize': True,
        'includeColor': True,
        'includePrice': True,
        'includeCode': True
    }
    
    files = generator.generate_barcode_with_text(
        '123456789012',
        test_product_info,
        test_options,
        1
    )
    
    if files:
        print(f"✅ Código de barras generado: {files[0]}")
        print(f"📁 Archivo existe: {os.path.exists(files[0])}")
        
        # Limpiar archivos de prueba
        generator.cleanup_files(files)
        print("🧹 Archivos de prueba limpiados")
    else:
        print("❌ No se generaron archivos")
        
except ImportError as e:
    print(f"❌ Error de importación: {e}")
except Exception as e:
    print(f"❌ Error general: {e}")
    import traceback
    traceback.print_exc()

print("\n🏁 Prueba completada")
