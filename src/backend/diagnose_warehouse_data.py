import sqlite3
import os
from datetime import datetime


def diagnose_and_fix_warehouse_data():
    """Diagnostica y corrige datos en warehouse_stock_variants"""

    db_path = os.path.join("database", "mykonos.db")
    print(f"🔍 Conectando a: {db_path}")

    if not os.path.exists(db_path):
        print(f"❌ Base de datos no encontrada en {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 1. Verificar productos existentes
        cursor.execute("SELECT COUNT(*) FROM products")
        products_count = cursor.fetchone()[0]
        print(f"📦 Total de productos: {products_count}")

        # 2. Verificar warehouse_stock (stock tradicional)
        cursor.execute("SELECT COUNT(*) FROM warehouse_stock")
        warehouse_count = cursor.fetchone()[0]
        print(f"📊 Registros en warehouse_stock: {warehouse_count}")

        # 3. Verificar warehouse_stock_variants (stock por variantes)
        cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants")
        variants_count = cursor.fetchone()[0]
        print(f"🎨 Registros en warehouse_stock_variants: {variants_count}")

        # 4. Verificar si hay sucursales
        cursor.execute("SELECT COUNT(*) FROM storage")
        storage_count = cursor.fetchone()[0]
        print(f"🏪 Sucursales disponibles: {storage_count}")

        # 5. Verificar si hay talles
        cursor.execute("SELECT COUNT(*) FROM sizes")
        sizes_count = cursor.fetchone()[0]
        print(f"📏 Talles disponibles: {sizes_count}")

        # 6. Verificar si hay colores
        cursor.execute("SELECT COUNT(*) FROM colors")
        colors_count = cursor.fetchone()[0]
        print(f"🎨 Colores disponibles: {colors_count}")

        print(f"\n" + "=" * 60)

        # Si hay productos pero no hay warehouse_stock_variants, crear algunos
        if products_count > 0 and variants_count == 0:
            print("⚠️ HAY PRODUCTOS PERO NO HAY VARIANTES DE STOCK")
            print("🔧 Intentando crear variantes de stock desde warehouse_stock...")

            # Migrar desde warehouse_stock a warehouse_stock_variants
            migrate_from_warehouse_stock(cursor, conn)

        elif variants_count > 0:
            print("✅ HAY VARIANTES DE STOCK DISPONIBLES")

            # Verificar códigos de barras
            cursor.execute("""
                SELECT COUNT(*) FROM warehouse_stock_variants 
                WHERE variant_barcode IS NULL OR variant_barcode = ''
            """)
            null_barcodes = cursor.fetchone()[0]

            if null_barcodes > 0:
                print(f"⚠️ {null_barcodes} variantes sin código de barras")
                fix_missing_barcodes(cursor, conn)
            else:
                print("✅ Todas las variantes tienen código de barras")

        # 7. Mostrar algunos ejemplos de datos
        show_sample_data(cursor)

    except Exception as e:
        print(f"❌ Error durante el diagnóstico: {e}")
        import traceback

        traceback.print_exc()
    finally:
        conn.close()


def migrate_from_warehouse_stock(cursor, conn):
    """Migra datos de warehouse_stock a warehouse_stock_variants"""
    try:
        print("🔄 Migrando datos de warehouse_stock a warehouse_stock_variants...")

        # Verificar si hay datos en warehouse_stock
        cursor.execute("""
            SELECT ws.product_id, ws.branch_id, ws.quantity
            FROM warehouse_stock ws
            WHERE ws.quantity > 0
            LIMIT 10
        """)
        warehouse_data = cursor.fetchall()

        if not warehouse_data:
            print("❌ No hay datos en warehouse_stock para migrar")
            return

        # Obtener IDs por defecto
        cursor.execute("SELECT id FROM sizes LIMIT 1")
        default_size = cursor.fetchone()
        cursor.execute("SELECT id FROM colors LIMIT 1")
        default_color = cursor.fetchone()

        if not default_size or not default_color:
            print("❌ No hay talles o colores por defecto disponibles")
            return

        default_size_id = default_size[0]
        default_color_id = default_color[0]

        print(f"📏 Usando talle por defecto ID: {default_size_id}")
        print(f"🎨 Usando color por defecto ID: {default_color_id}")

        # Migrar cada registro
        migrated = 0
        for ws_record in warehouse_data:
            product_id, branch_id, quantity = ws_record

            # Verificar si ya existe esta variante
            cursor.execute(
                """
                SELECT id FROM warehouse_stock_variants
                WHERE product_id = ? AND branch_id = ? AND size_id = ? AND color_id = ?
            """,
                (product_id, branch_id, default_size_id, default_color_id),
            )

            existing = cursor.fetchone()
            if existing:
                continue  # Ya existe

            # Generar código de barras
            variant_barcode = (
                f"VAR-{product_id}-{default_size_id}-{default_color_id}-{branch_id}"
            )

            # Insertar la variante
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


def fix_missing_barcodes(cursor, conn):
    """Corrige códigos de barras faltantes"""
    try:
        print("🔧 Corrigiendo códigos de barras faltantes...")

        cursor.execute("""
            SELECT id, product_id, size_id, color_id, branch_id
            FROM warehouse_stock_variants
            WHERE variant_barcode IS NULL OR variant_barcode = ''
        """)
        missing_barcodes = cursor.fetchall()

        fixed = 0
        for record in missing_barcodes:
            variant_id, product_id, size_id, color_id, branch_id = record

            # Generar nuevo código de barras
            variant_barcode = f"VAR-{product_id}-{size_id or 0}-{color_id or 0}-{branch_id}-{variant_id}"

            cursor.execute(
                """
                UPDATE warehouse_stock_variants
                SET variant_barcode = ?
                WHERE id = ?
            """,
                (variant_barcode, variant_id),
            )

            fixed += 1

        conn.commit()
        print(f"✅ Corregidos {fixed} códigos de barras")

    except Exception as e:
        print(f"❌ Error corrigiendo códigos de barras: {e}")
        conn.rollback()


def show_sample_data(cursor):
    """Muestra datos de ejemplo"""
    try:
        print(f"\n" + "=" * 60)
        print("📋 DATOS DE EJEMPLO:")

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

        sample_data = cursor.fetchall()
        for row in sample_data:
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

    except Exception as e:
        print(f"❌ Error mostrando datos de ejemplo: {e}")


if __name__ == "__main__":
    diagnose_and_fix_warehouse_data()
