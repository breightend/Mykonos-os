#!/usr/bin/env python3
"""
Script para probar el endpoint de detalles del producto después de la corrección
"""

import requests
import json


def test_product_details():
    """Prueba el endpoint de detalles del producto"""

    product_id = 14
    url = f"http://localhost:5000/api/inventory/product-details/{product_id}"

    print(f"Probando endpoint: {url}")

    try:
        response = requests.get(url, timeout=10)

        print(f"Status Code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type', 'N/A')}")

        if response.status_code == 200:
            data = response.json()
            print("✅ SUCCESS: Detalles obtenidos correctamente")

            # Verificar campos específicos
            if data.get("status") == "success" and "data" in data:
                product_data = data["data"]

                print("\n🔍 VERIFICANDO CAMPOS CORREGIDOS:")
                print(
                    f"  provider_name: '{product_data.get('provider_name')}' ({type(product_data.get('provider_name'))})"
                )
                print(
                    f"  provider_code: '{product_data.get('provider_code')}' ({type(product_data.get('provider_code'))})"
                )
                print(
                    f"  creation_date: '{product_data.get('creation_date')}' ({type(product_data.get('creation_date'))})"
                )
                print(
                    f"  last_modified_date: '{product_data.get('last_modified_date')}' ({type(product_data.get('last_modified_date'))})"
                )

                print("\n📊 OTROS CAMPOS:")
                print(f"  product_name: '{product_data.get('product_name')}'")
                print(f"  brand_name: '{product_data.get('brand_name')}'")
                print(f"  cost: {product_data.get('cost')}")
                print(f"  sale_price: {product_data.get('sale_price')}")

                # Verificar si los campos problemáticos ahora tienen valores
                issues = []
                if not product_data.get("provider_name"):
                    issues.append("❌ provider_name aún está vacío")
                else:
                    print("✅ provider_name tiene valor")

                if not product_data.get("creation_date"):
                    issues.append("❌ creation_date aún está vacío")
                else:
                    print("✅ creation_date tiene valor")

                if issues:
                    print("\n⚠️ PROBLEMAS ENCONTRADOS:")
                    for issue in issues:
                        print(f"  {issue}")
                else:
                    print("\n🎉 TODOS LOS CAMPOS CORREGIDOS CORRECTAMENTE")

            else:
                print("❌ Estructura de respuesta incorrecta")
                print(f"Response: {json.dumps(data, indent=2)}")

        else:
            print(f"❌ ERROR: Status code {response.status_code}")
            print("Contenido de respuesta:")
            try:
                error_data = response.json()
                print(json.dumps(error_data, indent=2))
            except:
                print(response.text[:500])

    except requests.exceptions.RequestException as e:
        print(f"❌ ERROR de conexión: {e}")
        return False

    return response.status_code == 200


if __name__ == "__main__":
    test_product_details()
