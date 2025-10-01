#!/usr/bin/env python3
"""
Script para asignar sucursales al administrador existente
"""

import os
import sys

# Agregar el directorio padre al path para importar módulos del backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.config import BaseConfig
import psycopg2
from psycopg2.extras import RealDictCursor


def assign_storages_to_admin():
    """Asigna todas las sucursales al administrador"""
    config = BaseConfig()

    try:
        connection = psycopg2.connect(
            host=config.DB_HOST,
            port=config.DB_PORT,
            database=config.DB_NAME,
            user=config.DB_USER,
            password=config.DB_PASSWORD,
            cursor_factory=RealDictCursor,
        )

        cursor = connection.cursor()

        # Buscar al administrador
        cursor.execute(
            "SELECT id, username FROM users WHERE role = 'administrator' LIMIT 1"
        )
        admin = cursor.fetchone()

        if not admin:
            print("❌ No se encontró ningún administrador")
            return False

        admin_id = admin["id"]
        admin_username = admin["username"]
        print(f"👤 Administrador encontrado: {admin_username} (ID: {admin_id})")

        # Verificar si existe al menos una sucursal
        cursor.execute("SELECT COUNT(*) as count FROM storage")
        storage_count = cursor.fetchone()["count"]

        if storage_count == 0:
            print("🏪 No hay sucursales. Creando sucursal por defecto...")

            # Crear sucursal por defecto
            cursor.execute(
                """
                INSERT INTO storage (name, address, postal_code, phone_number, area, description, status, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING id, name
            """,
                (
                    "Sucursal Principal",
                    "Dirección Principal",
                    "0000",
                    "000-000-0000",
                    "Principal",
                    "Sucursal principal del sistema",
                    "Activo",
                ),
            )

            new_storage = cursor.fetchone()
            print(
                f"✅ Sucursal creada: {new_storage['name']} (ID: {new_storage['id']})"
            )

        # Obtener todas las sucursales
        cursor.execute("SELECT id, name FROM storage")
        storages = cursor.fetchall()

        print(f"🏪 Sucursales disponibles: {len(storages)}")

        # Asignar cada sucursal al administrador (si no está ya asignada)
        for storage in storages:
            storage_id = storage["id"]
            storage_name = storage["name"]

            # Verificar si ya existe la relación
            cursor.execute(
                "SELECT id FROM usersxstorage WHERE id_user = %s AND id_storage = %s",
                (admin_id, storage_id),
            )

            if not cursor.fetchone():
                # Crear la relación
                cursor.execute(
                    "INSERT INTO usersxstorage (id_user, id_storage, created_at, updated_at) VALUES (%s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
                    (admin_id, storage_id),
                )
                print(f"   ✅ Asignado acceso a: {storage_name}")
            else:
                print(f"   ℹ️  Ya tiene acceso a: {storage_name}")

        connection.commit()
        print(f"🎉 ¡Administrador '{admin_username}' configurado exitosamente!")
        print("🔄 Reinicia la aplicación para ver los cambios")

        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        if "connection" in locals():
            connection.rollback()
        return False

    finally:
        if "connection" in locals():
            connection.close()


if __name__ == "__main__":
    print("🔧 Configurando sucursales para el administrador...")
    assign_storages_to_admin()
