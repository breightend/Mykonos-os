#!/usr/bin/env python3
"""
Script definitivo para asegurar que TODOS los registros tengan variant_barcode
"""

import sqlite3
import os
import uuid


def main():
    print("🔧 SCRIPT DEFINITIVO - CORRIGIENDO TODOS LOS VARIANT_BARCODE")
    print("=" * 60)

    # Conectar a la base de datos
    db_path = os.path.join("database", "mykonos.db")

    if not os.path.exists(db_path):
        print(f"❌ ERROR: No se encontró la base de datos en {db_path}")
        return False

    print(f"✅ Conectando a: {db_path}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 1. Verificar estructura
        print("\n1. 📋 VERIFICANDO ESTRUCTURA...")
        cursor.execute("PRAGMA table_info(warehouse_stock_variants)")
        columns = [col[1] for col in cursor.fetchall()]

        if "variant_barcode" not in columns:
            print("❌ ERROR: La columna variant_barcode no existe!")
            return False

        print("✅ La columna variant_barcode existe")

        # 2. Contar registros
        print("\n2. 📊 CONTANDO REGISTROS...")
        cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants")
        total = cursor.fetchone()[0]
        print(f"   Total de registros: {total}")

        cursor.execute(
            "SELECT COUNT(*) FROM warehouse_stock_variants WHERE variant_barcode IS NULL"
        )
        null_barcodes = cursor.fetchone()[0]
        print(f"   Con variant_barcode NULL: {null_barcodes}")

        cursor.execute(
            "SELECT COUNT(*) FROM warehouse_stock_variants WHERE variant_barcode = ''"
        )
        empty_barcodes = cursor.fetchone()[0]
        print(f"   Con variant_barcode vacío: {empty_barcodes}")

        cursor.execute(
            "SELECT COUNT(*) FROM warehouse_stock_variants WHERE variant_barcode IS NOT NULL AND variant_barcode != ''"
        )
        valid_barcodes = cursor.fetchone()[0]
        print(f"   Con variant_barcode válido: {valid_barcodes}")

        # 3. Mostrar ejemplos problemáticos
        if null_barcodes > 0 or empty_barcodes > 0:
            print("\n3. 🔍 EJEMPLOS DE REGISTROS PROBLEMÁTICOS:")
            cursor.execute("""
                SELECT id, product_id, size_id, color_id, variant_barcode 
                FROM warehouse_stock_variants 
                WHERE variant_barcode IS NULL OR variant_barcode = ''
                LIMIT 5
            """)

            problematic = cursor.fetchall()
            for record in problematic:
                print(
                    f"   ID: {record[0]}, Product: {record[1]}, Size: {record[2]}, Color: {record[3]}, Barcode: {record[4]}"
                )

        # 4. Corregir registros NULL
        if null_barcodes > 0:
            print(
                f"\n4. 🔨 CORRIGIENDO {null_barcodes} REGISTROS CON variant_barcode NULL..."
            )

            cursor.execute(
                "SELECT id FROM warehouse_stock_variants WHERE variant_barcode IS NULL"
            )
            null_records = cursor.fetchall()

            updated_null = 0
            for record in null_records:
                record_id = record[0]
                new_barcode = str(uuid.uuid4())[:12].upper().replace("-", "")

                cursor.execute(
                    "UPDATE warehouse_stock_variants SET variant_barcode = ? WHERE id = ?",
                    (new_barcode, record_id),
                )
                updated_null += 1

                if updated_null <= 5:  # Mostrar solo los primeros 5
                    print(f"   ✅ ID {record_id}: {new_barcode}")

            print(f"   📝 Actualizados {updated_null} registros NULL")

        # 5. Corregir registros vacíos
        if empty_barcodes > 0:
            print(
                f"\n5. 🔨 CORRIGIENDO {empty_barcodes} REGISTROS CON variant_barcode VACÍO..."
            )

            cursor.execute(
                "SELECT id FROM warehouse_stock_variants WHERE variant_barcode = ''"
            )
            empty_records = cursor.fetchall()

            updated_empty = 0
            for record in empty_records:
                record_id = record[0]
                new_barcode = str(uuid.uuid4())[:12].upper().replace("-", "")

                cursor.execute(
                    "UPDATE warehouse_stock_variants SET variant_barcode = ? WHERE id = ?",
                    (new_barcode, record_id),
                )
                updated_empty += 1

                if updated_empty <= 5:  # Mostrar solo los primeros 5
                    print(f"   ✅ ID {record_id}: {new_barcode}")

            print(f"   📝 Actualizados {updated_empty} registros vacíos")

        # 6. Guardar cambios
        print("\n6. 💾 GUARDANDO CAMBIOS...")
        conn.commit()
        print("✅ Cambios guardados exitosamente")

        # 7. Verificación final
        print("\n7. ✅ VERIFICACIÓN FINAL...")
        cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants")
        final_total = cursor.fetchone()[0]

        cursor.execute(
            "SELECT COUNT(*) FROM warehouse_stock_variants WHERE variant_barcode IS NOT NULL AND variant_barcode != ''"
        )
        final_valid = cursor.fetchone()[0]

        cursor.execute(
            "SELECT COUNT(*) FROM warehouse_stock_variants WHERE variant_barcode IS NULL OR variant_barcode = ''"
        )
        final_invalid = cursor.fetchone()[0]

        print(f"   Total final: {final_total}")
        print(f"   Con códigos válidos: {final_valid}")
        print(f"   Sin códigos válidos: {final_invalid}")

        # 8. Mostrar ejemplos finales
        print("\n8. 📋 EJEMPLOS FINALES:")
        cursor.execute("""
            SELECT wsv.id, wsv.variant_barcode, p.product_name, s.size_name, c.color_name
            FROM warehouse_stock_variants wsv
            LEFT JOIN products p ON wsv.product_id = p.id
            LEFT JOIN sizes s ON wsv.size_id = s.id
            LEFT JOIN colors c ON wsv.color_id = c.id
            WHERE wsv.variant_barcode IS NOT NULL AND wsv.variant_barcode != ''
            LIMIT 5
        """)

        examples = cursor.fetchall()
        for i, example in enumerate(examples, 1):
            product = example[2] or "Sin nombre"
            size = example[3] or "Sin talle"
            color = example[4] or "Sin color"
            barcode = example[1]
            print(f"   {i}. {product} | {size} | {color} | 🏷️  {barcode}")

        # Resultado final
        if final_invalid == 0:
            print(f"\n🎉 ¡ÉXITO TOTAL!")
            print(
                f"✅ Todos los {final_total} registros tienen códigos de barras válidos"
            )
            return True
        else:
            print(
                f"\n⚠️  ATENCIÓN: Aún hay {final_invalid} registros sin códigos válidos"
            )
            return False

    except Exception as e:
        print(f"\n❌ ERROR DURANTE LA EJECUCIÓN: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()


if __name__ == "__main__":
    success = main()
    if success:
        print("\n🎯 PRÓXIMO PASO: Reiniciar el servidor backend para aplicar cambios")
    else:
        print("\n🔄 REINTENTAR: Ejecutar el script nuevamente si es necesario")
