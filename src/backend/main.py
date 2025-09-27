import webbrowser
import logging
from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from commons import create_admin
from config.config import get_config
from config.logging_config import setup_logging
from routes.auth import auth_bp
from routes.usuario_router import usuario_router
from routes.provider_router import provider_router
from routes.client_router import client_router
from routes.product_router import product_router
from routes.storage_router import storage_router
from routes.inventory_router import inventory_router
from routes.purchase_router import purchase_bp
from routes.barcode_router import barcode_router
from routes.debug_router import debug_router
from routes.debug_inventory_router import debug_inventory_bp
from routes.sales_router import sales_router
from routes.account_movements_router import account_movements_router
from routes.client_sales_router import client_sales_router
from routes.exchange_router import exchange_router
from routes.payment_methods_router import payment_methods_router
from routes.banks_router import banks_router
from routes.statistics_router import statistics_bp
from routes.files_router import files_bp
from routes.health import health_bp

# Initialize configuration and logging
config = get_config()
setup_logging(config)
logger = logging.getLogger(__name__)

app = Flask(__name__)


# Add request logging (only in development)
@app.before_request
def before_request():
    if config.DEBUG:
        logger.debug(f"🌐 INCOMING REQUEST: {request.method} {request.url}")
        logger.debug(f"🌐 Headers: {dict(request.headers)}")


# Add response logging (only in development)
@app.after_request
def after_request(response):
    if config.DEBUG:
        logger.debug(f"🌐 OUTGOING RESPONSE: {response.status_code}")
    return response


# CORS configuration optimized for Electron desktop application
# Para aplicaciones de escritorio, permitimos cualquier origen ya que la seguridad
# se maneja a través de la autenticación JWT, no por restricciones de origen
CORS(
    app,
    resources={r"/*": {"origins": "*"}},
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    supports_credentials=False,
    expose_headers=["Content-Type", "Authorization"],
)
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(usuario_router, url_prefix="/api/user")
app.register_blueprint(provider_router, url_prefix="/api/provider")
app.register_blueprint(client_router, url_prefix="/api/client")
app.register_blueprint(product_router, url_prefix="/api/product")
app.register_blueprint(storage_router, url_prefix="/api/storage")
app.register_blueprint(inventory_router, url_prefix="/api/inventory")
app.register_blueprint(purchase_bp, url_prefix="/api/purchases")
app.register_blueprint(barcode_router, url_prefix="/api/barcode")
app.register_blueprint(debug_router, url_prefix="/api/debug")
app.register_blueprint(debug_inventory_bp, url_prefix="/api/debug")
app.register_blueprint(sales_router, url_prefix="/api/sales")
app.register_blueprint(account_movements_router, url_prefix="/api/account")
app.register_blueprint(client_sales_router, url_prefix="/api/client-sales")
app.register_blueprint(exchange_router, url_prefix="/api/exchange")
app.register_blueprint(payment_methods_router, url_prefix="/api/payment-methods")
app.register_blueprint(banks_router, url_prefix="/api/banks")
app.register_blueprint(statistics_bp, url_prefix="/api/statistics")
app.register_blueprint(files_bp, url_prefix="/api/files")


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
        response.headers.add("Access-Control-Allow-Headers", "*")
        response.headers.add("Access-Control-Allow-Methods", "*")
        return response


def open_browser():
    webbrowser.open_new("http://127.0.0.1:5000/")


""" @app.route('/api/data', methods=['POST'])
def getData():
    data=request.json
    print(data)
    return jsonify({"mensaje": "Hola desde Flask", "status": "éxito"}) """


if __name__ == "__main__":
    # Register health check routes
    app.register_blueprint(health_bp, url_prefix="/api")

    # Log startup information
    logger.info(f"Starting Mykonos OS backend in {config.ENVIRONMENT} environment")
    logger.info(f"Server will run on {config.SERVER_HOST}:{config.SERVER_PORT}")
    logger.info(f"Debug mode: {config.DEBUG}")

    # Only open browser in development
    if config.DEBUG:
        # Inicia un temporizador para abrir el navegador después de 1 segundo
        # threading.Timer(1, open_browser).start()
        pass

    try:
        app.run(host=config.SERVER_HOST, port=config.SERVER_PORT, debug=config.DEBUG)
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        raise
