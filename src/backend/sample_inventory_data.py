"""
Script para insertar datos de ejemplo para probar la funcionalidad de inventario
Relación muchos a muchos entre productos y sucursales (storage)
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import Database


def execute_insert(db, query, params):
    """Ejecuta una consulta INSERT usando execute_query"""
    try:
        with db.create_connection() as conn:
            cur = conn.cursor()
            cur.execute(query, params)
            conn.commit()
            return True
    except Exception as e:
        print(f"Error en INSERT: {e}")
        return False


def insert_sample_data():
    """Inserta datos de ejemplo para productos, sucursales y stock"""
    db = Database()

    try:
        print("Insertando datos de ejemplo...")

        # Insertar sucursales de ejemplo
        storage_data = [
            (
                "Sucursal Centro",
                "Av. Libertador 1234",
                "1414",
                "11-4567-8900",
                "Principal",
                "Sucursal principal en el centro",
            ),
            (
                "Sucursal Norte",
                "Av. Cabildo 5678",
                "1426",
                "11-4567-8901",
                "Secundaria",
                "Sucursal en zona norte",
            ),
            (
                "Sucursal Sur",
                "Av. Rivadavia 9012",
                "1406",
                "11-4567-8902",
                "Secundaria",
                "Sucursal en zona sur",
            ),
            (
                "Depósito Central",
                "Parque Industrial 345",
                "1754",
                "11-4567-8903",
                "Depósito",
                "Depósito principal de mercadería",
            ),
        ]

        for storage in storage_data:
            execute_insert(
                db,
                """
                INSERT OR IGNORE INTO storage (name, address, postal_code, phone_number, area, description)
                VALUES (?, ?, ?, ?, ?, ?)
            """,
                storage,
            )

        # Insertar marcas de ejemplo
        brands_data = [
            ("Moravia",),
            ("Levi's",),
            ("Zara",),
            ("Adidas",),
            ("Nike",),
            ("H&M",),
        ]

        for brand in brands_data:
            execute_insert(
                db,
                """
                INSERT OR IGNORE INTO brands (brand_name)
                VALUES (?)
            """,
                brand,
            )

        # Insertar colores de ejemplo
        colors_data = [
            ("Negro",),
            ("Blanco",),
            ("Azul",),
            ("Rojo",),
            ("Verde",),
            ("Gris",),
            ("Amarillo",),
        ]

        for color in colors_data:
            execute_insert(
                db,
                """
                INSERT OR IGNORE INTO colors (color_name)
                VALUES (?)
            """,
                color,
            )

        # Obtener IDs de marcas
        brands = db.execute_query("SELECT id, brand_name FROM brands")
        brand_dict = {brand["brand_name"]: brand["id"] for brand in brands}

        # Insertar productos de ejemplo
        products_data = [
            (
                "7798123456789",
                "PROD001",
                "Remera Básica",
                1,
                None,
                "Remera de algodón básica",
                1500.00,
                2500.00,
                21.00,
                0.00,
                "Remera cómoda para uso diario",
                1,
                None,
                brand_dict.get("Moravia"),
            ),
            (
                "7798123456790",
                "PROD002",
                "Pantalón Jean",
                1,
                None,
                "Jean clásico",
                3500.00,
                5500.00,
                21.00,
                10.00,
                "Jean de corte clásico",
                1,
                None,
                brand_dict.get("Levi's"),
            ),
            (
                "7798123456791",
                "PROD003",
                "Campera de Abrigo",
                1,
                None,
                "Campera para invierno",
                4500.00,
                7500.00,
                21.00,
                0.00,
                "Campera abrigada para temporada fría",
                1,
                None,
                brand_dict.get("Zara"),
            ),
            (
                "7798123456792",
                "PROD004",
                "Buzo con Capucha",
                1,
                None,
                "Buzo deportivo",
                2800.00,
                4200.00,
                21.00,
                5.00,
                "Buzo cómodo para deporte",
                1,
                None,
                brand_dict.get("Adidas"),
            ),
            (
                "7798123456793",
                "PROD005",
                "Zapatillas Running",
                1,
                None,
                "Zapatillas para correr",
                8500.00,
                12000.00,
                21.00,
                15.00,
                "Zapatillas técnicas para running",
                1,
                None,
                brand_dict.get("Nike"),
            ),
            (
                "7798123456794",
                "PROD006",
                "Vestido Casual",
                1,
                None,
                "Vestido para uso diario",
                3200.00,
                5800.00,
                21.00,
                0.00,
                "Vestido cómodo y versátil",
                1,
                None,
                brand_dict.get("H&M"),
            ),
        ]

        for product in products_data:
            execute_insert(
                db,
                """
                INSERT OR IGNORE INTO products 
                (barcode, provider_code, product_name, group_id, provider_id, description, cost, sale_price, tax, discount, comments, user_id, images_ids, brand_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
                product,
            )

        # Obtener IDs de productos y sucursales
        products = db.execute_query("SELECT id, product_name FROM products")
        storages = db.execute_query("SELECT id, name FROM storage")

        # Insertar stock de ejemplo (relación muchos a muchos)
        import random

        for product in products:
            for storage in storages:
                # Generar cantidad aleatoria entre 0 y 100
                quantity = random.randint(0, 100)

                execute_insert(
                    db,
                    """
                    INSERT OR REPLACE INTO warehouse_stock (product_id, branch_id, quantity)
                    VALUES (?, ?, ?)
                """,
                    (product["id"], storage["id"], quantity),
                )

        # Insertar relaciones producto-color de ejemplo

        # Asignar colores a productos
        product_colors = [
            (1, [1, 2]),  # Remera: Negro, Blanco
            (2, [3, 1]),  # Pantalón: Azul, Negro
            (3, [4, 5]),  # Campera: Rojo, Verde
            (4, [6, 2]),  # Buzo: Gris, Blanco
            (5, [1, 2, 3]),  # Zapatillas: Negro, Blanco, Azul
            (6, [4, 2, 5]),  # Vestido: Rojo, Blanco, Verde
        ]

        for product_id, color_ids in product_colors:
            for color_id in color_ids:
                execute_insert(
                    db,
                    """
                    INSERT OR IGNORE INTO product_colors (product_id, color_id)
                    VALUES (?, ?)
                """,
                    (product_id, color_id),
                )

        print("✅ Datos de ejemplo insertados correctamente!")
        print("\nResumen de datos insertados:")
        print(f"- Sucursales: {len(storage_data)}")
        print(f"- Marcas: {len(brands_data)}")
        print(f"- Colores: {len(colors_data)}")
        print(f"- Productos: {len(products_data)}")
        print(f"- Registros de stock: {len(products) * len(storages)}")

        # Mostrar ejemplo de stock por sucursal
        print("\n📊 Ejemplo de stock por sucursal:")
        sample_data = db.execute_query("""
            SELECT 
                p.product_name,
                s.name as sucursal,
                ws.quantity
            FROM warehouse_stock ws
            JOIN products p ON ws.product_id = p.id
            JOIN storage s ON ws.branch_id = s.id
            WHERE ws.quantity > 0
            ORDER BY p.product_name, s.name
            LIMIT 10
        """)

        for row in sample_data:
            print(
                f"  {row['product_name']} - {row['sucursal']}: {row['quantity']} unidades"
            )

    except Exception as e:
        print(f"❌ Error al insertar datos: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    insert_sample_data()
