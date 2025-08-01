#!/usr/bin/env python3
"""
Script de migración alternativo para agregar códigos de barras únicos por variante
Usa una estrategia de recrear la tabla para evitar problemas con UNIQUE constraints
"""

import sqlite3
import sys
import os
from datetime import datetime

# Agregar el directorio padre al path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.barcode_service import BarcodeService


def migrate_add_variant_barcodes_v2(db_path):
    """
    Migración alternativa para agregar códigos de barras únicos por variante
    """
    try:
        # Conectar a la base de datos
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print("🔄 Iniciando migración alternativa de códigos de barras por variante...")

        # 1. Verificar si la columna ya existe
        cursor.execute("PRAGMA table_info(warehouse_stock_variants)")
        columns = [column[1] for column in cursor.fetchall()]

        if "variant_barcode" in columns:
            print(
                "✅ La columna 'variant_barcode' ya existe. Actualizando códigos existentes..."
            )

            # Solo actualizar registros sin código
            cursor.execute("""
                SELECT id, product_id, size_id, color_id, branch_id
                FROM warehouse_stock_variants 
                WHERE variant_barcode IS NULL OR variant_barcode = ''
            """)
            variants = cursor.fetchall()

        else:
            print("📝 Creando nueva estructura de tabla...")

            # 2. Obtener todas las variantes existentes
            cursor.execute("""
                SELECT id, product_id, size_id, color_id, branch_id, quantity, last_updated
                FROM warehouse_stock_variants
            """)
            variants = cursor.fetchall()

            # 3. Crear tabla temporal con la nueva estructura
            cursor.execute("""
                CREATE TABLE warehouse_stock_variants_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id INTEGER NOT NULL,
                    size_id INTEGER,
                    color_id INTEGER,
                    branch_id INTEGER NOT NULL,
                    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
                    variant_barcode TEXT,
                    last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (product_id) REFERENCES products (id),
                    FOREIGN KEY (size_id) REFERENCES sizes (id),
                    FOREIGN KEY (color_id) REFERENCES colors (id),
                    FOREIGN KEY (branch_id) REFERENCES storage (id)
                )
            """)

            print("✅ Tabla temporal creada.")

        if not variants:
            print("✅ No hay variantes para procesar.")
            return

        print(f"📊 Procesando {len(variants)} variantes...")

        # 4. Generar códigos de barras y actualizar/insertar datos
        barcode_service = BarcodeService()
        updated_count = 0
        errors = 0
        used_barcodes = set()

        for variant in variants:
            if "variant_barcode" in columns:
                # Modo actualización
                variant_id, product_id, size_id, color_id, branch_id = variant
                quantity = None  # No lo necesitamos en modo actualización
                last_updated = None
            else:
                # Modo migración completa
                (
                    variant_id,
                    product_id,
                    size_id,
                    color_id,
                    branch_id,
                    quantity,
                    last_updated,
                ) = variant

            try:
                # Generar código único para esta variante
                variant_barcode = barcode_service.generate_variant_barcode(
                    product_id, size_id, color_id
                )

                # Verificar unicidad y agregar sufijo si es necesario
                original_barcode = variant_barcode
                counter = 1
                while variant_barcode in used_barcodes:
                    variant_barcode = f"{original_barcode}_{counter:03d}"
                    counter += 1

                used_barcodes.add(variant_barcode)

                if "variant_barcode" in columns:
                    # Actualizar registro existente
                    cursor.execute(
                        """
                        UPDATE warehouse_stock_variants 
                        SET variant_barcode = ?
                        WHERE id = ?
                    """,
                        (variant_barcode, variant_id),
                    )
                else:
                    # Insertar en tabla nueva
                    cursor.execute(
                        """
                        INSERT INTO warehouse_stock_variants_new 
                        (id, product_id, size_id, color_id, branch_id, quantity, variant_barcode, last_updated)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                        (
                            variant_id,
                            product_id,
                            size_id,
                            color_id,
                            branch_id,
                            quantity,
                            variant_barcode,
                            last_updated,
                        ),
                    )

                updated_count += 1

                if updated_count % 50 == 0:
                    print(f"⏳ Procesadas {updated_count} variantes...")

            except Exception as e:
                print(f"❌ Error procesando variante ID {variant_id}: {str(e)}")
                errors += 1
                continue

        # 5. Si estamos en modo migración completa, reemplazar la tabla
        if "variant_barcode" not in columns:
            print("🔄 Reemplazando tabla original...")

            # Eliminar tabla original
            cursor.execute("DROP TABLE warehouse_stock_variants")

            # Renombrar tabla nueva
            cursor.execute("""
                ALTER TABLE warehouse_stock_variants_new 
                RENAME TO warehouse_stock_variants
            """)

            # Crear índice para mejorar rendimiento
            cursor.execute("""
                CREATE INDEX idx_variant_barcode 
                ON warehouse_stock_variants(variant_barcode)
            """)

            print("✅ Tabla reemplazada exitosamente.")

        # 6. Confirmar cambios
        conn.commit()

        print(f"\n✅ Migración completada:")
        print(f"   📈 Variantes procesadas: {updated_count}")
        print(f"   ❌ Errores: {errors}")
        print(f"   📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

        # 7. Verificar integridad
        print("\n🔍 Verificando integridad de datos...")
        cursor.execute("""
            SELECT COUNT(*) FROM warehouse_stock_variants 
            WHERE variant_barcode IS NULL OR variant_barcode = ''
        """)
        remaining = cursor.fetchone()[0]

        if remaining == 0:
            print("✅ Todas las variantes tienen códigos de barras.")
        else:
            print(f"⚠️  Quedan {remaining} variantes sin código de barras.")

        # 8. Mostrar estadísticas
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
    backup_path = f"{db_path}.backup_v2_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

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
        migrate_add_variant_barcodes_v2(db_path)
        print("\n🎉 ¡Migración completada exitosamente!")

    except Exception as e:
        print(f"\n💥 Migración falló: {str(e)}")
        if os.path.exists(backup_path):
            print(f'🔄 Para restaurar el backup: copy "{backup_path}" "{db_path}"')


if __name__ == "__main__":
    main()
