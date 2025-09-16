import { useState, useEffect } from 'react'
// Statistics dashboard component with comprehensive charts and metrics
import {
  SalesChart,
  RevenueChart,
  CategoryPieChart,
  TopProductsChart,
  ProfitChart,
  SalesVsPurchasesChart
} from '../ui/charts'
import { statisticsApi } from '../../services/statisticsApi'

const Estadisticas = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [salesByMonth, setSalesByMonth] = useState([])
  const [salesByCategory, setSalesByCategory] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [profitData, setProfitData] = useState([])
  const [comparisonData, setComparisonData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Date range state
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  const loadAllData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [
        dashboardResponse,
        salesMonthResponse,
        salesCategoryResponse,
        topProductsResponse,
        profitResponse,
        comparisonResponse
      ] = await Promise.all([
        statisticsApi.getDashboardStats({
          start_date: dateRange.startDate,
          end_date: dateRange.endDate
        }),
        statisticsApi.getSalesByMonth({
          start_date: dateRange.startDate,
          end_date: dateRange.endDate
        }),
        statisticsApi.getSalesByCategory({
          start_date: dateRange.startDate,
          end_date: dateRange.endDate
        }),
        statisticsApi.getTopProducts({
          start_date: dateRange.startDate,
          end_date: dateRange.endDate
        }),
        statisticsApi.getProfitAnalysis({
          start_date: dateRange.startDate,
          end_date: dateRange.endDate
        }),
        statisticsApi.getSalesVsPurchases({
          start_date: dateRange.startDate,
          end_date: dateRange.endDate
        })
      ])

      setDashboardData(dashboardResponse)
      setSalesByMonth(salesMonthResponse)
      setSalesByCategory(salesCategoryResponse)
      setTopProducts(topProductsResponse)
      setProfitData(profitResponse)
      setComparisonData(comparisonResponse)
    } catch (err) {
      setError('Error loading statistics data: ' + err.message)
      console.error('Statistics loading error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [dateRange])

  const handleDateRangeChange = (field, value) => {
    setDateRange((prev) => ({
      ...prev,
      [field]: value
    }))
  }

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
      <div className="alert alert-error mx-auto mt-8 max-w-md">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 shrink-0 stroke-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{error}</span>
        <button className="btn btn-outline btn-sm" onClick={loadAllData}>
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen space-y-6 bg-base-100 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-base-content">Estadísticas de Negocio</h1>
          <p className="text-base-content/70 mt-1">
            Panel de control con métricas y análisis detallados
          </p>
        </div>

        {/* Date Range Controls */}
        <div className="mt-4 flex flex-col gap-4 sm:flex-row lg:mt-0">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Fecha Inicio</span>
            </label>
            <input
              type="date"
              className="input-bordered input input-sm"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Fecha Fin</span>
            </label>
            <input
              type="date"
              className="input-bordered input input-sm"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
            />
          </div>
          <button className="btn btn-primary btn-sm self-end" onClick={loadAllData}>
            Actualizar
          </button>
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
              <div className="text-primary-content/80 stat-title">Ventas Totales</div>
              <div className="stat-value">{dashboardData.sales?.total_sales || 0}</div>
              <div className="text-primary-content/60 stat-desc">
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
              <div className="text-secondary-content/80 stat-title">Ingresos</div>
              <div className="stat-value">
                ${dashboardData.sales?.total_revenue?.toLocaleString() || 0}
              </div>
              <div className="text-secondary-content/60 stat-desc">
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
              <div className="text-accent-content/80 stat-title">Compras</div>
              <div className="stat-value">{dashboardData.purchases?.total_purchases || 0}</div>
              <div className="text-accent-content/60 stat-desc">
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
              <div className="text-info-content/80 stat-title">Inventario</div>
              <div className="stat-value">{dashboardData.inventory?.total_products || 0}</div>
              <div className="text-info-content/60 stat-desc">
                {dashboardData.inventory?.total_stock_units || 0} unidades en stock
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Sales Trend Chart */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-base-content">Tendencia de Ventas por Mes</h2>
            <div className="h-80">
              <SalesChart data={salesByMonth} />
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-base-content">Ingresos Acumulados</h2>
            <div className="h-80">
              <RevenueChart data={salesByMonth} />
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-base-content">Ventas por Categoría</h2>
            <div className="h-80">
              <CategoryPieChart data={salesByCategory} />
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-base-content">Productos Más Vendidos</h2>
            <div className="h-80">
              <TopProductsChart data={topProducts} />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Analysis Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Profit Analysis */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-base-content">Análisis de Ganancias</h2>
            <div className="h-80">
              <ProfitChart data={profitData} />
            </div>
          </div>
        </div>

        {/* Sales vs Purchases Comparison */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-base-content">Ventas vs Compras</h2>
            <div className="h-80">
              <SalesVsPurchasesChart data={comparisonData} />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      {dashboardData && (
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-base-content">Resumen del Período</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  $
                  {(
                    (dashboardData.sales?.total_revenue || 0) -
                    (dashboardData.purchases?.total_spent || 0)
                  ).toLocaleString()}
                </div>
                <div className="text-base-content/70 text-sm">Ganancia Neta</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">
                  {dashboardData.inventory?.total_variants || 0}
                </div>
                <div className="text-base-content/70 text-sm">Variantes de Productos</div>
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
                <div className="text-base-content/70 text-sm">ROI Estimado</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Estadisticas
