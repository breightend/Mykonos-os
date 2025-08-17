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

def create_account_movements_table():
    """Crear la tabla de movimientos de cuenta en la base de datos"""
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS "account_movements" (
            id SERIAL PRIMARY KEY AUTOINCREMENT,
            numero_operacion INTEGER NOT NULL CHECK (numero_operacion > 0),
            entity_id INTEGER NOT NULL, 
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            descripcion TEXT,  
            payment_method INTEGER,  
            numero_de_comprobante TEXT,
            purchase_id INTEGER,
            debe REAL,
            haber REAL,
            saldo REAL,
            file_id INTEGER,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

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


if __name__ == "__main__":
    create_account_movements_table()
