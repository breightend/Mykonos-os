# Sistema de Inventario - Relación Muchos a Muchos

## Descripción

Se ha implementado un sistema de inventario que maneja la relación muchos a muchos entre productos y sucursales (storage). Esto permite saber cuántas prendas específicas hay en cada sucursal.

## Estructura de la Base de Datos

### Tabla `warehouse_stock` (Relación muchos a muchos)

- `id`: Identificador único
- `product_id`: ID del producto (FK a `products`)
- `branch_id`: ID de la sucursal (FK a `storage`)
- `quantity`: Cantidad del producto en esa sucursal
- `last_updated`: Fecha de última actualización

## Endpoints del Backend (`inventory_router.py`)

### 1. Obtener productos por sucursal

```
GET /api/inventory/products-by-storage
GET /api/inventory/products-by-storage?storage_id={id}
```

- Sin `storage_id`: Retorna todos los productos con su stock en todas las sucursales
- Con `storage_id`: Retorna productos de una sucursal específica

### 2. Lista de sucursales

```
GET /api/inventory/storage-list
```

Retorna todas las sucursales activas.

### 3. Stock de un producto específico

```
GET /api/inventory/product-stock/{product_id}
```

Retorna el stock de un producto en todas las sucursales.

### 4. Actualizar stock

```
PUT /api/inventory/update-stock
```

Cuerpo de la petición:

```json
{
  "product_id": 1,
  "storage_id": 2,
  "quantity": 50
}
```

### 5. Stock total de un producto

```
GET /api/inventory/total-stock/{product_id}
```

Retorna la suma total del stock de un producto en todas las sucursales.

## Frontend (`inventoryService.js`)

### Funciones disponibles:

1. **`getProductsByStorage(storageId)`**

   - Obtiene productos con stock por sucursal
   - Si no se pasa `storageId`, obtiene de todas las sucursales

2. **`getStorageList()`**

   - Obtiene lista de sucursales activas

3. **`getProductStockByStorage(productId)`**

   - Obtiene stock de un producto específico por sucursal

4. **`updateStock(productId, storageId, quantity)`**

   - Actualiza el stock de un producto en una sucursal

5. **`getTotalStock(productId)`**
   - Obtiene el stock total de un producto

## Componente Inventario (`inventario.jsx`)

### Nuevas características:

1. **Selector de sucursales**: Permite filtrar productos por sucursal específica
2. **Vista de stock por sucursal**: Muestra la cantidad en cada sucursal cuando no se filtra
3. **Indicadores visuales**: Badges de colores para mostrar stock disponible/agotado
4. **Carga dinámica**: Los datos se cargan desde la API real

### Estados manejados:

- `inventoryData`: Datos de productos con stock
- `storageList`: Lista de sucursales
- `selectedStorage`: Sucursal seleccionada para filtrar
- `loading`: Estado de carga
- `error`: Manejo de errores

## Uso del Sistema

### 1. Ejecutar el script de datos de ejemplo

```bash
cd src/backend
python sample_inventory_data.py
```

### 2. Iniciar el backend

```bash
cd src/backend
python main.py
```

### 3. El frontend mostrará:

- Tabla con todos los productos
- Cantidad total o por sucursal según el filtro seleccionado
- Información de stock por sucursal en columna adicional
- Funcionalidad de búsqueda y filtros

## Ventajas del Sistema

1. **Gestión multisucursal**: Permite manejar stock independiente por sucursal
2. **Flexibilidad**: Se puede consultar stock total o por sucursal específica
3. **Escalabilidad**: Fácil agregar nuevas sucursales sin afectar la estructura
4. **Trazabilidad**: Cada movimiento de stock está registrado con fecha
5. **Interfaz intuitiva**: Vista clara del stock disponible en cada ubicación

## Próximas Mejoras

1. **Transferencias entre sucursales**: Mover stock de una sucursal a otra
2. **Alertas de stock mínimo**: Notificaciones cuando el stock esté bajo
3. **Reportes de inventario**: Exportar datos de stock por período
4. **Historial de movimientos**: Ver el historial de cambios de stock
5. **Códigos de barras**: Integración con lectores de códigos de barras
