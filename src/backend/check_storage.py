#!/usr/bin/env python3
"""
Script para verificar tabla storage
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import Database


def check_storage_table():
    """Verificar estado de la tabla storage"""
    try:
        db = Database()

        # Verificar estructura de la tabla
        print("🔍 Verificando estructura de la tabla storage...")
        schema_query = "PRAGMA table_info(storage)"
        schema = db.execute_query(schema_query)

        if schema:
            print("✅ Estructura de la tabla storage:")
            for col in schema:
                if isinstance(col, dict):
                    print(f"   - {col.get('name', 'N/A')} ({col.get('type', 'N/A')})")
                else:
                    print(f"   - {col[1]} ({col[2]})")
        else:
            print("❌ No se encontró la tabla storage")
            return

        # Verificar datos
        print("\n📊 Verificando datos en la tabla storage...")
        data_query = "SELECT * FROM storage"
        storages = db.execute_query(data_query)

        if storages:
            print(f"✅ Encontradas {len(storages)} sucursales:")
            for storage in storages:
                if isinstance(storage, dict):
                    print(
                        f"   ID: {storage.get('id')}, Nombre: {storage.get('name')}, Status: {storage.get('status')}"
                    )
                else:
                    print(
                        f"   ID: {storage[0]}, Nombre: {storage[1]}, Status: {storage[2] if len(storage) > 2 else 'N/A'}"
                    )
        else:
            print("❌ No hay datos en la tabla storage")
            print("\n🔧 Creando datos de prueba...")

            # Insertar datos de prueba
            test_data = [
                ("Sucursal Principal", "Calle 123", "Sucursal principal", "Activo"),
                ("Sucursal Norte", "Avenida 456", "Sucursal del norte", "Activo"),
                ("Almacén Central", "Industrial 789", "Almacén principal", "Activo"),
            ]

            insert_query = "INSERT INTO storage (name, address, description, status) VALUES (?, ?, ?, ?)"

            for name, address, desc, status in test_data:
                try:
                    db.execute_query(insert_query, (name, address, desc, status))
                    print(f"   ✅ Insertado: {name}")
                except Exception as e:
                    print(f"   ❌ Error insertando {name}: {e}")

            # Verificar inserción
            print("\n📊 Verificando datos después de inserción...")
            storages = db.execute_query(data_query)
            if storages:
                print(f"✅ Ahora hay {len(storages)} sucursales:")
                for storage in storages:
                    if isinstance(storage, dict):
                        print(
                            f"   ID: {storage.get('id')}, Nombre: {storage.get('name')}, Status: {storage.get('status')}"
                        )
                    else:
                        print(
                            f"   ID: {storage[0]}, Nombre: {storage[1]}, Status: {storage[2] if len(storage) > 2 else 'N/A'}"
                        )

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    check_storage_table()
