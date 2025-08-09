#!/usr/bin/env python3
import sys

sys.path.append("./src/backend")

from database.database import Database


def test_sales_insert():
    try:
        print("🔄 Iniciando test de inserción en sales...")

        db = Database()
        conn = db.create_connection()
        cursor = conn.cursor()

        # Probar inserción simple
        query = """
        INSERT INTO sales (
            employee_id, cashier_user_id, storage_id,
            subtotal, total, payment_method, status
        ) VALUES (%s, %s, %s, %s, %s, %s, %s) 
        RETURNING id
        """

        params = (1, 1, 1, 100.0, 100.0, "efectivo", "Completada")
        print(f"📋 Query: {query}")
        print(f"📋 Params: {params}")

        cursor.execute(query, params)
        result = cursor.fetchone()
        print(f"✅ ID creado: {result[0]}")

        # Rollback para no guardar el test
        conn.rollback()
        conn.close()

        print("✅ Test completado exitosamente")
        return True

    except Exception as e:
        print(f"❌ Error en test: {e}")
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":
    test_sales_insert()
