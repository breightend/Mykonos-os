import requests
import json

def test_server_connection():
    """Prueba básica de conexión al servidor"""
    try:
        response = requests.get("http://localhost:5000/api/inventory/storage-list", timeout=5)
        print(f"✅ Servidor conectado - Status: {response.status_code}")
        return True
    except requests.exceptions.ConnectionError:
        print("❌ No se puede conectar al servidor en localhost:5000")
        return False
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

def test_barcode_endpoint():
    """Prueba el endpoint de código de barras"""
    if not test_server_connection():
        return
    
    print("\n🧪 Probando endpoint de código de barras...")
    
    url = "http://localhost:5000/api/inventory/generate-barcode-svg/1"
    data = {
        "options": {
            "includeProductName": True,
            "includeSize": True,
            "includeColor": True,
            "includePrice": True,
            "includeCode": True
        }
    }
    
    try:
        response = requests.post(url, json=data, timeout=10)
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Respuesta exitosa")
            print(f"   📋 Status: {result.get('status')}")
            
            if result.get('status') == 'success':
                data = result.get('data', {})
                print(f"   🏷️  Código: {data.get('barcode_code')}")
                print(f"   📝 Líneas: {len(data.get('text_lines', []))}")
                print(f"   🖼️  SVG: {len(data.get('svg_content', ''))} caracteres")
                
                # Mostrar primeros caracteres del SVG
                svg = data.get('svg_content', '')
                if svg:
                    print(f"   📄 SVG preview: {svg[:100]}...")
                    
                print("\n✅ ¡El endpoint está funcionando correctamente!")
            else:
                print(f"   ❌ Error en datos: {result.get('message')}")
        else:
            print(f"❌ Error HTTP {response.status_code}")
            try:
                error_data = response.json()
                print(f"   📋 Error: {error_data.get('message', 'Sin mensaje')}")
            except:
                print(f"   📋 Texto: {response.text[:200]}")
    
    except requests.exceptions.Timeout:
        print("❌ Timeout - El servidor tardó demasiado en responder")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_barcode_endpoint()
