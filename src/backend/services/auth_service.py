from werkzeug.security import check_password_hash
from flask_jwt_extended import create_access_token
from database.database import Database

db = Database()

from werkzeug.security import check_password_hash
from flask_jwt_extended import create_access_token
from database.database import Database

db = Database()

def authenticate_user(username, password):
    """
    Verifica las credenciales del usuario.

    Args:
        username (str): Nombre de usuario.
        password (str): Contraseña ingresada por el usuario.

    Returns:
        dict: {'success': bool, 'message': str, 'access_token': str (si éxito)}
    """
    user_response = db.get_record_by_clause(table_name='users', search_clause="username=?", value=username)
    
    if not user_response["success"]:
        return {"success": False, "message": user_response["message"]}

    user_record = user_response["record"]  # Obtenemos el diccionario del usuario
    
    if not user_record:
        return {"success": False, "message": "Usuario no encontrado."}

    # Extraer valores específicos
    user_id = user_record["id"]
    db_password = user_record["password"]

    # Verificar la contraseña hasheada
    if not check_password_hash(db_password, password):
        return {"success": False, "message": "Contraseña incorrecta."}

    # Si la contraseña es correcta, generar un token JWT
    access_token = create_access_token(identity=user_id)
    return {"success": True, "message": "Login exitoso.", "access_token": access_token}

