#!/usr/bin/env python3

import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.database import Database
from services.auth_service import authenticate_user


def test_login():
    print("=== TESTING LOGIN FUNCTIONALITY ===")

    db = Database()

    # Verificar sucursales
    print("\n1. Verificando sucursales en BD:")
    storages = db.get_all_records("storage")
    if storages:
        for s in storages:
            print(
                f"   ID: {s.get('id')}, Nombre: {s.get('name')}, Status: {s.get('status')}"
            )
    else:
        print("   No hay sucursales")

    # Verificar sucursales activas
    print("\n2. Verificando sucursales ACTIVAS:")
    active_storages = db.get_all_records_by_clause("storage", "status = ?", "Active")
    if active_storages:
        for s in active_storages:
            print(
                f"   ID: {s.get('id')}, Nombre: {s.get('name')}, Status: {s.get('status')}"
            )
        storage_id = active_storages[0]["id"]
    else:
        print("   No hay sucursales activas")
        storage_id = None

    # Verificar usuarios
    print("\n3. Verificando usuarios:")
    users = db.get_all_records("users")
    if users:
        for u in users:
            print(
                f"   ID: {u.get('id')}, Username: {u.get('username')}, Role: {u.get('role')}, Status: {u.get('status')}"
            )
    else:
        print("   No hay usuarios")

    # Simular login
    if users and len(users) > 0:
        test_user = users[0]  # Usar el primer usuario
        print(f"\n4. Simulando login con usuario: {test_user['username']}")
        print(f"   Storage ID: {storage_id}")

        # Nota: No podemos probar la contraseña real porque está hasheada
        # Pero podemos verificar la lógica
        print("   (No se puede probar contraseña real porque está hasheada)")

        # Verificar lógica de validación
        if storage_id is None and test_user["role"] != "administrator":
            print("   ❌ Usuario no admin sin sucursal disponible - debería fallar")
        elif storage_id is not None:
            print("   ✅ Sucursal disponible - login debería funcionar")
        else:
            print("   ✅ Usuario admin - login debería funcionar sin sucursal")


if __name__ == "__main__":
    test_login()
