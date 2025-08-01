#!/usr/bin/env python3
"""
Script de migración para agregar códigos de barras únicos por variante
Agrega el campo 'variant_barcode' a la tabla warehouse_stock_variants
y genera códigos únicos para todas las variantes existentes.
"""

import sqlite3
import sys
import os
from datetime import datetime

# Agregar el directorio padre al path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.barcode_service import BarcodeService


def migrate_add_variant_barcodes(db_path):
    """
    Migración para agregar códigos de barras únicos por variante
    """
    try:
        # Conectar a la base de datos
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print("🔄 Iniciando migración de códigos de barras por variante...")

        # 1. Verificar si la columna ya existe
        cursor.execute("PRAGMA table_info(warehouse_stock_variants)")
        columns = [column[1] for column in cursor.fetchall()]

        if "variant_barcode" in columns:
            print("✅ La columna 'variant_barcode' ya existe.")
        else:
            # 2. Agregar la nueva columna
            print(
                "📝 Agregando columna 'variant_barcode' a warehouse_stock_variants..."
            )
            cursor.execute("""
                ALTER TABLE warehouse_stock_variants 
                ADD COLUMN variant_barcode TEXT UNIQUE
            """)
            conn.commit()
            print("✅ Columna agregada exitosamente.")

        # 3. Obtener todas las variantes existentes sin código de barras
        print("🔍 Obteniendo variantes existentes sin código de barras...")
        cursor.execute("""
            SELECT id, product_id, size_id, color_id, branch_id
            FROM warehouse_stock_variants 
            WHERE variant_barcode IS NULL OR variant_barcode = ''
        """)
        variants = cursor.fetchall()

        if not variants:
            print("✅ Todas las variantes ya tienen códigos de barras asignados.")
            return

        print(f"📊 Se encontraron {len(variants)} variantes sin código de barras.")

        # 4. Generar códigos de barras para cada variante
        barcode_service = BarcodeService()
        updated_count = 0
        errors = 0

        for variant in variants:
            variant_id, product_id, size_id, color_id, branch_id = variant

            try:
                # Generar código único para esta variante
                variant_barcode = barcode_service.generate_variant_barcode(
                    product_id, size_id, color_id
                )

                # Verificar que el código no exista ya
                cursor.execute(
                    """
                    SELECT COUNT(*) FROM warehouse_stock_variants 
                    WHERE variant_barcode = ?
                """,
                    (variant_barcode,),
                )

                if cursor.fetchone()[0] > 0:
                    print(
                        f"⚠️  Código de barras {variant_barcode} ya existe, generando uno alternativo..."
                    )
                    # Agregar sufijo único basado en el ID de la variante
                    variant_barcode = (
                        f"{variant_barcode[:10]}{str(variant_id).zfill(3)}"
                    )

                # Actualizar el registro con el nuevo código
                cursor.execute(
                    """
                    UPDATE warehouse_stock_variants 
                    SET variant_barcode = ?
                    WHERE id = ?
                """,
                    (variant_barcode, variant_id),
                )

                updated_count += 1

                if updated_count % 100 == 0:
                    print(f"⏳ Procesadas {updated_count} variantes...")

            except Exception as e:
                print(f"❌ Error procesando variante ID {variant_id}: {str(e)}")
                errors += 1
                continue

        # 5. Confirmar cambios
        conn.commit()

        print(f"\n✅ Migración completada:")
        print(f"   📈 Variantes actualizadas: {updated_count}")
        print(f"   ❌ Errores: {errors}")
        print(f"   📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        # 6. Verificar integridad
        print("\n🔍 Verificando integridad de datos...")
        cursor.execute("""
            SELECT COUNT(*) FROM warehouse_stock_variants 
            WHERE variant_barcode IS NULL OR variant_barcode = ''
        """)
        remaining = cursor.fetchone()[0]

        if remaining == 0:
            print("✅ Todas las variantes tienen códigos de barras únicos.")
        else:
            print(f"⚠️  Quedan {remaining} variantes sin código de barras.")

        # 7. Mostrar estadísticas
        cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants")
        total_variants = cursor.fetchone()[0]

        cursor.execute("""
            SELECT COUNT(DISTINCT variant_barcode) 
            FROM warehouse_stock_variants 
            WHERE variant_barcode IS NOT NULL
        """)
        unique_barcodes = cursor.fetchone()[0]

        print(f"\n📊 Estadísticas finales:")
        print(f"   Total de variantes: {total_variants}")
        print(f"   Códigos únicos: {unique_barcodes}")

        conn.close()

    except Exception as e:
        print(f"❌ Error durante la migración: {str(e)}")
        if "conn" in locals():
            conn.rollback()
            conn.close()
        raise


def main():
    """Función principal del script de migración"""

    # Ruta a la base de datos
    db_path = os.path.join(os.path.dirname(__file__), "mykonos.db")

    if not os.path.exists(db_path):
        print(f"❌ No se encontró la base de datos en: {db_path}")
        print("Por favor, verifica la ruta de la base de datos.")
        return

    print(f"🎯 Base de datos: {db_path}")

    # Hacer backup antes de la migración
    backup_path = f"{db_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    try:
        import shutil

        shutil.copy2(db_path, backup_path)
        print(f"💾 Backup creado: {backup_path}")
    except Exception as e:
        print(f"⚠️  No se pudo crear backup: {str(e)}")
        response = input("¿Continuar sin backup? (s/N): ")
        if response.lower() != "s":
            print("Migración cancelada.")
            return

    # Ejecutar migración
    try:
        migrate_add_variant_barcodes(db_path)
        print("\n🎉 ¡Migración completada exitosamente!")

    except Exception as e:
        print(f"\n💥 Migración falló: {str(e)}")
        if os.path.exists(backup_path):
            print(f"🔄 Para restaurar el backup: cp {backup_path} {db_path}")


if __name__ == "__main__":
    main()
