#!/usr/bin/env python3
"""Script para crear la tabla de bancos en la base de datos"""

import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import psycopg2
from config.config import Config


def get_db_connection():
    """Obtener conexión a la base de datos PostgreSQL"""
    config = Config()
    return psycopg2.connect(**config.postgres_config)


def create_bank_table():
    """Crear la tabla de bancos en la base de datos"""
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        create_table = """
        CREATE TABLE IF NOT EXISTS banks (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            swift_code VARCHAR(100) NULL
        )
        """
        cursor.execute(create_table)

        conn.commit()
        print("Tabla 'banks' creada exitosamente.")

    except Exception as e:
        print(f"Error al crear la tabla de bancos: {e}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
if __name__ == "__main__":
    create_bank_table()
