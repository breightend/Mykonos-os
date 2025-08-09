import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "src", "backend"))

from database.database import Database

print("🧪 Verificando conexión a base de datos...")

try:
    db = Database()
    conn = db.create_connection()
    cursor = conn.cursor()

    # Verificar que las tablas existen
    cursor.execute("SELECT COUNT(*) FROM sales LIMIT 1")
    print("✅ Tabla sales accesible")

    cursor.execute("SELECT COUNT(*) FROM sales_detail LIMIT 1")
    print("✅ Tabla sales_detail accesible")

    cursor.execute("SELECT COUNT(*) FROM product_variants LIMIT 1")
    print("✅ Tabla product_variants accesible")

    cursor.close()
    conn.close()

    print("\n✅ Base de datos está lista para pruebas de ventas")
    print("🔧 El sistema de ventas debería funcionar correctamente ahora")

except Exception as e:
    print(f"❌ Error al verificar base de datos: {e}")
    import traceback

    traceback.print_exc()
