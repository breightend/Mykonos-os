import { useState, useEffect } from 'react'
import { 
  SalesChart, 
  RevenueChart, 
  CategoryPieChart, 
  TopProductsChart,
  ProfitChart,
  SalesVsPurchasesChart
} from '../ui/charts'
import { statisticsApi } from '../../services/statisticsApi'
import { useSession } from '../../contexts/Sess        {/* Big Yearly Sales Chart - Full Width */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-base-content text-xl">📈 Ventas del Año {new Date().getFullYear()}</h2>
            <div className="h-80">
              {yearlyData && yearlyData.length > 0 ? (
                <SalesChart data={yearlyData} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📊</div>
                    <p className="text-base-content/70">No hay datos de ventas para el año actual</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-base-content">Ingresos Acumulados</h2>
            <div className="h-80">
              {salesData && salesData.length > 0 ? (
                <RevenueChart data={salesData} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-4">💰</div>
                    <p className="text-base-content/70">No hay datos de ingresos disponibles</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
const EstadisticasTest = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [salesData, setSalesData] = useState([])
  const [yearlyData, setYearlyData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [topProductsData, setTopProductsData] = useState([])
  const [profitData, setProfitData] = useState([])
  const [comparisonData, setComparisonData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { getCurrentStorage } = useSession()
  const currentStorage = getCurrentStorage()

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        console.log('Current storage:', currentStorage)
        console.log('Storage ID:', currentStorage?.id)
        
        // Load dashboard data
        console.log('Calling getDashboardStats...')
        const dashboardData = await statisticsApi.getDashboardStats({
          storage_id: currentStorage?.id
        })
        setDashboardData(dashboardData)
        console.log('Dashboard data received:', dashboardData)

        // Load sales chart data (monthly)
        console.log('Calling getSalesByMonth...')
        const salesData = await statisticsApi.getSalesByMonth({
          storage_id: currentStorage?.id
        })
        setSalesData(salesData)
        console.log('Sales data received:', salesData)

        // Load yearly sales data (for the big chart)
        console.log('Calling getSalesByMonth for yearly data...')
        const currentYear = new Date().getFullYear()
        const yearlyData = await statisticsApi.getSalesByMonth({
          storage_id: currentStorage?.id,
          start_date: `${currentYear}-01-01`,
          end_date: `${currentYear}-12-31`
        })
        setYearlyData(yearlyData)
        console.log('Yearly data received:', yearlyData)

        // Load category data
        if (statisticsApi.getSalesByCategory) {
          const categoryData = await statisticsApi.getSalesByCategory({
            storage_id: currentStorage?.id
          })
          setCategoryData(categoryData)
          console.log('Category data received:', categoryData)
        }

        // Load top products data
        if (statisticsApi.getTopProducts) {
          const topProductsData = await statisticsApi.getTopProducts({
            storage_id: currentStorage?.id
          })
          setTopProductsData(topProductsData)
          console.log('Top products data received:', topProductsData)
        }
        
      } catch (err) {
        console.error('Error in loadData:', err)
        setError('Error: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    if (currentStorage?.id) {
      loadData()
    } else {
      console.log('No current storage found, waiting...')
      setLoading(false)
    }
  }, [currentStorage?.id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <span className="ml-4 text-lg">Cargando estadísticas...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="alert alert-error max-w-md">
          <span>{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-100 p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-base-content">Estadísticas de Negocio</h1>
        <p className="text-base-content/70 mt-2">
          Panel de control con métricas y análisis detallados
        </p>
        
        {/* Debug Information */}
        <div className="mt-4 p-4 bg-base-200 rounded-lg">
          <h3 className="font-bold mb-2">Debug Info:</h3>
          <p>Storage ID: {currentStorage?.id || 'No storage'}</p>
          <p>Storage Name: {currentStorage?.name || 'No storage name'}</p>
          <p>Monthly Sales Data: {salesData?.length || 0} entries</p>
          <p>Yearly Sales Data: {yearlyData?.length || 0} entries</p>
          <p>Category Data: {categoryData?.length || 0} entries</p>
          <p>Top Products Data: {topProductsData?.length || 0} entries</p>
          <p>Dashboard Data: {dashboardData ? 'Loaded' : 'Not loaded'}</p>
        </div>
      </div>

      {/* Dashboard Metrics Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Sales Metrics */}
          <div className="stats bg-primary text-primary-content shadow">
            <div className="stat">
              <div className="stat-figure">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="inline-block h-8 w-8 stroke-current"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              <div className="stat-title text-primary-content/80">Ventas Totales</div>
              <div className="stat-value">{dashboardData.sales?.total_sales || 0}</div>
              <div className="stat-desc text-primary-content/60">
                Productos vendidos: {dashboardData.sales?.total_products_sold || 0}
              </div>
            </div>
          </div>

          {/* Revenue Metrics */}
          <div className="stats bg-secondary text-secondary-content shadow">
            <div className="stat">
              <div className="stat-figure">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="inline-block h-8 w-8 stroke-current"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                  ></path>
                </svg>
              </div>
              <div className="stat-title text-secondary-content/80">Ingresos</div>
              <div className="stat-value">
                ${dashboardData.sales?.total_revenue?.toLocaleString() || 0}
              </div>
              <div className="stat-desc text-secondary-content/60">
                Promedio: ${dashboardData.sales?.avg_sale_value?.toLocaleString() || 0}
              </div>
            </div>
          </div>

          {/* Purchases Metrics */}
          <div className="stats bg-accent text-accent-content shadow">
            <div className="stat">
              <div className="stat-figure">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="inline-block h-8 w-8 stroke-current"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 3H3m4 10v6a1 1 0 001 1h9a1 1 0 001-1v-6m-10 0V9a1 1 0 011-1h8a1 1 0 011 1v4.01"
                  ></path>
                </svg>
              </div>
              <div className="stat-title text-accent-content/80">Compras</div>
              <div className="stat-value">{dashboardData.purchases?.total_purchases || 0}</div>
              <div className="stat-desc text-accent-content/60">
                Total gastado: ${dashboardData.purchases?.total_spent?.toLocaleString() || 0}
              </div>
            </div>
          </div>

          {/* Inventory Metrics */}
          <div className="stats bg-info text-info-content shadow">
            <div className="stat">
              <div className="stat-figure">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="inline-block h-8 w-8 stroke-current"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  ></path>
                </svg>
              </div>
              <div className="stat-title text-info-content/80">Inventario</div>
              <div className="stat-value">{dashboardData.inventory?.total_products || 0}</div>
              <div className="stat-desc text-info-content/60">
                {dashboardData.inventory?.total_stock_units || 0} unidades en stock
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Section */}
      {dashboardData && (
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-base-content">Resumen del Período</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  ${(
                    (dashboardData.sales?.total_revenue || 0) -
                    (dashboardData.purchases?.total_spent || 0)
                  ).toLocaleString()}
                </div>
                <div className="text-sm text-base-content/70">Ganancia Neta</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">
                  {dashboardData.inventory?.total_variants || 0}
                </div>
                <div className="text-sm text-base-content/70">Variantes de Productos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">
                  {Math.round(
                    ((dashboardData.sales?.total_revenue || 0) /
                      (dashboardData.purchases?.total_spent || 1)) *
                      100
                  )}
                  %
                </div>
                <div className="text-sm text-base-content/70">ROI Estimado</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Sales Chart */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-base-content">Ventas por Mes</h2>
            <div className="h-80">
              {salesData && salesData.length > 0 ? (
                <SalesChart data={salesData} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📊</div>
                    <p className="text-base-content/70">No hay datos de ventas disponibles</p>
                    <p className="text-base-content/50 text-sm mt-2">
                      Los datos aparecerán cuando haya ventas registradas
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Placeholder for next chart */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-base-content">Próximo Gráfico</h2>
            <div className="h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">�</div>
                <p className="text-base-content/70">
                  Siguiente gráfico se añadirá paso a paso
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EstadisticasTest
