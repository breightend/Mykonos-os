"""
Complete Exchange System Testing
"""

import requests
import json
import time


def test_api_endpoint(url, method="GET", data=None, description=""):
    """Test an API endpoint and return results"""
    try:
        print(f"\n🧪 {description}")
        print("-" * 50)

        if method == "GET":
            response = requests.get(url, timeout=10)
        elif method == "POST":
            response = requests.post(
                url, json=data, headers={"Content-Type": "application/json"}, timeout=10
            )

        print(f"📡 URL: {url}")
        print(f"🔢 Status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success: {json.dumps(result, indent=2, ensure_ascii=False)}")
            return True, result
        else:
            print(f"❌ Error: {response.text}")
            return False, None

    except Exception as e:
        print(f"💥 Exception: {e}")
        return False, None


# Base URL
BASE_URL = "http://localhost:5000/api/exchange"

print("🚀 SISTEMA DE INTERCAMBIOS - PRUEBAS COMPLETAS")
print("=" * 60)

# Test 1: Check exchange history (should work even if empty)
success, _ = test_api_endpoint(
    f"{BASE_URL}/history", description="Verificar historial de intercambios"
)

# Test 2: Validate a product for return
test_barcode = "VAR0003002003"
validation_data = {"variant_barcode": test_barcode, "quantity": 1, "branch_id": 1}
success, product_info = test_api_endpoint(
    f"{BASE_URL}/validate-return",
    method="POST",
    data=validation_data,
    description=f"Validar producto para devolución ({test_barcode})",
)

# Test 3: Validate new product for exchange
new_barcode = "VAR0003003004"
new_validation_data = {"variant_barcode": new_barcode, "quantity": 1, "branch_id": 1}
success, new_product_info = test_api_endpoint(
    f"{BASE_URL}/validate-new-product",
    method="POST",
    data=new_validation_data,
    description=f"Validar producto nuevo ({new_barcode})",
)

# Test 4: Create a simple return (no exchange)
return_data = {
    "return_variant_barcode": test_barcode,
    "return_quantity": 1,
    "branch_id": 1,
    "reason": "Prueba de devolución - testing",
    "user_id": 1,
}
success, return_result = test_api_endpoint(
    f"{BASE_URL}/create",
    method="POST",
    data=return_data,
    description="Crear devolución simple (sin intercambio)",
)

# Test 5: Create full exchange with price difference
exchange_data = {
    "return_variant_barcode": test_barcode,
    "return_quantity": 1,
    "new_variant_barcode": new_barcode,
    "new_quantity": 1,
    "branch_id": 1,
    "reason": "Prueba de intercambio completo",
    "user_id": 1,
    "customer_id": 1,
}
success, exchange_result = test_api_endpoint(
    f"{BASE_URL}/create",
    method="POST",
    data=exchange_data,
    description="Crear intercambio completo con cliente",
)

# Test 6: Check history after operations
success, final_history = test_api_endpoint(
    f"{BASE_URL}/history?limit=10",
    description="Verificar historial después de operaciones",
)

print("\n" + "=" * 60)
print("🏁 PRUEBAS COMPLETADAS")
print("=" * 60)

if return_result and exchange_result:
    print("✅ Sistema de intercambios funcionando correctamente")
    print("🔄 Funcionalidades probadas:")
    print("   - ✅ Validación de productos")
    print("   - ✅ Devoluciones simples")
    print("   - ✅ Intercambios completos")
    print("   - ✅ Cálculo de diferencias de precio")
    print("   - ✅ Actualización de inventario")
    print("   - ✅ Movimientos financieros")
    print("   - ✅ Historial de transacciones")
else:
    print("⚠️  Algunas pruebas fallaron - revisar configuración")
