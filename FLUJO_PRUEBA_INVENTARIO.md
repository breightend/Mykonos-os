# 🧪 Guía de Prueba: Flujo Completo de Movimientos de Inventario

## 📋 Flujo Implementado

### 1. **Sucursal Origen** - Crear y Gestionar Envío

#### ✅ Crear Envío

1. Ve a **Inventario** → **Movimiento de Inventario**
2. Haz clic en **"Enviar Productos"**
3. Selecciona productos/variantes (por código de barras o lista)
4. Selecciona sucursal destino
5. **Ejecutar Movimiento**

**Resultado:** Estado = `empacado`, stock se quita del origen pero NO se agrega al destino

#### ✅ Gestionar Estados (desde "Envíos Realizados")

```
empacado → 🚚 En tránsito     (producto en camino)
empacado → ❌ Cancelar        (devuelve stock al origen)

en_transito → ✅ Entregado    (producto llegó al destino)
en_transito → ❌ Cancelar     (devuelve stock al origen)

cancelado → 🔄 Retomar        (reactiva el envío)

retomado → 🚚 En tránsito     (vuelve a poner en camino)
retomado → ❌ Cancelar        (cancela definitivamente)
```

### 2. **Sucursal Destino** - Confirmar Recepción

#### ✅ Ver Envíos Pendientes

1. Ve a **Inventario** → **Movimiento de Inventario**
2. Haz clic en **"Envíos Pendientes"**
3. Ve envíos que vienen hacia tu sucursal

#### ✅ Confirmar Recepción

- **✅ Botón Verde:** Marcar como **"recibido"** → Stock aparece en tu inventario
- **❌ Botón Rojo:** Marcar como **"no recibido"** → Stock no se transfiere

## 🎯 Prueba Paso a Paso

### Paso 1: Verificar Stock Inicial

1. Ve a **Inventario** → **Ver Productos**
2. Anota el stock de un producto en Sucursal A y Sucursal B

### Paso 2: Crear Envío (desde Sucursal A)

1. **Inventario** → **Movimiento de Inventario** → **Enviar Productos**
2. Selecciona 2 unidades de un producto
3. Destino: Sucursal B
4. **Ejecutar Movimiento**

**Verifica:**

- Stock en Sucursal A se redujo en 2
- Stock en Sucursal B NO cambió aún
- Estado del envío = `empacado`

### Paso 3: Cambiar Estado (desde Sucursal A)

1. **Envíos Realizados** → Busca tu envío
2. Haz clic **🚚 En tránsito**

**Verifica:** Estado cambió a `en_transito`

### Paso 4: Confirmar Recepción (desde Sucursal B)

1. Cambia a Sucursal B (si tienes selector de sucursal)
2. **Envíos Pendientes** → Busca el envío
3. Haz clic **✅ Botón Verde** (Recibido)

**Verifica:**

- Stock en Sucursal B aumentó en 2
- Estado del envío = `recibido`
- Envío desaparece de pendientes

## 🧪 Prueba de Cancelación

### Cancelar Envío (desde Sucursal A)

1. Crea un envío (Paso 2)
2. En **Envíos Realizados** → **❌ Cancelar**

**Verifica:**

- Stock vuelve a Sucursal A
- Estado = `cancelado`
- Aparece botón **🔄 Retomar**

### Retomar Envío

1. Haz clic **🔄 Retomar**
2. Estado cambia a `retomado`
3. Aparecen botones **🚚 En tránsito** y **❌ Cancelar**

## 🚨 Estados de los Envíos

| Estado        | Color       | Descripción            | Acciones Disponibles              |
| ------------- | ----------- | ---------------------- | --------------------------------- |
| `empacado`    | 🔵 Azul     | Listo para enviar      | 🚚 En tránsito, ❌ Cancelar       |
| `en_transito` | 🟡 Amarillo | En camino              | ✅ Entregado, ❌ Cancelar         |
| `entregado`   | 🟢 Verde    | Llegó al destino       | (Espera confirmación del destino) |
| `recibido`    | 🟢 Verde    | Confirmado por destino | ✅ Completado                     |
| `cancelado`   | 🔴 Rojo     | Cancelado              | 🔄 Retomar                        |
| `retomado`    | ⚪ Gris     | Reactivado             | 🚚 En tránsito, ❌ Cancelar       |

## 💡 Notas Importantes

- **Solo cuando se marca "recibido"** el stock se transfiere al destino
- **Cancelar** siempre devuelve el stock al origen
- **El stock "desaparece" temporalmente** hasta la confirmación
- **Cada sucursal ve diferentes opciones** según su rol (origen/destino)

---

¡Ahora tienes un sistema completo de transferencias entre sucursales con confirmación! 🎉
