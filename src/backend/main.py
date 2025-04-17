import atexit
import webbrowser
import threading
from flask import Flask, jsonify, request
from flask_cors import CORS
from commons import create_admin
from database.database import Database
from werkzeug.security import generate_password_hash
from routes.usuario_router import usuario_router
from routes.provider_router import provider_router
from routes.client_router import client_router
from codecarbon import EmissionsTracker

app = Flask(__name__)
app.register_blueprint(usuario_router, url_prefix="/api/data")
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": "http://localhost:5173",
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type"],
        }
    },
)
app.register_blueprint(provider_router, url_prefix="/api/provider")
app.register_blueprint(client_router, url_prefix="/api/client")


@app.route("/")
def index():
    create_admin.create_admin()
    return "¡Hola, mundo desde Flask!"


@app.route("/saludo")
def get_data():
    return jsonify({"mensaje": "Hola desde Flask", "status": "éxito"})


def open_browser():
    webbrowser.open_new("http://127.0.0.1:5000/")


# @atexit.register
# def cleanup():
#     print("Ejecutando limpieza antes de salir...")
#     print("Cerrando la base de datos...")
#     i = 100000
#     db = Database()
#     while i > 0:
#         i -= 1
#         db.get_record_by_id("entities", 1)
#         print(i)
#     if "tracker" in globals():
#         tracker.stop()


if __name__ == "__main__":
    # Inicia un temporizador para abrir el navegador después de 1 segundo
    # threading.Timer(1, open_browser).start()

    # tracker = EmissionsTracker(default_cpu_power=85, log_level="debug")
    # tracker.start()

    # Ejecutar Flask sin recargador para evitar problemas con señales
    app.run(debug=True, use_reloader=False, port=5000)
