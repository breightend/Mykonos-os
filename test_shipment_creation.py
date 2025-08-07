#!/usr/bin/env python3
"""
Script de prueba para crear un envío y verificar que se muestre correctamente
con todos los detalles de variante (marca, talle, color, precio)
"""

import requests
import json

# Configuración
BASE_URL = "http://localhost:5000/api"


def test_shipment_flow():
    print("🧪 Iniciando prueba del flujo de envíos...")

    # 1. Obtener storage disponible
    print("\n1. Obteniendo storage disponible...")
    response = requests.get(f"{BASE_URL}/storage")
    if response.status_code != 200:
        print(f"❌ Error obteniendo storage: {response.status_code}")
        return

    storages = response.json().get("data", [])
    print(f"✅ Storage disponible: {len(storages)} sucursales")

    if len(storages) < 2:
        print("❌ Se necesitan al menos 2 sucursales para hacer una prueba")
        return

    from_storage = storages[0][0]  # ID de primera sucursal
    to_storage = storages[1][0]  # ID de segunda sucursal

    print(f"📍 Desde sucursal ID: {from_storage}")
    print(f"📍 Hacia sucursal ID: {to_storage}")

    # 2. Obtener variantes disponibles
    print(f"\n2. Obteniendo variantes disponibles en sucursal {from_storage}...")
    response = requests.get(f"{BASE_URL}/variants/{from_storage}")
    if response.status_code != 200:
        print(f"❌ Error obteniendo variantes: {response.status_code}")
        return

    variants = response.json().get("data", [])
    print(f"✅ Variantes disponibles: {len(variants)}")

    if len(variants) == 0:
        print("❌ No hay variantes disponibles para crear envío")
        return

    # Usar la primera variante disponible
    test_variant = variants[0]
    print(f"🎯 Usando variante de prueba:")
    print(f"   - Producto: {test_variant.get('product_name')}")
    print(f"   - Marca: {test_variant.get('brand_name')}")
    print(f"   - Talle: {test_variant.get('size_name')}")
    print(f"   - Color: {test_variant.get('color_name')}")
    print(f"   - Código: {test_variant.get('variant_barcode')}")
    print(f"   - Stock: {test_variant.get('available_stock')}")

    # 3. Crear movimiento de variante
    print(f"\n3. Creando movimiento de variante...")
    movement_data = {
        "from_storage_id": from_storage,
        "to_storage_id": to_storage,
        "variants": [
            {
                "variant_id": test_variant["variant_id"],
                "product_id": test_variant["product_id"],
                "size_id": test_variant["size_id"],
                "color_id": test_variant["color_id"],
                "quantity": 1,
                "variant_barcode": test_variant["variant_barcode"],
            }
        ],
        "notes": "Envío de prueba - verificación de detalles de variante",
        "user_id": 1,
    }

    response = requests.post(f"{BASE_URL}/variant-movements", json=movement_data)
    if response.status_code != 201:
        print(f"❌ Error creando movimiento: {response.status_code}")
        print(f"Response: {response.text}")
        return

    result = response.json()
    print(f"✅ Movimiento creado exitosamente!")
    print(f"   - ID: {result.get('movement_id')}")
    print(f"   - Variantes: {result.get('variants_moved')}")
    print(f"   - Valor total: ${result.get('total_value')}")

    # 4. Verificar envíos realizados
    print(f"\n4. Verificando envíos realizados desde sucursal {from_storage}...")
    response = requests.get(f"{BASE_URL}/sent-shipments/{from_storage}")
    if response.status_code != 200:
        print(f"❌ Error obteniendo envíos realizados: {response.status_code}")
        return

    sent_shipments = response.json().get("data", [])
    print(f"✅ Envíos realizados: {len(sent_shipments)}")

    if len(sent_shipments) > 0:
        latest_shipment = sent_shipments[0]  # El más reciente
        print(f"\n📦 Detalles del último envío:")
        print(f"   - ID: {latest_shipment['id']}")
        print(f"   - Estado: {latest_shipment['status']}")
        print(f"   - Desde: {latest_shipment['fromStorage']}")
        print(f"   - Hacia: {latest_shipment['toStorage']}")
        print(f"   - Productos: {len(latest_shipment['products'])}")

        if latest_shipment["products"]:
            product = latest_shipment["products"][0]
            print(f"\n🏷️ Detalles del primer producto:")
            print(f"   - Nombre: {product.get('name', 'N/A')}")
            print(f"   - Marca: {product.get('brand', 'N/A')}")
            print(f"   - Talle: {product.get('size', 'N/A')}")
            print(f"   - Color: {product.get('color', 'N/A')}")
            print(f"   - Precio: ${(product.get('sale_price', 0) / 100):.2f}")
            print(f"   - Cantidad: {product.get('quantity', 0)}")
            print(f"   - Código: {product.get('variant_barcode', 'N/A')}")

            # Verificar si la información está completa
            if all(
                [
                    product.get("brand") not in [None, "Sin marca", ""],
                    product.get("size") not in [None, "Sin talle", ""],
                    product.get("color") not in [None, "Sin color", ""],
                    product.get("sale_price", 0) > 0,
                ]
            ):
                print(
                    "\n🎉 ¡SUCCESS! Todos los detalles de variante están disponibles correctamente"
                )
            else:
                print(
                    "\n⚠️ PROBLEMA: Algunos detalles de variante están vacíos o por defecto"
                )

    print(f"\n✅ Prueba completada!")


if __name__ == "__main__":
    test_shipment_flow()
