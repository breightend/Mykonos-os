#!/usr/bin/env python3
"""
Script para crear categorías iniciales en la base de datos
"""

import sys
import os

# Agregar el directorio backend al path de Python
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database.database import Database


def create_initial_categories():
    """Crear categorías iniciales para los talles"""
    db = Database()

    # Categorías iniciales que necesitamos
    categories = [
        {"category_name": "Ropa", "permanent": 1},
        {"category_name": "Calzado", "permanent": 1},
        {"category_name": "Accesorios", "permanent": 1},
        {"category_name": "Unisex", "permanent": 1},
        {"category_name": "Infantil", "permanent": 1},
    ]

    print("🔧 Creando categorías iniciales...")

    for category in categories:
        try:
            # Verificar si la categoría ya existe
            existing = db.get_record_by_field(
                "size_categories", "category_name", category["category_name"]
            )

            if existing:
                print(f"✅ La categoría '{category['category_name']}' ya existe")
            else:
                success = db.add_record("size_categories", category)
                if success:
                    print(
                        f"✅ Categoría '{category['category_name']}' creada exitosamente"
                    )
                else:
                    print(
                        f"❌ Error al crear la categoría '{category['category_name']}'"
                    )
        except Exception as e:
            print(
                f"❌ Error al procesar la categoría '{category['category_name']}': {e}"
            )

    # Verificar las categorías creadas
    print("\n📋 Categorías en la base de datos:")
    all_categories = db.get_all_records("size_categories")
    for cat in all_categories:
        print(f"  - ID: {cat['id']}, Nombre: {cat['category_name']}")

    print(f"\n🎉 Proceso completado. Total de categorías: {len(all_categories)}")


def create_initial_sizes():
    """Crear algunos talles iniciales para cada categoría"""
    db = Database()

    # Obtener todas las categorías
    categories = db.get_all_records("size_categories")

    if not categories:
        print(
            "❌ No hay categorías disponibles. Ejecuta primero create_initial_categories()"
        )
        return

    # Talles por categoría
    sizes_by_category = {
        "Ropa": ["XS", "S", "M", "L", "XL", "XXL"],
        "Calzado": ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"],
        "Accesorios": ["Único", "S", "M", "L"],
        "Unisex": ["XS", "S", "M", "L", "XL"],
        "Infantil": ["2", "4", "6", "8", "10", "12", "14", "16"],
    }

    print("👕 Creando talles iniciales...")

    for category in categories:
        cat_name = category["category_name"]
        cat_id = category["id"]

        if cat_name in sizes_by_category:
            print(f"\n📏 Creando talles para categoría '{cat_name}':")

            for size_name in sizes_by_category[cat_name]:
                try:
                    # Verificar si el talle ya existe para esta categoría
                    existing = db.get_records_by_multiple_fields(
                        "sizes", {"size_name": size_name, "category_id": cat_id}
                    )

                    if existing:
                        print(
                            f"  ✅ El talle '{size_name}' ya existe para '{cat_name}'"
                        )
                    else:
                        size_data = {
                            "size_name": size_name,
                            "category_id": cat_id,
                            "description": f"Talle {size_name} para {cat_name.lower()}",
                        }

                        success = db.add_record("sizes", size_data)
                        if success:
                            print(f"  ✅ Talle '{size_name}' creado para '{cat_name}'")
                        else:
                            print(
                                f"  ❌ Error al crear talle '{size_name}' para '{cat_name}'"
                            )

                except Exception as e:
                    print(
                        f"  ❌ Error al procesar talle '{size_name}' para '{cat_name}': {e}"
                    )

    # Verificar los talles creados
    print("\n📏 Talles en la base de datos:")
    all_sizes = db.get_all_records("sizes")
    for size in all_sizes:
        cat = next((c for c in categories if c["id"] == size["category_id"]), None)
        cat_name = cat["category_name"] if cat else "Desconocida"
        print(f"  - {size['size_name']} ({cat_name})")

    print(f"\n🎉 Proceso completado. Total de talles: {len(all_sizes)}")


def create_initial_colors():
    """Crear algunos colores básicos"""
    db = Database()

    # Colores básicos
    colors = [
        {"color_name": "Negro", "color_hex": "#000000"},
        {"color_name": "Blanco", "color_hex": "#FFFFFF"},
        {"color_name": "Rojo", "color_hex": "#FF0000"},
        {"color_name": "Azul", "color_hex": "#0000FF"},
        {"color_name": "Verde", "color_hex": "#008000"},
        {"color_name": "Amarillo", "color_hex": "#FFFF00"},
        {"color_name": "Rosa", "color_hex": "#FFC0CB"},
        {"color_name": "Violeta", "color_hex": "#8A2BE2"},
        {"color_name": "Naranja", "color_hex": "#FFA500"},
        {"color_name": "Gris", "color_hex": "#808080"},
        {"color_name": "Marrón", "color_hex": "#A52A2A"},
        {"color_name": "Beige", "color_hex": "#F5F5DC"},
    ]

    print("🎨 Creando colores iniciales...")

    for color in colors:
        try:
            # Verificar si el color ya existe
            existing = db.get_record_by_field(
                "colors", "color_name", color["color_name"]
            )

            if existing:
                print(f"✅ El color '{color['color_name']}' ya existe")
            else:
                success = db.add_record("colors", color)
                if success:
                    print(f"✅ Color '{color['color_name']}' creado exitosamente")
                else:
                    print(f"❌ Error al crear el color '{color['color_name']}'")
        except Exception as e:
            print(f"❌ Error al procesar el color '{color['color_name']}': {e}")

    # Verificar los colores creados
    print("\n🎨 Colores en la base de datos:")
    all_colors = db.get_all_records("colors")
    for color in all_colors:
        print(f"  - {color['color_name']} ({color['color_hex']})")

    print(f"\n🎉 Proceso completado. Total de colores: {len(all_colors)}")


if __name__ == "__main__":
    print("🚀 Inicializando datos base para la aplicación...\n")

    try:
        # Crear categorías primero
        create_initial_categories()
        print("\n" + "=" * 50 + "\n")

        # Crear talles para cada categoría
        create_initial_sizes()
        print("\n" + "=" * 50 + "\n")

        # Crear colores básicos
        create_initial_colors()

        print("\n🎉 ¡Inicialización completa! Ya puedes usar la aplicación.")

    except Exception as e:
        print(f"❌ Error durante la inicialización: {e}")
        sys.exit(1)
