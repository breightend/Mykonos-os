# Implementación de Relaciones Muchos-a-Muchos: Productos, Talles y Colores

## Resumen de Cambios

Se ha implementado exitosamente la relación muchos-a-muchos entre productos, talles y colores en el sistema Mykonos. Esto permite que:

- **Un producto puede tener múltiples talles**
- **Un producto puede tener múltiples colores**
- **Un talle puede estar asociado a múltiples productos**
- **Un color puede estar asociado a múltiples productos**

## Cambios en la Base de Datos

### 1. Nuevas Tablas de Unión

#### `product_sizes`

```sql
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- product_id: INTEGER NOT NULL (FK -> products.id)
- size_id: INTEGER NOT NULL (FK -> sizes.id)
- created_at: TEXT DEFAULT CURRENT_TIMESTAMP
```

#### `product_colors`

```sql
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- product_id: INTEGER NOT NULL (FK -> products.id)
- color_id: INTEGER NOT NULL (FK -> colors.id)
- created_at: TEXT DEFAULT CURRENT_TIMESTAMP
```

### 2. Modificaciones en la Tabla `products`

**Eliminadas las columnas:**

- `size_id` (era relación uno-a-muchos)
- `color_id` (era relación uno-a-muchos)

### 3. Nuevos Enums en TABLES

- `PRODUCT_SIZES = "product_sizes"`
- `PRODUCT_COLORS = "product_colors"`

## Nuevos Métodos en la Clase Database

### Relaciones Producto-Talle

- `add_product_size_relationship(product_id, size_id)`
- `remove_product_size_relationship(product_id, size_id)`
- `get_sizes_by_product(product_id)`
- `get_products_by_size(size_id)`
- `check_product_size_relationship_exists(product_id, size_id)`

### Relaciones Producto-Color

- `add_product_color_relationship(product_id, color_id)`
- `remove_product_color_relationship(product_id, color_id)`
- `get_colors_by_product(product_id)`
- `get_products_by_color(color_id)`
- `check_product_color_relationship_exists(product_id, color_id)`

### Método de Soporte

- `get_join_records()` - Para realizar JOINs con filtros WHERE opcionales

## Nuevos Endpoints en product_router.py

### Gestión de Talles por Producto

- `POST /products/<product_id>/sizes` - Agregar un talle a un producto
- `DELETE /products/<product_id>/sizes/<size_id>` - Remover un talle de un producto
- `GET /products/<product_id>/sizes` - Obtener todos los talles de un producto
- `POST /products/<product_id>/sizes/bulk` - Agregar múltiples talles a un producto

### Gestión de Colores por Producto

- `POST /products/<product_id>/colors` - Agregar un color a un producto
- `DELETE /products/<product_id>/colors/<color_id>` - Remover un color de un producto
- `GET /products/<product_id>/colors` - Obtener todos los colores de un producto
- `POST /products/<product_id>/colors/bulk` - Agregar múltiples colores a un producto

### Consultas Inversas

- `GET /products/sizes/<size_id>/products` - Obtener todos los productos que tienen un talle específico
- `GET /products/colors/<color_id>/products` - Obtener todos los productos que tienen un color específico

### Información Completa

- `GET /products/<product_id>/details` - Obtener un producto con todos sus talles y colores

## Modificaciones en el Endpoint de Creación de Productos

El endpoint `POST /products/` ahora acepta:

```json
{
  "barcode": "string",
  "product_name": "string",
  "description": "string",
  "cost": 100.0,
  "sale_price": 150.0,
  "tax": 21.0,
  "discount": 0.0,
  "comments": "string",
  "user_id": 1,
  "brand_id": 1,
  "group_id": 1,
  "provider_id": 1,
  "size_ids": [1, 2, 3], // ← NUEVO: Array de IDs de talles
  "color_ids": [1, 2] // ← NUEVO: Array de IDs de colores
}
```

## Ejemplos de Uso

### 1. Crear un producto con múltiples talles y colores

```json
POST /products/
{
  "barcode": "ABC123",
  "product_name": "Camiseta Básica",
  "description": "Camiseta de algodón",
  "cost": 50.0,
  "sale_price": 80.0,
  "size_ids": [1, 2, 3, 4],  // XS, S, M, L
  "color_ids": [1, 2, 3]     // Rojo, Azul, Verde
}
```

### 2. Agregar un nuevo talle a un producto existente

```json
POST /products/123/sizes
{
  "size_id": 5  // XL
}
```

### 3. Obtener todos los talles de un producto

```http
GET /products/123/sizes
```

### 4. Obtener todos los productos que tienen el talle "M"

```http
GET /products/sizes/3/products
```

### 5. Obtener información completa de un producto

```http
GET /products/123/details
```

Respuesta:

```json
{
  "product": {
    "id": 123,
    "barcode": "ABC123",
    "product_name": "Camiseta Básica",
    ...
  },
  "sizes": [
    {"id": 1, "size_name": "XS", "description": "Extra Small"},
    {"id": 2, "size_name": "S", "description": "Small"},
    ...
  ],
  "colors": [
    {"id": 1, "color_name": "Rojo", "color_hex": "#FF0000"},
    {"id": 2, "color_name": "Azul", "color_hex": "#0000FF"},
    ...
  ]
}
```

## Migración de Datos Existentes

**⚠️ IMPORTANTE:** Si ya tienes productos con `size_id` y `color_id`, necesitarás migrar esos datos a las nuevas tablas de unión antes de usar el sistema.

Para probar la implementación, ejecuta:

```bash
python test_many_to_many.py
```

## Ventajas de esta Implementación

1. **Flexibilidad:** Un producto puede tener cualquier combinación de talles y colores
2. **Escalabilidad:** Fácil agregar/remover relaciones sin modificar el producto base
3. **Consultas Eficientes:** Índices automáticos en las claves foráneas
4. **Consistencia:** Las claves foráneas mantienen la integridad referencial
5. **Facilidad de Uso:** Endpoints intuitivos para gestionar las relaciones

El sistema ahora soporta completamente las relaciones muchos-a-muchos y está listo para uso en producción.
