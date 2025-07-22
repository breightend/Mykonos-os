import requests

print("🔍 Probando nuevos endpoints de inventario...")

base_url = "http://localhost:5000/api/inventory"

# Probar endpoint de resumen de productos
print("\n=== PROBANDO ENDPOINT: /products-summary ===")
try:
    response = requests.get(f"{base_url}/products-summary")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Status: {data.get('status')}")
        products = data.get("data", [])
        print(f"📦 Total productos: {len(products)}")

        if products:
            print("\n🎯 Primeros 3 productos:")
            for i, product in enumerate(products[:3]):
                print(f"  {i + 1}. ID: {product.get('id')}")
                print(f"     Producto: {product.get('producto')}")
                print(f"     Marca: {product.get('marca')}")
                print(f"     Cantidad Total: {product.get('cantidad_total')}")
                print(f"     Fecha Edición: {product.get('fecha_edicion')}")
                print(
                    f"     Sucursales con Stock: {product.get('sucursales_con_stock')}"
                )
                print()
    else:
        print(f"❌ Error HTTP: {response.status_code}")
        print(f"📄 Response: {response.text}")
except Exception as e:
    print(f"💥 Error: {e}")

# Probar endpoint de detalles de producto (usando el primer producto)
print("\n=== PROBANDO ENDPOINT: /product-details/1 ===")
try:
    response = requests.get(f"{base_url}/product-details/1")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Status: {data.get('status')}")
        product = data.get("data", {})

        print("📋 Detalles del producto ID 1:")
        print(f"   Nombre: {product.get('product_name')}")
        print(f"   Marca: {product.get('brand_name')}")
        print(f"   Precio: ${product.get('sale_price')}")
        print(f"   Stock Total: {product.get('stock_total')}")
        print(f"   Sucursales: {product.get('sucursales_con_stock')}")

        stock_por_sucursal = product.get("stock_por_sucursal", [])
        print(f"\n🏪 Stock por sucursal ({len(stock_por_sucursal)}):")
        for stock in stock_por_sucursal:
            print(
                f"   - {stock.get('sucursal_nombre')}: {stock.get('cantidad')} unidades"
            )

        colores = product.get("colores", [])
        if colores:
            print(f"\n🎨 Colores ({len(colores)}):")
            for color in colores:
                print(f"   - {color.get('nombre')}")

        tallas = product.get("tallas", [])
        if tallas:
            print(f"\n📏 Tallas ({len(tallas)}):")
            for talla in tallas:
                print(f"   - {talla.get('nombre')}")
    else:
        print(f"❌ Error HTTP: {response.status_code}")
        print(f"📄 Response: {response.text}")
except Exception as e:
    print(f"💥 Error: {e}")

# Probar endpoint de storage-list
print("\n=== PROBANDO ENDPOINT: /storage-list ===")
try:
    response = requests.get(f"{base_url}/storage-list")
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Status: {data.get('status')}")
        storages = data.get("data", [])
        print(f"🏪 Total sucursales: {len(storages)}")

        if storages:
            print("\n🎯 Sucursales encontradas:")
            for i, storage in enumerate(storages):
                print(
                    f"  {i + 1}. ID: {storage[0]}, Nombre: {storage[1]}, Status: {storage[4]}"
                )
    else:
        print(f"❌ Error HTTP: {response.status_code}")
        print(f"📄 Response: {response.text}")
except Exception as e:
    print(f"💥 Error: {e}")

print("\n🏁 Prueba de endpoints completada.")
