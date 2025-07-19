# Implementación de Vista Jerárquica de Grupos de Productos

## Resumen de Cambios

Se ha implementado una vista jerárquica de grupos de productos que permite ver la estructura padre-hijo de los grupos y seleccionar basándose en esa vista organizada.

## Nuevas Funcionalidades

### 1. **Endpoint de Árbol Jerárquico (`product_router.py`)**

- **Nuevo endpoint**: `GET /api/product/familyProducts/tree`
- **Descripción**: Devuelve los grupos en estructura de árbol jerárquico
- **Algoritmo**: Función recursiva `build_tree()` que organiza grupos planos en estructura de árbol
- **Respuesta**: JSON con estructura anidada donde cada grupo incluye sus `children`

```python
def build_tree(items, parent_id=None):
    tree = []
    for item in items:
        if item.get('parent_group_id') == parent_id:
            children = build_tree(items, item['id'])
            if children:
                item['children'] = children
            tree.append(item)
    return tree
```

### 2. **Servicio Frontend Actualizado (`familyService.js`)**

- **Nueva función**: `fetchFamilyProductsTree()`
- **Endpoint**: Consume la nueva API de árbol jerárquico
- **Retorna**: Estructura de datos organizada en árbol

### 3. **Componente de Selector Jerárquico (`GroupTreeSelector.jsx`)**

#### Características:

- **Vista de árbol expandible**: Nodos padre/hijo con iconos de carpeta
- **Búsqueda integrada**: Filtro en tiempo real por nombre de grupo
- **Navegación visual**: Indentación por niveles, iconos diferenciados
- **Selección intuitiva**: Click para seleccionar, highlight visual del seleccionado
- **Badges informativos**: Marcadores para grupos raíz
- **Dropdown controlado**: Se cierra automáticamente al seleccionar

#### Funcionalidades técnicas:

- **Algoritmo de búsqueda recursiva**: `filterGroups()` mantiene jerarquía en resultados
- **Búsqueda por ID recursiva**: `findGroupById()` para encontrar grupos seleccionados
- **Componente anidado**: `GroupTreeNode` para renderizado recursivo del árbol
- **Estado de expansión**: Control individual de cada nodo
- **Overlay de cierre**: Click fuera para cerrar el dropdown

### 4. **Modal de Vista Previa (`GroupTreePreviewModal.jsx`)**

#### Características:

- **Vista completa del árbol**: Muestra toda la estructura de grupos
- **Expansión/colapso**: Control individual de cada nodo
- **Información detallada**: ID de grupo, nombre, tipo (raíz/hijo)
- **Diseño responsive**: Modal con scroll y tamaño adaptativo
- **Estadísticas**: Contador total de grupos

### 5. **Integración en Formulario de Producto (`nuevoProducto.jsx`)**

#### Cambios realizados:

- **Reemplazo del select tradicional**: Por el nuevo `GroupTreeSelector`
- **Botón de vista previa**: Acceso rápido al modal de estructura completa
- **Carga de datos en árbol**: Nuevo estado `grupoTree` y llamada a `fetchFamilyProductsTree()`
- **Manejo de selección**: Función `handleGroupSelect()` para procesar la selección
- **Validación actualizada**: Mensajes de error adaptados a "grupos" en lugar de "tipos"

## Estructura de Datos

### Formato de respuesta del endpoint `/tree`:

```json
[
  {
    "id": 1,
    "group_name": "Ropa",
    "parent_group_id": null,
    "marked_as_root": 1,
    "children": [
      {
        "id": 2,
        "group_name": "Remeras",
        "parent_group_id": 1,
        "marked_as_root": 0,
        "children": [
          {
            "id": 3,
            "group_name": "Remeras Deportivas",
            "parent_group_id": 2,
            "marked_as_root": 0
          }
        ]
      }
    ]
  }
]
```

## Beneficios de la Implementación

### 1. **Organización Mejorada**

- Visualización clara de jerarquías de productos
- Navegación intuitiva por categorías y subcategorías
- Comprensión rápida de la estructura organizacional

### 2. **Experiencia de Usuario Mejorada**

- Interfaz visual más atractiva que un select tradicional
- Búsqueda integrada para grupos numerosos
- Vista previa completa de la estructura
- Feedback visual claro del elemento seleccionado

### 3. **Escalabilidad**

- Soporte para estructuras de grupos complejas
- Rendimiento optimizado con carga única de datos
- Expansión/colapso individual para grandes árboles

### 4. **Mantenibilidad**

- Código modularizado en componentes reutilizables
- Separación clara de responsabilidades
- API backend extensible para futuros requerimientos

## Uso

### Para el usuario final:

1. **Selección de grupo**: Click en el selector → navegar árbol → seleccionar grupo
2. **Búsqueda**: Escribir en el campo de búsqueda para filtrar grupos
3. **Vista completa**: Click en botón de vista previa para ver toda la estructura
4. **Navegación**: Expandir/colapsar nodos según necesidad

### Para desarrolladores:

1. **Reutilización**: `GroupTreeSelector` es reutilizable en otros formularios
2. **Personalización**: Props configurables para diferentes contextos
3. **Extensión**: Fácil agregar nuevas funcionalidades al árbol
4. **Debugging**: Modal de vista previa útil para verificar estructura de datos

## Archivos Modificados

### Backend:

- `src/backend/routes/product_router.py` - Nuevo endpoint `/tree`

### Frontend:

- `src/renderer/src/services/products/familyService.js` - Nueva función de API
- `src/renderer/src/components/GroupTreeSelector.jsx` - Componente principal (NUEVO)
- `src/renderer/src/components/GroupTreePreviewModal.jsx` - Modal de vista previa (NUEVO)
- `src/renderer/src/creats/nuevoProducto.jsx` - Integración en formulario

## Consideraciones Técnicas

### Performance:

- **Carga única**: Los datos del árbol se cargan una vez al inicializar
- **Renderizado eficiente**: Solo se renderizan nodos visibles (expandidos)
- **Búsqueda optimizada**: Filtrado en memoria sin llamadas adicionales al backend

### Accesibilidad:

- **Navegación por teclado**: Soporte para Tab y Enter
- **Tooltips informativos**: Ayuda contextual en botones
- **Contraste visual**: Colores diferenciados para estados

### Compatibilidad:

- **DaisyUI/Tailwind**: Uso de clases estándar del framework
- **Iconos Lucide**: Consistencia con el resto de la aplicación
- **Responsive**: Adaptable a diferentes tamaños de pantalla

Esta implementación proporciona una experiencia significativamente mejorada para la selección de grupos de productos, manteniendo la funcionalidad existente mientras agrega capacidades avanzadas de visualización y navegación jerárquica.
