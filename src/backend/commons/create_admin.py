import base64
from werkzeug.security import generate_password_hash
from database.database import Database


def create_admin():
    """
    Crea un usuario administrador por defecto si no existe.
    """
    print("🔧 Verificando usuario administrador...")
    db = Database()

    # Verificar si existe algún usuario admin
    admin_response = db.get_all_records_by_clause("users", "role = ?", "administrator")

    if admin_response and len(admin_response) > 0:
        print("✅ Ya existe al menos un usuario administrador.")
        return True
    else:
        print("📝 Creando usuario administrador por defecto...")

        # Crear imagen de perfil por defecto (un pixel transparente en base64)
        default_image = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        )

        # Crear el usuario admin por defecto
        hashed_password = generate_password_hash("admin123")

        admin_data = {
            "username": "admin",
            "fullname": "Administrador Sistema",
            "password": hashed_password,
            "email": "admin@mykonos.local",
            "phone": "000-000-0000",
            "domicilio": "Sistema",
            "cuit": "00-00000000-0",
            "role": "administrator",
            "status": "active",
            "session_token": "",
            "profile_image": default_image,
        }

        result = db.add_record("users", admin_data)

        if result["success"]:
            print("🎉 Usuario administrador creado con éxito.")
            print("   Usuario: admin")
            print("   Contraseña: admin123")
            print("   ⚠️  IMPORTANTE: Cambie la contraseña después del primer login")
            return True
        else:
            print(
                f"❌ Error al crear el usuario administrador: {result.get('message', 'Error desconocido')}"
            )
            return False


def create_custom_admin(username, password, fullname, email, phone, domicilio, cuit):
    """
    Crea un usuario administrador personalizado.

    Args:
        username (str): Nombre de usuario
        password (str): Contraseña
        fullname (str): Nombre completo
        email (str): Email
        phone (str): Teléfono
        domicilio (str): Domicilio
        cuit (str): CUIT

    Returns:
        dict: Resultado de la operación
    """
    print(f"🔧 Creando usuario administrador: {username}")
    db = Database()

    # Verificar si el usuario ya existe
    existing_user = db.get_record_by_clause("users", "username = ?", username)
    if existing_user["success"] and existing_user["record"]:
        return {"success": False, "message": f"El usuario '{username}' ya existe."}

    # Verificar si el CUIT ya existe
    existing_cuit = db.get_record_by_clause("users", "cuit = ?", cuit)
    if existing_cuit["success"] and existing_cuit["record"]:
        return {"success": False, "message": f"El CUIT '{cuit}' ya está registrado."}

    # Crear imagen de perfil por defecto
    default_image = base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    )

    # Hashear la contraseña
    hashed_password = generate_password_hash(password)

    admin_data = {
        "username": username,
        "fullname": fullname,
        "password": hashed_password,
        "email": email,
        "phone": phone,
        "domicilio": domicilio,
        "cuit": cuit,
        "role": "administrator",
        "status": "active",
        "session_token": "",
        "profile_image": default_image,
    }

    result = db.add_record("users", admin_data)

    if result["success"]:
        print(f"🎉 Usuario administrador '{username}' creado con éxito.")
        return {
            "success": True,
            "message": f"Usuario administrador '{username}' creado exitosamente.",
            "user_id": result["rowid"],
        }
    else:
        print(
            f"❌ Error al crear el usuario administrador: {result.get('message', 'Error desconocido')}"
        )
        return {
            "success": False,
            "message": f"Error al crear el usuario: {result.get('message', 'Error desconocido')}",
        }


def list_admins():
    """
    Lista todos los usuarios administradores.

    Returns:
        list: Lista de administradores
    """
    db = Database()
    admins = db.get_all_records_by_clause("users", "role = ?", "administrator")

    if admins:
        print("👥 Usuarios administradores:")
        for admin in admins:
            status_icon = "🟢" if admin.get("status") == "active" else "🔴"
            print(
                f"   {status_icon} {admin.get('username')} - {admin.get('fullname')} ({admin.get('email')})"
            )
    else:
        print("❌ No se encontraron usuarios administradores.")

    return admins if admins else []


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        command = sys.argv[1]

        if command == "create-custom":
            if len(sys.argv) != 9:
                print(
                    "Uso: python create_admin.py create-custom <username> <password> <fullname> <email> <phone> <domicilio> <cuit>"
                )
                sys.exit(1)

            _, _, username, password, fullname, email, phone, domicilio, cuit = sys.argv
            result = create_custom_admin(
                username, password, fullname, email, phone, domicilio, cuit
            )

            if result["success"]:
                print(f"✅ {result['message']}")
            else:
                print(f"❌ {result['message']}")

        elif command == "list":
            list_admins()

        else:
            print("Comandos disponibles:")
            print(
                "  python create_admin.py                    - Crear admin por defecto"
            )
            print(
                "  python create_admin.py create-custom ...  - Crear admin personalizado"
            )
            print(
                "  python create_admin.py list               - Listar administradores"
            )
    else:
        create_admin()
