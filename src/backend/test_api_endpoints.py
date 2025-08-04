#!/usr/bin/env python3
"""
Test script para verificar el endpoint de actualización de productos
"""

import requests
import json
import base64
from PIL import Image
import io

# Configuración del servidor
BASE_URL = "http://localhost:5000"
API_URL = f"{BASE_URL}/api/inventory"


def test_product_update_endpoint():
    """
    Prueba el endpoint PUT /api/inventory/products/{id}
    """
    print("🧪 Iniciando prueba del endpoint de actualización de productos...")

    try:
        # 1. Primero obtener la lista de productos para tener un ID válido
        print("📋 Obteniendo lista de productos...")
        response = requests.get(f"{API_URL}/products-summary")

        if response.status_code != 200:
            print(f"❌ Error obteniendo productos: {response.status_code}")
            return False

        products_data = response.json()
        if not products_data.get("data") or len(products_data["data"]) == 0:
            print("❌ No hay productos disponibles para probar")
            return False

        # Usar el primer producto para la prueba
        test_product = products_data["data"][0]
        product_id = test_product[0]  # Asumiendo que el ID es el primer elemento
        product_name = test_product[1]  # Y el nombre es el segundo

        print(f"🎯 Probando con producto ID: {product_id}, Nombre: {product_name}")

        # 2. Preparar datos de actualización
        print("📝 Preparando datos de prueba...")

        update_data = {
            "description": "Descripción actualizada via API test",
            "comments": "Comentarios añadidos durante prueba automatizada",
            "cost": 85.50,
            "sale_price": 120.00,
            "original_price": 150.00,
            "discount_percentage": 20.0,
            "discount_amount": 30.0,
            "has_discount": True,
            "tax": 21.0,
        }

        print(f"📊 Datos a enviar: {json.dumps(update_data, indent=2)}")

        # 3. Enviar actualización
        print(f"🔄 Enviando actualización al endpoint...")

        headers = {"Content-Type": "application/json"}
        response = requests.put(
            f"{API_URL}/products/{product_id}", json=update_data, headers=headers
        )

        print(f"📡 Respuesta del servidor: {response.status_code}")
        print(f"📄 Contenido de respuesta: {response.text}")

        if response.status_code == 200:
            response_data = response.json()
            if response_data.get("status") == "success":
                print("✅ Actualización exitosa!")

                # Mostrar los datos actualizados
                updated_product = response_data.get("data")
                if updated_product:
                    print("📊 Datos actualizados:")
                    print(f"   - Descripción: {updated_product.get('description')}")
                    print(f"   - Comentarios: {updated_product.get('comments')}")
                    print(f"   - Costo: ${updated_product.get('cost')}")
                    print(f"   - Precio venta: ${updated_product.get('sale_price')}")
                    print(
                        f"   - Precio original: ${updated_product.get('original_price')}"
                    )
                    print(
                        f"   - Descuento %: {updated_product.get('discount_percentage')}%"
                    )
                    print(
                        f"   - Descuento $: ${updated_product.get('discount_amount')}"
                    )
                    print(
                        f"   - Tiene descuento: {updated_product.get('has_discount')}"
                    )
                    print(f"   - Impuesto: {updated_product.get('tax')}%")
                    print(
                        f"   - Última modificación: {updated_product.get('last_modified_date')}"
                    )

                print("✅ Prueba de actualización básica exitosa!")
                return True
            else:
                print(f"❌ Error en respuesta: {response_data.get('message')}")
                return False
        else:
            print(f"❌ Error HTTP: {response.status_code}")
            print(f"📄 Contenido: {response.text}")
            return False

    except requests.exceptions.ConnectionError:
        print("❌ Error de conexión: ¿Está el servidor ejecutándose en localhost:5000?")
        return False
    except Exception as e:
        print(f"❌ Error durante la prueba: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_product_with_image():
    """
    Prueba la actualización de producto con imagen
    """
    print("\n🖼️ Iniciando prueba de actualización con imagen...")

    try:
        # Obtener producto para probar
        response = requests.get(f"{API_URL}/products-summary")
        if response.status_code != 200:
            print("❌ Error obteniendo productos para prueba de imagen")
            return False

        products_data = response.json()
        if not products_data.get("data") or len(products_data["data"]) == 0:
            print("❌ No hay productos para probar imagen")
            return False

        product_id = products_data["data"][0][0]

        # Crear una imagen de prueba simple
        print("🎨 Creando imagen de prueba...")
        img = Image.new("RGB", (200, 200), color="red")

        # Agregar texto a la imagen
        try:
            from PIL import ImageDraw, ImageFont

            draw = ImageDraw.Draw(img)
            draw.text((10, 10), "TEST IMAGE", fill="white")
        except:
            print("⚠️ No se pudo agregar texto a la imagen (sin ImageDraw)")

        # Convertir a base64
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=85)
        img_bytes = buffer.getvalue()
        img_base64 = base64.b64encode(img_bytes).decode("utf-8")
        img_data_url = f"data:image/jpeg;base64,{img_base64}"

        print(f"📸 Imagen creada: {len(img_base64)} caracteres base64")

        # Datos de actualización con imagen
        update_data = {
            "description": "Producto con imagen actualizada",
            "product_image": img_data_url,
        }

        print("📤 Enviando actualización con imagen...")
        response = requests.put(
            f"{API_URL}/products/{product_id}",
            json=update_data,
            headers={"Content-Type": "application/json"},
        )

        print(f"📡 Respuesta: {response.status_code}")

        if response.status_code == 200:
            response_data = response.json()
            if response_data.get("status") == "success":
                print("✅ Actualización con imagen exitosa!")
                return True
            else:
                print(
                    f"❌ Error en respuesta con imagen: {response_data.get('message')}"
                )
                return False
        else:
            print(f"❌ Error HTTP con imagen: {response.status_code}")
            print(f"📄 Contenido: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Error en prueba de imagen: {e}")
        return False


def test_product_with_variants():
    """
    Prueba la actualización de producto con variantes de stock
    """
    print("\n📦 Iniciando prueba de actualización con variantes...")

    try:
        # Obtener productos, sucursales, talles y colores
        products_response = requests.get(f"{API_URL}/products-summary")
        storages_response = requests.get(f"{API_URL}/storage-list")

        if products_response.status_code != 200 or storages_response.status_code != 200:
            print("❌ Error obteniendo datos para prueba de variantes")
            return False

        products_data = products_response.json()
        storages_data = storages_response.json()

        if not products_data.get("data") or not storages_data.get("data"):
            print("❌ No hay datos suficientes para prueba de variantes")
            return False

        product_id = products_data["data"][0][0]
        storage_id = storages_data["data"][0][0]

        print(f"🎯 Usando producto ID: {product_id}, sucursal ID: {storage_id}")

        # Crear variantes de prueba
        stock_variants = [
            {
                "size_id": 1,
                "color_id": 1,
                "sucursal_id": storage_id,
                "quantity": 25,
                "is_new": True,
            },
            {
                "size_id": 2,
                "color_id": 1,
                "sucursal_id": storage_id,
                "quantity": 15,
                "is_new": True,
            },
        ]

        update_data = {
            "description": "Producto con variantes actualizadas",
            "stock_variants": stock_variants,
        }

        print(f"📦 Enviando {len(stock_variants)} variantes...")
        response = requests.put(
            f"{API_URL}/products/{product_id}",
            json=update_data,
            headers={"Content-Type": "application/json"},
        )

        print(f"📡 Respuesta: {response.status_code}")

        if response.status_code == 200:
            response_data = response.json()
            if response_data.get("status") == "success":
                print("✅ Actualización con variantes exitosa!")
                return True
            else:
                print(
                    f"❌ Error en respuesta con variantes: {response_data.get('message')}"
                )
                return False
        else:
            print(f"❌ Error HTTP con variantes: {response.status_code}")
            print(f"📄 Contenido: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Error en prueba de variantes: {e}")
        return False


if __name__ == "__main__":
    print("🚀 Iniciando pruebas del API de actualización de productos")

    tests_passed = 0
    total_tests = 3

    # Prueba 1: Actualización básica
    if test_product_update_endpoint():
        tests_passed += 1

    # Prueba 2: Actualización con imagen
    if test_product_with_image():
        tests_passed += 1

    # Prueba 3: Actualización con variantes
    if test_product_with_variants():
        tests_passed += 1

    print(f"\n📊 Resultados: {tests_passed}/{total_tests} pruebas exitosas")

    if tests_passed == total_tests:
        print("🎉 ¡Todas las pruebas pasaron! El API está funcionando correctamente.")
    else:
        print("⚠️ Algunas pruebas fallaron. Revisar los logs anteriores.")
