#!/usr/bin/env python3
"""
Script para crear la tabla de métodos de pago de bancos en la base de datos
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

def create_banks_payment_method_table():
    """Crear la tabla de métodos de pago de bancos en la base de datos"""
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        create_table = """
        CREATE TABLE IF NOT EXISTS banks_payment_methods (
            id SERIAL PRIMARY KEY,
            bank_id INTEGER NOT NULL,
            payment_method_id INTEGER NOT NULL,
            FOREIGN KEY (bank_id) REFERENCES banks (id) ON DELETE CASCADE,
            FOREIGN KEY (payment_method_id) REFERENCES payment_methods (id) ON DELETE CASCADE
        )
        """
        cursor.execute(create_table)

        conn.commit()
        print("Tabla 'banks_payment_methods' creada exitosamente.")

    except Exception as e:
        print(f"Error al crear la tabla de métodos de pago de bancos: {e}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


if __name__ == "__main__":
    create_banks_payment_method_table()
