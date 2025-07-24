#!/usr/bin/env python3
"""
Manual verification script for branch switching functionality
Run this script to verify all components are properly implemented
"""

import os
import sys

# Add the backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), "src", "backend")
sys.path.insert(0, backend_path)


def verify_auth_service():
    """Verify auth_service.py has required functions"""
    print("🔍 Verificando auth_service.py...")

    try:
        from services.auth_service import change_user_storage, get_user_allowed_storages

        print("✅ change_user_storage function imported successfully")
        print("✅ get_user_allowed_storages function imported successfully")
        return True
    except ImportError as e:
        print(f"❌ Error importing auth service functions: {e}")
        return False


def verify_auth_routes():
    """Verify auth.py has required routes"""
    print("\n🔍 Verificando rutas de auth.py...")

    auth_file = os.path.join(backend_path, "routes", "auth.py")

    try:
        with open(auth_file, "r", encoding="utf-8") as f:
            content = f.read()

        # Check for required route endpoints
        routes_to_check = [
            ("/change-storage", "change_storage"),
            ("/user-storages", "get_user_storages"),
        ]

        for route_path, route_function in routes_to_check:
            if route_path in content and route_function in content:
                print(f"✅ Route {route_path} ({route_function}) found")
            else:
                print(f"❌ Route {route_path} ({route_function}) NOT found")
                return False

        return True
    except Exception as e:
        print(f"❌ Error checking auth routes: {e}")
        return False


def verify_database_functions():
    """Verify database.py has required functions"""
    print("\n🔍 Verificando funciones de database.py...")

    try:
        from database.database import DatabaseManager

        # Check if required methods exist
        required_methods = [
            "get_storages_by_user",
            "check_user_storage_relationship_exists",
            "add_user_storage_relationship",
            "remove_user_storage_relationship",
        ]

        for method_name in required_methods:
            if hasattr(DatabaseManager, method_name):
                print(f"✅ Method {method_name} found in DatabaseManager")
            else:
                print(f"❌ Method {method_name} NOT found in DatabaseManager")
                return False

        return True
    except Exception as e:
        print(f"❌ Error checking database functions: {e}")
        return False


def verify_frontend_files():
    """Verify frontend files are updated"""
    print("\n🔍 Verificando archivos del frontend...")

    # Check SessionContext.jsx
    session_context_file = os.path.join(
        os.path.dirname(__file__),
        "src",
        "renderer",
        "src",
        "contexts",
        "SessionContext.jsx",
    )

    try:
        with open(session_context_file, "r", encoding="utf-8") as f:
            content = f.read()

        if "changeBranchStorage" in content:
            print("✅ changeBranchStorage function found in SessionContext.jsx")
        else:
            print("❌ changeBranchStorage function NOT found in SessionContext.jsx")
            return False

    except Exception as e:
        print(f"❌ Error checking SessionContext.jsx: {e}")
        return False

    # Check usuario.jsx
    usuario_file = os.path.join(
        os.path.dirname(__file__), "src", "renderer", "src", "modals", "usuario.jsx"
    )

    try:
        with open(usuario_file, "r", encoding="utf-8") as f:
            content = f.read()

        if "handleStorageChange" in content and "userStorages" in content:
            print("✅ Branch switching functionality found in usuario.jsx")
        else:
            print("❌ Branch switching functionality NOT found in usuario.jsx")
            return False

    except Exception as e:
        print(f"❌ Error checking usuario.jsx: {e}")
        return False

    return True


def main():
    """Run all verification checks"""
    print("🚀 Iniciando verificación de la funcionalidad de cambio de sucursal...\n")

    all_checks_passed = True

    # Run all verification checks
    checks = [
        verify_auth_service,
        verify_auth_routes,
        verify_database_functions,
        verify_frontend_files,
    ]

    for check in checks:
        if not check():
            all_checks_passed = False

    print("\n" + "=" * 60)
    if all_checks_passed:
        print("🎉 ¡Todas las verificaciones pasaron exitosamente!")
        print("\n📋 Pasos siguientes:")
        print("1. Reiniciar el servidor backend (python src/backend/main.py)")
        print("2. Reiniciar la aplicación Electron")
        print("3. Hacer login en la aplicación")
        print("4. Ir al perfil de usuario para probar cambio de sucursal")
    else:
        print("❌ Algunas verificaciones fallaron. Revisar los errores arriba.")

    return all_checks_passed


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
