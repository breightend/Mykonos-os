# Guía de Uso: DaisyUI + Shadcn/UI Híbrido

## 🎨 DaisyUI (Para todo excepto gráficos)

### Uso General

- **Botones**: `btn`, `btn-primary`, `btn-secondary`, etc.
- **Cards**: `card`, `card-body`, `card-title`, etc.
- **Modales**: `modal`, `modal-box`, `modal-action`, etc.
- **Forms**: `input`, `select`, `textarea`, `form-control`, etc.
- **Navigation**: `navbar`, `drawer`, `menu`, etc.

### Ejemplo de Componente DaisyUI:

```jsx
function MyComponent() {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Título</h2>
        <p>Contenido de la tarjeta</p>
        <div className="card-actions justify-end">
          <button className="btn btn-primary">Acción</button>
        </div>
      </div>
    </div>
  )
}
```

## 📊 Shadcn/UI (Solo para gráficos)

### Uso para Gráficos

- **Importar**: `import { cn } from '../lib/utils'`
- **Usar función cn()**: Para combinar clases de gráficos
- **Variables CSS**: Usar las variables --primary, --secondary, etc.

### Ejemplo de Gráfico Shadcn/UI:

```jsx
import { cn } from '../lib/utils'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'

function ChartComponent({ className, ...props }) {
  return (
    <div className={cn('chart-container', className)} {...props}>
      <div className="chart-header">
        <h3 className="chart-title">Mi Gráfico</h3>
      </div>
      <div className="chart-content">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Bar dataKey="value" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

## 🎯 Reglas de Uso

### ✅ Para DaisyUI:

- Formularios, botones, navegación
- Modales, alerts, badges
- Layout general (grid, flex con clases DaisyUI)
- Temas con `data-theme="cupcake"` o `data-theme="night"`

### ✅ Para Shadcn/UI:

- Solo componentes de gráficos (Recharts)
- Usar función `cn()` para combinar clases
- Usar variables CSS `hsl(var(--primary))` etc.
- Clases `.chart-container`, `.chart-header`, etc.

### ❌ Evitar:

- No mezclar `btn` (DaisyUI) con componentes de gráficos
- No usar `cn()` en componentes DaisyUI normales
- No aplicar temas DaisyUI a gráficos Shadcn/UI

## 🚀 Cambio de Tema

```jsx
import { setTheme } from '../lib/utils'

// Cambiar tema
setTheme('cupcake') // Tema claro
setTheme('night') // Tema oscuro
```

## 📁 Estructura Recomendada

```
components/
├── ui/              # Solo componentes de gráficos (Shadcn/UI)
│   ├── chart.jsx
│   └── ...
├── common/          # Componentes DaisyUI
│   ├── Button.jsx
│   ├── Modal.jsx
│   └── ...
└── ...
```
