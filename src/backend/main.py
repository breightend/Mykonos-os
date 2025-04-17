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
from codecarbon import EmissionsTracker, track_emissions
from datetime import datetime
from zoneinfo import ZoneInfo

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


@atexit.register
def cleanup():
    print("Ejecutando limpieza antes de salir...")
    print("Cerrando la base de datos...")

    zona_arg = ZoneInfo("America/Argentina/Buenos_Aires")
    hora_arg = datetime.now(zona_arg)
    print("Hora de fin del programa:", hora_arg)
    
    # if "tracker" in globals():
        # tracker.stop()

@track_emissions
def simulacion_ejec_programa():

    zona_arg = ZoneInfo("America/Argentina/Buenos_Aires")

    # Obtener hora actual en Argentina
    hora_arg = datetime.now(zona_arg)
    print("Hora de inicio del programa:", hora_arg)


    db = Database()
    i = 0
    while True:
        i += 1
        if i % 2 == 0:
            db.get_all_records_by_clause("entities", "entity_type LIKE ?", "client")
        if i % 3 == 0:
            db.get_all_records_by_clause("entities", "entity_type LIKE ?", "provider")
        if i % 5 == 0:
            cliente = {
                "entity_name": "pruebas de green",
                "entity_type": "client",
                "razon_social": "hola",
                "responsabilidad_iva": 123456,
                "domicilio_comercial": "seasdasdas",
                "cuit": f"20-{i:08d}-9",
                "inicio_actividades": "123123",
                "ingresos_brutos": "123213123",
                "contact_name": "brenda",
                "phone_number": "1231221",
                "email": "qweqweqwe",
            }
            db.add_record("entities", cliente)
        elif i % 7 == 0:
            provider = {
                "entity_name": "pruebas de green",
                "entity_type": "provider",
                "razon_social": "hola",
                "responsabilidad_iva": 123456,
                "domicilio_comercial": "seasdasdas",
                "cuit": f"20-{i:08d}-9",
                "inicio_actividades": "123123",
                "ingresos_brutos": "123213123",
                "contact_name": "brenda",
                "phone_number": "1231221",
                "email": "qweqweqwe",
            }
            db.add_record("entities", cliente)
        
        print(f"Simulando ejecución del programa... {i}")

        if i == 100000000:
            hora_arg = datetime.now(zona_arg)
            print("Hora de fin del programa:", hora_arg)
            # tracker.stop()
            break



if __name__ == "__main__":
    # Inicia un temporizador para abrir el navegador después de 1 segundo
    # threading.Timer(1, open_browser).start()

    # tracker = EmissionsTracker(default_cpu_power=85, log_level="debug", measure_power_secs=5, tracking_mode="machine")
    # tracker.start()

    # Ejecutar Flask sin recargador para evitar problemas con señales
    simulacion_ejec_programa()
    app.run(debug=True, use_reloader=False, port=5000)
