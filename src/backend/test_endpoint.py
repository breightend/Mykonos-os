#!/usr/bin/env python3
"""
Script para probar el endpoint de detalles de producto
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import Database
from routes.inventory_router import get_product_details
from flask import Flask, json


def test_product_details():
    """Probar el endpoint de detalles de producto"""
    product_id = 3  # El producto que sabemos que tiene imagen

    print(f"🧪 Probando endpoint de detalles para producto ID: {product_id}")

    # Simular llamada directa a la función
    app = Flask(__name__)

    with app.app_context():
        # Importar y ejecutar la función directamente
        import sys
        import importlib.util

        # Simular request context
        from unittest.mock import patch

        # Importar el módulo y ejecutar la función
        spec = importlib.util.spec_from_file_location(
            "inventory_router", "routes/inventory_router.py"
        )
        inventory_module = importlib.util.module_from_spec(spec)

        sys.modules["inventory_router"] = inventory_module
        spec.loader.exec_module(inventory_module)

        # Ejecutar la función directamente
        try:
            from routes.inventory_router import get_product_details

            result = get_product_details(product_id)

            print(f"📋 Resultado del endpoint:")
            print(
                f"   Status Code: {result[1] if isinstance(result, tuple) else 'Unknown'}"
            )

            if isinstance(result, tuple) and len(result) >= 1:
                response_data = result[0]
                if hasattr(response_data, "get_json"):
                    json_data = response_data.get_json()
                elif hasattr(response_data, "data"):
                    json_data = json.loads(response_data.data)
                else:
                    json_data = result[0]

                print(f"   Response: {json_data}")

                if "data" in json_data and "product_image" in json_data["data"]:
                    image_data = json_data["data"]["product_image"]
                    if image_data:
                        print(
                            f"✅ Imagen encontrada! Tamaño: {len(image_data)} caracteres"
                        )
                        print(f"   Primeros 50 caracteres: {image_data[:50]}...")
                    else:
                        print("❌ Campo product_image está vacío")
                else:
                    print("❌ No se encontró campo product_image en la respuesta")

        except Exception as e:
            print(f"❌ Error ejecutando endpoint: {e}")
            import traceback

            traceback.print_exc()


if __name__ == "__main__":
    test_product_details()
