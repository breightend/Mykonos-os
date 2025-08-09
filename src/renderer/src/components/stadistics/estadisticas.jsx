import MenuVertical from '../../componentes especificos/menuVertical'
import Navbar from '../../componentes especificos/navbar'
import { SalesChart, ProductsLineChart, CategoryPieChart, MultiBarChart } from '../ui/charts'
import { BarChart3, TrendingUp, PieChart, DollarSign } from 'lucide-react'

export default function Estadisticas() {
  return (
    <div data-page="estadisticas">
      <Navbar />
      <div className="flex">
        <MenuVertical currentPath="/estadisticas" />
        
        <div className="flex-1 p-6 bg-base-200 min-h-screen">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-primary mb-2">📊 Estadísticas</h1>
              <p className="text-base-content/70">Panel de análisis de ventas y productos</p>
            </div>

            {/* Indicador de que Shadcn UI funciona */}
            <div className="alert alert-success mb-6 flex items-center gap-3">
              <TrendingUp className="h-5 w-5" />
              <span className="font-semibold">✅ Gráficos Shadcn/UI funcionando correctamente!</span>
            </div>

            {/* Stats Cards usando DaisyUI con estilos forzados */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Stat 1 - Ventas del Mes */}
              <div className="stat bg-white dark:bg-gray-800 shadow-lg rounded-box p-6 border border-gray-100 dark:border-gray-700">
                <div className="stat-figure text-orange-500">
                  <DollarSign className="w-8 h-8" />
                </div>
                <div className="stat-title text-gray-600 dark:text-gray-400 font-medium text-sm mb-1">
                  Ventas del Mes
                </div>
                <div className="stat-value text-orange-500 text-3xl font-bold mb-1">
                  $25.6K
                </div>
                <div className="stat-desc text-green-600 text-sm font-medium">
                  ↗︎ 21% más que el mes pasado
                </div>
              </div>

              {/* Stat 2 - Productos Vendidos */}
              <div className="stat bg-white dark:bg-gray-800 shadow-lg rounded-box p-6 border border-gray-100 dark:border-gray-700">
                <div className="stat-figure text-indigo-500">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <div className="stat-title text-gray-600 dark:text-gray-400 font-medium text-sm mb-1">
                  Productos Vendidos
                </div>
                <div className="stat-value text-indigo-500 text-3xl font-bold mb-1">
                  2,860
                </div>
                <div className="stat-desc text-green-600 text-sm font-medium">
                  ↗︎ 12% incremento
                </div>
              </div>

              {/* Stat 3 - Crecimiento */}
              <div className="stat bg-white dark:bg-gray-800 shadow-lg rounded-box p-6 border border-gray-100 dark:border-gray-700">
                <div className="stat-figure text-cyan-500">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <div className="stat-title text-gray-600 dark:text-gray-400 font-medium text-sm mb-1">
                  Crecimiento
                </div>
                <div className="stat-value text-cyan-500 text-3xl font-bold mb-1">
                  18.7%
                </div>
                <div className="stat-desc text-blue-600 text-sm font-medium">
                  vs trimestre anterior
                </div>
              </div>

              {/* Stat 4 - Categorías Activas */}
              <div className="stat bg-white dark:bg-gray-800 shadow-lg rounded-box p-6 border border-gray-100 dark:border-gray-700">
                <div className="stat-figure text-emerald-500">
                  <PieChart className="w-8 h-8" />
                </div>
                <div className="stat-title text-gray-600 dark:text-gray-400 font-medium text-sm mb-1">
                  Categorías Activas
                </div>
                <div className="stat-value text-emerald-500 text-3xl font-bold mb-1">
                  86
                </div>
                <div className="stat-desc text-purple-600 text-sm font-medium">
                  +4 nuevas este mes
                </div>
              </div>
            </div>

            {/* Gráficos usando Shadcn UI */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Gráfico de Barras - Ventas Mensuales */}
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="flex items-center gap-3 mb-4">
                    <BarChart3 className="h-6 w-6 text-primary" />
                    <h2 className="card-title text-primary">Ventas Mensuales</h2>
                    <span className="badge badge-primary badge-sm">Shadcn/UI</span>
                  </div>
                  <SalesChart />
                </div>
              </div>

              {/* Gráfico de Líneas Múltiples - Productos/Devoluciones/Intercambios */}
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="h-6 w-6 text-secondary" />
                    <h2 className="card-title text-secondary">Productos & Operaciones</h2>
                    <span className="badge badge-secondary badge-sm">Multi-línea</span>
                  </div>
                  <ProductsLineChart />
                </div>
              </div>
            </div>

            {/* Segunda fila de gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Gráfico de Barras Múltiples */}
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="flex items-center gap-3 mb-4">
                    <BarChart3 className="h-6 w-6 text-accent" />
                    <h2 className="card-title text-accent">Comparación Mensual</h2>
                    <span className="badge badge-accent badge-sm">Multi-barra</span>
                  </div>
                  <MultiBarChart />
                </div>
              </div>

              {/* Gráfico de Pastel - Categorías */}
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="flex items-center gap-3 mb-4">
                    <PieChart className="h-6 w-6 text-info" />
                    <h2 className="card-title text-info">Ventas por Categoría</h2>
                    <span className="badge badge-info badge-sm">8 Colores</span>
                  </div>
                  <div className="flex justify-center">
                    <CategoryPieChart className="max-w-md" />
                  </div>
                </div>
              </div>
            </div>

            {/* Mensaje informativo sobre la implementación híbrida */}
            <div className="card bg-gradient-to-r from-primary/10 to-secondary/10 shadow-xl">
              <div className="card-body">
                <h3 className="card-title text-primary mb-4">🎯 Sistema Híbrido Funcionando</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-primary mb-2">🎨 DaisyUI Components:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Cards, badges, alerts</li>
                      <li>Stats, botones, formularios</li>
                      <li>Layout y navegación</li>
                      <li>Temas (cupcake/night)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-secondary mb-2">📊 Shadcn/UI Charts:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Recharts con variables CSS</li>
                      <li>Tooltips personalizados</li>
                      <li>Colores consistentes con el tema</li>
                      <li>Responsive y accesibles</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
