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

        <div className="min-h-screen flex-1 bg-base-200 p-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <h1 className="mb-2 text-3xl font-bold text-primary">📊 Estadísticas</h1>
              <p className="text-base-content/70">Panel de análisis de ventas y productos</p>
            </div>

            {/* Indicador de que Shadcn UI funciona */}
            <div className="alert alert-success mb-6 flex items-center gap-3">
              <TrendingUp className="h-5 w-5" />
              <span className="font-semibold">
                ✅ Gráficos Shadcn/UI funcionando correctamente!
              </span>
            </div>

            {/* Stats Cards usando DaisyUI con estilos forzados */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Stat 1 - Ventas del Mes */}
              <div className="stat rounded-box border border-gray-100 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <div className="stat-figure text-orange-500">
                  <DollarSign className="h-8 w-8" />
                </div>
                <div className="stat-title mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Ventas del Mes
                </div>
                <div className="stat-value mb-1 text-3xl font-bold text-orange-500">$25.6K</div>
                <div className="stat-desc text-sm font-medium text-green-600">
                  ↗︎ 21% más que el mes pasado
                </div>
              </div>

              {/* Stat 2 - Productos Vendidos */}
              <div className="stat rounded-box border border-gray-100 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <div className="stat-figure text-indigo-500">
                  <BarChart3 className="h-8 w-8" />
                </div>
                <div className="stat-title mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Productos Vendidos
                </div>
                <div className="stat-value mb-1 text-3xl font-bold text-indigo-500">2,860</div>
                <div className="stat-desc text-sm font-medium text-green-600">
                  ↗︎ 12% incremento
                </div>
              </div>

              {/* Stat 3 - Crecimiento */}
              <div className="stat rounded-box border border-gray-100 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <div className="stat-figure text-cyan-500">
                  <TrendingUp className="h-8 w-8" />
                </div>
                <div className="stat-title mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Crecimiento
                </div>
                <div className="stat-value mb-1 text-3xl font-bold text-cyan-500">18.7%</div>
                <div className="stat-desc text-sm font-medium text-blue-600">
                  vs trimestre anterior
                </div>
              </div>

              {/* Stat 4 - Categorías Activas */}
              <div className="stat rounded-box border border-gray-100 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <div className="stat-figure text-emerald-500">
                  <PieChart className="h-8 w-8" />
                </div>
                <div className="stat-title mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Categorías Activas
                </div>
                <div className="stat-value mb-1 text-3xl font-bold text-emerald-500">86</div>
                <div className="stat-desc text-sm font-medium text-purple-600">
                  +4 nuevas este mes
                </div>
              </div>
            </div>

            {/* Gráficos usando Shadcn UI */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Gráfico de Barras - Ventas Mensuales */}
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="mb-4 flex items-center gap-3">
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
                  <div className="mb-4 flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-secondary" />
                    <h2 className="card-title text-secondary">Productos & Operaciones</h2>
                    <span className="badge badge-secondary badge-sm">Multi-línea</span>
                  </div>
                  <ProductsLineChart />
                </div>
              </div>
            </div>

            {/* Segunda fila de gráficos */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Gráfico de Barras Múltiples */}
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="mb-4 flex items-center gap-3">
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
                  <div className="mb-4 flex items-center gap-3">
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
                <h3 className="card-title mb-4 text-primary">🎯 Sistema Híbrido Funcionando</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 font-semibold text-primary">🎨 DaisyUI Components:</h4>
                    <ul className="list-inside list-disc space-y-1 text-sm">
                      <li>Cards, badges, alerts</li>
                      <li>Stats, botones, formularios</li>
                      <li>Layout y navegación</li>
                      <li>Temas (cupcake/night)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 font-semibold text-secondary">📊 Shadcn/UI Charts:</h4>
                    <ul className="list-inside list-disc space-y-1 text-sm">
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
