#!/usr/bin/env python3

import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "src", "backend"))

try:
    from database.database import Database

    def check_barcode_generation():
        """Check how barcodes are generated in the database"""
        try:
            db = Database()

            print("🔍 === VERIFICACIÓN DE CÓDIGOS DE BARRAS ===")

            # 1. Verificar estructura de warehouse_stock_variants
            print("\n📋 Estructura de warehouse_stock_variants:")
            result = db.execute_query("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'warehouse_stock_variants' 
                ORDER BY ordinal_position
            """)
            for col in result:
                print(f"  - {col['column_name']}: {col['data_type']}")

            # 2. Verificar códigos de barras existentes
            print("\n🏷️ Códigos de barras en warehouse_stock_variants:")
            variants = db.execute_query("""
                SELECT 
                    wsv.id,
                    wsv.product_id,
                    wsv.variant_barcode,
                    p.product_name,
                    s.size_name,
                    c.color_name,
                    wsv.quantity
                FROM warehouse_stock_variants wsv
                JOIN products p ON wsv.product_id = p.id
                LEFT JOIN sizes s ON wsv.size_id = s.id
                LEFT JOIN colors c ON wsv.color_id = c.id
                WHERE wsv.variant_barcode IS NOT NULL
                LIMIT 10
            """)

            if variants:
                print(f"✅ Encontradas {len(variants)} variantes con códigos:")
                for variant in variants:
                    print(
                        f"  - ID: {variant['id']} | Producto: {variant['product_name']}"
                    )
                    print(f"    Código: {variant['variant_barcode']}")
                    print(
                        f"    Talle: {variant['size_name']} | Color: {variant['color_name']}"
                    )
                    print(f"    Stock: {variant['quantity']}")
                    print()
            else:
                print("❌ No se encontraron variantes con códigos de barras")

            # 3. Verificar productos disponibles
            print("\n📦 Productos disponibles:")
            products = db.execute_query("""
                SELECT 
                    p.id,
                    p.product_name,
                    p.sale_price,
                    b.brand_name,
                    COUNT(wsv.id) as total_variants
                FROM products p
                LEFT JOIN brands b ON p.brand_id = b.id
                LEFT JOIN warehouse_stock_variants wsv ON p.id = wsv.product_id
                GROUP BY p.id, p.product_name, p.sale_price, b.brand_name
                HAVING COUNT(wsv.id) > 0
                ORDER BY p.id
                LIMIT 5
            """)

            if products:
                print(f"✅ Encontrados {len(products)} productos con variantes:")
                for product in products:
                    print(f"  - ID: {product['id']} | {product['product_name']}")
                    print(f"    Marca: {product['brand_name'] or 'Sin marca'}")
                    print(f"    Precio: ${product['sale_price'] or 0}")
                    print(f"    Variantes: {product['total_variants']}")
                    print()
            else:
                print("❌ No se encontraron productos con variantes")

            # 4. Test específico para un producto
            print("\n🧪 Test para producto ID 1:")
            test_product = db.execute_query("""
                SELECT 
                    p.id,
                    p.product_name as name,
                    p.sale_price,
                    p.cost,
                    b.brand_name as brand
                FROM products p
                LEFT JOIN brands b ON p.brand_id = b.id
                WHERE p.id = 1
            """)

            if test_product:
                product = test_product[0]
                print(f"  Producto: {product['name']}")
                print(f"  Marca: {product['brand']}")
                print(
                    f"  Precio: {product['sale_price']} (tipo: {type(product['sale_price'])})"
                )

                # Verificar variantes de este producto
                test_variants = db.execute_query("""
                    SELECT 
                        wsv.id,
                        wsv.variant_barcode,
                        s.size_name,
                        c.color_name,
                        c.color_hex,
                        wsv.quantity
                    FROM warehouse_stock_variants wsv
                    LEFT JOIN sizes s ON wsv.size_id = s.id
                    LEFT JOIN colors c ON wsv.color_id = c.id
                    WHERE wsv.product_id = 1
                    AND wsv.quantity > 0
                """)

                print(f"  Variantes: {len(test_variants)}")
                for variant in test_variants:
                    print(
                        f"    - ID: {variant['id']} | Código: {variant['variant_barcode']}"
                    )
                    print(
                        f"      Talle: {variant['size_name']} | Color: {variant['color_name']}"
                    )
                    print(f"      Stock: {variant['quantity']}")
            else:
                print("  ❌ Producto ID 1 no encontrado")

            # 5. Verificar generación de códigos
            print("\n🔧 Patrón de códigos de barras:")
            all_codes = db.execute_query("""
                SELECT DISTINCT variant_barcode 
                FROM warehouse_stock_variants 
                WHERE variant_barcode IS NOT NULL 
                ORDER BY variant_barcode
                LIMIT 10
            """)

            if all_codes:
                print("  Códigos encontrados:")
                for code in all_codes:
                    barcode = code["variant_barcode"]
                    print(f"    - {barcode}")

                    # Analizar patrón
                    if barcode.startswith("VAR"):
                        print(f"      Formato: VAR + números")
                    elif len(barcode) == 10:
                        print(f"      Formato: 10 dígitos")
                    else:
                        print(f"      Formato: {len(barcode)} caracteres")
            else:
                print("  ❌ No se encontraron códigos de barras")

        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback

            traceback.print_exc()

    if __name__ == "__main__":
        check_barcode_generation()

except ImportError as e:
    print(f"❌ Error de importación: {e}")
    print("Asegúrate de que el servidor backend esté configurado correctamente")
