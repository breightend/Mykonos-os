#!/usr/bin/env python3
"""
Script de debugging profundo para el problema de imágenes
"""

import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "src", "backend"))

from database.database import Database


def deep_debug_product_14():
    """
    Debug profundo del producto 14
    """
    print("🔍 DEBUG PROFUNDO - Producto 14")

    db = Database()

    try:
        print("\n1️⃣ Consulta directa a la tabla images:")
        direct_query = "SELECT product_id, length(image_data) as size, image_data FROM images WHERE product_id = 14"
        direct_result = db.execute_query(direct_query)

        if direct_result and len(direct_result) > 0:
            record = direct_result[0]
            print(
                f"   ✅ Encontrado - Product ID: {record['product_id'] if isinstance(record, dict) else record[0]}"
            )
            print(
                f"   ✅ Tamaño: {record['size'] if isinstance(record, dict) else record[1]} bytes"
            )

            # Verificar si image_data es None
            image_data = record["image_data"] if isinstance(record, dict) else record[2]
            if image_data is None:
                print("   ❌ image_data es None!")
            else:
                print(f"   ✅ image_data disponible: {len(image_data)} bytes")
                print(f"   ✅ Tipo de datos: {type(image_data)}")
        else:
            print("   ❌ No encontrado en consulta directa")

        print("\n2️⃣ Usando get_record_by_clause:")
        clause_result = db.get_record_by_clause("images", "product_id = ?", (14,))
        print(f"   Success: {clause_result.get('success')}")
        print(f"   Message: {clause_result.get('message')}")

        if clause_result.get("record"):
            record = clause_result["record"]
            print(
                f"   Record keys: {list(record.keys()) if isinstance(record, dict) else 'Not a dict'}"
            )

            if "image_data" in record:
                image_data = record["image_data"]
                if image_data is None:
                    print("   ❌ image_data en record es None!")
                else:
                    print(f"   ✅ image_data en record: {len(image_data)} bytes")
            else:
                print("   ❌ No hay clave 'image_data' en record")
        else:
            print("   ❌ No record en resultado")

        print("\n3️⃣ Usando get_product_image method:")
        method_result = db.get_product_image(14)
        print(f"   Success: {method_result.get('success')}")
        print(f"   Message: {method_result.get('message')}")

        image_data = method_result.get("image_data")
        if image_data is None:
            print("   ❌ image_data del método es None!")
        else:
            print(f"   ✅ image_data del método: {len(image_data)} bytes")

    except Exception as e:
        print(f"❌ Error en debug: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    deep_debug_product_14()
