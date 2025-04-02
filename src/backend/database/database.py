import os
import io as io
import sqlite3
import time
import threading
from enum import Enum
from commons.tools import print_debug

class TABLES(Enum):
    ENTITIES = "entities"
    FILE_ATTACHMENTS = "file_attachments"
    ACCOUNT_MOVEMENTS = "account_movements"
    GROUP = "groups"
    USERS = "users"
    SIZE_CATEGORIES = "size_categories"
    SIZES = "sizes"
    COLORS = "colors"
    BARCODES = "barcodes"
    STORAGE = "storage"
    PRODUCTS = "products"
    IMAGES = "images"
    WAREHOUSE_STOCK = "warehouse_stock"
    INVENTORY_MOVEMETNS = "inventory_movements"
    INVENTORY_MOVEMETNS_GROUPS = "inventory_movements_groups"
    RESPONSABILIDADES_AFIP = "responsabilidades_afip"
    BRANDS = 'brands'
    PURCHASES = "purchases"
    PURCHASES_DETAIL = "purchases_detail"

DATABASE_TABLES = {
    TABLES.ENTITIES: {
        "columns": {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",      # Identificador único para cada entidad, se incrementa automáticamente.
            "entity_name": "TEXT NOT NULL",                 # Nombre de la entidad (puede ser cliente o proveedor).
            "entity_type": "TEXT NOT NULL",                 # Tipo de entidad (ejemplo: 'cliente', 'proveedor').
            "razon_social": "TEXT NOT NULL",                # Razón social de la entidad, importante para facturación.
            "responsabilidad_iva": "INTEGER NOT NULL",      # Indica la categoría de responsabilidad ante el IVA (ej: responsable inscripto).
            "domicilio_comercial": "TEXT NOT NULL",         # Dirección comercial de la entidad, necesaria para correspondencia y facturación.
            "cuit": "TEXT NOT NULL UNIQUE",                 # CUIT (Clave Única de Identificación Tributaria), único para cada entidad.
            "inicio_actividades": "TEXT",                   # Fecha de inicio de actividades de la entidad.
            "ingresos_brutos": "TEXT",                      # Información sobre los ingresos brutos, puede ser útil para reportes.
            "contact_name": "TEXT",                         # Nombre del contacto principal en la entidad, si aplica.
            "phone_number": "TEXT",                         # Número de teléfono de la entidad para contacto directo.
            "email": "TEXT",                                # Correo electrónico de la entidad para enviar comunicaciones.
            "observations": "TEXT"                          # Notas adicionales o comentarios sobre la entidad, para uso interno.
        }
    },

    TABLES.FILE_ATTACHMENTS: {
        "columns": {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",          # Identificador único para cada archivo adjunto, se incrementa automáticamente.
            "file_name": "TEXT NOT NULL",                       # Nombre del archivo original
            "file_extension": "TEXT NOT NULL",                  # Extensión del archivo (ej: pdf, jpg, png)
            "file_content": "BLOB NOT NULL",                    # Contenido del archivo
            "upload_date": "TEXT DEFAULT CURRENT_TIMESTAMP",    # Fecha de carga del archivo
            "comment": "TEXT"                                   # Comentario opcional sobre el archivo
        }
    },

    TABLES.ACCOUNT_MOVEMENTS: {
        "columns": {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",                              # Identificador único para cada movimiento de cuenta, se incrementa automáticamente.
            "numero_operacion": "INTEGER NOT NULL CHECK (numero_operacion > 0)",    # Número de operación, debe ser positivo.
            "entity_id": "INTEGER NOT NULL",                                        # ID de la entidad relacionada (cliente o proveedor).
            "created_at": "TEXT DEFAULT CURRENT_TIMESTAMP",                         # Fecha y hora en que se creó el movimiento.
            "descripcion": "TEXT",                                                  # Descripción del movimiento para un seguimiento más detallado.
            "medio_pago": "TEXT",                                                   # Medio de pago utilizado (efectivo, tarjeta de crédito, transferencia, etc.).
            "numero_de_comprobante": "TEXT",                                        # Número de comprobante asociado al movimiento, si aplica.
            "purchase_id": "INTEGER",                                               # ID de la compra asociada a este movimiento
            "debe": "REAL",                                                         # Monto que se debe (cargos).
            "haber": "REAL",                                                        # Monto que se acredita (abonos).
            "saldo": "REAL",                                                        # Saldo actual después de realizar el movimiento.
            "file_id": "INTEGER",                                                   # ID del archivo asociado, si existe (documentación adjunta).
            "updated_at": "TEXT DEFAULT CURRENT_TIMESTAMP"                          # Fecha de la última modificación del movimiento.
        },
        "foreign_keys": [
            {# Relación con la tabla de entidades.
                "column": "entity_id", 
                "reference_table": TABLES.ENTITIES,
                "reference_column": "id",
                "export_column_name":"entity_name",  # <- columna de referencia cuando se exportan tablas
            },# Relación con la tabla de archivos adjuntos.
            {
                "column": "file_id",
                "reference_table": TABLES.FILE_ATTACHMENTS,
                "reference_column": "id",
                "export_column_name":"file_name",
            },
            {# Relación con la tabla de compras.
                "column": "purchase_id",
                "reference_table": TABLES.PURCHASES,
                "reference_column": "id",
                "export_column_name":"id",
            }         
        ]
    },

    TABLES.GROUP: {
        "columns": {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",          # Identificador único para cada grupo, se incrementa automáticamente.
            "group_name": "TEXT NOT NULL",                      # Nombre del grupo, requerido.
            "parent_group_id": "INTEGER",                       # ID del grupo padre, si aplica (permite crear jerarquías).
            "marked_as_root": "INTEGER NOT NULL DEFAULT 0"      # Indica si el grupo es raíz (0) o no (1).
        },
        "foreign_keys": [
            { # Relación con la tabla de grupos.
                "column": "parent_group_id",
                "reference_table": TABLES.GROUP,
                "reference_column": "id",
                "export_column_name":"group_name"
            }
        ]
    },

    TABLES.USERS: {
        "columns": {
            "id":            "INTEGER PRIMARY KEY AUTOINCREMENT",            # Identificador único para cada usuario, se incrementa automáticamente.
            "username":      "TEXT UNIQUE",                         # Nombre de usuario, debe ser único y no nulo.
            "fullname":      "TEXT",                                # Nombre completo del usuario, requerido.
            "password":      "TEXT",                                # Contraseña del usuario, requerida.
            "email":         "TEXT",                                         # Correo electrónico del usuario.
            "phone":         "TEXT",                                         # Número de teléfono del usuario.
            "role":          "TEXT",                                         # Rol del usuario (ejemplo: admin, usuario normal).
            "status":        "TEXT",                                         # Estado del usuario (activo, inactivo, etc.).
            "session_token": "TEXT",                                         # Token de sesión para la autenticación del usuario.
            "profile_image": "BLOB",                                         # Imagen de perfil del usuario, almacenada como BLOB.
            "created_at":    "TEXT DEFAULT (datetime('now','localtime'))"    # Fecha de creación del registro, se establece por defecto a la fecha y hora actuales.
        }
    },

    TABLES.SIZE_CATEGORIES: {
        "columns": {
            "id":             "INTEGER PRIMARY KEY AUTOINCREMENT",  # Identificador único para cada categoría de tamaño, se incrementa automáticamente.
            "category_name":  "TEXT NOT NULL UNIQUE",               # Nombre de la categoría de tamaño, debe ser único y no nulo.
            "permanent":      "BOOLEAN NOT NULL DEFAULT 0"          # Indica si la categoría es permanente (1) o no (0).
        }
    },

    TABLES.SIZES: {
        "columns": {
            "id":            "INTEGER PRIMARY KEY AUTOINCREMENT",      # Identificador único para cada tamaño, se incrementa automáticamente.
            "size_name":     "TEXT NOT NULL",                          # Nombre del tamaño, requerido.
            "category_id":   "INTEGER NOT NULL",                       # ID de la categoría de tamaño a la que pertenece.
            "description":   "TEXT"                                    # Descripción del tamaño, opcional.
        },
        "foreign_keys": [
            {
                "column": "category_id",
                "reference_table": TABLES.SIZE_CATEGORIES,
                "reference_column": "id",
                "export_column_name": "category_name"
            }  # Relación con la tabla de categorías de tamaño.
        ]
    },

    TABLES.COLORS: {
        "columns": {
            "id":          "INTEGER PRIMARY KEY AUTOINCREMENT",         # Identificador único para cada color, se incrementa automáticamente.
            "color_name":  "TEXT NOT NULL",                             # Nombre del color, requerido.
            "color_hex":   "TEXT NOT NULL"                              # Código hexadecimal del color, requerido.
        }
    },

    TABLES.BARCODES: {
        "columns": {
            "id":          "INTEGER PRIMARY KEY AUTOINCREMENT",         # Identificador único para cada código de barras, se incrementa automáticamente.
            "barcode":     "TEXT UNIQUE NOT NULL",                      # Código de barras único para cada producto, requerido.
            "product_id":  "INTEGER"                                    # ID del producto al que corresponde el código de barras.
        },
        "foreign_keys": [
            {
                "column": "product_id",
                "reference_table": TABLES.PRODUCTS,
                "reference_column": "barcode",
                "export_column_name":"product_name"
            }  # Relación con la tabla de productos.
        ]
    },

    TABLES.STORAGE: {
        "columns": {
            "id":           "INTEGER PRIMARY KEY AUTOINCREMENT",    # Identificador único para cada almacenamiento, se incrementa automáticamente.
            "name":         "TEXT NOT NULL",                        # Nombre del almacenamiento, requerido.
            "address":      "TEXT",                                 # Dirección del almacenamiento.
            "postal_code":  "TEXT",                                 # Código postal del almacenamiento.
            "phone_number": "TEXT",                                 # Número de teléfono del almacenamiento.
            "area":         "TEXT",                                 # Área o sección dentro del almacenamiento.
            "description":  "TEXT"                                  # Área o sección dentro del almacenamiento.
        }
    },

    TABLES.PRODUCTS: {
        "columns": {
            "id":                "INTEGER PRIMARY KEY AUTOINCREMENT",                       # Identificador único para cada producto, se incrementa automáticamente.
            "barcode":           "TEXT NOT NULL",                                           # Código de barras del producto, requerido.
            "provider_code":     "TEXT",                                                    # Código del proveedor
            "product_name":      "TEXT NOT NULL",                                           # Nombre del producto, requerido.
            "group_id":          "INTEGER",                                                 # ID del grupo al que pertenece el producto.
            "provider_id":       "INTEGER",                                                 # ID del proveedor, se relaciona con la tabla de entidades.
            "size_id":           "INTEGER",                                                 # ID del tamaño del producto.
            "description":       "TEXT",                                                    # Descripción del producto, opcional.
            "cost":              "REAL",                                                    # Costo del producto.
            "sale_price":        "REAL",                                                    # Precio de venta del producto.
            "tax":               "REAL",                                                    # Impuesto aplicable al producto.
            "discount":          "REAL",                                                    # Descuento aplicado al producto.
            "color_id":          "INTEGER",                                                 # ID del color del producto.
            "comments":          "TEXT",                                                    # Comentarios adicionales sobre el producto.
            "user_id":           "INTEGER",                                                 # ID del usuario que creó o modificó el producto.
            "images_ids":        "TEXT",                                                    # IDs de las imágenes asociadas al producto.
            "brand_id":          "INTEGER",                                                 # ID de la marca del producto.
            "creation_date":     "TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))",    # Fecha de creación del producto, se establece por defecto a la fecha y hora actuales.
            "last_modified_date": "TEXT"                                                    # Fecha de la última modificación del producto.
        },

        "foreign_keys": [
            {# Relación con la tabla de usuarios.
                "column": "user_id",
                "reference_table": TABLES.USERS,
                "reference_column": "id",
                "export_column_name":"username"
            },
            {# Relación con la tabla de grupos.
                "column": "group_id",
                "reference_table": TABLES.GROUP,
                "reference_column": "id",
                "export_column_name":"group_name"
            },
            {# Relación con la tabla de tamaños.
                "column": "size_id",
                "reference_table": TABLES.SIZES,
                "reference_column": "id",
                "export_column_name":"size_name"
             },
            {# Relación con la tabla de colores.
                "column": "color_id",
                "reference_table": TABLES.COLORS,
                "reference_column": "id",
                "export_column_name":"color_name",
            },   
            {# Relación con la tabla de marcas.
                "column": "brand_id",
                "reference_table": TABLES.BRANDS,
                "reference_column": "id",
                "export_column_name":"brand_name"
            }    
        ]
    },

    TABLES.IMAGES: {
        "columns": {
            "id":          "INTEGER PRIMARY KEY AUTOINCREMENT",     # Identificador único para cada imagen, se incrementa automáticamente.
            "image_data":  "BLOB NOT NULL",                         # Datos de la imagen, almacenados como BLOB.
            "product_id":  "INTEGER"                                # ID del producto al que corresponde la imagen.
        },
        "foreign_keys": [
            {# Relación con la tabla de productos.
                "column": "product_id",
                "reference_table": TABLES.PRODUCTS,
                "reference_column": "id",
                "export_column_name":"product_name"
            }
        ]
    },

    TABLES.WAREHOUSE_STOCK: {
        "columns": {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",                              # Identificador único para cada registro en el inventario.
            "product_id": "INTEGER NOT NULL",                                       # Identificador del producto, relacionado con la tabla products.
            "branch_id": "INTEGER NOT NULL",                                        # Identificador de la sucursal que almacena el producto.
            "quantity": "INTEGER NOT NULL CHECK (quantity >= 0)",                   # Cantidad actual del producto en la sucursal, no puede ser negativo.
            "last_updated": "TEXT DEFAULT CURRENT_TIMESTAMP"                        # Fecha de la última actualización del stock.
        },
        "foreign_keys": [
            {# Relación con la tabla de productos.
                "column": "product_id",
                "reference_table": TABLES.PRODUCTS,
                "reference_column": "id",
                "export_column_name":"product_name"
            },
            {# Relación con la tabla de sucursales.
                "column": "branch_id",
                "reference_table": TABLES.STORAGE,
                "reference_column": "id",
                "export_column_name":"name"
            }
        ]
    },
    
    TABLES.INVENTORY_MOVEMETNS: {
        "columns": {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",                              # Identificador único para cada movimiento de inventario.
            "inventory_movements_group_id": "INTEGER NOT NULL",                     # Identificador del grupo de transferencia.
            "product_id": "INTEGER NOT NULL",                                       # Identificador del producto movido.
            "quantity": "INTEGER NOT NULL CHECK (quantity > 0)",                    # Cantidad de productos movidos, siempre positiva.
            "discount":     "REAL DEFAULT 0.0",                                     # Descuento aplicado al producto
            "subtotal":     "REAL NOT NULL",                                        # Subtotal para el producto (precio * cantidad)                    
            "total":                "REAL NOT NULL",                                # Total final después de aplicar descuentos
            "movement_date": "TEXT DEFAULT CURRENT_TIMESTAMP"                       # Fecha y hora del movimiento de inventario.
        },
        "foreign_keys": [
            { # Relación con la tabla de grupos de transferencia.
                "column": "inventory_movements_group_id",
                "reference_table": TABLES.INVENTORY_MOVEMETNS_GROUPS,  
                "reference_column": "id",
                "export_column_name":"id",
            },
            { # Relación con la tabla de productos.
                "column": "product_id", 
                "reference_table": TABLES.PRODUCTS, 
                "reference_column": "id",
                "export_column_name":"barcode"
            }  
        ]
    },

    TABLES.INVENTORY_MOVEMETNS_GROUPS: {
        "columns": {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",                              # Identificador único para cada grupo de transferencia.
            "origin_branch_id": "INTEGER NOT NULL",                                 # ID de la sucursal de origen.
            "destination_branch_id": "INTEGER NOT NULL",                            # ID de la sucursal de destino.
            "created_at": "TEXT DEFAULT CURRENT_TIMESTAMP",                         # Fecha y hora de la creación del grupo de transferencia.
            "notes": "TEXT"                                                         # Comentarios adicionales sobre la transferencia.
        },
        "foreign_keys": [
            {# Relación con la sucursal de origen.
                "column": "origin_branch_id",
                "reference_table": TABLES.STORAGE,
                "reference_column": "id",
                "export_column_name":"name"
            },
            {# Relación con la sucursal de destino.
                "column": "destination_branch_id",
                "reference_table": TABLES.STORAGE,
                "reference_column": "id",
                "export_column_name":"name"
            }
        ]
    },

    TABLES.RESPONSABILIDADES_AFIP: {
        "columns": {
            "id":          "INTEGER PRIMARY KEY",                   # Identificador único para cada responsabilidad, se establece como clave primaria.
            "codigo":      "INTEGER NOT NULL",                      # Código de responsabilidad, requerido.
            "descripcion": "TEXT NOT NULL"                          # Descripción de la responsabilidad, requerida.
        }
    },

    TABLES.BRANDS: {
        "columns": {
            "id":                  "INTEGER PRIMARY KEY AUTOINCREMENT",                     # Identificador único para cada marca, se incrementa automáticamente.
            "brand_name":         "TEXT NOT NULL UNIQUE",                                   # Nombre de la marca, debe ser único y no nulo.
            "description":        "TEXT",                                                   # Descripción de la marca, opcional.
            "creation_date":      "TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))",   # Fecha de creación del registro, se establece por defecto a la fecha y hora actuales.
            "last_modified_date": "TEXT"                                                    # Fecha de la última modificación de la marca.
        }
    },

    TABLES.PURCHASES: {
        "columns": {
            "id":                   "INTEGER PRIMARY KEY AUTOINCREMENT",   # Identificador único de la venta
            "entity_id":            "INTEGER",                             # Id de la entidad 
            "purchase_date":        "TEXT DEFAULT CURRENT_TIMESTAMP",      # Fecha y hora de la venta
            "subtotal":             "REAL NOT NULL",                       # Suma total antes de descuentos
            "discount":             "REAL DEFAULT 0.0",                    # Total de descuentos aplicados
            "total":                "REAL NOT NULL",                       # Total final después de aplicar descuentos
            "payment_method":       "TEXT",                                # Medio de pago (efectivo, tarjeta, etc.)
            "transaction_number":   "TEXT",                                # Número del comprobante te transferencia/ticket de la venta
            "invoice_number":       "TEXT",                                # Número de factura de la venta
            "notes":                "TEXT",                                # Nota de texto para dejar comentarios
            "file_id":              "INTEGER"                              # Id del arhcivo adjunto de la compra TODO: Tenes cuidado con esto
        },
        "foreign_keys": [
            {# Relación con tabla de clientes si es necesario
                "column": "entity_id",
                "reference_table": TABLES.ENTITIES,
                "reference_column": "id",
                "export_column_name":"entity_name"
            },
            {# Relación con tabla de archivos si es necesario
                "column": "file_id",
                "reference_table": TABLES.FILE_ATTACHMENTS,
                "reference_column": "id",
                "export_column_name":"file_name"
            }
        ]
    },
    
    TABLES.PURCHASES_DETAIL:{
        "columns": {
            "id":           "INTEGER PRIMARY KEY AUTOINCREMENT",            # Identificador único del detalle de la venta
            "purchase_id":  "INTEGER NOT NULL",                             # ID de la venta relacionada
            "product_id":   "INTEGER",                                      # ID del producto
            "sale_price":   "REAL NOT NULL",                                # Precio del producto en el momento de la venta
            "quantity":     "INTEGER NOT NULL CHECK (quantity > 0)",        # Cantidad de productos vendidos
            "discount":     "REAL DEFAULT 0.0",                             # Descuento aplicado al producto
            "subtotal":     "REAL NOT NULL",                                # Subtotal para el producto (precio * cantidad)
            "metadata":     "TEXT"                                          # Informacion adicional de la venta
        },
        "foreign_keys": [
            {# Relación con la tabla de ventas
                "column": "purchase_id",
                "reference_table": TABLES.PURCHASES,
                "reference_column": "id",
                "export_column_name":"id"
            },
            {# Relación a la tabla de productos
                "column": "product_id",
                "reference_table": TABLES.PRODUCTS,
                "reference_column": "id",
                "export_column_name":"product_name"
            }
        ]
    }
}

DATABASE_PATH = "./database/mykonos.db"

class Database:
    def __init__(self, db_path=DATABASE_PATH):
        if not os.path.exists(db_path):
            print(f"Base de datos no encontrada en: {db_path}. Creando una nueva base de datos.")
            try:
                # Crear el archivo de la base de datos si no existe
                conn = sqlite3.connect(db_path)
                conn.close()  # Cerramos la conexión tras crear el archivo

            except sqlite3.Error as e:
                print(f"Error al crear la base de datos: {e}")
                return None
            
        self.db_path = db_path
        self.db_lock = threading.Lock()
        self.create_tables()

    # Commons
    def create_connection(self):
        """
        Crea y devuelve una conexión a la base de datos SQLite.
        """
        try:
            return sqlite3.connect(self.db_path)
        except sqlite3.Error as e:
            print(e)
        return None

    def get_db_lock(self):
        return self.db_lock
    
    # Tables
    def create_tables(self):
        """
        Crea todas las tablas necesarias en la base de datos.
        """
        def create_or_update_table(conn, table_name, columns, foreign_keys=[]):
            """
            Crea la tabla si no existe y revisa si hay columnas faltantes o de más.
            """
            # print_debug(f"Creando o actualizando tabla: {table_name}")
            
            # Verificar las columnas que ya existen en la tabla
            existing_columns = get_existing_columns(conn, table_name)

            # Si la tabla no existe, se crea directamente
            if not existing_columns:
                column_defs = [f"{col_name} {col_type}" for col_name, col_type in columns.items()]
                if foreign_keys:
                    for fk in foreign_keys:
                        column_defs.append(f"FOREIGN KEY({fk['column']}) REFERENCES {fk['reference_table'].value}({fk['reference_column']})")
                create_table_sql = f"CREATE TABLE IF NOT EXISTS {table_name} ({', '.join(column_defs)});"
                print(create_table_sql)  # Para depuración, muestra la consulta SQL creada
                conn.execute(create_table_sql)
            else:
                # Si la tabla ya existe, asegurarse de que las columnas coincidan
                extra_columns = [col for col in existing_columns if col not in columns]
                if extra_columns:
                    # Si existen columnas de más, reestructuramos la tabla sin borrar los datos
                    remove_extra_columns(conn, table_name, columns, foreign_keys, extra_columns, existing_columns)

                # Agregar columnas faltantes
                for col_name, col_type in columns.items():
                    if col_name not in existing_columns:
                        try:
                            alter_table_sql = f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type};"
                            print(f"Agregando columna: {col_name} a la tabla {table_name}")
                            conn.execute(alter_table_sql)
                        except sqlite3.OperationalError as e:
                            print(f"Error al agregar la columna {col_name}: {e}")
                            # Si el error es por un nombre duplicado, lo ignoramos
                            if 'duplicate column name' in str(e).lower():
                                continue
                            else:
                                raise e

        def get_existing_columns(conn, table_name):
            """
            Devuelve una lista de las columnas existentes en una tabla.
            """
            cursor = conn.execute(f"PRAGMA table_info({table_name});")
            return [row[1] for row in cursor.fetchall()]

        def remove_extra_columns(conn, table_name, columns, foreign_keys, extra_columns, existing_columns):
            """
            Reestructura la tabla para eliminar columnas extra sin borrar datos existentes.
            """
            print(f"Eliminando columnas extra: {extra_columns} en la tabla {table_name}")

            # Deshabilitar claves foráneas temporalmente
            conn.execute("PRAGMA foreign_keys = OFF;")
            
            # Verificar si la tabla temporal ya existe, y si es así, eliminarla
            conn.execute(f"DROP TABLE IF EXISTS {table_name}_temp;")

            # Crear una tabla temporal con las columnas correctas
            column_defs = [f"{col_name} {col_type}" for col_name, col_type in columns.items()]
            if foreign_keys:
                for fk in foreign_keys:
                    column_defs.append(f"FOREIGN KEY({fk['column']}) REFERENCES {fk['reference_table']}({fk['reference_column']})")

            temp_table_sql = f"CREATE TABLE IF NOT EXISTS {table_name}_temp ({', '.join(column_defs)});"

            conn.execute(temp_table_sql)

            # Copiar los datos de las columnas válidas a la tabla temporal
            valid_columns = ', '.join([col for col in existing_columns if col in columns])
            copy_data_sql = f"INSERT INTO {table_name}_temp ({valid_columns}) SELECT {valid_columns} FROM {table_name};"

            conn.execute(copy_data_sql)

            # Eliminar la tabla original
            conn.execute(f"DROP TABLE {table_name};")

            # Renombrar la tabla temporal a la tabla original
            conn.execute(f"ALTER TABLE {table_name}_temp RENAME TO {table_name};")

            # Rehabilitar claves foráneas
            conn.execute("PRAGMA foreign_keys = ON;")

        conn = self.create_connection()
            
        try:
            # Habilitar claves foráneas
            conn.execute("PRAGMA foreign_keys = ON;")
            
            # Diccionario de tablas
            tables = DATABASE_TABLES

            # Iterar sobre cada tabla en el diccionario y crearla
            for table_name, table_data in tables.items():
                create_or_update_table(conn, table_name.value, table_data["columns"], table_data.get("foreign_keys", []))
                # Hacer commit de todos los cambios
                conn.commit()

        except sqlite3.Error as e:
            print(e)
        finally:
            if conn:
                conn.close()

    def delete_tables(self, tables):
        """
        Elimina las tablas especificadas de la base de datos.

        Args:
            tables (list): Una lista de nombres de tablas a eliminar.

        Returns:
            dict: {'success': bool, 'message': str, 'deleted_count': int}
        """
        result = {"success": False, "message": "", "deleted_count": 0}
        
        try:
            with self.create_connection() as conn:
                if conn:
                    cur = conn.cursor()
                    deleted_count = 0

                    for table in tables:
                        sql = f"DROP TABLE IF EXISTS {table}"
                        cur.execute(sql)
                        deleted_count += 1
                        print(f"Tabla '{table}' eliminada correctamente.")

                    conn.commit()
                    result["success"] = True
                    result["message"] = f"Se eliminaron {deleted_count} tablas correctamente."
                    result["deleted_count"] = deleted_count
                else:
                    result["message"] = "No se pudo establecer la conexión con la base de datos."
        except Exception as e:
            result["message"] = f"Error al eliminar las tablas: {e}"

        return result

    def create_table(self, conn, sql_create_table):
        """
        Crea una tabla en la base de datos utilizando el SQL proporcionado.

        Args:
            conn (sqlite3.Connection): Conexión a la base de datos.
            sql_create_table (str): SQL para crear la tabla.
        """
        try:
            cur = conn.cursor()
            cur.execute(sql_create_table)
        except Exception as e:
            print(f"Error al crear la tabla: {e}")

    def get_table_columns_name(self, table_name):
        """
        Obtiene los nombres de las columnas de una tabla específica en la base de datos.

        Args:
            table_name (str): El nombre de la tabla de la cual se desean obtener los nombres de las columnas.

        Returns:
            dict: Un diccionario con las claves:
                - 'success' (bool): Indica si la operación fue exitosa.
                - 'message' (str): Mensaje de error o éxito.
                - 'table_names' (list): Lista con los nombres de las columnas de la tabla.
        """
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                # Verificar si la tabla existe antes de consultar
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
                if not cursor.fetchone():
                    return {
                        "success": False,
                        "message": f"La tabla '{table_name}' no existe en la base de datos.",
                        "table_names": []
                    }

                # Obtener los nombres de las columnas
                cursor.execute(f"PRAGMA table_info({table_name})")
                columns_info = cursor.fetchall()
                column_names = [column[1] for column in columns_info]

                return {
                    "success": True,
                    "message": f"Se obtuvieron {len(column_names)} columnas de la tabla '{table_name}'.",
                    "table_names": column_names
                }

        except sqlite3.Error as e:
            return {
                "success": False,
                "message": f"Error al obtener las columnas de la tabla '{table_name}': {e}",
                "table_names": []
            }
        
    # Record
    def add_record(self, table_name, data):
        """
        Agrega un nuevo registro a la tabla especificada en la base de datos.

        :param table_name: El nombre de la tabla en la que se va a insertar el registro.
        :param data: Un diccionario con los datos a insertar, donde las claves son los nombres de las columnas.
        :return: Un diccionario con 'success' (bool), 'message' (str) y 'rowid' (int o None).
        """
        placeholders = ', '.join([f":{key}" for key in data.keys()])
        columns = ', '.join(data.keys())
        sql = f'''INSERT INTO {table_name} ({columns})
                VALUES ({placeholders})'''

        retries = 5
        while retries:
            try:
                with self.db_lock:
                    with sqlite3.connect(self.db_path) as conn:
                        cur = conn.cursor()
                        cur.execute(sql, data)
                        conn.commit()
                        return {
                            "success": True,
                            "message": f"Registro agregado correctamente en la tabla '{table_name}'",
                            "rowid": cur.lastrowid
                        }
            except sqlite3.OperationalError as e:
                if "locked" in str(e):
                    retries -= 1
                    time.sleep(1)
                else:
                    return {
                        "success": False,
                        "message": f"Error al agregar registro en la tabla '{table_name}': {e}",
                        "rowid": None
                    }
            except sqlite3.IntegrityError as e:
                return {
                    "success": False,
                    "message": f"Error de integridad al agregar registro en la tabla '{table_name}': {e}",
                    "rowid": None
                }
            except Exception as e:
                return {
                    "success": False,
                    "message": f"Error al agregar registro en la tabla '{table_name}': {e}",
                    "rowid": None
                }

        return {
            "success": False,
            "message": f"Error al agregar registro en la tabla '{table_name}': la base de datos está bloqueada después de varios intentos",
            "rowid": None
        }
    
    def update_record(self, table_name, data):
        """
        Actualiza un registro en la tabla especificada de la base de datos.

        :param table_name: El nombre de la tabla donde se actualizará el registro.
        :param data: Un diccionario con los datos a actualizar, incluyendo el ID del registro.
        :return: Un diccionario con dos claves: 'success' (bool) y 'message' (str).
        """
        if 'id' not in data:
            return {'success': False,
                    'message': "Error: El diccionario de datos debe contener una clave 'id' con el ID del registro."}

        if data.get('id', None) is None:
            return {'success': False, 
                    'message': f"Error: El diccionario de datos debe contener una clave 'id' valido, actual:{data.get('id', None)}"}
        
        # Construir la cláusula SET de la consulta SQL, excluyendo 'id'
        set_clause = ', '.join([f"{key} = :{key}" for key in data.keys() if key != 'id'])
        sql = f"UPDATE {table_name} SET {set_clause} WHERE id = :id"

        try:
            with self.db_lock:
                with sqlite3.connect(self.db_path) as conn:
                    cur = conn.cursor()
                    cur.execute(sql, data)
                    conn.commit()
            return {'success': True, 'message': f"Registro en la tabla '{table_name}' actualizado correctamente."}
        except Exception as e:
            return {'success': False, 'message': f"Error al actualizar el registro en la tabla '{table_name}': {e}"}

    def delete_record(self, table_name, where_clause, params):
        """
        Elimina un registro de la base de datos basado en una cláusula WHERE.

        :param table_name: Nombre de la tabla de la cual eliminar el registro.
        :param where_clause: Cláusula WHERE para especificar las condiciones de eliminación.
        :param params: Parámetros para la cláusula WHERE.
        :return: Un diccionario con 'success' (bool) y 'message' (str).
        """
        sql = f"DELETE FROM {table_name} WHERE {where_clause}"

        try:
            with self.db_lock:
                with sqlite3.connect(self.db_path) as conn:
                    cur = conn.cursor()
                    cur.execute(sql, params)
                    
                    if cur.rowcount == 0:
                        return {
                            "success": False,
                            "message": "Error: No se encontró un registro que cumpla con los criterios especificados."
                        }
                    
                    conn.commit()
                    
            return {
                "success": True,
                "message": "Registro eliminado correctamente"
            }

        except Exception as e:
            return {
                "success": False,
                "message": f"Error al eliminar registro: {e}"
            }

    def get_record_by_id(self, table_name, record_id):
        """
        Obtiene un registro de la base de datos por su ID.

        Args:
            table_name (str): El nombre de la tabla.
            record_id (int): El ID del registro.

        Returns:
            dict: Un diccionario con la información del estado de la operación y los datos del registro.
        """
        sql = f"SELECT * FROM {table_name} WHERE id = ?"
        try:
            with self.create_connection() as conn:
                cur = conn.cursor()
                cur.execute(sql, (record_id,))
                row = cur.fetchone()
                if row:
                    columns = [desc[0] for desc in cur.description]
                    record = dict(zip(columns, row))
                    return {
                        'success': True,
                        'message': f"Registro en la tabla '{table_name}' encontrado",
                        'record': record
                    }
                else:
                    return {
                        'success': False,
                        'message': f"No se encontró el registro en la tabla '{table_name}'",
                        'record': None
                    }
        except Exception as e:
            return {
                'success': False,
                'message': f"Error al obtener el registro en la tabla '{table_name}': {e}",
                'record': None
            }

    def get_record_by_clause(self, table_name, search_clause, value):
        """
        Obtiene un registro de la base de datos en función de una cláusula de búsqueda personalizada.

        Args:
            table_name (str): El nombre de la tabla donde se realizará la búsqueda.
            search_clause (str): La columna y el operador de búsqueda (ej: "username = ?", "email LIKE ?").
            value: El valor o los valores a buscar en la columna especificada. Puede ser un valor único o una tupla de valores.

        Returns:
            dict: {'success': bool, 'message': str, 'record': dict or None}
        """
        sql = f"SELECT * FROM {table_name} WHERE {search_clause}"
        result = {"success": False, "message": "", "record": None}

        try:
            with self.create_connection() as conn:
                conn.row_factory = sqlite3.Row  # Permite acceder a los valores por nombre de columna
                cur = conn.cursor()

                # Convertir value a tupla si no lo es
                if not isinstance(value, tuple):
                    value = (value,)

                cur.execute(sql, value)
                row = cur.fetchone()
                
                if row:
                    result["success"] = True
                    result["message"] = "Registro encontrado."
                    result["record"] = {key: row[key] for key in row.keys()}  # Diccionario con nombres de columnas
                else:
                    result["message"] = "No se encontró ningún registro."

        except Exception as e:
            result["message"] = f"Error al obtener registro de '{table_name}': {e}"

        return result


    # #TODO: devolver dict{sucess, message, record}
    # def get_all_records_by_clause(self, table_name, search_clause, value):
    #     """
    #     Obtiene todos los registros de la base de datos en función de una cláusula de búsqueda personalizada.

    #     Args:
    #         table_name (str): El nombre de la tabla donde se realizará la búsqueda.
    #         search_clause (str): La columna y el operador de búsqueda (ej: "username = ?", "email LIKE ?").
    #         value: El valor a buscar en la columna especificada.

    #     Returns:
    #         list[dict]: Una lista de diccionarios con los datos de cada registro, o una lista vacía si no se encontraron registros.
    #     """
    #     sql = f"SELECT * FROM {table_name} WHERE {search_clause}"
    #     try:
    #         with self.create_connection() as conn:
    #             conn.row_factory = sqlite3.Row  # Devuelve los resultados como un diccionario
    #             cur = conn.cursor()
    #             cur.execute(sql, (value,))
    #             rows = cur.fetchall()
    #             if rows:
    #                 return [dict(row) for row in rows]  # Convierte cada fila en un diccionario y devuelve la lista
    #             return []
    #     except Exception as e:
    #         print(f"Error al obtener registros de la tabla '{table_name}': {e}")
    #         return []

    # #TODO: devolver dict{sucess, message, record}
    # def get_all_records_by_clauses(self, table_name, search_clauses):
    #     """
    #     Obtiene todos los registros de la base de datos en función de múltiples cláusulas de búsqueda personalizadas.

    #     Args:
    #         table_name (str): El nombre de la tabla donde se realizará la búsqueda.
    #         search_clauses (dict): Diccionario donde las claves son nombres de columna y los valores son los valores de búsqueda.

    #     Returns:
    #         list[dict]: Una lista de diccionarios con los datos de cada registro, o una lista vacía si no se encontraron registros.
    #     """
    #     # Construir la cláusula WHERE a partir del diccionario de condiciones
    #     clause_strings = [f"{column} = ?" for column in search_clauses.keys()]
    #     search_clause = " AND ".join(clause_strings)
    #     values = tuple(search_clauses.values())

    #     # Construir la consulta SQL con las condiciones especificadas
    #     sql = f"SELECT * FROM {table_name} WHERE {search_clause}"
        
    #     try:
    #         with self.create_connection() as conn:
    #             conn.row_factory = sqlite3.Row  # Devuelve los resultados como un diccionario
    #             cur = conn.cursor()
    #             cur.execute(sql, values)
    #             rows = cur.fetchall()
    #             if rows:
    #                 return [dict(row) for row in rows]  # Convierte cada fila en un diccionario y devuelve la lista
    #             return []
    #     except Exception as e:
    #         print(f"Error al obtener registros de la tabla '{table_name}': {e}")
    #         return []

    # #TODO: devolver dict{sucess, message, record}
    # def get_all_records(self, table_name):
    #     """
    #     Obtiene todos los registros de una tabla de la base de datos.

    #     Args:
    #         table_name (str): El nombre de la tabla.

    #     Returns:
    #         list: Una lista de diccionarios con los datos de todos los registros.
    #     """
    #     sql = f"SELECT * FROM {table_name}"
    #     try:
    #         with self.create_connection() as conn:
    #             cur = conn.cursor()
    #             cur.execute(sql)
    #             rows = cur.fetchall()
    #             records = []
    #             columns = [desc[0] for desc in cur.description]
    #             for row in rows:
    #                 records.append(dict(zip(columns, row)))
    #             return records
    #     except Exception as e:
    #         print(f"Error al obtener todos los registros de {table_name}: {e}")
    #         return []
