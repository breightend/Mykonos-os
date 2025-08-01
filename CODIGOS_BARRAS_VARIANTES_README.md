# 🏷️ Sistema de Códigos de Barras por Variante

## 📋 Descripción

Sistema completo que genera códigos de barras únicos para cada variante (combinación de talle + color) de un producto. Permite identificar exactamente qué prenda específica se está escaneando durante las ventas.

## 🎯 Funcionalidades

### ✅ Backend

- **Generación de códigos únicos**: Cada variante tiene un código único basado en producto + talle + color
- **Múltiples formatos**: SVG (vectorial) e imágenes (PNG)
- **Parseo de códigos**: Extrae información del producto desde el código escaneado
- **API REST completa**: Endpoints para generar y manejar códigos

### ✅ Frontend

- **Integración automática**: Genera códigos al crear productos nuevos
- **Visualización en modales**: Muestra códigos de barras en detalles del producto
- **Servicio reutilizable**: Clase JavaScript para manejar códigos de barras

### ✅ Base de Datos

- **Campo de código por variante**: Cada registro de stock tiene su código único
- **Migración automática**: Script para actualizar bases de datos existentes

## 🏗️ Arquitectura

### Formato de Código de Barras

```
VAR + PRODUCT_ID(4) + SIZE_ID(3) + COLOR_ID(3)
Ejemplo: VAR0001002003
- VAR: Prefijo para variantes
- 0001: Producto ID 1 (con padding)
- 002: Talle ID 2 (con padding)
- 003: Color ID 3 (con padding)
```

### Estructura de Base de Datos

```sql
-- Campo agregado a warehouse_stock_variants
ALTER TABLE warehouse_stock_variants
ADD COLUMN variant_barcode TEXT UNIQUE;
```

## 📁 Archivos Creados/Modificados

### Backend

```
src/backend/
├── services/
│   └── barcode_service.py          # Servicio principal de códigos de barras
├── routes/
│   └── barcode_router.py           # API endpoints
├── database/
│   ├── database.py                 # Estructura actualizada (campo variant_barcode)
│   ├── migrate_add_variant_barcodes_v2.py  # Script de migración
│   └── mykonos.db                  # BD actualizada
├── test_barcode.py                 # Test de librerías
├── test_barcode_frontend.html      # Test web básico
├── test_variant_barcodes.html      # Test completo del sistema
└── main.py                         # Router registrado
```

### Frontend

```
src/renderer/src/
├── services/
│   └── barcodeService.js           # Servicio JavaScript
├── creats/
│   └── nuevoProducto.jsx           # Integración en creación de productos
└── modals/ProductDetailModal/
    └── ProductDetailModal.jsx      # Visualización de códigos
```

## 🚀 Uso

### 1. Crear Producto con Variantes (Frontend)

```javascript
// Al enviar formulario de nuevo producto
const barcodeService = new BarcodeService()

// Después de crear el producto
if (response.product_id && productData.stock_variants.length > 0) {
  const variants = productData.stock_variants.map((variant) => ({
    size_id: variant.size_id,
    color_id: variant.color_id,
    quantity: variant.quantity
  }))

  const result = await barcodeService.generateVariantBarcodes(response.product_id, variants)
}
```

### 2. Generar Códigos (Backend)

```python
from services.barcode_service import BarcodeService

barcode_service = BarcodeService()

# Generar código para variante específica
code = barcode_service.generate_variant_barcode(
    product_id=1,
    size_id=2,
    color_id=3
)
# Resultado: "VAR0001002003"

# Generar SVG
svg = barcode_service.generate_barcode_svg(code)
```

### 3. Parsear Códigos Escaneados

```python
# Parsear código escaneado
parsed = barcode_service.parse_variant_barcode("VAR0001002003")
# Resultado: {
#   'product_id': 1,
#   'size_id': 2,
#   'color_id': 3
# }
```

## 🌐 API Endpoints

### Códigos de Barras Generales

- `POST /api/barcode/generate` - Generar código personalizado
- `GET /api/barcode/test` - Probar servicio

### Códigos de Productos

- `GET /api/barcode/generate-product/<id>` - Código general del producto

### Códigos de Variantes

- `POST /api/barcode/generate-variants` - Códigos para múltiples variantes
- `POST /api/barcode/generate-variant` - Código para variante específica
- `GET /api/barcode/parse-variant/<code>` - Parsear código de variante

## 📊 Flujo de Trabajo

### Creación de Producto

1. Usuario llena formulario con talles y colores
2. Se crea el producto en la base de datos
3. **NUEVO**: Se generan códigos únicos para cada variante
4. Códigos se almacenan en `warehouse_stock_variants.variant_barcode`

### Proceso de Venta

1. Se escanea código de barras de la prenda específica
2. Sistema parsea el código para obtener producto + talle + color
3. Se localiza la variante exacta en inventario
4. Se descuenta stock de esa variante específica

### Visualización

1. En detalles del producto se muestran todos los códigos por variante
2. Cada código incluye información de talle, color y sucursal
3. Códigos se pueden visualizar como SVG o descargar

## 🧪 Testing

### 1. Ejecutar Servidor

```bash
cd src/backend
python main.py
```

### 2. Probar API

```bash
# Test básico
curl http://localhost:5000/api/barcode/test

# Generar variantes
curl -X POST http://localhost:5000/api/barcode/generate-variants \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1, "variants": [{"size_id": 1, "color_id": 2}]}'
```

### 3. Test Web

Abrir en navegador:

- `test_barcode_frontend.html` - Test básico
- `test_variant_barcodes.html` - Test completo del sistema

## 🔧 Configuración

### Dependencias Python

```bash
pip install python-barcode Pillow
```

### Variables de Entorno

```python
# En barcodeService.js
const API_BASE = 'http://localhost:5000/api/barcode'
```

## 🐛 Troubleshooting

### Error: "Cannot add UNIQUE column"

- **Causa**: SQLite no permite agregar columnas UNIQUE a tablas con datos
- **Solución**: Usar `migrate_add_variant_barcodes_v2.py` que recrea la tabla

### Error: Import "barcode" could not be resolved

- **Causa**: Librerías no instaladas en el entorno correcto
- **Solución**: `pip install python-barcode Pillow` en el entorno de Python usado

### Códigos duplicados

- **Causa**: Múltiples variantes con mismos IDs
- **Solución**: El sistema agrega sufijos automáticamente para garantizar unicidad

## 📈 Beneficios

### Para el Negocio

- ✅ **Control exacto de inventario**: Saber exactamente qué prenda se vendió
- ✅ **Reducción de errores**: No más confusiones entre talles/colores
- ✅ **Trazabilidad completa**: Seguimiento detallado de cada variante
- ✅ **Optimización de stock**: Análisis preciso de qué variantes se venden más

### Para el Desarrollo

- ✅ **Arquitectura escalable**: Fácil extensión a otros tipos de variantes
- ✅ **API RESTful**: Integración sencilla con otros sistemas
- ✅ **Códigos legibles**: Formato estructurado y parseable
- ✅ **SVG vectorial**: Códigos nítidos en cualquier tamaño

## 🔮 Futuras Mejoras

1. **Códigos QR**: Soporte para códigos QR con más información
2. **Impresión directa**: Integración con impresoras de etiquetas
3. **Lectura móvil**: App móvil para escanear códigos
4. **Analytics**: Dashboard de análisis de ventas por variante
5. **Integración ERP**: Conexión con sistemas externos

---

**Implementado por**: Sistema Mykonos-OS  
**Fecha**: Agosto 2025  
**Versión**: 1.0.0
