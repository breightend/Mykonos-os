#!/usr/bin/env python3
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "src", "backend"))

from database.database import Database


def check_tables():
    try:
        db = Database()
        conn = db.create_connection()
        cursor = conn.cursor()

        print("📋 Verificando estructura de tablas necesarias...")

        # Verificar tabla sales
        cursor.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'sales'
            ORDER BY ordinal_position
        """)
        sales_columns = cursor.fetchall()

        print(f"\n🏪 Tabla 'sales' ({len(sales_columns)} columnas):")
        for col in sales_columns:
            print(
                f"  - {col[0]}: {col[1]} ({'NULL' if col[2] == 'YES' else 'NOT NULL'})"
            )

        # Verificar tabla sales_detail
        cursor.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'sales_detail'
            ORDER BY ordinal_position
        """)
        sales_detail_columns = cursor.fetchall()

        print(f"\n📄 Tabla 'sales_detail' ({len(sales_detail_columns)} columnas):")
        for col in sales_detail_columns:
            print(
                f"  - {col[0]}: {col[1]} ({'NULL' if col[2] == 'YES' else 'NOT NULL'})"
            )

        # Verificar tabla warehouse_stock_variants
        cursor.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'warehouse_stock_variants'
            ORDER BY ordinal_position
        """)
        stock_columns = cursor.fetchall()

        print(f"\n📦 Tabla 'warehouse_stock_variants' ({len(stock_columns)} columnas):")
        for col in stock_columns:
            print(
                f"  - {col[0]}: {col[1]} ({'NULL' if col[2] == 'YES' else 'NOT NULL'})"
            )

        # Verificar si hay datos de prueba
        cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants")
        stock_count = cursor.fetchone()[0]
        print(f"\n📊 Total de variantes en stock: {stock_count}")

        if stock_count > 0:
            cursor.execute("SELECT * FROM warehouse_stock_variants LIMIT 3")
            sample_variants = cursor.fetchall()
            print("📋 Muestras de variantes:")
            for variant in sample_variants:
                print(
                    f"  - ID: {variant[0]}, Cantidad: {variant[-1] if len(variant) > 0 else 'N/A'}"
                )

        conn.close()
        print("✅ Verificación completada")

    except Exception as e:
        print(f"❌ Error verificando tablas: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    check_tables()
