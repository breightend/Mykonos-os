import webbrowser
import threading
from flask import Flask, jsonify
from commons import create_admin

app = Flask(__name__)

@app.route('/')
def index():
    create_admin.create_admin()
    return "¡Hola, mundo desde Flask!"

@app.route('/api/data')
def get_data():
    return jsonify({"mensaje": "Hola desde Flask", "status": "éxito"})

def open_browser():
    webbrowser.open_new("http://127.0.0.1:5000/")

if __name__ == '__main__':
    # Inicia un temporizador para abrir el navegador después de 1 segundo
    #threading.Timer(1, open_browser).start()
    app.run(debug=True, port=5000)
    #create_admin.create_admin()
    
