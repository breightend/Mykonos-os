#!/usr/bin/env python3
"""
Reporte final del estado del sistema después de eliminar códigos de barras generales
"""

import sqlite3
import os


def generate_final_report():
    print("🎯 REPORTE FINAL - ELIMINACIÓN DE CÓDIGOS DE BARRAS GENERALES")
    print("=" * 70)

    # Conectar a la base de datos
    db_path = os.path.join("database", "mykonos.db")
    if not os.path.exists(db_path):
        print(f"❌ No se encontró la base de datos en: {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        print("\n1. 📊 VERIFICACIÓN DE ELIMINACIÓN DE CÓDIGOS GENERALES")
        print("-" * 50)

        # Verificar que no existe la tabla barcodes
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='barcodes'"
        )
        barcodes_table = cursor.fetchone()

        if barcodes_table:
            print("❌ La tabla 'barcodes' aún existe")
        else:
            print("✅ La tabla 'barcodes' fue eliminada correctamente")

        # Verificar que no existe la columna barcode en products
        cursor.execute("PRAGMA table_info(products)")
        product_columns = cursor.fetchall()
        barcode_column = any(col[1] == "barcode" for col in product_columns)

        if barcode_column:
            print("❌ La columna 'barcode' aún existe en la tabla 'products'")
        else:
            print("✅ La columna 'barcode' fue eliminada de la tabla 'products'")

        print("\n2. 📋 VERIFICACIÓN DE CÓDIGOS DE BARRAS POR VARIANTE")
        print("-" * 50)

        # Verificar warehouse_stock_variants
        cursor.execute("PRAGMA table_info(warehouse_stock_variants)")
        variant_columns = cursor.fetchall()
        variant_barcode_column = any(
            col[1] == "variant_barcode" for col in variant_columns
        )

        if variant_barcode_column:
            print("✅ La columna 'variant_barcode' existe en warehouse_stock_variants")
        else:
            print(
                "❌ La columna 'variant_barcode' NO existe en warehouse_stock_variants"
            )
            return

        # Contar variantes con y sin códigos de barras
        cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants")
        total_variants = cursor.fetchone()[0]

        cursor.execute(
            "SELECT COUNT(*) FROM warehouse_stock_variants WHERE variant_barcode IS NOT NULL AND variant_barcode != ''"
        )
        with_barcode = cursor.fetchone()[0]

        cursor.execute(
            "SELECT COUNT(*) FROM warehouse_stock_variants WHERE variant_barcode IS NULL OR variant_barcode = ''"
        )
        without_barcode = cursor.fetchone()[0]

        print(f"   Total de variantes: {total_variants}")
        print(f"   Con códigos de barras: {with_barcode}")
        print(f"   Sin códigos de barras: {without_barcode}")

        if without_barcode == 0:
            print("✅ Todas las variantes tienen códigos de barras")
        else:
            print(f"⚠️  {without_barcode} variantes necesitan códigos de barras")

        print("\n3. 🔍 MUESTRA DE DATOS")
        print("-" * 50)

        # Mostrar algunos ejemplos de variantes con códigos de barras
        cursor.execute("""
            SELECT 
                wsv.id,
                wsv.variant_barcode,
                p.product_name,
                s.size_name,
                c.color_name,
                st.name as storage_name
            FROM warehouse_stock_variants wsv
            LEFT JOIN products p ON wsv.product_id = p.id
            LEFT JOIN sizes s ON wsv.size_id = s.id
            LEFT JOIN colors c ON wsv.color_id = c.id
            LEFT JOIN storage st ON wsv.branch_id = st.id
            WHERE wsv.variant_barcode IS NOT NULL AND wsv.variant_barcode != ''
            LIMIT 5
        """)

        examples = cursor.fetchall()

        if examples:
            print("   Ejemplos de variantes con códigos de barras:")
            for i, example in enumerate(examples, 1):
                product = example[2] or "Sin nombre"
                size = example[3] or "Sin talle"
                color = example[4] or "Sin color"
                storage = example[5] or "Sin sucursal"
                barcode = example[1]

                print(f"   {i}. {product} | {size} | {color} | {storage}")
                print(f"      🏷️  Código: {barcode}")
        else:
            print("   ❌ No se encontraron ejemplos de variantes con códigos de barras")

        print("\n4. 📈 RESUMEN FINAL")
        print("-" * 50)

        if (
            not barcodes_table
            and not barcode_column
            and variant_barcode_column
            and without_barcode == 0
        ):
            print("🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE")
            print("✅ Códigos de barras generales eliminados")
            print("✅ Códigos de barras por variante implementados")
            print("✅ Todas las variantes tienen códigos de barras")
            print("\n📝 SIGUIENTE PASO:")
            print("   - Verificar que el frontend muestre correctamente los datos")
            print("   - Probar la funcionalidad de búsqueda por códigos de variante")
        else:
            print("⚠️  MIGRACIÓN INCOMPLETA")
            if barcodes_table:
                print("❌ La tabla 'barcodes' debe ser eliminada")
            if barcode_column:
                print("❌ La columna 'barcode' debe ser eliminada de 'products'")
            if not variant_barcode_column:
                print(
                    "❌ La columna 'variant_barcode' debe existir en 'warehouse_stock_variants'"
                )
            if without_barcode > 0:
                print(f"❌ {without_barcode} variantes necesitan códigos de barras")

    except Exception as e:
        print(f"❌ Error durante la verificación: {e}")
    finally:
        conn.close()


if __name__ == "__main__":
    # Cambiar al directorio correcto
    generate_final_report()
