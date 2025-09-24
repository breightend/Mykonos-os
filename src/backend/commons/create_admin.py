import base64
from werkzeug.security import generate_password_hash
from database.database import Database


def assign_all_storages_to_user(db, user_id):
    """
    Asigna acceso a todas las sucursales existentes al usuario especificado.

    Args:
        db (Database): Instancia de la base de datos
        user_id (int): ID del usuario
    """
    try:
        # Obtener todas las sucursales
        storages = db.get_all_records("storage")

        if not storages:
            print("   📦 No hay sucursales registradas en el sistema.")
            return

        print(f"   📦 Asignando acceso a {len(storages)} sucursal(es)...")

        # Asignar cada sucursal al usuario
        success_count = 0
        for storage in storages:
            storage_id = storage.get("id")

            # Verificar si ya existe la relación
            existing = db.get_record_by_clause(
                "usersxstorage", "id_user = ? AND id_storage = ?", (user_id, storage_id)
            )

            if not (existing["success"] and existing["record"]):
                # Crear la relación usuario-sucursal
                relation_data = {"id_user": user_id, "id_storage": storage_id}

                result = db.add_record("usersxstorage", relation_data)
                if result["success"]:
                    success_count += 1
                    print(
                        f"      ✅ Acceso asignado a sucursal: {storage.get('name', f'ID {storage_id}')}"
                    )
                else:
                    print(
                        f"      ❌ Error asignando sucursal {storage.get('name', f'ID {storage_id}')}: {result.get('message')}"
                    )
            else:
                print(
                    f"      ℹ️  Ya tiene acceso a sucursal: {storage.get('name', f'ID {storage_id}')}"
                )

        if success_count > 0:
            print(f"   🎯 Acceso asignado exitosamente a {success_count} sucursal(es).")

    except Exception as e:
        print(f"   ❌ Error al asignar sucursales: {str(e)}")


def create_default_storage_if_needed(db):
    """
    Crea una sucursal por defecto si no existe ninguna.

    Args:
        db (Database): Instancia de la base de datos
    """
    try:
        # Verificar si existen sucursales
        storages = db.get_all_records("storage")

        if not storages:
            print(
                "   🏪 No hay sucursales registradas. Creando sucursal por defecto..."
            )

            default_storage = {
                "name": "Sucursal Principal",
                "address": "Dirección Principal",
                "postal_code": "0000",
                "phone_number": "000-000-0000",
                "area": "Principal",
                "description": "Sucursal principal del sistema",
                "status": "Activo",
            }

            result = db.add_record("storage", default_storage)
            if result["success"]:
                print(f"   ✅ Sucursal por defecto creada con ID: {result['rowid']}")
                return result["rowid"]
            else:
                print(
                    f"   ❌ Error creando sucursal por defecto: {result.get('message')}"
                )
                return None
        else:
            print(f"   ℹ️  Ya existen {len(storages)} sucursal(es) en el sistema.")
            return True

    except Exception as e:
        print(f"   ❌ Error verificando/creando sucursales: {str(e)}")
        return None


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

        # Crear sucursal por defecto si no existe ninguna
        create_default_storage_if_needed(db)

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
            user_id = result["rowid"]
            print("🎉 Usuario administrador creado con éxito.")
            print("   Usuario: admin")
            print("   Contraseña: admin123")

            # Asignar acceso a todas las sucursales
            assign_all_storages_to_user(db, user_id)

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
        user_id = result["rowid"]
        print(f"🎉 Usuario administrador '{username}' creado con éxito.")

        # Asignar acceso a todas las sucursales
        assign_all_storages_to_user(db, user_id)

        return {
            "success": True,
            "message": f"Usuario administrador '{username}' creado exitosamente.",
            "user_id": user_id,
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


def assign_storages_to_existing_user(username):
    """
    Asigna acceso a todas las sucursales a un usuario existente.

    Args:
        username (str): Nombre de usuario
    """
    print(f"🔧 Asignando sucursales al usuario: {username}")
    db = Database()

    # Buscar el usuario
    user_result = db.get_record_by_clause("users", "username = ?", username)

    if not (user_result["success"] and user_result["record"]):
        print(f"❌ Usuario '{username}' no encontrado.")
        return False

    user = user_result["record"]
    user_id = user.get("id")

    print(f"✅ Usuario encontrado: {user.get('fullname')} (ID: {user_id})")

    # Crear sucursal por defecto si no existe ninguna
    create_default_storage_if_needed(db)

    # Asignar todas las sucursales
    assign_all_storages_to_user(db, user_id)

    print("🎯 Proceso completado.")
    return True


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

        elif command == "assign-storages":
            if len(sys.argv) != 3:
                print("Uso: python create_admin.py assign-storages <username>")
                sys.exit(1)

            username = sys.argv[2]
            assign_storages_to_existing_user(username)

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
            print(
                "  python create_admin.py assign-storages <username> - Asignar sucursales a usuario existente"
            )
    else:
        create_admin()
