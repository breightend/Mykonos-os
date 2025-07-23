#!/usr/bin/env python3
"""
Script para probar la validación de sesión
"""

import sys
import os

# Añadir el directorio backend al path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from services.auth_service import authenticate_user, validate_session


def test_session_flow():
    print("🧪 Probando flujo completo de sesión...")

    # Paso 1: Login
    print("\n1️⃣ Intentando login...")
    login_result = authenticate_user(
        username="admin",
        password="admin123",
        storage_id=None,
        ip_address="127.0.0.1",
        user_agent="Test Script",
    )

    if not login_result["success"]:
        print(f"❌ Login falló: {login_result['message']}")
        return False

    print("✅ Login exitoso!")
    session_token = login_result["session_data"]["session_token"]
    print(f"   Token: {session_token[:20]}...")

    # Paso 2: Validar sesión inmediatamente
    print("\n2️⃣ Validando sesión inmediatamente...")
    validation_result = validate_session(session_token)

    if not validation_result["success"]:
        print(f"❌ Validación falló: {validation_result['message']}")
        return False

    print("✅ Validación exitosa!")
    print(f"   Usuario: {validation_result['session_data']['username']}")
    print(f"   Rol: {validation_result['session_data']['role']}")
    print(f"   Sucursal: {validation_result['session_data']['storage_name']}")

    # Paso 3: Validar sesión nuevamente (simular múltiples validaciones)
    print("\n3️⃣ Validando sesión por segunda vez...")
    validation_result2 = validate_session(session_token)

    if not validation_result2["success"]:
        print(f"❌ Segunda validación falló: {validation_result2['message']}")
        return False

    print("✅ Segunda validación exitosa!")

    # Paso 4: Verificar estructura de base de datos
    print("\n4️⃣ Verificando sesión en base de datos...")
    import sqlite3

    conn = sqlite3.connect("database/mykonos.db")
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT s.id, s.user_id, s.storage_id, s.session_token, s.is_active,
               u.username, u.role
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.session_token = ?
    """,
        (session_token,),
    )

    session_db = cursor.fetchone()
    if session_db:
        print("✅ Sesión encontrada en base de datos:")
        print(f"   Session ID: {session_db[0]}")
        print(f"   User ID: {session_db[1]}")
        print(f"   Storage ID: {session_db[2]}")
        print(f"   Is Active: {session_db[4]}")
        print(f"   Username: {session_db[5]}")
        print(f"   Role: {session_db[6]}")
    else:
        print("❌ Sesión no encontrada en base de datos")

    conn.close()

    return True


if __name__ == "__main__":
    print("🔍 DIAGNÓSTICO DE SESIÓN")
    print("=" * 50)

    if test_session_flow():
        print("\n🎉 TODAS LAS PRUEBAS PASARON")
        print("=" * 50)
        print("✅ El sistema de sesión funciona correctamente")
        print("🔑 Intenta hacer login nuevamente en el frontend")
    else:
        print("\n⚠️ ALGUNAS PRUEBAS FALLARON")
        print("=" * 50)
        print("❌ Hay problemas en el sistema de sesión")
