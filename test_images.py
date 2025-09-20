import requests
import json

# Test multiple product IDs to find one with an image
base_url = "http://localhost:5000/api/product"

print("🔍 Buscando productos con imágenes...")

for product_id in range(1, 21):  # Test first 20 products
    try:
        response = requests.get(f"{base_url}/{product_id}/image")
        if response.status_code == 200:
            print(f"✅ Producto {product_id} SÍ tiene imagen (Content-Type: {response.headers.get('content-type')})")
            print(f"   Tamaño de imagen: {len(response.content)} bytes")
        elif response.status_code == 404:
            print(f"❌ Producto {product_id} NO tiene imagen")
        else:
            print(f"⚠️ Producto {product_id} retorna status: {response.status_code}")
    except Exception as e:
        print(f"💥 Error con producto {product_id}: {e}")

print("\n🔍 Verificando también desde el endpoint de inventario...")

try:
    inventory_response = requests.get("http://localhost:5000/api/inventory/products")
    if inventory_response.status_code == 200:
        products = inventory_response.json()
        products_with_images = [p for p in products.get('data', []) if p.get('has_image', False)]
        print(f"📋 Productos que reportan tener imagen: {len(products_with_images)}")
        for p in products_with_images[:5]:  # Show first 5
            print(f"   - ID: {p.get('id')}, Nombre: {p.get('product_name')}, has_image: {p.get('has_image')}")
except Exception as e:
    print(f"💥 Error consultando inventario: {e}")