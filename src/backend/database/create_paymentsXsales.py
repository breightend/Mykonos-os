#!/usr/bin/env python3
"""Script para crear la relacion formas de pago con Sales"""

import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import psycopg2
from config.config import Config


def get_db_connection():
    """Obtener conexión a la base de datos PostgreSQL"""
    config = Config()
    return psycopg2.connect(**config.postgres_config)


def create_sales_payment_table():
    """Crear la tabla de relaciones entre ventas y formas de pago en la base de datos"""
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        create_table = """
        CREATE TABLE IF NOT EXISTS sales_payments (
            id SERIAL PRIMARY KEY,
            sales_id INTEGER NOT NULL,
            payment_method_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sales_id) REFERENCES sales (id),
            FOREIGN KEY (payment_method_id) REFERENCES banks_payment_methods (id)
        )
        """
        cursor.execute(create_table)

        conn.commit()
        print("Tabla 'sales_payments' creada exitosamente.")

    except Exception as e:
        print(f"Error al crear la tabla de ventas y formas de pago: {e}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
if __name__ == "__main__":
    create_sales_payment_table()