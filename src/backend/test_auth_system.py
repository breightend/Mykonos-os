#!/usr/bin/env python3
"""
Script de prueba para verificar el sistema de autenticación
"""

import sys
import os
import requests
import json

# Agregar el directorio backend al path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)


def test_server_connection():
    """Prueba la conexión al servidor"""
    try:
        response = requests.get("http://localhost:5000/")
        print(f"✅ Servidor responde: {response.status_code}")
        return True
    except Exception as e:
        print(f"❌ Error conectando al servidor: {e}")
        return False


def test_storages_endpoint():
    """Prueba el endpoint de sucursales"""
    try:
        response = requests.get("http://localhost:5000/api/auth/storages")
        data = response.json()

        if response.status_code == 200:
            storages_count = len(data.get("storages", []))
            print(
                f"✅ Endpoint storages funciona: {storages_count} sucursales encontradas"
            )

            if storages_count == 0:
                print(
                    "⚠️  No hay sucursales configuradas - modo primer login habilitado"
                )
            else:
                print("📋 Sucursales disponibles:")
                for storage in data["storages"]:
                    print(f"   - {storage['name']} (ID: {storage['id']})")

            return True, storages_count
        else:
            print(f"❌ Error en endpoint storages: {response.status_code}")
            return False, 0
    except Exception as e:
        print(f"❌ Error probando endpoint storages: {e}")
        return False, 0


def test_login_without_storage():
    """Prueba login sin sucursal (solo para administradores)"""
    try:
        login_data = {"username": "admin", "password": "admin123", "storage_id": None}

        response = requests.post(
            "http://localhost:5000/api/auth/login",
            headers={"Content-Type": "application/json"},
            data=json.dumps(login_data),
        )

        if response.status_code == 200:
            data = response.json()
            print("✅ Login sin sucursal exitoso para administrador")
            print(f"   Usuario: {data['session_data']['username']}")
            print(f"   Rol: {data['session_data']['role']}")
            print(f"   Sucursal: {data['session_data']['storage_name']}")
            return True, data["session_data"]["session_token"]
        else:
            data = response.json()
            print(
                f"❌ Login sin sucursal falló: {data.get('message', 'Error desconocido')}"
            )
            return False, None
    except Exception as e:
        print(f"❌ Error probando login sin sucursal: {e}")
        return False, None


def test_validate_session(token):
    """Prueba validación de sesión"""
    try:
        validate_data = {"session_token": token}

        response = requests.post(
            "http://localhost:5000/api/auth/validate",
            headers={"Content-Type": "application/json"},
            data=json.dumps(validate_data),
        )

        if response.status_code == 200:
            print("✅ Validación de sesión exitosa")
            return True
        else:
            print(f"❌ Validación de sesión falló: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error probando validación de sesión: {e}")
        return False


def main():
    """Función principal de pruebas"""
    print("🧪 Sistema de Pruebas - Autenticación Mykonos-OS")
    print("=" * 50)

    # Verificar conexión al servidor
    if not test_server_connection():
        print(
            "❌ No se puede conectar al servidor. Asegúrese de que esté ejecutándose."
        )
        return

    print()

    # Probar endpoint de sucursales
    storages_ok, storages_count = test_storages_endpoint()
    if not storages_ok:
        print("❌ Fallo en endpoint de sucursales")
        return

    print()

    # Probar login sin sucursal (modo primer login)
    login_ok, token = test_login_without_storage()
    if not login_ok:
        print("❌ Fallo en login sin sucursal")
        print("💡 Asegúrese de que existe el usuario administrador 'admin'")
        print("   Ejecute: python admin_manager.py")
        return

    print()

    # Probar validación de sesión
    if token:
        validate_ok = test_validate_session(token)
        if not validate_ok:
            print("❌ Fallo en validación de sesión")
            return

    print()
    print("🎉 Todas las pruebas pasaron exitosamente!")
    print()

    if storages_count == 0:
        print("📋 Próximos pasos:")
        print("1. Haga login como administrador en la aplicación")
        print("2. Configure al menos una sucursal")
        print("3. Cree empleados y asígnelos a sucursales")
    else:
        print("✅ Sistema listo para uso normal")


if __name__ == "__main__":
    main()
