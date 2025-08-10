#!/usr/bin/env python3
"""
Script de prueba para el endpoint de impresión de códigos de barras
"""

import requests
import json

def test_print_endpoint():
    url = "http://localhost:5000/api/inventory/print-barcodes"
    
    # Datos de prueba
    test_data = {
        "productId": 1,
        "variants": [
            {
                "variantId": 1,
                "quantity": 1
            }
        ],
        "options": {
            "includeProductName": True,
            "includeSize": True,
            "includeColor": True,
            "includePrice": True,
            "includeCode": True
        }
    }
    
    print("🧪 Probando endpoint de impresión...")
    print(f"📤 URL: {url}")
    print(f"📋 Datos: {json.dumps(test_data, indent=2)}")
    
    try:
        response = requests.post(url, json=test_data)
        
        print(f"\n📊 Status Code: {response.status_code}")
        print(f"📝 Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ ¡Éxito!")
            print(json.dumps(result, indent=2, ensure_ascii=False))
        else:
            print("❌ Error:")
            print(f"   Status: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   JSON: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
            except:
                print(f"   Text: {response.text}")
                
    except Exception as e:
        print(f"💥 Excepción: {e}")

def test_preview_endpoint():
    url = "http://localhost:5000/api/inventory/generate-barcode-svg/1"
    
    test_data = {
        "options": {
            "includeProductName": True,
            "includeSize": True,
            "includeColor": True,
            "includePrice": True,
            "includeCode": True
        }
    }
    
    print("\n\n🔍 Probando endpoint de vista previa...")
    print(f"📤 URL: {url}")
    
    try:
        response = requests.post(url, json=test_data)
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Vista previa generada")
            print(f"   - Status: {result.get('status')}")
            print(f"   - Código: {result.get('data', {}).get('barcode_code')}")
            print(f"   - Texto: {result.get('data', {}).get('text_lines')}")
        else:
            print("❌ Error en vista previa:")
            print(f"   Text: {response.text}")
            
    except Exception as e:
        print(f"💥 Error: {e}")

if __name__ == "__main__":
    test_print_endpoint()
    test_preview_endpoint()
    print("\n🏁 Pruebas completadas")
