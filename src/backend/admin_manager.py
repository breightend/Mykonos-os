#!/usr/bin/env python3
"""
Script para gestionar usuarios administradores de Mykonos-OS
"""

import sys
import os

# Agregar el directorio backend al path para importar módulos
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

# Importar después de configurar el path
try:
    from commons.create_admin import create_admin, create_custom_admin, list_admins
except ImportError as e:
    print(f"❌ Error importando módulos: {e}")
    print("Asegúrese de que está ejecutando el script desde el directorio correcto.")
    sys.exit(1)


def print_help():
    """Muestra la ayuda del script"""
    print("🔧 Gestor de Usuarios Administradores - Mykonos-OS")
    print("=" * 50)
    print("Uso:")
    print("  python admin_manager.py [comando] [argumentos]")
    print("")
    print("Comandos disponibles:")
    print("  (sin argumentos)     - Crear usuario administrador por defecto")
    print("  create-default       - Crear usuario administrador por defecto")
    print("  create-custom        - Crear usuario administrador personalizado")
    print("  list                 - Listar todos los administradores")
    print("  help                 - Mostrar esta ayuda")
    print("")
    print("Ejemplos:")
    print("  python admin_manager.py")
    print("  python admin_manager.py create-default")
    print("  python admin_manager.py create-custom")
    print("  python admin_manager.py list")
    print("")
    print(
        "Para crear un administrador personalizado, se le pedirán los datos interactivamente."
    )


def create_custom_interactive():
    """Crea un usuario administrador de forma interactiva"""
    print("🔧 Crear Usuario Administrador Personalizado")
    print("=" * 45)

    try:
        # Solicitar datos
        username = input("Nombre de usuario: ").strip()
        if not username:
            print("❌ El nombre de usuario es requerido.")
            return False

        password = input("Contraseña: ").strip()
        if not password:
            print("❌ La contraseña es requerida.")
            return False

        fullname = input("Nombre completo: ").strip()
        if not fullname:
            print("❌ El nombre completo es requerido.")
            return False

        email = input("Email: ").strip()
        if not email:
            print("❌ El email es requerido.")
            return False

        phone = input("Teléfono: ").strip()
        if not phone:
            print("❌ El teléfono es requerido.")
            return False

        domicilio = input("Domicilio: ").strip()
        if not domicilio:
            print("❌ El domicilio es requerido.")
            return False

        cuit = input("CUIT (formato XX-XXXXXXXX-X): ").strip()
        if not cuit:
            print("❌ El CUIT es requerido.")
            return False

        # Confirmar datos
        print("\n📋 Datos ingresados:")
        print(f"   Usuario: {username}")
        print(f"   Nombre: {fullname}")
        print(f"   Email: {email}")
        print(f"   Teléfono: {phone}")
        print(f"   Domicilio: {domicilio}")
        print(f"   CUIT: {cuit}")

        confirm = input("\n¿Confirma la creación del usuario? (s/N): ").strip().lower()
        if confirm not in ["s", "si", "sí", "y", "yes"]:
            print("❌ Operación cancelada.")
            return False

        # Crear usuario
        result = create_custom_admin(
            username, password, fullname, email, phone, domicilio, cuit
        )

        if result["success"]:
            print(f"\n✅ {result['message']}")
            print("⚠️  IMPORTANTE: Guarde estos datos en un lugar seguro.")
            return True
        else:
            print(f"\n❌ {result['message']}")
            return False

    except KeyboardInterrupt:
        print("\n❌ Operación cancelada por el usuario.")
        return False
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        return False


def main():
    """Función principal"""
    if len(sys.argv) == 1:
        # Sin argumentos, crear admin por defecto
        print("🔧 Creando usuario administrador por defecto...")
        create_admin()
        return

    command = sys.argv[1].lower()

    if command in ["help", "-h", "--help"]:
        print_help()
    elif command == "create-default":
        print("🔧 Creando usuario administrador por defecto...")
        create_admin()
    elif command == "create-custom":
        create_custom_interactive()
    elif command == "list":
        print("👥 Listando usuarios administradores...")
        list_admins()
    else:
        print(f"❌ Comando desconocido: {command}")
        print("Use 'python admin_manager.py help' para ver los comandos disponibles.")


if __name__ == "__main__":
    main()
