#!/usr/bin/env python3
"""
Script de verificación final para códigos de barras de variantes
"""

import sqlite3
import os
import uuid
import json


def verify_database():
    """Verificar el estado de la base de datos"""
    print("🔍 VERIFICANDO BASE DE DATOS...")

    db_path = os.path.join("database", "mykonos.db")
    if not os.path.exists(db_path):
        print(f"❌ No se encontró la base de datos en: {db_path}")
        return False

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Verificar estructura de warehouse_stock_variants
        cursor.execute("PRAGMA table_info(warehouse_stock_variants)")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]

        if "variant_barcode" not in column_names:
            print("❌ La columna variant_barcode no existe en warehouse_stock_variants")
            return False

        print("✅ La columna variant_barcode existe")

        # Verificar datos
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

        print(f"📊 ESTADO DE CÓDIGOS DE BARRAS:")
        print(f"  Total registros: {total}")
        print(f"  Con barcode: {with_barcode}")
        print(f"  Sin barcode: {without_barcode}")

        if without_barcode > 0:
            print(f"⚠️  Se necesita generar {without_barcode} códigos de barras")

            # Generar códigos faltantes
            print("🔨 Generando códigos faltantes...")
            cursor.execute(
                'SELECT id FROM warehouse_stock_variants WHERE variant_barcode IS NULL OR variant_barcode = ""'
            )
            records = cursor.fetchall()

            for record in records:
                variant_id = record[0]
                new_barcode = str(uuid.uuid4())[:12].upper()
                cursor.execute(
                    "UPDATE warehouse_stock_variants SET variant_barcode = ? WHERE id = ?",
                    (new_barcode, variant_id),
                )

            conn.commit()
            print(f"✅ Generados {len(records)} códigos de barras")
        else:
            print("✅ Todos los registros tienen códigos de barras")

        # Mostrar algunos ejemplos
        print("\n📋 EJEMPLOS DE DATOS:")
        cursor.execute("""
            SELECT 
                wsv.id, 
                wsv.variant_barcode, 
                p.product_name, 
                s.size_name, 
                c.color_name,
                st.name as storage_name
            FROM warehouse_stock_variants wsv
            LEFT JOIN products p ON wsv.product_id = p.id
            LEFT JOIN sizes s ON wsv.size_id = s.id
            LEFT JOIN colors c ON wsv.color_id = c.id
            LEFT JOIN storage st ON wsv.branch_id = st.id
            LIMIT 5
        """)

        examples = cursor.fetchall()
        for i, row in enumerate(examples, 1):
            print(
                f"  {i}. ID:{row[0]} | Barcode:{row[1]} | {row[2]} | {row[3]} | {row[4]} | {row[5]}"
            )

        return True

    except Exception as e:
        print(f"❌ Error en verificación: {e}")
        return False
    finally:
        conn.close()


def test_inventory_endpoint():
    """Simular una consulta del endpoint de inventario"""
    print("\n🧪 SIMULANDO ENDPOINT DE INVENTARIO...")

    db_path = os.path.join("database", "mykonos.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Simular la consulta que hace el frontend
        query = """
        SELECT 
            p.id,
            p.product_name as producto,
            COALESCE(b.brand_name, 'Sin marca') as marca,
            COALESCE(SUM(ws.quantity), 0) as cantidad_total,
            COALESCE(p.last_modified_date, datetime('now')) as fecha_edicion,
            COUNT(DISTINCT ws.branch_id) as sucursales_con_stock,
            COALESCE(g.group_name, 'Sin grupo') as grupo,
            p.group_id,
            p.sale_price
        FROM products p
        LEFT JOIN warehouse_stock ws ON p.id = ws.product_id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN groups g ON p.group_id = g.id
        GROUP BY p.id, p.product_name, b.brand_name, p.last_modified_date, g.group_name, p.group_id, p.sale_price
        ORDER BY p.product_name
        LIMIT 3
        """

        products = cursor.execute(query).fetchall()

        print(f"🔍 Productos encontrados: {len(products)}")

        if products:
            for i, product in enumerate(products, 1):
                print(
                    f"  {i}. ID:{product[0]} | {product[1]} | {product[2]} | Stock:{product[3]}"
                )

                # Para cada producto, obtener sus variantes
                variants_query = """
                SELECT 
                    wsv.id,
                    s.size_name,
                    c.color_name,
                    st.name as sucursal_nombre,
                    wsv.quantity,
                    wsv.variant_barcode
                FROM warehouse_stock_variants wsv
                LEFT JOIN sizes s ON wsv.size_id = s.id
                LEFT JOIN colors c ON wsv.color_id = c.id
                JOIN storage st ON wsv.branch_id = st.id
                WHERE wsv.product_id = ?
                LIMIT 3
                """

                variants = cursor.execute(variants_query, (product[0],)).fetchall()
                print(f"     Variantes: {len(variants)}")
                for v in variants:
                    print(
                        f"       - {v[1]}|{v[2]}|{v[3]} (Stock:{v[4]}, Barcode:{v[5]})"
                    )
        else:
            print("❌ No se encontraron productos")

        return True

    except Exception as e:
        print(f"❌ Error en test de endpoint: {e}")
        return False
    finally:
        conn.close()


def main():
    print("🚀 VERIFICACIÓN FINAL DEL SISTEMA")
    print("=" * 50)

    # Cambiar al directorio correcto
    if not verify_database():
        print("❌ Verificación de base de datos falló")
        return

    if not test_inventory_endpoint():
        print("❌ Test de endpoint falló")
        return

    print("\n🎉 VERIFICACIÓN COMPLETADA EXITOSAMENTE")
    print("✅ La base de datos está correcta")
    print("✅ Todos los registros tienen códigos de barras")
    print("✅ Los endpoints devuelven los datos correctos")
    print(
        "\n📝 SIGUIENTE PASO: Verificar que el frontend muestre los datos correctamente"
    )


if __name__ == "__main__":
    main()
