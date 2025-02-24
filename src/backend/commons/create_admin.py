from werkzeug.security import generate_password_hash
from database.database import Database

def create_admin():
    """
    Crea un usuario por defecto 'admin' con contraseña 'admin' si no existe.
    """
    db = Database()

    # Verificar si el usuario admin ya existe
    user_response = db.get_record_by_clause("users", "username=?", "admin")

    if user_response["success"]:
        print("✅ El usuario 'admin' ya existe.")
    else:
        # Crear el usuario admin
        hashed_password = generate_password_hash("admin")
        success = db.add_record("users", {"username": "admin", "password": hashed_password})

        if success:
            print("🎉 Usuario 'admin' creado con éxito.")
        else:
            print("❌ Error al crear el usuario 'admin'. Puede que ya exista.")

if __name__ == "__main__":
    create_admin()