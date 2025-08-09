import { cn } from '../../../lib/utils'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'

// Datos de ejemplo para el gráfico con más variedad
const salesData = [
  { month: 'Ene', sales: 4000, products: 240, returns: 120, exchanges: 80 },
  { month: 'Feb', sales: 3000, products: 139, returns: 95, exchanges: 60 },
  { month: 'Mar', sales: 2000, products: 980, returns: 180, exchanges: 120 },
  { month: 'Abr', sales: 2780, products: 390, returns: 140, exchanges: 95 },
  { month: 'May', sales: 1890, products: 480, returns: 110, exchanges: 75 },
  { month: 'Jun', sales: 2390, products: 380, returns: 125, exchanges: 85 },
  { month: 'Jul', sales: 3200, products: 420, returns: 130, exchanges: 90 },
  { month: 'Ago', sales: 2800, products: 350, returns: 115, exchanges: 70 }
]

const categoryData = [
  { name: 'Ropa', value: 400, color: '#ff8c42' }, // Naranja vibrante - primary
  { name: 'Calzado', value: 300, color: '#6366f1' }, // Índigo moderno - secondary
  { name: 'Accesorios', value: 200, color: '#06b6d4' }, // Cian elegante - accent
  { name: 'Otros', value: 180, color: '#10b981' }, // Verde esmeralda
  { name: 'Joyería', value: 150, color: '#f59e0b' }, // Ámbar dorado
  { name: 'Bolsos', value: 120, color: '#ef4444' }, // Rojo coral
  { name: 'Perfumes', value: 100, color: '#8b5cf6' }, // Púrpura vibrante
  { name: 'Deportivo', value: 80, color: '#0ea5e9' } // Azul cielo
]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">{label}</span>
            {payload.map((entry, index) => (
              <span key={index} className="font-bold text-muted-foreground">
                {entry.value}
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }
  return null
}

export function SalesChart({ className }) {
  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={salesData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="month"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ProductsLineChart({ className }) {
  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={salesData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="month"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="products"
            stroke="#ff8c42"
            strokeWidth={3}
            name="Productos Vendidos"
            dot={{ fill: '#ff8c42', strokeWidth: 2, r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="returns"
            stroke="#ef4444"
            strokeWidth={2}
            name="Devoluciones"
            dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
            strokeDasharray="5 5"
          />
          <Line
            type="monotone"
            dataKey="exchanges"
            stroke="#10b981"
            strokeWidth={2}
            name="Intercambios"
            dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Nuevo gráfico de barras múltiples
export function MultiBarChart({ className }) {
  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={salesData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="month"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="products" fill="#ff8c42" radius={[2, 2, 0, 0]} name="Productos" />
          <Bar dataKey="returns" fill="#ef4444" radius={[2, 2, 0, 0]} name="Devoluciones" />
          <Bar dataKey="exchanges" fill="#10b981" radius={[2, 2, 0, 0]} name="Intercambios" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CategoryPieChart({ className }) {
  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={categoryData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {categoryData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
