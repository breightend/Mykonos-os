#!/usr/bin/env python3
"""
Script para insertar un nuevo usuario administrador en la base de datos
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import psycopg2
from config.config import Config

def get_db_connection():
    """Obtener conexión a la base de datos PostgreSQL"""
    config = Config()
    return psycopg2.connect(**config.postgres_config)

def create_admin_user():
    """Insertar un nuevo usuario administrador en la tabla users"""


    username = input("Ingrese el nombre de usuario para el administrador: ")
    password = input("Ingrese la contraseña para el administrador: ")
    confirm_password = input("Confirme la contraseña para el administrador: ")

    if password != confirm_password:
        print("Las contraseñas no coinciden.")
        return

    connection = None
    cursor = None
    
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        insert_user_sql = """
        INSERT INTO users (username, password, is_admin, created_at, updated_at)
        VALUES (%s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id;
        """

        cursor.execute(insert_user_sql, (username, password, True))
        result = cursor.fetchone()
        if result:
            new_user_id = result[0]
            connection.commit()
            print(f"Usuario administrador '{username}' creado exitosamente.")
        else:
            print("El usuario ya existe o no se pudo crear.")
            return

        # 1. Get all storage IDs
        cursor.execute("SELECT id FROM storage")
        storage_ids = [row[0] for row in cursor.fetchall()]

        # 2. Insert into usersxstorage for each storage
        for storage_id in storage_ids:
            cursor.execute(
                "INSERT INTO usersxstorage (user_id, storage_id) VALUES (%s, %s)",
                (new_user_id, storage_id)
            )
        connection.commit()
    except Exception as e:
        if connection:
            connection.rollback()
        print(f"Error al crear el usuario administrador: {e}")
        
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()