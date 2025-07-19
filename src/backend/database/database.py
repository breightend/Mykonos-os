# filepath: c:\Users\brend\OneDrive\Desktop\BrendaDevs\mykonos-os-electron-dev\Mykonos-app\src\backend\database\database.py
import os
import io as io
import sqlite3
import time
import threading
from enum import Enum
from commons.tools import print_debug  # noqa: F401
# TODO: hacer tabla ProveedoresXMarcas para poder relacionar varios proveedores a una misma marca y viceversa.


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
    PRODUCT_SIZES = "product_sizes"
    PRODUCT_COLORS = "product_colors"
    IMAGES = "images"
    WAREHOUSE_STOCK = "warehouse_stock"
    INVENTORY_MOVEMETNS = "inventory_movements"
    INVENTORY_MOVEMETNS_GROUPS = "inventory_movements_groups"
    RESPONSABILIDADES_AFIP = "responsabilidades_afip"
    BRANDS = "brands"
    PURCHASES = "purchases"
    PURCHASES_DETAIL = "purchases_detail"
    PROVEEDORXMARCA = "proveedorxmarca"
    USERSXSTORAGE = "usersxstorage"


DATABASE_TABLES = {
    TABLES.ENTITIES: {
        "columns": {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",  # Identificador único para cada entidad, se incrementa automáticamente.
            "entity_name": "TEXT NOT NULL",  # Nombre de la entidad (puede ser cliente o proveedor).
            "entity_type": "TEXT NOT NULL",  # Tipo de entidad (ejemplo: 'cliente', 'proveedor').
            "razon_social": "TEXT NOT NULL",  # Razón social de la entidad, importante para facturación.
            "responsabilidad_iva": "INTEGER NOT NULL",  # Indica la categoría de responsabilidad ante el IVA (ej: responsable inscripto).
            "domicilio_comercial": "TEXT NOT NULL",  # Dirección comercial de la entidad, necesaria para correspondencia y facturación.
            "cuit": "TEXT NOT NULL UNIQUE",  # CUIT (Clave Única de Identificación Tributaria), único para cada entidad.
            "inicio_actividades": "TEXT",  # Fecha de inicio de actividades de la entidad.
            "ingresos_brutos": "TEXT",  # Información sobre los ingresos brutos, puede ser útil para reportes.
            "contact_name": "TEXT",  # Nombre del contacto principal en la entidad, si aplica.
            "phone_number": "TEXT",  # Número de teléfono de la entidad para contacto directo.
            "email": "TEXT",  # Correo electrónico de la entidad para enviar comunicaciones.
            "observations": "TEXT",  # Notas adicionales o comentarios sobre la entidad, para uso interno.
        }
    },
    TABLES.PROVEEDORXMARCA: {
        "columns": {
            "id_brand": "INTEGER NOT NULL",  # Identificador de la marca.
            "id_provider": "INTEGER NOT NULL",  # Identificador del proveedor.
        },
        "primary_key": [
            "id_brand",
            "id_provider",
        ],  # Definimos la clave primaria compuesta
        "foreign_keys": [
            {  # Relación con la tabla de brand.
                "column": "id_brand",
                "reference_table": TABLES.BRANDS,
                "reference_column": "id",
                "export_column_name": "brand_name",  # <- columna de referencia cuando se exportan tablas
            },
            {  # Relación con la tabla de entidades (proveedores).
                "column": "id_provider",
                "reference_table": TABLES.ENTITIES,
                "reference_column": "id",
                "export_column_name": "entity_name",  # <- columna de referencia cuando se exportan tablas
            },
        ],
    },
    TABLES.FILE_ATTACHMENTS: {
        "columns": {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",  # Identificador único para cada archivo adjunto, se incrementa automáticamente.
            "file_name": "TEXT NOT NULL",  # Nombre del archivo original
            "file_extension": "TEXT NOT NULL",  # Extensión del archivo (ej: pdf, jpg, png)
            "file_content": "BLOB NOT NULL",  # Contenido del archivo
            "upload_date": "TEXT DEFAULT CURRENT_TIMESTAMP",  # Fecha de carga del archivo
            "comment": "TEXT",  # Comentario opcional sobre el archivo
        }
    },
    TABLES.ACCOUNT_MOVEMENTS: {
        "columns": {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",  # Identificador único para cada movimiento de cuenta, se incrementa automáticamente.
            "numero_operacion": "INTEGER NOT NULL CHECK (numero_operacion > 0)",  # Número de operación, debe ser positivo.
            "entity_id": "INTEGER NOT NULL",  # ID de la entidad relacionada (cliente o proveedor).
            "created_at": "TEXT DEFAULT CURRENT_TIMESTAMP",  # Fecha y hora en que se creó el movimiento.
            "descripcion": "TEXT",  # Descripción del movimiento para un seguimiento más detallado.
            "medio_pago": "TEXT",  # Medio de pago utilizado (efectivo, tarjeta de crédito, transferencia, etc.).
            "numero_de_comprobante": "TEXT",  # Número de comprobante asociado al movimiento, si aplica.
            "purchase_id": "INTEGER",  # ID de la compra asociada a este movimiento
            "debe": "REAL",  # Monto que se debe (cargos).
            "haber": "REAL",  # Monto que se acredita (abonos).
            "saldo": "REAL",  # Saldo actual después de realizar el movimiento.
            "file_id": "INTEGER",  # ID del archivo asociado, si existe (documentación adjunta).
            "updated_at": "TEXT DEFAULT CURRENT_TIMESTAMP",  # Fecha de la última modificación del movimiento.
        },
        "foreign_keys": [
            {  # Relación con la tabla de entidades.
                "column": "entity_id",
                "reference_table": TABLES.ENTITIES,
                "reference_column": "id",
                "export_column_name": "entity_name",  # <- columna de referencia cuando se exportan tablas
            },  # Relación con la tabla de archivos adjuntos.
            {
                "column": "file_id",
                "reference_table": TABLES.FILE_ATTACHMENTS,
                "reference_column": "id",
                "export_column_name": "file_name",
            },
            {  # Relación con la tabla de compras.
                "column": "purchase_id",
                "reference_table": TABLES.PURCHASES,
                "reference_column": "id",
                "export_column_name": "id",
            },
        ],
    },
    TABLES.GROUP: {
        "columns": {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",  # Identificador único para cada grupo, se incrementa automáticamente.
            "group_name": "TEXT NOT NULL",  # Nombre del grupo, requerido.
            "parent_group_id": "INTEGER",  # ID del grupo padre, si aplica (permite crear jerarquías).
            "marked_as_root": "INTEGER NOT NULL DEFAULT 0",  # Indica si el grupo es raíz (0) o no (1).
        },
        "foreign_keys": [
            {  # Relación con la tabla de grupos.
                "column": "parent_group_id",
                "reference_table": TABLES.GROUP,
                "reference_column": "id",
                "export_column_name": "group_name",
            }
        ],
    },
    TABLES.USERS: {
        "columns": {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",  # Identificador único para cada usuario, se incrementa automáticamente.
            "username": "TEXT UNIQUE",  # Nombre de usuario, debe ser único y no nulo.
            "fullname": "TEXT",  # Nombre completo del usuario, requerido.
            "password": "TEXT",  # Contraseña del usuario, requerida.
            "email": "TEXT",  # Correo electrónico del usuario.
            "phone": "TEXT",
            "domicilio": "TEXT",  # Número de teléfono del usuario.
            "cuit": "TEXT NOT NULL UNIQUE",  # Número de teléfono del usuario.
            "role": "TEXT",  # Rol del usuario (ejemplo: admin, usuario normal).
            "status": "TEXT",  # Estado del usuario (activo, inactivo, etc.).
            "session_token": "TEXT",  # Token de sesión para la autenticación del usuario.
            "profile_image": "BLOB",  # Imagen de perfil del usuario, almacenada como BLOB.
            "created_at": "TEXT DEFAULT (datetime('now','localtime'))",  # Fecha de creación del registro, se establece por defecto a la fecha y hora actuales.
        }
    },
    TABLES.SIZE_CATEGORIES: {
        "columns": {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",  # Identificador único para cada categoría de tamaño, se incrementa automáticamente.
            "category_name": "TEXT NOT NULL UNIQUE",  # Nombre de la categoría de tamaño, debe ser único y no nulo.
            "permanent": "BOOLEAN NOT NULL DEFAULT 0",  # Indica si la categoría es permanente (1) o no (0).
        }
    },
    TABLES.SIZES: {
        "columns": {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",  # Identificador único para cada tamaño, se incrementa automáticamente.
            "size_name": "TEXT NOT NULL",  # Nombre del tamaño, requerido.
            "category_id": "INTEGER NOT NULL",  # ID de la categoría de tamaño a la que pertenece.
            "description": "TEXT",  # Descripción del tamaño, opcional.
        },
        "foreign_keys": [
            {
                "column": "category_id",
                "reference_table": TABLES.SIZE_CATEGORIES,
                "reference_column": "id",
                "export_column_name": "category_name",
            }  # Relación con la tabla de categorías de tamaño.
        ],
    },
    TABLES.COLORS: {
        "columns": {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",  # Identificador único para cada color, se incrementa automáticamente.
            "color_name": "TEXT NOT NULL",  # Nombre del color, requerido.
            "color_hex": "TEXT NOT NULL",  # Código hexadecimal del color, requerido.
        }
    },
    TABLES.BARCODES: {
        "columns": {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",  # Identificador único para cada código de barras, se incrementa automáticamente.
            "barcode": "TEXT UNIQUE NOT NULL",  # Código de barras único para cada producto, requerido.
            "product_id": "INTEGER",  # ID del producto al que corresponde el código de barras.
        },
        "foreign_keys": [
            {
                "column": "product_id",
                "reference_table": TABLES.PRODUCTS,
                "reference_column": "barcode",
                "export_column_name": "product_name",
            }  # Relación con la tabla de productos.
        ],
    },
    TABLES.STORAGE: {
        "columns": {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",  # Identificador único para cada almacenamiento, se incrementa automáticamente.
            "name": "TEXT NOT NULL",  # Nombre del almacenamiento, requerido.
            "address": "TEXT",  # Dirección del almacenamiento.
            "postal_code": "TEXT",  # Código postal del almacenamiento.
            "phone_number": "TEXT",  # Número de teléfono del almacenamiento.
            "area": "TEXT",  # Área o sección dentro del almacenamiento.
            "description": "TEXT",  # Área o sección dentro del almacenamiento.
            "created_at": "TEXT DEFAULT (datetime('now','localtime'))",  # Fecha de creación del registro, se establece por defecto a la fecha y hora actuales.
            "status": "TEXT DEFAULT 'Activo'",  # Estado del almacenamiento (activo, inactivo, etc.).
        }
    },
    TABLES.PRODUCTS: {
        "columns": {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",  # Identificador único para cada producto, se incrementa automáticamente.
            "barcode": "TEXT NOT NULL",  # Código de barras del producto, requerido.
            "provider_code": "TEXT",  # Código del proveedor
            "product_name": "TEXT NOT NULL",  # Nombre del producto, requerido.
            "group_id": "INTEGER",  # ID del grupo al que pertenece el producto.
            "provider_id": "INTEGER",  # ID del proveedor, se relaciona con la tabla de entidades.
            "description": "TEXT",  # Descripción del producto, opcional.
            "cost": "REAL",  # Costo del producto.
            "sale_price": "REAL",  # Precio de venta del producto.
            "tax": "REAL",  # Impuesto aplicable al producto.
            "discount": "REAL",  # Descuento aplicado al producto.
            "comments": "TEXT",  # Comentarios adicionales sobre el producto.
            "user_id": "INTEGER",  # ID del usuario que creó o modificó el producto.
            "images_ids": "TEXT",  # IDs de las imágenes asociadas al producto.
            "brand_id": "INTEGER",  # ID de la marca del producto.
            "creation_date": "TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))",  # Fecha de creación del producto, se establece por defecto a la fecha y hora actuales.
            "last_modified_date": "TEXT",  # Fecha de la última modificación del producto.
        },
        "foreign_keys": [
            {  # Relación con la tabla de usuarios.
                "column": "user_id",
                "reference_table": TABLES.USERS,
                "reference_column": "id",
                "export_column_name": "username",
            },
            {  # Relación con la tabla de grupos.
                "column": "group_id",
                "reference_table": TABLES.GROUP,
                "reference_column": "id",
                "export_column_name": "group_name",
            },
            {  # Relación con la tabla de marcas.
                "column": "brand_id",
                "reference_table": TABLES.BRANDS,
                "reference_column": "id",
                "export_column_name": "brand_name",
            },
        ],
    },
    TABLES.IMAGES: {
        "columns": {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",  # Identificador único para cada imagen, se incrementa automáticamente.
            "image_data": "BLOB NOT NULL",  # Datos de la imagen, almacenados como BLOB.
            "product_id": "INTEGER",  # ID del producto al que corresponde la imagen.
        },
        "foreign_keys": [
            {  # Relación con la tabla de productos.
                "column": "product_id",
                "reference_table": TABLES.PRODUCTS,
                "reference_column": "id",
                "export_column_name": "product_name",
            }
        ],
    },
    TABLES.PRODUCT_SIZES: {
        "columns": {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",  # Identificador único para cada relación producto-talle.
            "product_id": "INTEGER NOT NULL",  # ID del producto.
            "size_id": "INTEGER NOT NULL",  # ID del talle.
            "created_at": "TEXT DEFAULT CURRENT_TIMESTAMP",  # Fecha de creación de la relación.
        },
        "foreign_keys": [
            {  # Relación con la tabla de productos.
                "column": "product_id",
                "reference_table": TABLES.PRODUCTS,
                "reference_column": "id",
                "export_column_name": "product_name",
            },
            {  # Relación con la tabla de talles.
                "column": "size_id",
                "reference_table": TABLES.SIZES,
                "reference_column": "id",
                "export_column_name": "size_name",
            },
        ],
    },
    TABLES.PRODUCT_COLORS: {
        "columns": {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",  # Identificador único para cada relación producto-color.
            "product_id": "INTEGER NOT NULL",  # ID del producto.
            "color_id": "INTEGER NOT NULL",  # ID del color.
            "created_at": "TEXT DEFAULT CURRENT_TIMESTAMP",  # Fecha de creación de la relación.
        },
        "foreign_keys": [
            {  # Relación con la tabla de productos.
                "column": "product_id",
                "reference_table": TABLES.PRODUCTS,
                "reference_column": "id",
                "export_column_name": "product_name",
            },
            {  # Relación con la tabla de colores.
                "column": "color_id",
                "reference_table": TABLES.COLORS,
                "reference_column": "id",
                "export_column_name": "color_name",
            },
        ],
    },
    TABLES.WAREHOUSE_STOCK: {
        "columns": {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",  # Identificador único para cada registro en el inventario.
            "product_id": "INTEGER NOT NULL",  # Identificador del producto, relacionado con la tabla products.
            "branch_id": "INTEGER NOT NULL",  # Identificador de la sucursal que almacena el producto.
            "quantity": "INTEGER NOT NULL CHECK (quantity >= 0)",  # Cantidad actual del producto en la sucursal, no puede ser negativo.
            "last_updated": "TEXT DEFAULT CURRENT_TIMESTAMP",  # Fecha de la última actualización del stock.
        },
        "foreign_keys": [
            {  # Relación con la tabla de productos.
                "column": "product_id",
                "reference_table": TABLES.PRODUCTS,
                "reference_column": "id",
                "export_column_name": "product_name",
            },
            {  # Relación con la tabla de sucursales.
                "column": "branch_id",
                "reference_table": TABLES.STORAGE,
                "reference_column": "id",
                "export_column_name": "name",
            },
        ],
    },
    TABLES.INVENTORY_MOVEMETNS: {
        "columns": {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",  # Identificador único para cada movimiento de inventario.
            "inventory_movements_group_id": "INTEGER NOT NULL",  # Identificador del grupo de transferencia.
            "product_id": "INTEGER NOT NULL",  # Identificador del producto movido.
            "quantity": "INTEGER NOT NULL CHECK (quantity > 0)",  # Cantidad de productos movidos, siempre positiva.
            "discount": "REAL DEFAULT 0.0",  # Descuento aplicado al producto
            "subtotal": "REAL NOT NULL",  # Subtotal para el producto (precio * cantidad)
            "total": "REAL NOT NULL",  # Total final después de aplicar descuentos
            "movement_date": "TEXT DEFAULT CURRENT_TIMESTAMP",  # Fecha y hora del movimiento de inventario.
        },
        "foreign_keys": [
            {  # Relación con la tabla de grupos de transferencia.
                "column": "inventory_movements_group_id",
                "reference_table": TABLES.INVENTORY_MOVEMETNS_GROUPS,
                "reference_column": "id",
                "export_column_name": "id",
            },
            {  # Relación con la tabla de productos.
                "column": "product_id",
                "reference_table": TABLES.PRODUCTS,
                "reference_column": "id",
                "export_column_name": "barcode",
            },
        ],
    },
    TABLES.INVENTORY_MOVEMETNS_GROUPS: {
        "columns": {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",  # Identificador único para cada grupo de transferencia.
            "origin_branch_id": "INTEGER NOT NULL",  # ID de la sucursal de origen.
            "destination_branch_id": "INTEGER NOT NULL",  # ID de la sucursal de destino.
            "created_at": "TEXT DEFAULT CURRENT_TIMESTAMP",  # Fecha y hora de la creación del grupo de transferencia.
            "notes": "TEXT",  # Comentarios adicionales sobre la transferencia.
        },
        "foreign_keys": [
            {  # Relación con la sucursal de origen.
                "column": "origin_branch_id",
                "reference_table": TABLES.STORAGE,
                "reference_column": "id",
                "export_column_name": "name",
            },
            {  # Relación con la sucursal de destino.
                "column": "destination_branch_id",
                "reference_table": TABLES.STORAGE,
                "reference_column": "id",
                "export_column_name": "name",
            },
        ],
    },
    TABLES.RESPONSABILIDADES_AFIP: {
        "columns": {
            "id": "INTEGER PRIMARY KEY",  # Identificador único para cada responsabilidad, se establece como clave primaria.
            "codigo": "INTEGER NOT NULL",  # Código de responsabilidad, requerido.
            "descripcion": "TEXT NOT NULL",  # Descripción de la responsabilidad, requerida.
        }
    },
    TABLES.BRANDS: {
        "columns": {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",  # Identificador único para cada marca, se incrementa automáticamente.
            "brand_name": "TEXT NOT NULL UNIQUE",  # Nombre de la marca, debe ser único y no nulo.
            "description": "TEXT",  # Descripción de la marca, opcional.
            "creation_date": "TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))",  # Fecha de creación del registro, se establece por defecto a la fecha y hora actuales.
            "last_modified_date": "TEXT",  # Fecha de la última modificación de la marca.
        }
    },
    TABLES.PURCHASES: {
        "columns": {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",  # Identificador único de la venta
            "entity_id": "INTEGER",  # Id de la entidad
            "purchase_date": "TEXT DEFAULT CURRENT_TIMESTAMP",  # Fecha y hora de la venta
            "subtotal": "REAL NOT NULL",  # Suma total antes de descuentos
            "discount": "REAL DEFAULT 0.0",  # Total de descuentos aplicados
            "total": "REAL NOT NULL",  # Total final después de aplicar descuentos
            "payment_method": "TEXT",  # Medio de pago (efectivo, tarjeta, etc.)
            "transaction_number": "TEXT",  # Número del comprobante te transferencia/ticket de la venta
            "invoice_number": "TEXT",  # Número de factura de la venta
            "notes": "TEXT",  # Nota de texto para dejar comentarios
            "file_id": "INTEGER",  # Id del arhcivo adjunto de la compra TODO: Tenes cuidado con esto
        },
        "foreign_keys": [
            {  # Relación con tabla de clientes si es necesario
                "column": "entity_id",
                "reference_table": TABLES.ENTITIES,
                "reference_column": "id",
                "export_column_name": "entity_name",
            },
            {  # Relación con tabla de archivos si es necesario
                "column": "file_id",
                "reference_table": TABLES.FILE_ATTACHMENTS,
                "reference_column": "id",
                "export_column_name": "file_name",
            },
        ],
    },
    TABLES.PURCHASES_DETAIL: {
        "columns": {
            "id": "INTEGER PRIMARY KEY AUTOINCREMENT",  # Identificador único del detalle de la venta
            "purchase_id": "INTEGER NOT NULL",  # ID de la venta relacionada
            "product_id": "INTEGER",  # ID del producto
            "sale_price": "REAL NOT NULL",  # Precio del producto en el momento de la venta
            "quantity": "INTEGER NOT NULL CHECK (quantity > 0)",  # Cantidad de productos vendidos
            "discount": "REAL DEFAULT 0.0",  # Descuento aplicado al producto
            "subtotal": "REAL NOT NULL",  # Subtotal para el producto (precio * cantidad)
            "metadata": "TEXT",  # Informacion adicional de la venta
        },
        "foreign_keys": [
            {  # Relación con la tabla de ventas
                "column": "purchase_id",
                "reference_table": TABLES.PURCHASES,
                "reference_column": "id",
                "export_column_name": "id",
            },
            {  # Relación a la tabla de productos
                "column": "product_id",
                "reference_table": TABLES.PRODUCTS,
                "reference_column": "id",
                "export_column_name": "product_name",
            },
        ],
    },
    TABLES.USERSXSTORAGE: {
        "columns": {
            "id_user": "INTEGER NOT NULL",  # Identificador del usuario.
            "id_storage": "INTEGER NOT NULL",  # Identificador del almacén.
        },
        "primary_key": [
            "id_user",
            "id_storage",
        ],  # Definimos la clave primaria compuesta
        "foreign_keys": [
            {  # Relación con la tabla de usuarios.
                "column": "id_user",
                "reference_table": TABLES.USERS,
                "reference_column": "id",
                "export_column_name": "username",  # <- columna de referencia cuando se exportan tablas
            },
            {  # Relación con la tabla de almacenes.
                "column": "id_storage",
                "reference_table": TABLES.STORAGE,
                "reference_column": "id",
                "export_column_name": "name",  # <- columna de referencia cuando se exportan tablas
            },
        ],
    },
}

DATABASE_PATH = "./database/mykonos.db"


class Database:
    def __init__(self, db_path=DATABASE_PATH):
        if not os.path.exists(db_path):
            print(
                f"Base de datos no encontrada en: {db_path}. Creando una nueva base de datos."
            )
            try:
                # Create the directory if it doesn't exist
                os.makedirs(os.path.dirname(db_path), exist_ok=True)
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
        conn = self.create_connection()
        if conn is not None:
            try:
                # Habilitar claves foráneas
                conn.execute("PRAGMA foreign_keys = ON;")

                for table, definition in DATABASE_TABLES.items():
                    primary_key = definition.get("primary_key")
                    foreign_keys = definition.get("foreign_keys", [])
                    self.create_or_update_table(
                        conn,
                        table.value,
                        definition["columns"],
                        foreign_keys,
                        primary_key,
                    )
                conn.commit()
            except sqlite3.Error as e:
                print(f"Error al crear o actualizar tablas: {e}")
            finally:
                conn.close()

    def create_or_update_table(
        self, conn, table_name, columns, foreign_keys=[], primary_key=None
    ):
        """
        Crea la tabla si no existe y revisa si hay columnas faltantes o de más.
        Soporta claves primarias compuestas para relaciones many-to-many.
        """
        existing_columns = self.get_existing_columns(conn, table_name)

        # Build column definitions, excluding PRIMARY KEY from individual columns if composite primary key is defined
        column_defs = []
        for col_name, col_type in columns.items():
            # If we have a composite primary key, remove PRIMARY KEY from individual column definitions
            if primary_key and col_name in primary_key:
                # Remove PRIMARY KEY AUTOINCREMENT from the column definition
                col_type_clean = (
                    col_type.replace("PRIMARY KEY AUTOINCREMENT", "")
                    .replace("PRIMARY KEY", "")
                    .strip()
                )
                column_defs.append(f"{col_name} {col_type_clean}")
            else:
                column_defs.append(f"{col_name} {col_type}")

        # Add composite primary key constraint if specified
        if primary_key:
            primary_key_columns = ", ".join(primary_key)
            column_defs.append(f"PRIMARY KEY ({primary_key_columns})")

        # Add foreign key constraints
        if foreign_keys:
            for fk in foreign_keys:
                column_defs.append(
                    f"FOREIGN KEY({fk['column']}) REFERENCES {fk['reference_table'].value}({fk['reference_column']})"
                )

        create_table_sql = (
            f"CREATE TABLE IF NOT EXISTS {table_name} ({', '.join(column_defs)});"
        )

        if not existing_columns:
            print(f"Creando tabla: {table_name}")
            print(create_table_sql)
            conn.execute(create_table_sql)
        else:
            # Check for extra columns
            extra_columns = [col for col in existing_columns if col not in columns]
            if extra_columns:
                self.remove_extra_columns(
                    conn,
                    table_name,
                    columns,
                    foreign_keys,
                    extra_columns,
                    existing_columns,
                    primary_key,
                )

            # Add missing columns
            for col_name, col_type in columns.items():
                if col_name not in existing_columns:
                    try:
                        # Clean column type for ALTER TABLE (remove PRIMARY KEY constraints)
                        col_type_clean = (
                            col_type.replace("PRIMARY KEY AUTOINCREMENT", "")
                            .replace("PRIMARY KEY", "")
                            .strip()
                        )

                        # Handle function-based defaults that SQLite can't add via ALTER TABLE
                        if (
                            "datetime(" in col_type_clean
                            or "CURRENT_TIMESTAMP" in col_type_clean
                        ):
                            # For function-based defaults, add column without default first
                            col_type_no_default = col_type_clean.split("DEFAULT")[
                                0
                            ].strip()
                            alter_table_sql = f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type_no_default};"
                            print(
                                f"Agregando columna: {col_name} a la tabla {table_name} (sin default function)"
                            )
                            conn.execute(alter_table_sql)

                            # Then update existing rows with current timestamp if it's a timestamp column
                            if "created_at" in col_name.lower():
                                update_sql = f"UPDATE {table_name} SET {col_name} = datetime('now','localtime') WHERE {col_name} IS NULL;"
                                conn.execute(update_sql)
                        else:
                            alter_table_sql = f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type_clean};"
                            print(
                                f"Agregando columna: {col_name} a la tabla {table_name}"
                            )
                            conn.execute(alter_table_sql)
                    except sqlite3.OperationalError as e:
                        print(f"Error al agregar la columna {col_name}: {e}")
                        if "duplicate column name" in str(e).lower():
                            continue
                        elif "Cannot add a column with non-constant default" in str(e):
                            # Try adding without the default
                            try:
                                col_type_no_default = col_type_clean.split("DEFAULT")[
                                    0
                                ].strip()
                                alter_table_sql = f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type_no_default};"
                                print(
                                    f"Reintentando agregar columna: {col_name} sin default"
                                )
                                conn.execute(alter_table_sql)
                            except Exception as e2:
                                print(
                                    f"Error al reintentar agregar columna {col_name}: {e2}"
                                )
                                continue
                        else:
                            print(
                                f"Error no manejado al agregar columna {col_name}: {e}"
                            )
                            continue

    def get_existing_columns(self, conn, table_name):
        """
        Devuelve una lista de las columnas existentes en una tabla.
        """
        cursor = conn.execute(f"PRAGMA table_info({table_name});")
        return [row[1] for row in cursor.fetchall()]

    def remove_extra_columns(
        self,
        conn,
        table_name,
        columns,
        foreign_keys,
        extra_columns,
        existing_columns,
        primary_key=None,
    ):
        """
        Reestructura la tabla para eliminar columnas extra sin borrar datos existentes.
        """
        print(f"Eliminando columnas extra: {extra_columns} en la tabla {table_name}")

        # Deshabilitar claves foráneas temporalmente
        conn.execute("PRAGMA foreign_keys = OFF;")

        # Verificar si la tabla temporal ya existe, y si es así, eliminarla
        conn.execute(f"DROP TABLE IF EXISTS {table_name}_temp;")

        # Crear una tabla temporal con las columnas correctas
        column_defs = []
        for col_name, col_type in columns.items():
            # If we have a composite primary key, remove PRIMARY KEY from individual column definitions
            if primary_key and col_name in primary_key:
                col_type_clean = (
                    col_type.replace("PRIMARY KEY AUTOINCREMENT", "")
                    .replace("PRIMARY KEY", "")
                    .strip()
                )
                column_defs.append(f"{col_name} {col_type_clean}")
            else:
                column_defs.append(f"{col_name} {col_type}")

        # Add composite primary key constraint if specified
        if primary_key:
            primary_key_columns = ", ".join(primary_key)
            column_defs.append(f"PRIMARY KEY ({primary_key_columns})")

        # Add foreign key constraints
        if foreign_keys:
            for fk in foreign_keys:
                column_defs.append(
                    f"FOREIGN KEY({fk['column']}) REFERENCES {fk['reference_table'].value}({fk['reference_column']})"
                )

        temp_table_sql = (
            f"CREATE TABLE IF NOT EXISTS {table_name}_temp ({', '.join(column_defs)});"
        )
        conn.execute(temp_table_sql)

        # Copiar los datos de las columnas válidas a la tabla temporal
        valid_columns = ", ".join([col for col in existing_columns if col in columns])
        copy_data_sql = f"INSERT INTO {table_name}_temp ({valid_columns}) SELECT {valid_columns} FROM {table_name};"
        conn.execute(copy_data_sql)

        # Eliminar la tabla original
        conn.execute(f"DROP TABLE {table_name};")

        # Renombrar la tabla temporal a la tabla original
        conn.execute(f"ALTER TABLE {table_name}_temp RENAME TO {table_name};")

        # Rehabilitar claves foráneas
        conn.execute("PRAGMA foreign_keys = ON;")

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
                    result["message"] = (
                        f"Se eliminaron {deleted_count} tablas correctamente."
                    )
                    result["deleted_count"] = deleted_count
                else:
                    result["message"] = (
                        "No se pudo establecer la conexión con la base de datos."
                    )
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
                cursor.execute(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
                    (table_name,),
                )
                if not cursor.fetchone():
                    return {
                        "success": False,
                        "message": f"La tabla '{table_name}' no existe en la base de datos.",
                        "table_names": [],
                    }

                # Obtener los nombres de las columnas
                cursor.execute(f"PRAGMA table_info({table_name})")
                columns_info = cursor.fetchall()
                column_names = [column[1] for column in columns_info]

                return {
                    "success": True,
                    "message": f"Se obtuvieron {len(column_names)} columnas de la tabla '{table_name}'.",
                    "table_names": column_names,
                }

        except sqlite3.Error as e:
            return {
                "success": False,
                "message": f"Error al obtener las columnas de la tabla '{table_name}': {e}",
                "table_names": [],
            }

    def execute_query(self, query, params=None):
        """
        Executes a custom SQL query and returns the results.

        Args:
            query (str): The SQL query to execute.
            params (tuple, optional): Parameters for the query. Defaults to None.

        Returns:
            list: A list of dictionaries with the query results.
        """
        try:
            with self.create_connection() as conn:
                cur = conn.cursor()
                if params:
                    cur.execute(query, params)
                else:
                    cur.execute(query)
                rows = cur.fetchall()
                records = []
                columns = [desc[0] for desc in cur.description]
                for row in rows:
                    records.append(dict(zip(columns, row)))
                return records
        except Exception as e:
            print(f"Error executing query: {e}")
            return []

    # CRUD methods
    def add_record(self, table_name, data):
        """
        Agrega un nuevo registro a la tabla especificada en la base de datos.

        :param table_name: El nombre de la tabla en la que se va a insertar el registro.
        :param data: Un diccionario con los datos a insertar, donde las claves son los nombres de las columnas.
        :return: Un diccionario con 'success' (bool), 'message' (str) y 'rowid' (int o None).
        """
        placeholders = ", ".join([f":{key}" for key in data.keys()])
        columns = ", ".join(data.keys())
        sql = f"""INSERT INTO {table_name} ({columns})
                VALUES ({placeholders})"""

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
                            "rowid": cur.lastrowid,
                        }
            except sqlite3.OperationalError as e:
                if "locked" in str(e):
                    retries -= 1
                    time.sleep(1)
                else:
                    return {
                        "success": False,
                        "message": f"Error al agregar registro en la tabla '{table_name}': {e}",
                        "rowid": None,
                    }
            except sqlite3.IntegrityError as e:
                return {
                    "success": False,
                    "message": f"Error de integridad al agregar registro en la tabla '{table_name}': {e}",
                    "rowid": None,
                }
            except Exception as e:
                return {
                    "success": False,
                    "message": f"Error al agregar registro en la tabla '{table_name}': {e}",
                    "rowid": None,
                }

        return {
            "success": False,
            "message": f"Error al agregar registro en la tabla '{table_name}': la base de datos está bloqueada después de varios intentos",
            "rowid": None,
        }

    def update_record(self, table_name, data):
        """
        Actualiza un registro en la tabla especificada de la base de datos.

        :param table_name: El nombre de la tabla donde se actualizará el registro.
        :param data: Un diccionario con los datos a actualizar, incluyendo el ID del registro.
        :return: Un diccionario con dos claves: 'success' (bool) y 'message' (str).
        """
        if "id" not in data:
            return {
                "success": False,
                "message": "Error: El diccionario de datos debe contener una clave 'id' con el ID del registro.",
            }

        if data.get("id", None) is None:
            return {
                "success": False,
                "message": f"Error: El diccionario de datos debe contener una clave 'id' valido, actual:{data.get('id', None)}",
            }

        # Construir la cláusula SET de la consulta SQL, excluyendo 'id'
        set_clause = ", ".join(
            [f"{key} = :{key}" for key in data.keys() if key != "id"]
        )
        sql = f"UPDATE {table_name} SET {set_clause} WHERE id = :id"

        try:
            with self.db_lock:
                with sqlite3.connect(self.db_path) as conn:
                    cur = conn.cursor()
                    cur.execute(sql, data)
                    conn.commit()
            return {
                "success": True,
                "message": f"Registro en la tabla '{table_name}' actualizado correctamente.",
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error al actualizar el registro en la tabla '{table_name}': {e}",
            }

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
                            "message": "Error: No se encontró un registro que cumpla con los criterios especificados.",
                        }

                    conn.commit()

            return {"success": True, "message": "Registro eliminado correctamente"}

        except Exception as e:
            return {"success": False, "message": f"Error al eliminar registro: {e}"}

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
                        "success": True,
                        "message": f"Registro en la tabla '{table_name}' encontrado",
                        "record": record,
                    }
                else:
                    return {
                        "success": False,
                        "message": f"No se encontró el registro en la tabla '{table_name}'",
                        "record": None,
                    }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error al obtener el registro en la tabla '{table_name}': {e}",
                "record": None,
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
                conn.row_factory = (
                    sqlite3.Row
                )  # Permite acceder a los valores por nombre de columna
                cur = conn.cursor()

                # Convertir value a tupla si no lo es
                if not isinstance(value, tuple):
                    value = (value,)

                cur.execute(sql, value)
                row = cur.fetchone()

                if row:
                    result["success"] = True
                    result["message"] = "Registro encontrado."
                    result["record"] = {
                        key: row[key] for key in row.keys()
                    }  # Diccionario con nombres de columnas
                else:
                    result["message"] = "No se encontró ningún registro."

        except Exception as e:
            result["message"] = f"Error al obtener registro de '{table_name}': {e}"

        return result

    def get_all_records_by_clause(self, table_name, search_clause, value):
        """
        Obtiene todos los registros de la base de datos en función de una cláusula de búsqueda personalizada.

        Args:
            table_name (str): El nombre de la tabla donde se realizará la búsqueda.
            search_clause (str): La columna y el operador de búsqueda (ej: "username = ?", "email LIKE ?").
            value: El valor a buscar en la columna especificada.

        Returns:
            list[dict]: Una lista de diccionarios con los datos de cada registro, o una lista vacía si no se encontraron registros.
        """
        sql = f"SELECT * FROM {table_name} WHERE {search_clause}"
        try:
            with self.create_connection() as conn:
                conn.row_factory = (
                    sqlite3.Row
                )  # Devuelve los resultados como un diccionario
                cur = conn.cursor()
                cur.execute(sql, (value,))
                rows = cur.fetchall()
                if rows:
                    return [
                        dict(row) for row in rows
                    ]  # Convierte cada fila en un diccionario y devuelve la lista
                return []
        except Exception as e:
            print(f"Error al obtener registros de la tabla '{table_name}': {e}")
            return []

    def get_all_records(self, table_name):
        """
        Obtiene todos los registros de una tabla de la base de datos.

        Args:
            table_name (str): El nombre de la tabla.

        Returns:
            list: Una lista de diccionarios con los datos de todos los registros.
        """
        sql = f"SELECT * FROM {table_name}"
        try:
            with self.create_connection() as conn:
                cur = conn.cursor()
                cur.execute(sql)
                rows = cur.fetchall()
                records = []
                columns = [desc[0] for desc in cur.description]
                for row in rows:
                    records.append(dict(zip(columns, row)))
                return records
        except Exception as e:
            print(f"Error al obtener todos los registros de {table_name}: {e}")
            return []

    def get_join_records_tres_tables(
        self,
        table1_name,
        table2_name,
        table3_name,
        join_column1,
        join_column2,
        join_column3,
        select_columns="t1.*, t2.*, t3.*",
    ):
        """
        Performs an INNER JOIN between three tables and retrieves records.

        Args:
            table1_name (str): The name of the first table (aliased as t1).
            table2_name (str): The name of the second table (aliased as t2).
            table3_name (str): The name of the third table (aliased as t3).
            join_column1 (str): The name of the join column in the first table.
            join_column2 (str): The name of the join column in the second table.
            join_column3 (str): The name of the join column in the third table.
            select_columns (str): Comma-separated string of columns to select.

        Returns:
            list[dict]: List of records as dictionaries
        """
        sql = f"""
            SELECT {select_columns}
            FROM {table1_name} AS t1
            INNER JOIN {table2_name} AS t2 ON t1.{join_column1} = t2.{join_column2}
            INNER JOIN {table3_name} AS t3 ON t2.{join_column3} = t3.id
        """

        try:
            with self.create_connection() as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                cur.execute(sql)
                rows = cur.fetchall()
                if rows:
                    return [dict(row) for row in rows]
                else:
                    return []
        except Exception as e:
            print(f"Error al obtener registros con JOIN: {e}")
            return []

    def get_join_records(
        self,
        table1_name,
        table2_name,
        join_column1,
        join_column2,
        select_columns="t1.*, t2.*",
        where_clause=None,
        where_params=None,
    ):
        """
        Performs an INNER JOIN between two tables and retrieves records.

        Args:
            table1_name (str): The name of the first table (aliased as t1).
            table2_name (str): The name of the second table (aliased as t2).
            join_column1 (str): The name of the join column in the first table.
            join_column2 (str): The name of the join column in the second table.
            select_columns (str): Comma-separated string of columns to select.
            where_clause (str, optional): Additional WHERE clause (e.g., "t1.product_id = ?")
            where_params (tuple, optional): Parameters for the WHERE clause

        Returns:
            list[dict]: List of records as dictionaries
        """
        # Basic validation
        if not all([table1_name, table2_name, join_column1, join_column2]):
            return []

        sql = f"""
            SELECT {select_columns}
            FROM {table1_name} AS t1
            INNER JOIN {table2_name} AS t2 ON t1.{join_column1} = t2.{join_column2}
        """

        if where_clause:
            sql += f" WHERE {where_clause}"

        try:
            with self.create_connection() as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()

                if where_params:
                    cur.execute(sql, where_params)
                else:
                    cur.execute(sql)

                rows = cur.fetchall()
                if rows:
                    return [dict(row) for row in rows]
                else:
                    return []
        except Exception as e:
            print(f"Error al obtener registros con JOIN: {e}")
            return []

    # Utility methods for many-to-many relationships
    def add_provider_brand_relationship(self, provider_id, brand_id):
        """
        Adds a many-to-many relationship between a provider and a brand.

        Args:
            provider_id (int): The ID of the provider (from ENTITIES table)
            brand_id (int): The ID of the brand (from BRANDS table)

        Returns:
            dict: {'success': bool, 'message': str, 'rowid': int or None}
        """
        data = {"id_provider": provider_id, "id_brand": brand_id}

        return self.add_record(TABLES.PROVEEDORXMARCA.value, data)

    def remove_provider_brand_relationship(self, provider_id, brand_id):
        """
        Removes a many-to-many relationship between a provider and a brand.

        Args:
            provider_id (int): The ID of the provider
            brand_id (int): The ID of the brand

        Returns:
            dict: {'success': bool, 'message': str}
        """
        where_clause = "id_provider = ? AND id_brand = ?"
        params = (provider_id, brand_id)

        return self.delete_record(TABLES.PROVEEDORXMARCA.value, where_clause, params)

    def get_brands_by_provider(self, provider_id):
        """
        Gets all brands associated with a specific provider.

        Args:
            provider_id (int): The ID of the provider

        Returns:
            list[dict]: List of brand records associated with the provider
        """
        return self.get_join_records(
            TABLES.PROVEEDORXMARCA.value,
            TABLES.BRANDS.value,
            "id_brand",
            "id",
            "t2.*",  # Only select brand columns
        )

    def get_providers_by_brand(self, brand_id):
        """
        Gets all providers associated with a specific brand.

        Args:
            brand_id (int): The ID of the brand

        Returns:
            list[dict]: List of provider (entity) records associated with the brand
        """
        return self.get_join_records(
            TABLES.PROVEEDORXMARCA.value,
            TABLES.ENTITIES.value,
            "id_provider",
            "id",
            "t2.*",  # Only select entity columns
        )

    def get_provider_brands_relationships(self):
        """
        Gets all provider-brand relationships with detailed information.

        Returns:
            list[dict]: List of records containing provider and brand information
        """
        return self.get_join_records_tres_tables(
            TABLES.PROVEEDORXMARCA.value,
            TABLES.ENTITIES.value,
            TABLES.BRANDS.value,
            "id_provider",
            "id",
            "id_brand",
            "t1.id_provider, t1.id_brand, t2.entity_name, t2.cuit, t3.brand_name, t3.description",
        )

    def check_provider_brand_relationship_exists(self, provider_id, brand_id):
        """
        Checks if a relationship between a provider and brand already exists.

        Args:
            provider_id (int): The ID of the provider
            brand_id (int): The ID of the brand

        Returns:
            dict: {'success': bool, 'message': str, 'exists': bool, 'record': dict or None}
        """
        result = self.get_record_by_clause(
            TABLES.PROVEEDORXMARCA.value,
            "id_provider = ? AND id_brand = ?",
            (provider_id, brand_id),
        )

        return {
            "success": result["success"],
            "message": result["message"],
            "exists": result["success"] and result["record"] is not None,
            "record": result["record"],
        }

    # Utility methods for user-storage many-to-many relationships
    def add_user_storage_relationship(self, user_id, storage_id):
        """
        Adds a many-to-many relationship between a user and a storage location.

        Args:
            user_id (int): The ID of the user
            storage_id (int): The ID of the storage location

        Returns:
            dict: {'success': bool, 'message': str, 'rowid': int or None}
        """
        data = {"id_user": user_id, "id_storage": storage_id}

        # Check if relationship already exists
        existing = self.get_record_by_clause(
            TABLES.USERSXSTORAGE.value,
            "id_user = ? AND id_storage = ?",
            (user_id, storage_id),
        )

        if existing["success"] and existing["record"] is not None:
            return {
                "success": False,
                "message": "La relación entre el usuario y el almacén ya existe.",
                "rowid": None,
            }

        result = self.add_record(TABLES.USERSXSTORAGE.value, data)
        return result

    def remove_user_storage_relationship(self, user_id, storage_id):
        """
        Removes a many-to-many relationship between a user and a storage location.

        Args:
            user_id (int): The ID of the user
            storage_id (int): The ID of the storage location

        Returns:
            dict: {'success': bool, 'message': str}
        """
        result = self.delete_record(
            TABLES.USERSXSTORAGE.value,
            "id_user = ? AND id_storage = ?",
            (user_id, storage_id),
        )
        return result

    def get_storages_by_user(self, user_id):
        """
        Gets all storage locations accessible to a specific user.

        Args:
            user_id (int): The ID of the user

        Returns:
            list[dict]: List of storage records accessible to the user
        """
        sql = """
            SELECT s.*
            FROM storage s
            INNER JOIN usersxstorage us ON s.id = us.id_storage
            WHERE us.id_user = ?
        """
        try:
            with self.create_connection() as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                cur.execute(sql, (user_id,))
                rows = cur.fetchall()
                if rows:
                    return [dict(row) for row in rows]
                else:
                    return []
        except Exception as e:
            print(f"Error getting storages by user: {e}")
            return []

    def get_users_by_storage(self, storage_id):
        """
        Gets all users who have access to a specific storage location.

        Args:
            storage_id (int): The ID of the storage location

        Returns:
            list[dict]: List of user records who have access to the storage
        """
        sql = """
            SELECT u.id, u.username, u.fullname, u.email, u.phone, u.domicilio, 
                   u.cuit, u.role, u.status, u.session_token, u.created_at
            FROM users u
            INNER JOIN usersxstorage us ON u.id = us.id_user
            WHERE us.id_storage = ?
        """
        try:
            with self.create_connection() as conn:
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                cur.execute(sql, (storage_id,))
                rows = cur.fetchall()
                if rows:
                    users = []
                    for row in rows:
                        user = dict(row)
                        # Ensure all values are JSON serializable
                        for key, value in user.items():
                            if isinstance(value, bytes):
                                user[key] = None  # Remove binary data
                        users.append(user)
                    return users
                else:
                    return []
        except Exception as e:
            print(f"Error getting users by storage: {e}")
            return []

    def get_user_storage_relationships(self):
        """
        Gets all user-storage relationships with detailed information.

        Returns:
            list[dict]: List of records containing user and storage information
        """
        return self.get_join_records_tres_tables(
            TABLES.USERSXSTORAGE.value,
            TABLES.USERS.value,
            TABLES.STORAGE.value,
            "id_user",
            "id",
            "id_storage",
            "t1.id_user, t1.id_storage, t2.username, t2.fullname, t3.name as storage_name, t3.description as storage_description",
        )

    def check_user_storage_relationship_exists(self, user_id, storage_id):
        """
        Checks if a relationship between a user and storage location already exists.

        Args:
            user_id (int): The ID of the user
            storage_id (int): The ID of the storage location

        Returns:
            dict: {'success': bool, 'message': str, 'exists': bool, 'record': dict or None}
        """
        result = self.get_record_by_clause(
            TABLES.USERSXSTORAGE.value,
            "id_user = ? AND id_storage = ?",
            (user_id, storage_id),
        )

        return {
            "success": result["success"],
            "message": result["message"],
            "exists": result["success"] and result["record"] is not None,
            "record": result["record"],
        }

    # Utility methods for product-size many-to-many relationships
    def add_product_size_relationship(self, product_id, size_id):
        """
        Adds a many-to-many relationship between a product and a size.

        Args:
            product_id (int): The ID of the product
            size_id (int): The ID of the size

        Returns:
            dict: {'success': bool, 'message': str, 'rowid': int or None}
        """
        data = {"product_id": product_id, "size_id": size_id}
        return self.add_record(TABLES.PRODUCT_SIZES.value, data)

    def remove_product_size_relationship(self, product_id, size_id):
        """
        Removes a many-to-many relationship between a product and a size.

        Args:
            product_id (int): The ID of the product
            size_id (int): The ID of the size

        Returns:
            dict: {'success': bool, 'message': str}
        """
        return self.delete_record(
            TABLES.PRODUCT_SIZES.value,
            "product_id = ? AND size_id = ?",
            (product_id, size_id),
        )

    def get_sizes_by_product(self, product_id):
        """
        Gets all sizes associated with a specific product.

        Args:
            product_id (int): The ID of the product

        Returns:
            list[dict]: List of size records associated with the product
        """
        return self.get_join_records(
            TABLES.PRODUCT_SIZES.value,
            TABLES.SIZES.value,
            "size_id",
            "id",
            "t2.*",  # Only select size columns
            "t1.product_id = ?",
            (product_id,),
        )

    def get_products_by_size(self, size_id):
        """
        Gets all products associated with a specific size.

        Args:
            size_id (int): The ID of the size

        Returns:
            list[dict]: List of product records associated with the size
        """
        return self.get_join_records(
            TABLES.PRODUCT_SIZES.value,
            TABLES.PRODUCTS.value,
            "product_id",
            "id",
            "t2.*",  # Only select product columns
            "t1.size_id = ?",
            (size_id,),
        )

    def check_product_size_relationship_exists(self, product_id, size_id):
        """
        Checks if a product-size relationship exists.

        Args:
            product_id (int): The ID of the product
            size_id (int): The ID of the size

        Returns:
            dict: {'success': bool, 'message': str, 'exists': bool, 'record': dict or None}
        """
        result = self.get_record_by_clause(
            TABLES.PRODUCT_SIZES.value,
            "product_id = ? AND size_id = ?",
            (product_id, size_id),
        )

        return {
            "success": result["success"],
            "message": result["message"],
            "exists": result["success"] and result["record"] is not None,
            "record": result["record"],
        }

    # Utility methods for product-color many-to-many relationships
    def add_product_color_relationship(self, product_id, color_id):
        """
        Adds a many-to-many relationship between a product and a color.

        Args:
            product_id (int): The ID of the product
            color_id (int): The ID of the color

        Returns:
            dict: {'success': bool, 'message': str, 'rowid': int or None}
        """
        data = {"product_id": product_id, "color_id": color_id}
        return self.add_record(TABLES.PRODUCT_COLORS.value, data)

    def remove_product_color_relationship(self, product_id, color_id):
        """
        Removes a many-to-many relationship between a product and a color.

        Args:
            product_id (int): The ID of the product
            color_id (int): The ID of the color

        Returns:
            dict: {'success': bool, 'message': str}
        """
        return self.delete_record(
            TABLES.PRODUCT_COLORS.value,
            "product_id = ? AND color_id = ?",
            (product_id, color_id),
        )

    def get_colors_by_product(self, product_id):
        """
        Gets all colors associated with a specific product.

        Args:
            product_id (int): The ID of the product

        Returns:
            list[dict]: List of color records associated with the product
        """
        return self.get_join_records(
            TABLES.PRODUCT_COLORS.value,
            TABLES.COLORS.value,
            "color_id",
            "id",
            "t2.*",  # Only select color columns
            "t1.product_id = ?",
            (product_id,),
        )

    def get_products_by_color(self, color_id):
        """
        Gets all products associated with a specific color.

        Args:
            color_id (int): The ID of the color

        Returns:
            list[dict]: List of product records associated with the color
        """
        return self.get_join_records(
            TABLES.PRODUCT_COLORS.value,
            TABLES.PRODUCTS.value,
            "product_id",
            "id",
            "t2.*",  # Only select product columns
            "t1.color_id = ?",
            (color_id,),
        )

    def check_product_color_relationship_exists(self, product_id, color_id):
        """
        Checks if a product-color relationship exists.

        Args:
            product_id (int): The ID of the product
            color_id (int): The ID of the color

        Returns:
            dict: {'success': bool, 'message': str, 'exists': bool, 'record': dict or None}
        """
        result = self.get_record_by_clause(
            TABLES.PRODUCT_COLORS.value,
            "product_id = ? AND color_id = ?",
            (product_id, color_id),
        )

        return {
            "success": result["success"],
            "message": result["message"],
            "exists": result["success"] and result["record"] is not None,
            "record": result["record"],
        }
