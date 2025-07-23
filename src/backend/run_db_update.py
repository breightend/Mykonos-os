#!/usr/bin/env python3
"""
Ejecutor directo para actualizar la base de datos
"""

import sys
import os

# Añadir el directorio backend al path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

# Importar y ejecutar la función de actualización
from update_sessions_db import update_sessions_table

if __name__ == "__main__":
    print("🚀 Iniciando actualización de la base de datos...")
    success = update_sessions_table()

    if success:
        print("\n" + "=" * 50)
        print("✅ ACTUALIZACIÓN COMPLETADA")
        print("=" * 50)
        print("🔑 Login disponible:")
        print("   Usuario: admin")
        print("   Contraseña: admin123")
        print("   URL: http://localhost:5000/api/auth/login")
        print("=" * 50)
    else:
        print("\n" + "=" * 50)
        print("❌ ACTUALIZACIÓN FALLIDA")
        print("=" * 50)
