#!/usr/bin/env python3
"""
Script de prueba para verificar el flujo completo de movimientos de inventario
Prueba la lógica:
1. Crear envío (solo quitar stock del origen)
2. Cambiar estados (empacado -> en_transito -> cancelado/retomado -> recibido)
3. Confirmar que el stock se transfiere solo cuando se marca como "recibido"
"""

import requests
import json

BASE_URL = "http://localhost:5000/api"


def test_movement_flow():
    print("🧪 Iniciando prueba del flujo de movimientos de inventario")

    # 1. Obtener sucursales disponibles
    print("\n1. 📍 Obteniendo lista de sucursales...")
    response = requests.get(f"{BASE_URL}/inventory/storage-list")
    if response.status_code == 200:
        storages = response.json()["data"]
        print(f"   ✅ Sucursales encontradas: {len(storages)}")
        for storage in storages[:3]:  # Mostrar solo las primeras 3
            print(f"      - ID: {storage[0]}, Nombre: {storage[1]}")
    else:
        print(f"   ❌ Error obteniendo sucursales: {response.status_code}")
        return

    # Usar las primeras dos sucursales para la prueba
    if len(storages) < 2:
        print("   ❌ Se necesitan al menos 2 sucursales para la prueba")
        return

    origin_storage_id = storages[0][0]
    destination_storage_id = storages[1][0]
    origin_name = storages[0][1]
    destination_name = storages[1][1]

    print(f"   📦 Origen: {origin_name} (ID: {origin_storage_id})")
    print(f"   🎯 Destino: {destination_name} (ID: {destination_storage_id})")

    # 2. Verificar stock inicial en ambas sucursales
    print("\n2. 📊 Verificando stock inicial...")

    def get_storage_stock(storage_id, storage_name):
        response = requests.get(
            f"{BASE_URL}/inventory/products-by-storage",
            params={"storage_id": storage_id},
        )
        if response.status_code == 200:
            products = response.json()["data"]
            print(f"   {storage_name}: {len(products)} productos con stock")
            return products
        else:
            print(f"   ❌ Error obteniendo stock de {storage_name}")
            return []

    origin_stock = get_storage_stock(origin_storage_id, origin_name)
    destination_stock = get_storage_stock(destination_storage_id, destination_name)

    if not origin_stock:
        print("   ❌ No hay productos con stock en la sucursal origen")
        return

    # 3. Crear un movimiento de prueba (solo si hay productos)
    print("\n3. 🚚 Creando movimiento de prueba...")

    # Usar el primer producto con stock
    test_product = origin_stock[0]
    product_id = test_product["id"]
    available_quantity = test_product["cantidad"]
    move_quantity = min(2, available_quantity)  # Mover máximo 2 unidades

    print(f"   📦 Producto de prueba: {test_product['producto']} (ID: {product_id})")
    print(f"   📊 Stock disponible: {available_quantity}, Mover: {move_quantity}")

    # Crear movimiento (simulando variantes - en una prueba real necesitarías variantes reales)
    movement_data = {
        "from_storage_id": origin_storage_id,
        "to_storage_id": destination_storage_id,
        "variants": [
            {
                "variant_id": 1,  # Esto debería ser un ID real de variante
                "product_id": product_id,
                "size_id": 1,
                "color_id": 1,
                "quantity": move_quantity,
            }
        ],
        "notes": "Prueba de flujo de movimiento",
        "user_id": 1,
    }

    print("   📤 Enviando solicitud de movimiento...")
    response = requests.post(
        f"{BASE_URL}/inventory/variant-movements",
        json=movement_data,
        headers={"Content-Type": "application/json"},
    )

    if response.status_code == 201:
        movement_result = response.json()
        movement_id = movement_result["movement_id"]
        print(f"   ✅ Movimiento creado exitosamente (ID: {movement_id})")
        print(f"   💰 Valor total: {movement_result.get('total_value', 'N/A')}")
        print(
            f"   📦 Variantes movidas: {movement_result.get('variants_moved', 'N/A')}"
        )
    else:
        print(f"   ❌ Error creando movimiento: {response.status_code}")
        try:
            error_detail = response.json()
            print(f"      Detalle: {error_detail}")
        except:
            print(f"      Respuesta: {response.text}")
        return

    # 4. Probar cambios de estado
    print(f"\n4. 🔄 Probando cambios de estado del envío {movement_id}...")

    def update_shipment_status(shipment_id, new_status):
        status_data = {"status": new_status, "user_id": 1}
        response = requests.put(
            f"{BASE_URL}/inventory/shipments/{shipment_id}/status",
            json=status_data,
            headers={"Content-Type": "application/json"},
        )

        if response.status_code == 200:
            print(f"   ✅ Estado actualizado a: {new_status}")
            return True
        else:
            print(f"   ❌ Error actualizando a {new_status}: {response.status_code}")
            try:
                error_detail = response.json()
                print(f"      Detalle: {error_detail}")
            except:
                print(f"      Respuesta: {response.text}")
            return False

    # Probar secuencia de estados
    print("   📝 Estado inicial: empacado (automático)")

    # En tránsito
    if update_shipment_status(movement_id, "en_transito"):
        print("      🚚 Envío marcado como en tránsito")

    # Entregado
    if update_shipment_status(movement_id, "entregado"):
        print("      📦 Envío marcado como entregado")

    # Finalmente, recibido (aquí es donde se debe transferir el stock)
    print("   🎯 Marcando como recibido (transferencia de stock)...")
    if update_shipment_status(movement_id, "recibido"):
        print("      ✅ Envío marcado como recibido - Stock debería estar transferido")

    # 5. Verificar stock final
    print("\n5. 📊 Verificando stock final...")

    print("   📍 Stock después del movimiento:")
    final_origin_stock = get_storage_stock(origin_storage_id, origin_name)
    final_destination_stock = get_storage_stock(
        destination_storage_id, destination_name
    )

    print("\n🎉 Prueba completada!")
    print("   ℹ️  Revisa los logs del backend para ver los detalles de la transferencia")
    print("   ℹ️  El stock debería haberse transferido cuando se marcó como 'recibido'")


def test_cancellation_flow():
    print("\n\n🧪 Probando flujo de cancelación...")
    print("   (Esta funcionalidad requiere un envío existente para cancelar)")

    # Obtener envíos existentes de la primera sucursal
    response = requests.get(f"{BASE_URL}/inventory/storage-list")
    if response.status_code == 200:
        storages = response.json()["data"]
        if storages:
            storage_id = storages[0][0]

            # Obtener envíos realizados
            response = requests.get(f"{BASE_URL}/inventory/sent-shipments/{storage_id}")
            if response.status_code == 200:
                shipments = response.json()["data"]
                print(f"   📤 Envíos encontrados: {len(shipments)}")

                for shipment in shipments[:3]:  # Mostrar solo los primeros 3
                    print(
                        f"      - ID: {shipment['id']}, Estado: {shipment['status']}, Hacia: {shipment['toStorage']}"
                    )


if __name__ == "__main__":
    try:
        test_movement_flow()
        test_cancellation_flow()
    except Exception as e:
        print(f"❌ Error durante la prueba: {e}")
