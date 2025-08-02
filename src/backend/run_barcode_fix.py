import sqlite3
import os
import sys
from datetime import datetime

# Agregar el directorio actual al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from services.barcode_service import BarcodeService

    print("✅ BarcodeService importado correctamente")
except ImportError as e:
    print(f"❌ Error importando BarcodeService: {e}")
    sys.exit(1)


def main():
    print("🔄 Iniciando generación de códigos de barras para variantes...")

    # Conexión a la base de datos
    db_path = os.path.join("database", "mykonos.db")
    if not os.path.exists(db_path):
        print(f"❌ No se encontró la base de datos en {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Crear instancia del servicio de códigos de barras
    barcode_service = BarcodeService()

    try:
        # Verificar si existe la columna variant_barcode
        cursor.execute("PRAGMA table_info(warehouse_stock_variants)")
        columns = cursor.fetchall()
        has_barcode_column = any(col[1] == "variant_barcode" for col in columns)

        if not has_barcode_column:
            print("❌ La columna 'variant_barcode' no existe en la tabla")
            return

        # Contar variantes sin código de barras
        cursor.execute("""
            SELECT COUNT(*) 
            FROM warehouse_stock_variants 
            WHERE variant_barcode IS NULL OR variant_barcode = ''
        """)
        count_without_barcode = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants")
        total_variants = cursor.fetchone()[0]

        print(f"📊 Estadísticas:")
        print(f"  Total de variantes: {total_variants}")
        print(f"  Sin código de barras: {count_without_barcode}")
        print(f"  Con código de barras: {total_variants - count_without_barcode}")

        if count_without_barcode == 0:
            print("\n✅ Todas las variantes ya tienen códigos de barras")
            return

        # Obtener variantes sin código de barras
        cursor.execute("""
            SELECT id, product_id, size_id, color_id
            FROM warehouse_stock_variants 
            WHERE variant_barcode IS NULL OR variant_barcode = ''
            ORDER BY product_id, size_id, color_id
        """)

        variants_without_barcode = cursor.fetchall()

        print(
            f"\n🔄 Generando códigos de barras para {len(variants_without_barcode)} variantes..."
        )

        updated_count = 0
        error_count = 0

        for variant in variants_without_barcode:
            variant_id, product_id, size_id, color_id = variant

            try:
                # Generar código de barras para la variante
                variant_barcode = barcode_service.generate_variant_barcode(
                    product_id, size_id, color_id
                )

                # Actualizar el registro
                cursor.execute(
                    """
                    UPDATE warehouse_stock_variants 
                    SET variant_barcode = ?, last_updated = ?
                    WHERE id = ?
                """,
                    (variant_barcode, datetime.now().isoformat(), variant_id),
                )

                updated_count += 1

                if updated_count % 10 == 0:
                    print(f"  ✅ Procesadas {updated_count} variantes...")

            except Exception as e:
                error_count += 1
                print(f"  ❌ Error en variante ID {variant_id}: {e}")

        # Confirmar cambios
        conn.commit()

        print(f"\n🎉 Proceso completado:")
        print(f"  ✅ Códigos generados: {updated_count}")
        print(f"  ❌ Errores: {error_count}")

        # Verificar resultado final
        cursor.execute("""
            SELECT COUNT(*) 
            FROM warehouse_stock_variants 
            WHERE variant_barcode IS NOT NULL AND variant_barcode != ''
        """)
        with_barcode = cursor.fetchone()[0]

        print(f"\n📊 Resultado final:")
        print(f"  Con códigos de barras: {with_barcode}")

        # Mostrar algunos ejemplos
        if with_barcode > 0:
            print(f"\n📝 Ejemplos de códigos generados:")
            cursor.execute("""
                SELECT wsv.variant_barcode, p.product_name, s.size_name, c.color_name
                FROM warehouse_stock_variants wsv
                LEFT JOIN products p ON wsv.product_id = p.id
                LEFT JOIN sizes s ON wsv.size_id = s.id
                LEFT JOIN colors c ON wsv.color_id = c.id
                WHERE wsv.variant_barcode IS NOT NULL AND wsv.variant_barcode != ''
                ORDER BY wsv.id
                LIMIT 5
            """)

            examples = cursor.fetchall()
            for ex in examples:
                barcode, product_name, size_name, color_name = ex
                print(f"  {barcode} → {product_name} ({size_name}, {color_name})")

    except Exception as e:
        print(f"❌ Error durante la ejecución: {e}")
        conn.rollback()

    finally:
        conn.close()


if __name__ == "__main__":
    main()
