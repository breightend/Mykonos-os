import webbrowser
import threading
from flask import Flask, jsonify, request
from flask_cors import CORS
from commons import create_admin
from database.database import Database
from werkzeug.security import generate_password_hash
from routes.usuario_router import usuario_router
from routes.provider_router import provider_router

app = Flask(__name__)
app.register_blueprint(usuario_router, url_prefix='/api/data')
CORS(app)  # Habilitar CORS para todas las rutas
app.register_blueprint(provider_router, url_prefix='/api/provider')

@app.route('/')
def index():
    create_admin.create_admin()
    return "¡Hola, mundo desde Flask!"

@app.route('/saludo')
def get_data():
    return jsonify({"mensaje": "Hola desde Flask", "status": "éxito"})

def open_browser():
    webbrowser.open_new("http://127.0.0.1:5000/")

""" @app.route('/api/data', methods=['POST'])
def getData():
    data=request.json
    print(data)
    return jsonify({"mensaje": "Hola desde Flask", "status": "éxito"}) """


if __name__ == '__main__':
    # Inicia un temporizador para abrir el navegador después de 1 segundo
    #threading.Timer(1, open_browser).start()
    app.run(debug=True, port=5000)
    #create_admin.create_admin()
    
