import webbrowser
from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from commons import create_admin
from routes.usuario_router import usuario_router
from routes.provider_router import provider_router
from routes.client_router import client_router
from routes.product_router import product_router
from routes.storage_router import storage_router

app = Flask(__name__)
# Comprehensive CORS configuration to handle all preflight requests
CORS(
    app,
    origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    supports_credentials=False,  # Changed to False to avoid conflicts with wildcard origins
    expose_headers=["Content-Type", "Authorization"]
)
app.register_blueprint(usuario_router, url_prefix="/api/user")
app.register_blueprint(provider_router, url_prefix="/api/provider")
app.register_blueprint(client_router, url_prefix="/api/client")
app.register_blueprint(product_router, url_prefix="/api/product")
app.register_blueprint(storage_router, url_prefix="/api/storage")


@app.route("/")
def index():
    create_admin.create_admin()
    return "¡Hola, mundo desde Flask!"


@app.route("/saludo")
def get_data():
    return jsonify({"mensaje": "Hola desde Flask", "status": "éxito"})


# Global OPTIONS handler for any unhandled preflight requests
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "*")
        response.headers.add('Access-Control-Allow-Methods', "*")
        return response


def open_browser():
    webbrowser.open_new("http://127.0.0.1:5000/")


""" @app.route('/api/data', methods=['POST'])
def getData():
    data=request.json
    print(data)
    return jsonify({"mensaje": "Hola desde Flask", "status": "éxito"}) """


if __name__ == "__main__":
    # Inicia un temporizador para abrir el navegador después de 1 segundo
    # threading.Timer(1, open_browser).start()
    app.run(debug=True, port=5000)
    # create_admin.create_admin()
