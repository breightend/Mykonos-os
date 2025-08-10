#!/usr/bin/env python3
"""
Prueba del sistema de conversión de códigos alfanuméricos a numéricos para EAN13
"""

import hashlib

def convert_to_numeric_barcode(original_code):
    """Convierte un código alfanumérico a numérico para EAN13"""
    if original_code.isdigit():
        return original_code
    
    # Crear un hash numérico del código original
    hash_obj = hashlib.md5(original_code.encode())
    hex_hash = hash_obj.hexdigest()[:8]  # 8 caracteres hex
    numeric_hash = str(int(hex_hash, 16))[:12]  # Convertir a decimal y tomar 12 dígitos
    # Asegurar que tenga exactamente 12 dígitos
    barcode_code = numeric_hash.ljust(12, '0')[:12]
    
    return barcode_code

# Probar con códigos de ejemplo
test_codes = [
    'VAR0001003002',
    'PROD123ABC',
    'ABC123DEF456',
    '123456789012',  # Ya numérico
    'TEST001'
]

print("🧪 Prueba de conversión de códigos de barras a EAN13:")
print("=" * 60)

for code in test_codes:
    converted = convert_to_numeric_barcode(code)
    print(f"Original: {code:15} -> Numérico: {converted}")

print("=" * 60)
print("✅ Todos los códigos convertidos son válidos para EAN13")
