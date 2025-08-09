#!/usr/bin/env python3
"""Verificar estructura de la base de datos"""

import sys
import os

# Agregar el path del backend al sys.path
backend_path = os.path.join(os.path.dirname(__file__), "src", "backend")
sys.path.insert(0, backend_path)

try:
    from database.database import Database
    import psycopg2

    def check_database_structure():
        """Verificar que las tablas necesarias existen"""
        print("🔍 Verificando estructura de la base de datos PostgreSQL...")

        db = Database()
        conn = db.create_connection()
        cursor = conn.cursor()

        # Verificar tabla 'sales'
        print("\n📋 Verificando tabla 'sales'...")
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'sales' 
            ORDER BY ordinal_position
        """)

        sales_columns = cursor.fetchall()
        if sales_columns:
            print(f"✅ Tabla 'sales' encontrada con {len(sales_columns)} columnas:")
            for col in sales_columns:
                print(
                    f"   - {col[0]}: {col[1]} {'NULL' if col[2] == 'YES' else 'NOT NULL'} {f'DEFAULT {col[3]}' if col[3] else ''}"
                )
        else:
            print("❌ Tabla 'sales' NO encontrada")
            return False

        # Verificar tabla 'sales_detail'
        print("\n📄 Verificando tabla 'sales_detail'...")
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'sales_detail' 
            ORDER BY ordinal_position
        """)

        sales_detail_columns = cursor.fetchall()
        if sales_detail_columns:
            print(
                f"✅ Tabla 'sales_detail' encontrada con {len(sales_detail_columns)} columnas:"
            )
            for col in sales_detail_columns[:5]:  # Mostrar solo las primeras 5
                print(
                    f"   - {col[0]}: {col[1]} {'NULL' if col[2] == 'YES' else 'NOT NULL'}"
                )
            if len(sales_detail_columns) > 5:
                print(f"   ... y {len(sales_detail_columns) - 5} columnas más")
        else:
            print("❌ Tabla 'sales_detail' NO encontrada")
            return False

        # Verificar tabla 'warehouse_stock_variants'
        print("\n📦 Verificando tabla 'warehouse_stock_variants'...")
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'warehouse_stock_variants' 
            ORDER BY ordinal_position
        """)

        stock_columns = cursor.fetchall()
        if stock_columns:
            print(
                f"✅ Tabla 'warehouse_stock_variants' encontrada con {len(stock_columns)} columnas:"
            )
            for col in stock_columns[:5]:  # Mostrar solo las primeras 5
                print(
                    f"   - {col[0]}: {col[1]} {'NULL' if col[2] == 'YES' else 'NOT NULL'}"
                )

            # Verificar si hay datos de ejemplo
            cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants")
            count = cursor.fetchone()[0]
            print(f"📊 Total de registros en warehouse_stock_variants: {count}")

            if count > 0:
                cursor.execute(
                    "SELECT id, quantity FROM warehouse_stock_variants LIMIT 3"
                )
                samples = cursor.fetchall()
                print("📋 Muestra de datos:")
                for sample in samples:
                    print(f"   - ID: {sample[0]}, Cantidad: {sample[1]}")
        else:
            print("❌ Tabla 'warehouse_stock_variants' NO encontrada")
            return False

        # Test simple de conexión e inserción
        print("\n🧪 Probando inserción simple en la tabla 'sales'...")
        try:
            cursor.execute(
                """
                INSERT INTO sales (
                    employee_id, cashier_user_id, storage_id, 
                    subtotal, total, payment_method, status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id
            """,
                (1, 1, 1, 50.0, 50.0, "Test", "Completada"),
            )

            test_sale_id = cursor.fetchone()[0]
            print(f"✅ Inserción exitosa! ID generado: {test_sale_id}")

            # Rollback para no afectar la DB
            conn.rollback()
            print("🔄 Rollback realizado (no se guardó en la DB)")

        except Exception as e:
            print(f"❌ Error en la inserción de prueba: {e}")
            conn.rollback()
            return False

        finally:
            conn.close()

        print("\n✅ Todas las verificaciones pasaron correctamente!")
        return True

    if __name__ == "__main__":
        success = check_database_structure()
        if not success:
            print("\n❌ Falló la verificación de la base de datos")
            sys.exit(1)
        else:
            print("\n🎉 Base de datos lista para crear ventas!")
            sys.exit(0)

except ImportError as e:
    print(f"❌ Error importando módulos del backend: {e}")
    print("   Verifica que el backend esté configurado correctamente")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error inesperado: {e}")
    import traceback

    traceback.print_exc()
    sys.exit(1)
