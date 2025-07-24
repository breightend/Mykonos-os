# 🧮 Funcionalidad de Cálculo Automático de Precios

## 📋 Descripción

Se implementó una nueva funcionalidad que permite calcular automáticamente el precio de venta a partir del precio de costo, con configuraciones personalizables desde el panel de Settings.

## ✨ Características Implementadas

### 🎛️ Configuraciones Disponibles

1. **Habilitar/Deshabilitar Cálculo Automático**

   - Toggle para activar o desactivar el cálculo automático
   - Cuando está deshabilitado, funciona como antes (manual)

2. **Tipo de Margen**

   - **Porcentaje (%)**: Calcula un porcentaje de ganancia sobre el costo
   - **Valor Fijo ($)**: Suma un valor fijo al costo

3. **Configuración de Ganancia**
   - Para porcentaje: valor numérico (ej: 50 = 50% de ganancia)
   - Para valor fijo: cantidad en pesos (ej: 100.00)

### 💡 Ejemplos de Cálculo

#### Modo Porcentaje

- **Costo**: $100
- **Ganancia**: 50%
- **Precio de Venta**: $150 (100 + 50% de 100)

#### Modo Valor Fijo

- **Costo**: $100
- **Ganancia Fija**: $50
- **Precio de Venta**: $150 (100 + 50)

## 🖥️ Interfaz de Usuario

### Panel de Configuraciones

Accesible desde el ícono de engranaje ⚙️ en la aplicación:

1. **Sección de Tema**: Control del modo claro/oscuro
2. **Sección de Cálculo de Precios**:
   - Toggle para habilitar/deshabilitar
   - Selector de tipo de margen
   - Input para valor de ganancia
   - Vista previa del cálculo en tiempo real

### Formulario de Nuevo Producto

Cuando el cálculo automático está habilitado globalmente:

- 🎛️ **Toggle Automático/Manual**: Permite elegir el modo para cada producto
- ✅ **Modo Automático**:
  - Indicador visual "📊 Cálculo automático activo"
  - Campo de precio de venta con fondo verde claro y deshabilitado
  - Cálculo automático al escribir el precio de costo
  - Información de la configuración actual de ganancia
- ✏️ **Modo Manual**:
  - Indicador visual "✏️ Modo manual activo"
  - Campo de precio de venta habilitado para edición manual
  - Placeholder "0.00" normal
- 🔄 **Intercambiable**: Se puede cambiar entre modos en cualquier momento
- 💾 **Persistente**: El modo elegido se mantiene durante la sesión

## 🔧 Archivos Modificados/Creados

### Nuevos Archivos

- `src/renderer/src/contexts/settingsContext.jsx` - Contexto para manejar configuraciones

### Archivos Modificados

- `src/renderer/src/main.jsx` - Agregado SettingsProvider
- `src/renderer/src/componentes especificos/settings.jsx` - Panel de configuraciones ampliado
- `src/renderer/src/creats/nuevoProducto.jsx` - Integración del cálculo automático

## 📱 Uso de la Funcionalidad

### Para Configurar:

1. Hacer clic en el ícono de configuraciones (⚙️)
2. En la sección "Cálculo automático de precios":
   - Activar el toggle "Habilitar cálculo automático"
   - Seleccionar tipo de margen (Porcentaje o Valor fijo)
   - Configurar el valor de ganancia deseado
   - Ver la vista previa del cálculo
3. Hacer clic en "Guardar y Cerrar"

### Para Usar en Nuevo Producto:

1. Ir a "Nuevo Producto"
2. Completar los campos normalmente
3. **Configuración por producto**:
   - Si el cálculo automático está habilitado globalmente, aparecerá un toggle para elegir entre automático/manual
   - **Automático**: Al ingresar el precio de costo, el precio de venta se calcula automáticamente
   - **Manual**: El usuario debe ingresar manualmente el precio de venta
4. El precio calculado automáticamente se puede cambiar a manual en cualquier momento
5. El campo se deshabilita automáticamente cuando está en modo automático y hay un costo válido

## 🔍 Persistencia de Datos

- Las configuraciones se guardan en `localStorage` con la clave `appSettings`
- Se mantienen entre sesiones de la aplicación
- Configuración por defecto: 50% de ganancia, modo porcentaje

## 🎯 Beneficios

- ⚡ **Rapidez**: Cálculo instantáneo de precios cuando se necesita
- 🎯 **Consistencia**: Misma metodología para todos los productos (cuando se usa automático)
- 🔧 **Flexibilidad**: Configurable globalmente + elección por producto
- 💡 **Transparencia**: Vista previa y indicadores visuales claros
- 📱 **Usabilidad**: Interfaz intuitiva con toggle fácil de usar
- 🎛️ **Control Total**: El usuario decide producto por producto si usar automático o manual
- 🔄 **Adaptabilidad**: Se puede cambiar entre modos sin perder datos

## 🚀 Extensiones Futuras

- Configuraciones por categoría de producto
- Múltiples niveles de precios
- Descuentos automáticos por volumen
- Integración con APIs de precios externos
