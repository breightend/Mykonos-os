#!/usr/bin/env python3
"""
Script de migración para crear la tabla warehouse_stock_variants
que permite rastrear stock específico por combinaciones de producto + talle + color + sucursal.

Autor: Sistema de migración de Mykonos OS
Fecha: 2024
"""

import sys
import os
import sqlite3
from datetime import datetime

# Agregar el directorio padre al path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def create_warehouse_stock_variants_table():
    """
    Crea la tabla warehouse_stock_variants en la base de datos.
    """
    try:
        # Conectar a la base de datos
        db_path = os.path.join(os.path.dirname(__file__), "database", "mykonos.db")

        if not os.path.exists(db_path):
            print(f"❌ Error: No se encontró la base de datos en {db_path}")
            return False

        print(f"📂 Conectando a la base de datos: {db_path}")

        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Verificar si la tabla ya existe
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='warehouse_stock_variants';
        """)

        if cursor.fetchone():
            print("⚠️  La tabla 'warehouse_stock_variants' ya existe.")
            print("   ¿Desea recrearla? (esto eliminará todos los datos existentes)")
            response = input(
                "   Escriba 'yes' para continuar o cualquier otra cosa para cancelar: "
            )

            if response.lower() != "yes":
                print("❌ Operación cancelada por el usuario.")
                conn.close()
                return False

            # Eliminar tabla existente
            cursor.execute("DROP TABLE warehouse_stock_variants;")
            print("🗑️  Tabla existente eliminada.")

        # Crear la nueva tabla
        create_table_sql = """
        CREATE TABLE warehouse_stock_variants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            branch_id INTEGER NOT NULL,
            size_id INTEGER NOT NULL,
            color_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 0,
            last_updated TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            
            -- Claves foráneas
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (branch_id) REFERENCES storage(id) ON DELETE CASCADE,
            FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE CASCADE,
            FOREIGN KEY (color_id) REFERENCES colors(id) ON DELETE CASCADE,
            
            -- Índice único para evitar duplicados
            UNIQUE(product_id, branch_id, size_id, color_id)
        );
        """

        cursor.execute(create_table_sql)
        print("✅ Tabla 'warehouse_stock_variants' creada exitosamente.")

        # Crear índices para optimizar consultas
        indexes = [
            "CREATE INDEX idx_warehouse_stock_variants_product ON warehouse_stock_variants(product_id);",
            "CREATE INDEX idx_warehouse_stock_variants_branch ON warehouse_stock_variants(branch_id);",
            "CREATE INDEX idx_warehouse_stock_variants_size ON warehouse_stock_variants(size_id);",
            "CREATE INDEX idx_warehouse_stock_variants_color ON warehouse_stock_variants(color_id);",
            "CREATE INDEX idx_warehouse_stock_variants_quantity ON warehouse_stock_variants(quantity);",
            "CREATE INDEX idx_warehouse_stock_variants_product_branch ON warehouse_stock_variants(product_id, branch_id);",
        ]

        for index_sql in indexes:
            try:
                cursor.execute(index_sql)
            except sqlite3.Error as e:
                print(f"⚠️  Advertencia al crear índice: {e}")

        print("📊 Índices de rendimiento creados.")

        # Confirmar cambios
        conn.commit()

        # Verificar la creación
        cursor.execute("SELECT COUNT(*) FROM warehouse_stock_variants;")
        count = cursor.fetchone()[0]
        print(
            f"✅ Verificación: La tabla contiene {count} registros (esperado: 0 para tabla nueva)."
        )

        conn.close()
        print("🎉 Migración completada exitosamente!")
        return True

    except sqlite3.Error as e:
        print(f"❌ Error de SQLite: {e}")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False


def migrate_existing_stock_data():
    """
    Función opcional para migrar datos existentes de warehouse_stock a warehouse_stock_variants.
    NOTA: Esta función requiere decisiones de negocio sobre cómo distribuir el stock existente.
    """
    print("\n🔄 Función de migración de datos existentes disponible.")
    print(
        "   Esta función está deshabilitada por defecto porque requiere decisiones de negocio"
    )
    print("   sobre cómo distribuir el stock actual entre las variantes.")
    print("   Si necesita migrar datos existentes, contacte al desarrollador.")


def main():
    """
    Función principal del script de migración.
    """
    print("🚀 Iniciando migración de warehouse_stock_variants")
    print("=" * 60)

    # Crear tabla
    if create_warehouse_stock_variants_table():
        print("\n✅ Migración de tabla completada.")

        # Ofrecer migración de datos (comentado por seguridad)
        # migrate_existing_stock_data()

        print("\n📋 Próximos pasos recomendados:")
        print(
            "   1. Verificar que el backend puede crear registros de stock por variantes"
        )
        print("   2. Probar la creación de un nuevo producto")
        print(
            "   3. Verificar que el modal de detalle muestra las variantes correctamente"
        )
        print(
            "   4. Considerar implementar una interfaz para editar cantidades por variante"
        )

    else:
        print("\n❌ Error durante la migración.")
        sys.exit(1)


if __name__ == "__main__":
    main()
