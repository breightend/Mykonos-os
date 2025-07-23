"""
Script para actualizar la base de datos con los nuevos campos para el sistema de compras
"""

import sqlite3
from database.database import DATABASE_PATH


def update_database():
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()

        print("Iniciando actualización de la base de datos...")

        # Verificar si las columnas ya existen antes de agregarlas

        # 1. Agregar columnas status y delivery_date a la tabla purchases
        try:
            cursor.execute(
                "ALTER TABLE purchases ADD COLUMN status TEXT DEFAULT 'Pendiente de entrega'"
            )
            print("✓ Columna 'status' agregada a la tabla purchases")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("- Columna 'status' ya existe en purchases")
            else:
                raise e

        try:
            cursor.execute("ALTER TABLE purchases ADD COLUMN delivery_date TEXT")
            print("✓ Columna 'delivery_date' agregada a la tabla purchases")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("- Columna 'delivery_date' ya existe en purchases")
            else:
                raise e

        # 2. Verificar si la tabla purchases_detail tiene la estructura correcta
        cursor.execute("PRAGMA table_info(purchases_detail)")
        columns = [column[1] for column in cursor.fetchall()]

        if "sale_price" in columns and "cost_price" not in columns:
            print("Actualizando estructura de purchases_detail...")

            # Crear nueva tabla con la estructura correcta
            cursor.execute("""
                CREATE TABLE purchases_detail_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    purchase_id INTEGER NOT NULL,
                    product_id INTEGER,
                    cost_price REAL NOT NULL,
                    quantity INTEGER NOT NULL CHECK (quantity > 0),
                    discount REAL DEFAULT 0.0,
                    subtotal REAL NOT NULL,
                    metadata TEXT,
                    FOREIGN KEY (purchase_id) REFERENCES purchases(id),
                    FOREIGN KEY (product_id) REFERENCES products(id)
                )
            """)

            # Copiar datos de la tabla antigua (si existe)
            cursor.execute("""
                INSERT INTO purchases_detail_new (id, purchase_id, product_id, cost_price, quantity, discount, subtotal, metadata)
                SELECT id, purchase_id, product_id, sale_price, quantity, discount, subtotal, metadata
                FROM purchases_detail
            """)

            # Eliminar tabla antigua y renombrar la nueva
            cursor.execute("DROP TABLE purchases_detail")
            cursor.execute(
                "ALTER TABLE purchases_detail_new RENAME TO purchases_detail"
            )

            print("✓ Tabla purchases_detail actualizada (sale_price → cost_price)")
        else:
            print("- Tabla purchases_detail ya tiene la estructura correcta")

        # 3. Actualizar el estado de compras existentes que no tengan estado
        cursor.execute(
            "UPDATE purchases SET status = 'Pendiente de entrega' WHERE status IS NULL OR status = ''"
        )
        affected_rows = cursor.rowcount
        if affected_rows > 0:
            print(
                f"✓ {affected_rows} compras actualizadas con estado 'Pendiente de entrega'"
            )
        else:
            print("- No hay compras sin estado para actualizar")

        # Confirmar cambios
        conn.commit()
        print("\n✅ Base de datos actualizada exitosamente!")

        # Mostrar estructura actualizada
        cursor.execute("PRAGMA table_info(purchases)")
        purchases_columns = cursor.fetchall()
        print("\nEstructura actual de la tabla 'purchases':")
        for col in purchases_columns:
            print(f"  - {col[1]} ({col[2]})")

        cursor.execute("PRAGMA table_info(purchases_detail)")
        detail_columns = cursor.fetchall()
        print("\nEstructura actual de la tabla 'purchases_detail':")
        for col in detail_columns:
            print(f"  - {col[1]} ({col[2]})")

    except Exception as e:
        print(f"❌ Error al actualizar la base de datos: {e}")
        conn.rollback()
    finally:
        conn.close()


if __name__ == "__main__":
    update_database()
