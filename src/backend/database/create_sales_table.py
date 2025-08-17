#!/usr/bin/env python3
"""
Script para crear la tabla ventas
"""

import sys
import os

# Agregar el directorio padre al path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import psycopg2
from config.config import Config


def get_db_connection():
    """Obtener conexión a la base de datos PostgreSQL"""
    config = Config()
    return psycopg2.connect(**config.postgres_config)


def create_sales_table():
    """Crear la tabla de ventas en la base de datos"""
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute( """
            CREATE TABLE IF NOT EXISTS sales (
                id SERIAL PRIMARY KEY,
                customer_id INTEGER,
                employee_id INTEGER NOT NULL,
                cashier_user_id INTEGER NOT NULL,
                storage_id INTEGER NOT NULL,
                sale_date TEXT DEFAULT CURRENT_TIMESTAMP,
                subtotal REAL NOT NULL,
                tax_amount REAL DEFAULT 0.0,
                discount REAL DEFAULT 0.0,
                total REAL NOT NULL,
                payment_method INTEGER NOT NULL,
                payment_reference TEXT,
                invoice_number TEXT,
                receipt_number TEXT,
                notes TEXT,
                status TEXT DEFAULT 'Completada',
                refund_reason TEXT,
                refunded_at TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (payment_method) REFERENCES banks_payment_methods (id) ON DELETE CASCADE,
                FOREIGN KEY (customer_id) REFERENCES entities (id) ON DELETE CASCADE,
                FOREIGN KEY (employee_id) REFERENCES entities (id) ON DELETE CASCADE,
                FOREIGN KEY (cashier_user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (storage_id) REFERENCES storage (id) ON DELETE CASCADE
        )
    """)

        conn.commit()
        print("Tabla 'sales' creada exitosamente.")
    except Exception as e:
        print(f"Error al crear la tabla 'sales': {e}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    create_sales_table()

