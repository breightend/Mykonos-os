from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config.config import Config
from routes.auth import auth_bp
from services.auth_service import authenticate_user

app = Flask(__name__)
app.config.from_object(Config)
jwt = JWTManager(app)
CORS(app)

# Registrar las rutas
app.register_blueprint(auth_bp, url_prefix="/auth")

if __name__ == "__main__":
    app.run(debug=True, port=5000)

    # 🔹 PRUEBA DE AUTENTICACIÓN 🔹
    print("\n🔍 Probando login...")

    # Reemplaza estos valores con un usuario existente en la base de datos
    test_username = "andres"
    test_password = "1234"

    response = authenticate_user(test_username, test_password)
    print("📝 Respuesta del login:", response)


