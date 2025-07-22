from database.database import Database


def ensure_test_data():
    """
    Asegura que haya datos de prueba en la base de datos
    """
    print("🔧 INSERTANDO DATOS DE PRUEBA...")

    db = Database()

    try:
        # 1. Insertar sucursales de prueba
        print("1. Insertando sucursales...")

        # Verificar si hay sucursales
        existing_storages = db.execute_query("SELECT COUNT(*) FROM storage")[0][0]
        if existing_storages == 0:
            storage_inserts = [
                "INSERT INTO storage (name, address, postal_code, phone_number, area, description, status) VALUES ('Sucursal Centro', 'Av. Principal 123', '1000', '123-456-789', 'Centro', 'Sucursal principal', 'Activo')",
                "INSERT INTO storage (name, address, postal_code, phone_number, area, description, status) VALUES ('Sucursal Norte', 'Av. Norte 456', '1001', '123-456-790', 'Norte', 'Sucursal norte', 'Activo')",
            ]
            for query in storage_inserts:
                with db.create_connection() as conn:
                    conn.execute(query)
                    conn.commit()
            print("   ✅ Sucursales insertadas")
        else:
            print(f"   ℹ️ Ya hay {existing_storages} sucursales")

        # 2. Insertar marcas de prueba
        print("2. Insertando marcas...")
        existing_brands = db.execute_query("SELECT COUNT(*) FROM brands")[0][0]
        if existing_brands == 0:
            brand_inserts = [
                "INSERT INTO brands (brand_name, description) VALUES ('Nike', 'Marca deportiva')",
                "INSERT INTO brands (brand_name, description) VALUES ('Adidas', 'Marca deportiva')",
            ]
            for query in brand_inserts:
                with db.create_connection() as conn:
                    conn.execute(query)
                    conn.commit()
            print("   ✅ Marcas insertadas")
        else:
            print(f"   ℹ️ Ya hay {existing_brands} marcas")

        # 3. Insertar productos de prueba
        print("3. Insertando productos...")
        existing_products = db.execute_query("SELECT COUNT(*) FROM products")[0][0]
        if existing_products == 0:
            product_inserts = [
                "INSERT INTO products (barcode, provider_code, product_name, description, cost, sale_price, tax, brand_id) VALUES ('123456789', 'PROD001', 'Zapatillas Nike Air', 'Zapatillas deportivas', 50.00, 100.00, 21.00, 1)",
                "INSERT INTO products (barcode, provider_code, product_name, description, cost, sale_price, tax, brand_id) VALUES ('123456790', 'PROD002', 'Camiseta Adidas', 'Camiseta deportiva', 20.00, 40.00, 21.00, 2)",
            ]
            for query in product_inserts:
                with db.create_connection() as conn:
                    conn.execute(query)
                    conn.commit()
            print("   ✅ Productos insertados")
        else:
            print(f"   ℹ️ Ya hay {existing_products} productos")

        # 4. Insertar stock de prueba
        print("4. Insertando stock...")
        existing_stock = db.execute_query("SELECT COUNT(*) FROM warehouse_stock")[0][0]
        if existing_stock == 0:
            stock_inserts = [
                "INSERT INTO warehouse_stock (product_id, branch_id, quantity) VALUES (1, 1, 10)",
                "INSERT INTO warehouse_stock (product_id, branch_id, quantity) VALUES (1, 2, 5)",
                "INSERT INTO warehouse_stock (product_id, branch_id, quantity) VALUES (2, 1, 8)",
                "INSERT INTO warehouse_stock (product_id, branch_id, quantity) VALUES (2, 2, 12)",
            ]
            for query in stock_inserts:
                with db.create_connection() as conn:
                    conn.execute(query)
                    conn.commit()
            print("   ✅ Stock insertado")
        else:
            print(f"   ℹ️ Ya hay {existing_stock} registros de stock")

        # 5. Verificar los datos insertados
        print("\n5. VERIFICACIÓN FINAL:")

        # Verificar la query principal
        test_query = """
        SELECT 
            p.id, p.product_name, ws.quantity, s.name
        FROM warehouse_stock ws
        JOIN products p ON ws.product_id = p.id
        JOIN storage s ON ws.branch_id = s.id
        """

        results = db.execute_query(test_query)
        print(f"   📊 Query JOIN exitosa: {len(results)} resultados")
        for r in results:
            print(f"      - Producto: {r[1]}, Cantidad: {r[2]}, Sucursal: {r[3]}")

        print("\n✅ DATOS DE PRUEBA LISTOS")
        return True

    except Exception as e:
        print(f"❌ Error insertando datos: {e}")
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":
    ensure_test_data()
