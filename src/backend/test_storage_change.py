#!/usr/bin/env python3

import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import requests
import json


def test_storage_change_functionality():
    print("=== TESTING STORAGE CHANGE FUNCTIONALITY ===")

    # Datos de prueba
    test_username = "admin"  # Cambiar por un usuario real
    test_password = "password"  # Cambiar por la contraseña real

    # Test 1: Login
    try:
        print("\n1. Testing login...")
        login_response = requests.post(
            "http://localhost:5000/api/auth/login",
            json={
                "username": test_username,
                "password": test_password,
                "storage_id": None,
            },
            timeout=5,
        )

        if login_response.status_code == 200:
            login_data = login_response.json()
            if login_data["success"]:
                session_token = login_data["session_data"]["session_token"]
                user_id = login_data["session_data"]["user_id"]
                print(f"   ✅ Login exitoso - Token: {session_token[:10]}...")
                print(f"   Usuario ID: {user_id}")
            else:
                print(f"   ❌ Login fallido: {login_data['message']}")
                return False
        else:
            print(f"   ❌ Login error HTTP: {login_response.status_code}")
            return False

    except Exception as e:
        print(f"   ❌ Error en login: {e}")
        return False

    # Test 2: Obtener sucursales del usuario
    try:
        print("\n2. Testing user storages...")
        storages_response = requests.post(
            "http://localhost:5000/api/auth/user-storages",
            json={"session_token": session_token},
            timeout=5,
        )

        if storages_response.status_code == 200:
            storages_data = storages_response.json()
            if storages_data["success"]:
                storages = storages_data["storages"]
                print(f"   ✅ Sucursales obtenidas: {len(storages)}")
                for storage in storages:
                    print(f"      - ID: {storage['id']}, Nombre: {storage['name']}")

                if len(storages) > 0:
                    test_storage_id = storages[0]["id"]
                else:
                    print("   ⚠️ No hay sucursales disponibles para probar cambio")
                    return True
            else:
                print(f"   ❌ Error obteniendo sucursales: {storages_data['message']}")
                return False
        else:
            print(
                f"   ❌ Error HTTP obteniendo sucursales: {storages_response.status_code}"
            )
            return False

    except Exception as e:
        print(f"   ❌ Error obteniendo sucursales: {e}")
        return False

    # Test 3: Cambiar sucursal
    try:
        print(f"\n3. Testing storage change to ID {test_storage_id}...")
        change_response = requests.post(
            "http://localhost:5000/api/auth/change-storage",
            json={"session_token": session_token, "new_storage_id": test_storage_id},
            timeout=5,
        )

        if change_response.status_code == 200:
            change_data = change_response.json()
            if change_data["success"]:
                new_session_data = change_data["session_data"]
                print(f"   ✅ Sucursal cambiada exitosamente")
                print(f"      Nueva sucursal: {new_session_data['storage_name']}")
                print(f"      Storage ID: {new_session_data['storage_id']}")
            else:
                print(f"   ❌ Error cambiando sucursal: {change_data['message']}")
                return False
        else:
            print(f"   ❌ Error HTTP cambiando sucursal: {change_response.status_code}")
            print(f"      Response: {change_response.text}")
            return False

    except Exception as e:
        print(f"   ❌ Error cambiando sucursal: {e}")
        return False

    # Test 4: Validar sesión después del cambio
    try:
        print("\n4. Testing session validation after change...")
        validate_response = requests.post(
            "http://localhost:5000/api/auth/validate",
            json={"session_token": session_token},
            timeout=5,
        )

        if validate_response.status_code == 200:
            validate_data = validate_response.json()
            if validate_data["success"]:
                session_data = validate_data["session_data"]
                print(f"   ✅ Sesión válida después del cambio")
                print(f"      Sucursal actual: {session_data['storage_name']}")
                print(f"      Storage ID: {session_data['storage_id']}")
            else:
                print(f"   ❌ Sesión inválida: {validate_data['message']}")
                return False
        else:
            print(f"   ❌ Error HTTP validando sesión: {validate_response.status_code}")
            return False

    except Exception as e:
        print(f"   ❌ Error validando sesión: {e}")
        return False

    print("\n🎉 ¡Todas las pruebas pasaron exitosamente!")
    return True


if __name__ == "__main__":
    print("⚠️  NOTA: Asegúrate de tener un usuario 'admin' con contraseña 'password'")
    print("   o modifica las credenciales en el script.")
    print()
    test_storage_change_functionality()
