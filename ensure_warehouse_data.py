#!/usr/bin/env python3
"""
Script para migrar y asegurar datos en warehouse_stock_variants
"""

import sqlite3
import os
from datetime import datetime


def ensure_warehouse_variants_data():
    """Asegura que hay datos en warehouse_stock_variants migrando desde warehouse_stock si es necesario"""

    backend_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(backend_dir, "src", "backend", "database", "mykonos.db")

    print(f"🔍 Conectando a la base de datos: {db_path}")

    if not os.path.exists(db_path):
        print(f"❌ Base de datos no encontrada en {db_path}")
        return False

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # 1. Verificar estado actual
        cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants")
        variants_count = cursor.fetchone()[0]
        print(f"📊 Variantes actuales en warehouse_stock_variants: {variants_count}")

        cursor.execute("SELECT COUNT(*) FROM warehouse_stock WHERE quantity > 0")
        stock_count = cursor.fetchone()[0]
        print(f"📊 Registros con stock en warehouse_stock: {stock_count}")

        # 2. Si no hay variantes pero hay stock tradicional, migrar
        if variants_count == 0 and stock_count > 0:
            print("🔄 Migrando datos de warehouse_stock a warehouse_stock_variants...")
            migrate_warehouse_data(cursor, conn)

        # 3. Verificar/crear talles y colores por defecto
        ensure_default_sizes_colors(cursor, conn)

        # 4. Asegurar códigos de barras
        fix_missing_variant_barcodes(cursor, conn)

        # 5. Verificar resultado final
        cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants")
        final_count = cursor.fetchone()[0]
        print(f"✅ Total final de variantes: {final_count}")

        # 6. Mostrar ejemplos
        show_sample_variants(cursor)

        conn.close()
        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def ensure_default_sizes_colors(cursor, conn):
    """Asegura que existan talles y colores por defecto"""
    try:
        # Verificar talles
        cursor.execute("SELECT COUNT(*) FROM sizes")
        sizes_count = cursor.fetchone()[0]

        if sizes_count == 0:
            print("🔧 Creando talles por defecto...")
            default_sizes = [("XS",), ("S",), ("M",), ("L",), ("XL",), ("XXL",)]
            cursor.executemany(
                "INSERT INTO sizes (size_name) VALUES (?)", default_sizes
            )

        # Verificar colores
        cursor.execute("SELECT COUNT(*) FROM colors")
        colors_count = cursor.fetchone()[0]

        if colors_count == 0:
            print("🔧 Creando colores por defecto...")
            default_colors = [
                ("Negro", "#000000"),
                ("Blanco", "#FFFFFF"),
                ("Azul", "#0000FF"),
                ("Rojo", "#FF0000"),
                ("Verde", "#00FF00"),
                ("Amarillo", "#FFFF00"),
                ("Gris", "#808080"),
            ]
            cursor.executemany(
                "INSERT INTO colors (color_name, color_hex) VALUES (?, ?)",
                default_colors,
            )

        conn.commit()

    except Exception as e:
        print(f"❌ Error creando datos por defecto: {e}")
        conn.rollback()


def migrate_warehouse_data(cursor, conn):
    """Migra datos de warehouse_stock a warehouse_stock_variants"""
    try:
        # Obtener talle y color por defecto
        cursor.execute("SELECT id FROM sizes ORDER BY id LIMIT 1")
        default_size_result = cursor.fetchone()
        cursor.execute("SELECT id FROM colors ORDER BY id LIMIT 1")
        default_color_result = cursor.fetchone()

        if not default_size_result or not default_color_result:
            print("❌ No hay talles o colores disponibles para la migración")
            return

        default_size_id = default_size_result[0]
        default_color_id = default_color_result[0]

        print(f"📏 Usando talle por defecto ID: {default_size_id}")
        print(f"🎨 Usando color por defecto ID: {default_color_id}")

        # Migrar cada registro de warehouse_stock
        cursor.execute("""
            SELECT product_id, branch_id, quantity
            FROM warehouse_stock 
            WHERE quantity > 0
        """)
        stock_records = cursor.fetchall()

        migrated = 0
        for product_id, branch_id, quantity in stock_records:
            # Verificar si ya existe
            cursor.execute(
                """
                SELECT id FROM warehouse_stock_variants
                WHERE product_id = ? AND branch_id = ? AND size_id = ? AND color_id = ?
            """,
                (product_id, branch_id, default_size_id, default_color_id),
            )

            if cursor.fetchone():
                continue  # Ya existe

            # Generar código de barras
            variant_barcode = (
                f"VAR-{product_id}-{default_size_id}-{default_color_id}-{branch_id}"
            )

            # Insertar variante
            cursor.execute(
                """
                INSERT INTO warehouse_stock_variants 
                (product_id, branch_id, size_id, color_id, quantity, variant_barcode, last_updated)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
                (
                    product_id,
                    branch_id,
                    default_size_id,
                    default_color_id,
                    quantity,
                    variant_barcode,
                    datetime.now().isoformat(),
                ),
            )

            migrated += 1

        conn.commit()
        print(f"✅ Migrados {migrated} registros a warehouse_stock_variants")

    except Exception as e:
        print(f"❌ Error durante la migración: {e}")
        conn.rollback()


def fix_missing_variant_barcodes(cursor, conn):
    """Corrige códigos de barras faltantes"""
    try:
        cursor.execute("""
            SELECT id, product_id, size_id, color_id, branch_id
            FROM warehouse_stock_variants
            WHERE variant_barcode IS NULL OR variant_barcode = ''
        """)
        missing_barcodes = cursor.fetchall()

        if missing_barcodes:
            print(
                f"🔧 Corrigiendo {len(missing_barcodes)} códigos de barras faltantes..."
            )

            for (
                variant_id,
                product_id,
                size_id,
                color_id,
                branch_id,
            ) in missing_barcodes:
                variant_barcode = f"VAR-{product_id}-{size_id or 0}-{color_id or 0}-{branch_id}-{variant_id}"

                cursor.execute(
                    """
                    UPDATE warehouse_stock_variants
                    SET variant_barcode = ?
                    WHERE id = ?
                """,
                    (variant_barcode, variant_id),
                )

            conn.commit()
            print(f"✅ Corregidos {len(missing_barcodes)} códigos de barras")
        else:
            print("✅ Todos los códigos de barras están presentes")

    except Exception as e:
        print(f"❌ Error corrigiendo códigos de barras: {e}")
        conn.rollback()


def show_sample_variants(cursor):
    """Muestra variantes de ejemplo"""
    try:
        cursor.execute("""
            SELECT 
                wsv.id,
                wsv.product_id,
                p.product_name,
                s.size_name,
                c.color_name,
                st.name as sucursal,
                wsv.quantity,
                wsv.variant_barcode
            FROM warehouse_stock_variants wsv
            LEFT JOIN products p ON wsv.product_id = p.id
            LEFT JOIN sizes s ON wsv.size_id = s.id
            LEFT JOIN colors c ON wsv.color_id = c.id
            LEFT JOIN storage st ON wsv.branch_id = st.id
            LIMIT 5
        """)

        samples = cursor.fetchall()
        if samples:
            print("\n📋 EJEMPLOS DE VARIANTES:")
            for row in samples:
                (
                    variant_id,
                    product_id,
                    product_name,
                    size_name,
                    color_name,
                    sucursal,
                    quantity,
                    variant_barcode,
                ) = row
                print(
                    f"   ID: {variant_id} | Producto: {product_name or 'Sin nombre'} ({product_id})"
                )
                print(
                    f"      Talle: {size_name or 'Sin talle'} | Color: {color_name or 'Sin color'}"
                )
                print(
                    f"      Sucursal: {sucursal or 'Sin sucursal'} | Cantidad: {quantity}"
                )
                print(f"      Código: {variant_barcode or 'SIN CÓDIGO'}")
                print("")
        else:
            print("No hay variantes para mostrar")

    except Exception as e:
        print(f"❌ Error mostrando ejemplos: {e}")


if __name__ == "__main__":
    print("🚀 INICIANDO MIGRACIÓN Y VERIFICACIÓN DE WAREHOUSE_STOCK_VARIANTS")
    print("=" * 70)

    success = ensure_warehouse_variants_data()

    if success:
        print("\n✅ Proceso completado exitosamente")
        print("🔄 Ahora reinicia el backend y prueba el frontend")
    else:
        print("\n❌ Proceso falló - revisar errores arriba")
