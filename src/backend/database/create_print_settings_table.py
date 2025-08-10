#!/usr/bin/env python3
"""
Script para crear la tabla de configuraciones de impresión de códigos de barras
"""

import sys
import os

# Agregar el directorio padre al path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import psycopg2
from config.config import Config

def get_db_connection():
    """Obtener conexión a la base de datos PostgreSQL"""
    config = Config()
    return psycopg2.connect(**config.postgres_config)

def create_print_settings_table():
    """Crear tabla para guardar configuraciones de impresión de códigos de barras"""
    
    connection = None
    cursor = None
    
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        
        # SQL para crear la tabla de configuraciones de impresión
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS barcode_print_settings (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(100) DEFAULT 'default',
            show_product_name BOOLEAN DEFAULT true,
            show_variant_name BOOLEAN DEFAULT true,
            show_size BOOLEAN DEFAULT true,
            show_color BOOLEAN DEFAULT true,
            show_price BOOLEAN DEFAULT false,
            show_barcode BOOLEAN DEFAULT true,
            print_width INTEGER DEFAULT 450,
            print_height INTEGER DEFAULT 200,
            font_size INTEGER DEFAULT 12,
            background_color VARCHAR(7) DEFAULT '#FFFFFF',
            text_color VARCHAR(7) DEFAULT '#000000',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        
        cursor.execute(create_table_sql)
        
        # Crear índice por user_id para búsquedas rápidas
        create_index_sql = """
        CREATE INDEX IF NOT EXISTS idx_barcode_print_settings_user_id 
        ON barcode_print_settings(user_id);
        """
        
        cursor.execute(create_index_sql)
        
        # Insertar configuración por defecto si no existe
        insert_default_sql = """
        INSERT INTO barcode_print_settings (
            user_id, show_product_name, show_variant_name, 
            show_size, show_color, show_price, show_barcode
        )
        SELECT 'default', true, true, true, true, false, true
        WHERE NOT EXISTS (
            SELECT 1 FROM barcode_print_settings WHERE user_id = 'default'
        );
        """
        
        cursor.execute(insert_default_sql)
        
        connection.commit()
        print("✅ Tabla 'barcode_print_settings' creada exitosamente")
        print("✅ Configuración por defecto insertada")
        
        # Verificar que se creó correctamente
        cursor.execute("SELECT * FROM barcode_print_settings WHERE user_id = 'default'")
        result = cursor.fetchone()
        
        if result:
            print("✅ Configuración por defecto verificada:")
            print(f"   - Mostrar nombre producto: {result[2]}")
            print(f"   - Mostrar nombre variante: {result[3]}")
            print(f"   - Mostrar talle: {result[4]}")
            print(f"   - Mostrar color: {result[5]}")
            print(f"   - Mostrar precio: {result[6]}")
            print(f"   - Mostrar código de barras: {result[7]}")
        
    except psycopg2.Error as e:
        print(f"❌ Error al crear la tabla: {e}")
        if connection:
            connection.rollback()
        
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        if connection:
            connection.rollback()
        
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

if __name__ == "__main__":
    create_print_settings_table()
