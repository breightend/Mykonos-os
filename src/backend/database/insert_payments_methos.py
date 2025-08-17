#!/usr/bin/env python3
"""
Script para ingresar metodos de pagos ya preestablecidos.
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


def insert_default_payment_methods():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        # Insertar configuración por defecto si no existe
        insert_default_sql = """
        INSERT INTO "payment_methods" ("method_name", "display_name", "description", "is_active", "requires_reference", "icon_name", "created_at", "updated_at")
        VALUES ('tarjeta_credito', 'Tarjeta de crédito', NULL, '1', '0', NULL, now(), now()) RETURNING "id";
        INSERT INTO "payment_methods" ("method_name", "display_name", "description", "is_active", "requires_reference", "icon_name", "created_at", "updated_at")
        VALUES ('tarjeta_debito', 'Tarjeta de débito', NULL, '1', '0', NULL, now(), now()) RETURNING "id";
        INSERT INTO "payment_methods" ("method_name", "display_name", "description", "is_active", "requires_reference", "icon_name", "created_at", "updated_at")
        VALUES ('transferencia', 'Transferencia', 'Pago en transferencia bancaria', '1', '0', 'Landmark', now(), now()) RETURNING "id";
        INSERT INTO "payment_methods" ("method_name", "display_name", "description", "is_active", "requires_reference", "icon_name", "created_at", "updated_at")
        VALUES ('efectivo', 'Efectivo', 'Pago en efectivo', '1', '0', 'HandCoins', now(), now()) RETURNING "id";
        INSERT INTO "payment_methods" ("method_name", "display_name", "description", "is_active", "requires_reference", "icon_name", "created_at", "updated_at")
        VALUES ('cuenta_corriente', 'Cuenta Corriente', 'Pagos de clientes conocidos', '1', '0', 'WalletCards', now(), now()) RETURNING "id";
        """

        cursor.execute(insert_default_sql)
        connection.commit()

    except Exception as e:
        print("Error al insertar configuración por defecto:", e)
    finally:
        cursor.close()
        connection.close()


if __name__ == "__main__":
    insert_default_payment_methods()
