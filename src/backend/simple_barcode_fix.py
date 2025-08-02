"""
Script directo para ejecutar la generación de códigos de barras
"""

import sqlite3
import os
from datetime import datetime


def generate_barcodes():
    print("🔄 Generando códigos de barras para variantes...")

    # Conexión directa a la base de datos
    db_path = "database/mykonos.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Función para generar código de barras de variante
        def generate_variant_barcode(
            product_id, size_id=None, color_id=None, prefix="VAR"
        ):
            size_part = str(size_id).zfill(3) if size_id else "000"
            color_part = str(color_id).zfill(3) if color_id else "000"
            product_part = str(product_id).zfill(4)
            return f"{prefix}{product_part}{size_part}{color_part}"

        # Verificar columna variant_barcode
        cursor.execute("PRAGMA table_info(warehouse_stock_variants)")
        columns = cursor.fetchall()
        has_barcode_column = any(col[1] == "variant_barcode" for col in columns)

        if not has_barcode_column:
            print("❌ La columna 'variant_barcode' no existe")
            return

        # Contar variantes sin código de barras
        cursor.execute("""
            SELECT COUNT(*) FROM warehouse_stock_variants 
            WHERE variant_barcode IS NULL OR variant_barcode = ''
        """)
        count_without = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants")
        total = cursor.fetchone()[0]

        print(f"📊 Total variantes: {total}")
        print(f"📊 Sin códigos: {count_without}")
        print(f"📊 Con códigos: {total - count_without}")

        if count_without == 0:
            print("✅ Todas las variantes ya tienen códigos de barras")
            return

        # Obtener variantes sin código
        cursor.execute("""
            SELECT id, product_id, size_id, color_id
            FROM warehouse_stock_variants 
            WHERE variant_barcode IS NULL OR variant_barcode = ''
        """)

        variants = cursor.fetchall()

        print(f"🔄 Actualizando {len(variants)} variantes...")

        updated = 0
        for variant in variants:
            variant_id, product_id, size_id, color_id = variant

            # Generar código
            barcode = generate_variant_barcode(product_id, size_id, color_id)

            # Actualizar registro
            cursor.execute(
                """
                UPDATE warehouse_stock_variants 
                SET variant_barcode = ?, last_updated = ?
                WHERE id = ?
            """,
                (barcode, datetime.now().isoformat(), variant_id),
            )

            updated += 1

            if updated % 10 == 0:
                print(f"  ✅ Procesadas {updated} variantes...")

        # Confirmar cambios
        conn.commit()

        print(f"🎉 Proceso completado: {updated} códigos generados")

        # Verificar resultado
        cursor.execute("""
            SELECT COUNT(*) FROM warehouse_stock_variants 
            WHERE variant_barcode IS NOT NULL AND variant_barcode != ''
        """)
        final_count = cursor.fetchone()[0]

        print(f"📊 Resultado final: {final_count} variantes con códigos")

        # Mostrar ejemplos
        cursor.execute("""
            SELECT variant_barcode, product_id, size_id, color_id
            FROM warehouse_stock_variants 
            WHERE variant_barcode IS NOT NULL AND variant_barcode != ''
            LIMIT 3
        """)

        examples = cursor.fetchall()
        print("📝 Ejemplos:")
        for ex in examples:
            print(f"  {ex[0]} → Producto:{ex[1]}, Talle:{ex[2]}, Color:{ex[3]}")

    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()

    finally:
        conn.close()


if __name__ == "__main__":
    generate_barcodes()
