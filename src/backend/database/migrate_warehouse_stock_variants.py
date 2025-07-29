#!/usr/bin/env python3
"""
Migración para crear la tabla warehouse_stock_variants
Ejecutar este script para agregar la nueva tabla de variantes de stock
"""

import sqlite3
import os
import sys

# Agregar el directorio padre al path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import Database, DATABASE_PATH


def create_warehouse_stock_variants_table():
    """
    Crear la tabla warehouse_stock_variants para manejar stock por variantes
    """
    try:
        print("🔄 Iniciando migración: creación de tabla warehouse_stock_variants")

        db = Database()

        # Verificar si la tabla ya existe
        check_table_query = """
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='warehouse_stock_variants'
        """
        existing_table = db.execute_query(check_table_query)

        if existing_table and len(existing_table) > 0:
            print("⚠️  La tabla warehouse_stock_variants ya existe. Saltando creación.")
            return True

        # Crear la tabla
        create_table_query = """
        CREATE TABLE warehouse_stock_variants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            size_id INTEGER,
            color_id INTEGER,
            branch_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
            last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id),
            FOREIGN KEY (size_id) REFERENCES sizes(id),
            FOREIGN KEY (color_id) REFERENCES colors(id),
            FOREIGN KEY (branch_id) REFERENCES storage(id)
        )
        """

        with db.create_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(create_table_query)
            conn.commit()
            print("✅ Tabla warehouse_stock_variants creada exitosamente")

        # Crear índices para optimizar consultas
        indexes = [
            "CREATE INDEX idx_warehouse_stock_variants_product_id ON warehouse_stock_variants(product_id)",
            "CREATE INDEX idx_warehouse_stock_variants_size_id ON warehouse_stock_variants(size_id)",
            "CREATE INDEX idx_warehouse_stock_variants_color_id ON warehouse_stock_variants(color_id)",
            "CREATE INDEX idx_warehouse_stock_variants_branch_id ON warehouse_stock_variants(branch_id)",
            "CREATE INDEX idx_warehouse_stock_variants_combo ON warehouse_stock_variants(product_id, size_id, color_id, branch_id)",
        ]

        with db.create_connection() as conn:
            cursor = conn.cursor()
            for index_query in indexes:
                try:
                    cursor.execute(index_query)
                    print(
                        f"✅ Índice creado: {index_query.split('ON')[0].split('CREATE INDEX')[1].strip()}"
                    )
                except sqlite3.Error as e:
                    print(f"⚠️  Error creando índice: {e}")
            conn.commit()

        print("🎉 Migración completada exitosamente")
        return True

    except Exception as e:
        print(f"❌ Error en la migración: {e}")
        import traceback

        traceback.print_exc()
        return False


def migrate_existing_stock():
    """
    Opcional: Migrar datos existentes de warehouse_stock a warehouse_stock_variants
    """
    try:
        print("🔄 Migrando datos existentes de warehouse_stock...")

        db = Database()

        # Obtener todos los registros de warehouse_stock
        get_stock_query = """
        SELECT ws.id, ws.product_id, ws.branch_id, ws.quantity, ws.last_updated
        FROM warehouse_stock ws
        WHERE ws.quantity > 0
        """

        existing_stock = db.execute_query(get_stock_query)

        if not existing_stock:
            print("ℹ️  No hay datos de stock existentes para migrar")
            return True

        print(f"📊 Encontrados {len(existing_stock)} registros de stock para migrar")

        # Para cada producto, obtener sus variantes (talles y colores)
        migrated_count = 0

        with db.create_connection() as conn:
            cursor = conn.cursor()

            for stock_record in existing_stock:
                if isinstance(stock_record, dict):
                    product_id = stock_record.get("product_id")
                    branch_id = stock_record.get("branch_id")
                    quantity = stock_record.get("quantity")
                    last_updated = stock_record.get("last_updated")
                else:
                    product_id = stock_record[1]
                    branch_id = stock_record[2]
                    quantity = stock_record[3]
                    last_updated = stock_record[4]

                # Obtener talles del producto
                sizes_query = """
                SELECT ps.size_id 
                FROM product_sizes ps 
                WHERE ps.product_id = ?
                """
                sizes = db.execute_query(sizes_query, (product_id,))

                # Obtener colores del producto
                colors_query = """
                SELECT pc.color_id 
                FROM product_colors pc 
                WHERE pc.product_id = ?
                """
                colors = db.execute_query(colors_query, (product_id,))

                # Si el producto tiene talles y colores, distribuir el stock
                if sizes and colors:
                    total_variants = len(sizes) * len(colors)
                    quantity_per_variant = max(1, quantity // total_variants)
                    remaining_quantity = quantity

                    for size_record in sizes:
                        size_id = (
                            size_record[0]
                            if isinstance(size_record, (list, tuple))
                            else size_record.get("size_id")
                        )

                        for color_record in colors:
                            color_id = (
                                color_record[0]
                                if isinstance(color_record, (list, tuple))
                                else color_record.get("color_id")
                            )

                            # Asignar cantidad a esta variante
                            variant_quantity = min(
                                quantity_per_variant, remaining_quantity
                            )
                            if variant_quantity > 0:
                                insert_variant_query = """
                                INSERT INTO warehouse_stock_variants 
                                (product_id, size_id, color_id, branch_id, quantity, last_updated)
                                VALUES (?, ?, ?, ?, ?, ?)
                                """
                                cursor.execute(
                                    insert_variant_query,
                                    (
                                        product_id,
                                        size_id,
                                        color_id,
                                        branch_id,
                                        variant_quantity,
                                        last_updated,
                                    ),
                                )
                                remaining_quantity -= variant_quantity
                                migrated_count += 1

                # Si el producto no tiene variantes, crear un registro sin talle/color
                elif quantity > 0:
                    insert_variant_query = """
                    INSERT INTO warehouse_stock_variants 
                    (product_id, size_id, color_id, branch_id, quantity, last_updated)
                    VALUES (?, NULL, NULL, ?, ?, ?)
                    """
                    cursor.execute(
                        insert_variant_query,
                        (product_id, branch_id, quantity, last_updated),
                    )
                    migrated_count += 1

            conn.commit()

        print(f"✅ Migración de datos completada: {migrated_count} variantes creadas")
        return True

    except Exception as e:
        print(f"❌ Error migrando datos existentes: {e}")
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("🚀 Iniciando migración de warehouse_stock_variants")
    print(f"📁 Base de datos: {DATABASE_PATH}")

    # Verificar que la base de datos existe
    if not os.path.exists(DATABASE_PATH):
        print(f"❌ No se encuentra la base de datos en: {DATABASE_PATH}")
        sys.exit(1)

    # Crear la tabla
    if create_warehouse_stock_variants_table():
        # Preguntar si quiere migrar datos existentes
        migrate_data = (
            input("\n¿Desea migrar los datos existentes de warehouse_stock? (y/N): ")
            .strip()
            .lower()
        )

        if migrate_data in ["y", "yes", "sí", "si"]:
            migrate_existing_stock()
        else:
            print("ℹ️  Saltando migración de datos. La tabla está lista para usar.")
    else:
        print("❌ Error creando la tabla. Revise los errores arriba.")
        sys.exit(1)

    print(
        "\n🎉 ¡Migración completada! La tabla warehouse_stock_variants está lista para usar."
    )
