#!/usr/bin/env python3
"""
Verificar variantes disponibles en la base de datos
"""

import sys
import os

sys.path.append("src/backend")

from database.database import Database


def check_variants():
    """
    Verificar qué variantes existen en la base de datos
    """
    try:
        db = Database()

        print("🔍 Verificando variantes en la base de datos...")

        # Consultar algunas variantes
        query = """
        SELECT 
            wsv.id,
            wsv.variant_barcode,
            wsv.product_id,
            p.product_name,
            s.size_name,
            c.color_name
        FROM warehouse_stock_variants wsv
        LEFT JOIN products p ON wsv.product_id = p.id
        LEFT JOIN sizes s ON wsv.size_id = s.id
        LEFT JOIN colors c ON wsv.color_id = c.id
        ORDER BY wsv.id
        LIMIT 10
        """

        variants = db.execute_query(query)

        if variants:
            print(f"✅ Encontradas {len(variants)} variantes:")
            for variant in variants:
                print(
                    f"   📦 ID: {variant['id']} | Producto: {variant['product_name']} | Código: {variant['variant_barcode']}"
                )
        else:
            print("❌ No se encontraron variantes en la base de datos")

        # Verificar si existe la variante 11 específicamente
        variant_11_query = """
        SELECT 
            wsv.id,
            wsv.variant_barcode,
            wsv.product_id,
            p.product_name
        FROM warehouse_stock_variants wsv
        LEFT JOIN products p ON wsv.product_id = p.id
        WHERE wsv.id = 11
        """

        variant_11 = db.execute_query(variant_11_query)

        print(f"\n🎯 Verificando variante ID 11:")
        if variant_11:
            v = variant_11[0]
            print(
                f"   ✅ Variante 11 existe: {v['product_name']} (Código: {v['variant_barcode']})"
            )
        else:
            print("   ❌ Variante 11 NO existe en la base de datos")

    except Exception as e:
        print(f"❌ Error conectando a la base de datos: {e}")


if __name__ == "__main__":
    check_variants()
