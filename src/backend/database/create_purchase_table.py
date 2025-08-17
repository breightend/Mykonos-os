#!/usr/bin/env python3

"""
Script para crear la tabla de compras en la base de datos
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
def create_purchases_table():

    """Crear la tabla de purchases"""
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS "purchases" (
            id SERIAL PRIMARY KEY AUTOINCREMENT,
            entity_id INTEGER NOT NULL, 
            purchase_date TEXT DEFAULT CURRENT_TIMESTAMP,
            subtotal REAL NOT NULL CHECK (subtotal >= 0),
            discount REAL DEFAULT 0.0,
            total REAL NOT NULL,
            payment_method TEXT,
            transaction_number TEXT,
            invoice_number TEXT,
            notes TEXT,
            file_id INTEGER,
            status TEXT DEFAULT 'Pendiente de entrega',
            delivery_date TEXT,
            file_id INTEGER,

            FOREIGN KEY (entity_id) REFERENCES entities (id) ON DELETE CASCADE,
            FOREIGN KEY (payment_method) REFERENCES banks_payment_methods (id) ON DELETE CASCADE,
            FOREIGN KEY (purchase_id) REFERENCES purchases (id) ON DELETE CASCADE,
            FOREIGN KEY (file_id) REFERENCES file_attachments (id) ON DELETE CASCADE
        );
        """
        cursor.execute(create_table_sql)
        connection.commit()

    except Exception as e:
        print("Error al crear la tabla de movimientos de cuenta:", e)
    finally:
        cursor.close()
        connection.close()