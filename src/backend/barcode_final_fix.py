import sqlite3
import uuid
import os


def fix_barcodes():
    print("🔧 CORRECCIÓN FINAL DE CÓDIGOS DE BARRAS")
    print("=" * 40)

    # Cambiar al directorio correcto
    db_path = os.path.join("database", "mykonos.db")

    print(f"Conectando a: {db_path}")

    if not os.path.exists(db_path):
        print(f"❌ ERROR: Base de datos no encontrada en {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Contar registros con variant_barcode NULL
        cursor.execute(
            "SELECT COUNT(*) FROM warehouse_stock_variants WHERE variant_barcode IS NULL"
        )
        null_count = cursor.fetchone()[0]

        print(f"📊 Registros con variant_barcode NULL: {null_count}")

        if null_count > 0:
            # Obtener IDs de registros NULL
            cursor.execute(
                "SELECT id FROM warehouse_stock_variants WHERE variant_barcode IS NULL"
            )
            null_records = cursor.fetchall()

            print(f"🔨 Actualizando {len(null_records)} registros...")

            # Actualizar cada registro
            for i, record in enumerate(null_records):
                record_id = record[0]
                new_barcode = str(uuid.uuid4())[:12].upper().replace("-", "")

                cursor.execute(
                    "UPDATE warehouse_stock_variants SET variant_barcode = ? WHERE id = ?",
                    (new_barcode, record_id),
                )

                if i < 5:  # Mostrar solo los primeros 5
                    print(f"   ✅ ID {record_id}: {new_barcode}")
                elif i == 5:
                    print(f"   ... y {len(null_records) - 5} más")

            # Guardar cambios
            conn.commit()
            print(f"✅ SUCCESS: {len(null_records)} registros actualizados")
        else:
            print("✅ SUCCESS: No hay registros NULL")

        # Verificación final
        cursor.execute(
            "SELECT COUNT(*) FROM warehouse_stock_variants WHERE variant_barcode IS NULL"
        )
        final_null = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants")
        total = cursor.fetchone()[0]

        print(f"\n📋 VERIFICACIÓN FINAL:")
        print(f"   Total registros: {total}")
        print(f"   NULL restantes: {final_null}")
        print(f"   Válidos: {total - final_null}")

        if final_null == 0:
            print("🎉 ÉXITO: Todos los registros tienen variant_barcode")
            print("\n📝 REINICIA EL SERVIDOR BACKEND PARA APLICAR CAMBIOS")
        else:
            print(f"⚠️  ATENCIÓN: Aún hay {final_null} registros NULL")

        # Mostrar ejemplos
        print(f"\n📝 EJEMPLOS:")
        cursor.execute(
            "SELECT id, variant_barcode FROM warehouse_stock_variants WHERE variant_barcode IS NOT NULL LIMIT 3"
        )
        examples = cursor.fetchall()
        for example in examples:
            print(f"   ID {example[0]}: {example[1]}")

    except Exception as e:
        print(f"❌ ERROR: {e}")
        conn.rollback()
    finally:
        conn.close()


if __name__ == "__main__":
    fix_barcodes()
