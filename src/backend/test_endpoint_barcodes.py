#!/usr/bin/env python3
"""
Test de verificación del endpoint product-details
para verificar que está devolviendo los códigos de barras
"""

import requests
import json
import sqlite3
import os


def test_product_details_endpoint():
    """Test del endpoint product-details"""

    # Primero verificar qué productos tenemos en la base de datos
    print("=== VERIFICANDO BASE DE DATOS ===")
    db_path = os.path.join("database", "mykonos.db")

    if not os.path.exists(db_path):
        print(f"❌ Error: No se encontró la base de datos en {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Obtener un producto que tenga variantes
    cursor.execute("""
        SELECT p.id, p.product_name, COUNT(wsv.id) as variant_count
        FROM products p
        LEFT JOIN warehouse_stock_variants wsv ON p.id = wsv.product_id
        GROUP BY p.id, p.product_name
        HAVING variant_count > 0
        ORDER BY variant_count DESC
        LIMIT 3
    """)

    products = cursor.fetchall()
    print(f"Productos con variantes encontrados: {len(products)}")

    if not products:
        print("❌ No hay productos con variantes para probar")
        conn.close()
        return

    for product in products:
        print(f"  ID: {product[0]}, Nombre: {product[1]}, Variantes: {product[2]}")

    # Probar con el primer producto
    test_product_id = products[0][0]
    print(f"\n=== PROBANDO ENDPOINT CON PRODUCTO ID: {test_product_id} ===")

    # Verificar variantes en la base de datos
    cursor.execute(
        """
        SELECT id, size_id, color_id, variant_barcode
        FROM warehouse_stock_variants
        WHERE product_id = ?
        LIMIT 5
    """,
        (test_product_id,),
    )

    variants_db = cursor.fetchall()
    print(f"Variantes en DB: {len(variants_db)}")
    for v in variants_db:
        print(f"  ID: {v[0]}, Size: {v[1]}, Color: {v[2]}, Barcode: {v[3]}")

    conn.close()

    # Probar el endpoint
    try:
        url = f"http://localhost:5000/api/inventory/product-details/{test_product_id}"
        print(f"\n=== LLAMANDO AL ENDPOINT ===")
        print(f"URL: {url}")

        response = requests.get(url, timeout=10)

        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"✅ Respuesta exitosa")
            print(f"Status: {data.get('status')}")

            if "data" in data and "stock_variants" in data["data"]:
                variants = data["data"]["stock_variants"]
                print(f"Variantes en respuesta: {len(variants)}")

                for i, variant in enumerate(variants[:3]):  # Solo primeras 3
                    print(f"  Variante {i + 1}:")
                    print(f"    ID: {variant.get('id')}")
                    print(f"    Size: {variant.get('size_name')}")
                    print(f"    Color: {variant.get('color_name')}")
                    print(
                        f"    Barcode: {variant.get('variant_barcode', 'NO ENCONTRADO')}"
                    )
                    print(f"    Sucursal: {variant.get('sucursal_nombre')}")
                    print(f"    Cantidad: {variant.get('quantity')}")

                # Verificar si hay códigos de barras
                variants_with_barcode = [
                    v for v in variants if v.get("variant_barcode")
                ]
                print(
                    f"\n✅ Variantes con código de barras: {len(variants_with_barcode)}/{len(variants)}"
                )

                if len(variants_with_barcode) == 0:
                    print("⚠️ PROBLEMA: No hay códigos de barras en la respuesta")
                else:
                    print("✅ ÉXITO: Los códigos de barras están siendo devueltos")

            else:
                print("❌ Error: No se encontró 'stock_variants' en la respuesta")
                print(f"Claves disponibles: {list(data.get('data', {}).keys())}")
        else:
            print(f"❌ Error en la respuesta: {response.status_code}")
            print(f"Contenido: {response.text}")

    except requests.exceptions.ConnectionError:
        print("❌ Error: No se pudo conectar al servidor. ¿Está ejecutándose?")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")


if __name__ == "__main__":
    test_product_details_endpoint()
