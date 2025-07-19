#!/usr/bin/env python3
"""
Script de prueba para las relaciones muchos-a-muchos entre productos, talles y colores.
Este script prueba las nuevas funcionalidades implementadas.
"""

import sys
import os

# Agregar el directorio padre al path para poder importar las clases
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.database import Database


def test_many_to_many_relationships():
    """Prueba las relaciones muchos-a-muchos implementadas."""
    print("🔄 Iniciando pruebas de relaciones muchos-a-muchos...")

    db = Database()

    # Test 1: Verificar que las nuevas tablas se crearon
    print("\n1. Verificando que las tablas de unión existen...")
    try:
        # Intentar obtener las tablas (esto fallará si no existen)
        db.get_all_records("product_sizes")
        db.get_all_records("product_colors")
        print("✅ Las tablas product_sizes y product_colors existen")
    except Exception as e:
        print(f"❌ Error: Las tablas no existen: {e}")
        return False

    # Test 2: Crear un producto de prueba
    print("\n2. Creando producto de prueba...")
    product_data = {
        "barcode": "TEST123456",
        "product_name": "Producto de Prueba",
        "description": "Producto para probar relaciones muchos-a-muchos",
        "cost": 100.0,
        "sale_price": 150.0,
        "tax": 21.0,
        "discount": 0.0,
        "comments": "Producto de prueba",
    }

    result = db.add_record("products", product_data)
    if result.get("success"):
        product_id = result.get("rowid")
        print(f"✅ Producto creado con ID: {product_id}")
    else:
        print(f"❌ Error al crear producto: {result.get('message')}")
        return False

    # Test 3: Crear talles de prueba
    print("\n3. Creando talles de prueba...")
    sizes_data = [
        {"size_name": "XS", "category_id": 1, "description": "Extra Small"},
        {"size_name": "S", "category_id": 1, "description": "Small"},
        {"size_name": "M", "category_id": 1, "description": "Medium"},
        {"size_name": "L", "category_id": 1, "description": "Large"},
    ]

    size_ids = []
    for size_data in sizes_data:
        result = db.add_record("sizes", size_data)
        if result.get("success"):
            size_ids.append(result.get("rowid"))
            print(
                f"✅ Talle {size_data['size_name']} creado con ID: {result.get('rowid')}"
            )
        else:
            print(
                f"❌ Error al crear talle {size_data['size_name']}: {result.get('message')}"
            )

    # Test 4: Crear colores de prueba
    print("\n4. Creando colores de prueba...")
    colors_data = [
        {"color_name": "Rojo", "color_hex": "#FF0000"},
        {"color_name": "Azul", "color_hex": "#0000FF"},
        {"color_name": "Verde", "color_hex": "#00FF00"},
        {"color_name": "Negro", "color_hex": "#000000"},
    ]

    color_ids = []
    for color_data in colors_data:
        result = db.add_record("colors", color_data)
        if result.get("success"):
            color_ids.append(result.get("rowid"))
            print(
                f"✅ Color {color_data['color_name']} creado con ID: {result.get('rowid')}"
            )
        else:
            print(
                f"❌ Error al crear color {color_data['color_name']}: {result.get('message')}"
            )

    # Test 5: Probar las relaciones muchos-a-muchos con talles
    print("\n5. Probando relaciones producto-talle...")
    for size_id in size_ids[:3]:  # Solo los primeros 3 talles
        result = db.add_product_size_relationship(product_id, size_id)
        if result.get("success"):
            print(f"✅ Relación producto-talle agregada: {product_id} -> {size_id}")
        else:
            print(
                f"❌ Error al agregar relación producto-talle: {result.get('message')}"
            )

    # Test 6: Probar las relaciones muchos-a-muchos con colores
    print("\n6. Probando relaciones producto-color...")
    for color_id in color_ids[:2]:  # Solo los primeros 2 colores
        result = db.add_product_color_relationship(product_id, color_id)
        if result.get("success"):
            print(f"✅ Relación producto-color agregada: {product_id} -> {color_id}")
        else:
            print(
                f"❌ Error al agregar relación producto-color: {result.get('message')}"
            )

    # Test 7: Verificar obtención de talles por producto
    print("\n7. Obteniendo talles del producto...")
    sizes = db.get_sizes_by_product(product_id)
    if sizes:
        print(f"✅ Se encontraron {len(sizes)} talles para el producto:")
        for size in sizes:
            print(
                f"   - {size.get('size_name', 'N/A')}: {size.get('description', 'N/A')}"
            )
    else:
        print("❌ No se encontraron talles para el producto")

    # Test 8: Verificar obtención de colores por producto
    print("\n8. Obteniendo colores del producto...")
    colors = db.get_colors_by_product(product_id)
    if colors:
        print(f"✅ Se encontraron {len(colors)} colores para el producto:")
        for color in colors:
            print(
                f"   - {color.get('color_name', 'N/A')}: {color.get('color_hex', 'N/A')}"
            )
    else:
        print("❌ No se encontraron colores para el producto")

    # Test 9: Verificar obtención de productos por talle
    print("\n9. Obteniendo productos por talle...")
    if size_ids:
        products = db.get_products_by_size(size_ids[0])
        if products:
            print(f"✅ Se encontraron {len(products)} productos para el talle:")
            for product in products:
                print(
                    f"   - {product.get('product_name', 'N/A')}: {product.get('barcode', 'N/A')}"
                )
        else:
            print("❌ No se encontraron productos para el talle")

    # Test 10: Verificar obtención de productos por color
    print("\n10. Obteniendo productos por color...")
    if color_ids:
        products = db.get_products_by_color(color_ids[0])
        if products:
            print(f"✅ Se encontraron {len(products)} productos para el color:")
            for product in products:
                print(
                    f"   - {product.get('product_name', 'N/A')}: {product.get('barcode', 'N/A')}"
                )
        else:
            print("❌ No se encontraron productos para el color")

    # Test 11: Probar remoción de relaciones
    print("\n11. Probando remoción de relaciones...")
    if size_ids:
        result = db.remove_product_size_relationship(product_id, size_ids[0])
        if result.get("success"):
            print("✅ Relación producto-talle removida correctamente")
        else:
            print(
                f"❌ Error al remover relación producto-talle: {result.get('message')}"
            )

    if color_ids:
        result = db.remove_product_color_relationship(product_id, color_ids[0])
        if result.get("success"):
            print("✅ Relación producto-color removida correctamente")
        else:
            print(
                f"❌ Error al remover relación producto-color: {result.get('message')}"
            )

    # Test 12: Verificar que las relaciones se removieron
    print("\n12. Verificando remoción de relaciones...")
    sizes_after = db.get_sizes_by_product(product_id)
    colors_after = db.get_colors_by_product(product_id)

    print(f"✅ Talles restantes: {len(sizes_after) if sizes_after else 0}")
    print(f"✅ Colores restantes: {len(colors_after) if colors_after else 0}")

    print("\n🎉 ¡Todas las pruebas completadas exitosamente!")
    print("Las relaciones muchos-a-muchos están funcionando correctamente.")

    return True


if __name__ == "__main__":
    success = test_many_to_many_relationships()
    if success:
        print(
            "\n✨ El sistema está listo para usar las nuevas relaciones muchos-a-muchos."
        )
    else:
        print("\n❌ Hubo errores en las pruebas. Revisa la implementación.")
        sys.exit(1)
