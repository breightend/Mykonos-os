import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ComposedChart,
  ReferenceLine,
  Brush
} from 'recharts'

// Enhanced color palette for charts
const COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7c7c',
  '#8dd1e1',
  '#d084d0',
  '#ff8042',
  '#00c49f',
  '#ffbb28',
  '#ff0080',
  '#8a2be2',
  '#00ced1'
]

// Gradient definitions for modern charts
const GRADIENTS = {
  sales: 'url(#salesGradient)',
  revenue: 'url(#revenueGradient)',
  profit: 'url(#profitGradient)'
}

// Currency formatter
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(value)
}

// Percentage formatter
const formatPercentage = (value) => {
  return `${value?.toFixed(1)}%`
}

// Sales Chart Component
export const SalesChart = ({ data = [] }) => {
  const chartData = data.map((item) => ({
    name: item.month || item.name,
    ventas: item.sales_count || item.total_sales || item.sales || 0,
    cantidad: item.products_sold || item.total_quantity || item.quantity || 0
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip
          formatter={(value, name) => [
            name === 'ventas' ? formatCurrency(value) : value,
            name === 'ventas' ? 'Ventas' : 'Cantidad'
          ]}
        />
        <Legend />
        <Line type="monotone" dataKey="ventas" stroke="#8884d8" strokeWidth={2} name="Ventas" />
        <Line type="monotone" dataKey="cantidad" stroke="#82ca9d" strokeWidth={2} name="Cantidad" />
      </LineChart>
    </ResponsiveContainer>
  )
}

// Revenue Chart Component
export const RevenueChart = ({ data = [] }) => {
  const chartData = data.map((item) => ({
    name: item.month || item.name,
    ingresos: item.total_revenue || item.revenue || 0
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value) => [formatCurrency(value), 'Ingresos']} />
        <Area
          type="monotone"
          dataKey="ingresos"
          stroke="#8884d8"
          fill="#8884d8"
          fillOpacity={0.6}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// Category Pie Chart Component
export const CategoryPieChart = ({ data = [] }) => {
  const chartData = data.map((item, index) => ({
    name: item.category_name || item.name,
    value: item.total_sales || item.sales || 0,
    color: COLORS[index % COLORS.length]
  }))

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded border border-base-300 bg-base-100 p-2 shadow">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-primary">Ventas: {formatCurrency(payload[0].value)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Top Products Chart Component
export const TopProductsChart = ({ data = [] }) => {
  const chartData = data.slice(0, 10).map((item) => ({
    name: item.product_name?.substring(0, 20) + '...' || item.name,
    ventas: item.total_revenue || item.revenue || 0,
    cantidad: item.total_quantity || item.quantity || 0
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} layout="horizontal">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={100} />
        <Tooltip
          formatter={(value, name) => [
            name === 'ventas' ? formatCurrency(value) : value,
            name === 'ventas' ? 'Ventas' : 'Cantidad'
          ]}
        />
        <Legend />
        <Bar dataKey="ventas" fill="#8884d8" name="Ventas" />
        <Bar dataKey="cantidad" fill="#82ca9d" name="Cantidad" />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Profit Chart Component
export const ProfitChart = ({ data = [] }) => {
  const chartData = data.map((item) => ({
    name: item.month || item.name,
    ingresos: item.revenue || 0,
    costos: item.costs || 0,
    ganancia: (item.revenue || 0) - (item.costs || 0),
    margen: item.revenue ? ((item.revenue - item.costs) / item.revenue) * 100 : 0
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip
          formatter={(value, name) => {
            if (name === 'margen') return [formatPercentage(value), 'Margen']
            return [formatCurrency(value), name]
          }}
        />
        <Legend />
        <Bar yAxisId="left" dataKey="ingresos" fill="#8884d8" name="Ingresos" />
        <Bar yAxisId="left" dataKey="costos" fill="#ff7c7c" name="Costos" />
        <Line yAxisId="right" type="monotone" dataKey="margen" stroke="#82ca9d" name="Margen %" />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

// Sales vs Purchases Comparison Chart
export const SalesVsPurchasesChart = ({ data = [] }) => {
  const chartData = data.map((item) => ({
    name: item.month || item.name,
    ventas: item.sales || 0,
    compras: item.purchases || 0
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value) => [formatCurrency(value)]} />
        <Legend />
        <Bar dataKey="ventas" fill="#8884d8" name="Ventas" />
        <Bar dataKey="compras" fill="#ff7c7c" name="Compras" />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Loading Chart Component
export const LoadingChart = () => {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="loading loading-spinner loading-lg text-primary"></div>
    </div>
  )
}

// Error Chart Component
export const ErrorChart = ({ error, onRetry }) => {
  return (
    <div className="flex h-full flex-col items-center justify-center space-y-4">
      <div className="text-center text-error">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mx-auto mb-2 h-12 w-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-sm">{error || 'Error al cargar datos'}</p>
      </div>
      {onRetry && (
        <button className="btn btn-error btn-outline btn-sm" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  )
}

// Interactive Area Chart Component - For the big yearly chart
export const InteractiveAreaChart = ({ data = [], title = 'Ventas del Año' }) => {
  const chartData = data.map((item) => ({
    name: item.month || item.name,
    ventas: item.sales_count || item.total_sales || item.sales || 0,
    ingresos: item.total_revenue || item.revenue || 0,
    productos: item.products_sold || item.total_quantity || item.quantity || 0
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <defs>
          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#f9fafb'
          }}
          formatter={(value, name) => [
            name === 'ingresos' ? formatCurrency(value) : value,
            name === 'ventas' ? 'Ventas' : name === 'ingresos' ? 'Ingresos' : 'Productos'
          ]}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="ingresos"
          stackId="1"
          stroke="#82ca9d"
          fill="url(#revenueGradient)"
          strokeWidth={2}
          name="Ingresos"
        />
        <Area
          type="monotone"
          dataKey="ventas"
          stackId="2"
          stroke="#8884d8"
          fill="url(#salesGradient)"
          strokeWidth={2}
          name="Ventas"
        />
        <Brush dataKey="name" height={30} stroke="#8884d8" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// Modern Bar Chart Component
export const ModernBarChart = ({ data = [], title = 'Ventas por Categoría' }) => {
  const chartData = data.map((item) => ({
    name: item.category_name || item.month || item.name,
    ventas: item.total_sales || item.sales_count || item.sales || 0,
    ingresos: item.total_revenue || item.revenue || 0
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#f9fafb'
          }}
          formatter={(value, name) => [
            name === 'ingresos' ? formatCurrency(value) : value,
            name === 'ventas' ? 'Ventas' : 'Ingresos'
          ]}
        />
        <Legend />
        <Bar dataKey="ventas" fill="#8884d8" radius={[4, 4, 0, 0]} name="Ventas" />
        <Bar dataKey="ingresos" fill="#82ca9d" radius={[4, 4, 0, 0]} name="Ingresos" />
      </BarChart>
    </ResponsiveContainer>
  )
}

// Enhanced Pie Chart with animations
export const EnhancedPieChart = ({ data = [], title = 'Distribución' }) => {
  const chartData = data.map((item, index) => ({
    name: item.category_name || item.name,
    value: item.total_sales || item.sales || item.value || 0,
    color: COLORS[index % COLORS.length],
    percentage: 0 // Will be calculated
  }))

  // Calculate percentages
  const total = chartData.reduce((sum, item) => sum + item.value, 0)
  chartData.forEach((item) => {
    item.percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
  })

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-lg border border-gray-600 bg-gray-800 p-3 shadow-lg">
          <p className="font-semibold text-white">{data.name}</p>
          <p className="text-blue-300">
            Valor: {typeof data.value === 'number' ? formatCurrency(data.value) : data.value}
          </p>
          <p className="text-green-300">Porcentaje: {data.percentage}%</p>
        </div>
      )
    }
    return null
  }

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
    if (percentage < 5) return null // Don't show labels for small slices

    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${percentage}%`}
      </text>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
          animationBegin={0}
          animationDuration={800}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} stroke="#1f2937" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value, entry) => (
            <span style={{ color: entry.color, fontWeight: 'bold' }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Combined Chart for comparing multiple metrics
export const CombinedMetricsChart = ({ data = [] }) => {
  const chartData = data.map((item) => ({
    name: item.month || item.name,
    ventas: item.sales_count || item.total_sales || item.sales || 0,
    ingresos: (item.total_revenue || item.revenue || 0) / 1000, // Scale down for visibility
    productos: item.products_sold || item.total_quantity || item.quantity || 0
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#f9fafb'
          }}
          formatter={(value, name) => [
            name === 'ingresos' ? formatCurrency(value * 1000) : value,
            name === 'ventas' ? 'Ventas' : name === 'ingresos' ? 'Ingresos (K)' : 'Productos'
          ]}
        />
        <Legend />
        <Bar yAxisId="left" dataKey="ventas" fill="#8884d8" name="Ventas" radius={[2, 2, 0, 0]} />
        <Bar
          yAxisId="left"
          dataKey="productos"
          fill="#82ca9d"
          name="Productos"
          radius={[2, 2, 0, 0]}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="ingresos"
          stroke="#ffc658"
          strokeWidth={3}
          name="Ingresos (K)"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
