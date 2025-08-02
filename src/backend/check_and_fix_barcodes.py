#!/usr/bin/env python3
"""
Script para verificar y corregir códigos de barras de variantes
"""

import sqlite3
import os
import uuid


def main():
    print("🔧 VERIFICANDO Y CORRIGIENDO CÓDIGOS DE BARRAS...")

    # Conectar a la base de datos
    db_path = os.path.join("database", "mykonos.db")
    if not os.path.exists(db_path):
        print(f"❌ No se encontró la base de datos en: {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Verificar estado actual
        cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants")
        total = cursor.fetchone()[0]

        cursor.execute(
            'SELECT COUNT(*) FROM warehouse_stock_variants WHERE variant_barcode IS NOT NULL AND variant_barcode != ""'
        )
        with_barcode = cursor.fetchone()[0]

        cursor.execute(
            'SELECT COUNT(*) FROM warehouse_stock_variants WHERE variant_barcode IS NULL OR variant_barcode = ""'
        )
        without_barcode = cursor.fetchone()[0]

        print(f"📊 ESTADO ACTUAL:")
        print(f"  Total registros: {total}")
        print(f"  Con barcode: {with_barcode}")
        print(f"  Sin barcode: {without_barcode}")

        if without_barcode > 0:
            print(f"\n🔨 GENERANDO {without_barcode} CÓDIGOS DE BARRAS...")

            # Obtener registros sin código de barras
            cursor.execute(
                'SELECT id FROM warehouse_stock_variants WHERE variant_barcode IS NULL OR variant_barcode = ""'
            )
            records = cursor.fetchall()

            updated = 0
            for record in records:
                variant_id = record[0]
                new_barcode = str(uuid.uuid4())[:12].upper()
                cursor.execute(
                    "UPDATE warehouse_stock_variants SET variant_barcode = ? WHERE id = ?",
                    (new_barcode, variant_id),
                )
                updated += 1

            conn.commit()
            print(f"✅ Actualizados {updated} registros")
        else:
            print("✅ Todos los registros ya tienen códigos de barras")

        # Verificar estado final
        cursor.execute(
            'SELECT COUNT(*) FROM warehouse_stock_variants WHERE variant_barcode IS NOT NULL AND variant_barcode != ""'
        )
        final_with_barcode = cursor.fetchone()[0]

        print(f"\n📊 ESTADO FINAL:")
        print(f"  Total con barcode: {final_with_barcode}/{total}")

        # Mostrar algunos ejemplos
        print(f"\n📋 EJEMPLOS:")
        cursor.execute("""
            SELECT wsv.id, wsv.variant_barcode, p.product_name, s.size_name, c.color_name
            FROM warehouse_stock_variants wsv
            LEFT JOIN products p ON wsv.product_id = p.id
            LEFT JOIN sizes s ON wsv.size_id = s.id
            LEFT JOIN colors c ON wsv.color_id = c.id
            LIMIT 3
        """)

        examples = cursor.fetchall()
        for i, row in enumerate(examples, 1):
            print(
                f"  {i}. ID:{row[0]} | Barcode:{row[1]} | {row[2]} | {row[3]} | {row[4]}"
            )

        print("\n🎉 PROCESO COMPLETADO EXITOSAMENTE")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
