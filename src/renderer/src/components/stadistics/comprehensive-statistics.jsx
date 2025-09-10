import { useState, useEffect } from 'react'
import {
  InteractiveAreaChart,
  ModernBarChart,
  EnhancedPieChart,
  CombinedMetricsChart,
  SalesChart,
  RevenueChart
} from '../ui/charts'
import { statisticsApi } from '../../services/statisticsApi'
import { useSession } from '../../contexts/SessionContext'

const ComprehensiveStatistics = () => {
  // State for different data types
  const [dashboardData, setDashboardData] = useState(null)
  const [salesByMonth, setSalesByMonth] = useState([])
  const [purchasesByMonth, setPurchasesByMonth] = useState([])
  const [salesByCategory, setSalesByCategory] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [salesVsPurchases, setSalesVsPurchases] = useState([])
  const [profitAnalysis, setProfitAnalysis] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Date range state
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0], // First day of current month
    endDate: new Date().toISOString().split('T')[0] // Today
  })

  const { getCurrentStorage } = useSession()
  const currentStorage = getCurrentStorage()

  // Helper function to set quick date ranges
  const setQuickRange = (months) => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(endDate.getMonth() - months)

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    })
  }

  const setYearRange = (years = 1) => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setFullYear(endDate.getFullYear() - years)

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    })
  }

  const handleDateRangeChange = (field, value) => {
    setDateRange((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true)
        setError(null)

        const apiParams = {
          storage_id: currentStorage?.id,
          start_date: dateRange.startDate,
          end_date: dateRange.endDate
        }

        console.log('Loading comprehensive statistics data...')

        // Load all data in parallel for better performance
        const [
          dashboardResponse,
          salesMonthResponse,
          purchasesMonthResponse,
          salesCategoryResponse,
          topProductsResponse,
          salesVsPurchasesResponse,
          profitResponse
        ] = await Promise.all([
          statisticsApi.getDashboardStats(apiParams),
          statisticsApi.getSalesByMonth(apiParams),
          statisticsApi.getPurchasesByMonth(apiParams),
          statisticsApi.getSalesByCategory(apiParams),
          statisticsApi.getTopProducts(apiParams),
          statisticsApi.getSalesVsPurchases(apiParams),
          statisticsApi.getProfitAnalysis(apiParams)
        ])

        // Set all data
        setDashboardData(dashboardResponse)
        setSalesByMonth(salesMonthResponse)
        setPurchasesByMonth(purchasesMonthResponse)
        setSalesByCategory(salesCategoryResponse)
        setTopProducts(topProductsResponse)
        setSalesVsPurchases(salesVsPurchasesResponse)
        setProfitAnalysis(profitResponse)

        console.log('All data loaded successfully:', {
          dashboard: dashboardResponse,
          salesByMonth: salesMonthResponse,
          purchasesByMonth: purchasesMonthResponse,
          salesByCategory: salesCategoryResponse,
          topProducts: topProductsResponse,
          salesVsPurchases: salesVsPurchasesResponse,
          profitAnalysis: profitResponse
        })
      } catch (err) {
        console.error('Error loading comprehensive statistics:', err)
        setError('Error loading statistics: ' + err.message)
      } finally {
        setLoading(false)
      }
    }

    if (currentStorage?.id) {
      loadAllData()
    } else {
      setLoading(false)
    }
  }, [currentStorage?.id, dateRange]) // Re-load when date range changes

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
        <span className="ml-4 text-lg">Cargando análisis completo...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-error mx-auto mt-8 max-w-md">
        <span>{error}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen space-y-6 bg-base-100 p-6">
      {/* Header with Date Range Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="mb-4 lg:mb-0">
          <h1 className="text-3xl font-bold text-base-content">📊 Análisis Empresarial Completo</h1>
          <p className="text-base-content/70 mt-2">
            Dashboard integral con métricas de ventas, compras, rentabilidad y tendencias
          </p>
        </div>

        {/* Date Range Controls */}
        <div className="flex flex-col gap-4 sm:flex-row lg:items-end">
          {/* Quick Range Buttons */}
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-outline btn-sm" onClick={() => setQuickRange(1)}>
              1 Mes
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => setQuickRange(3)}>
              3 Meses
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => setQuickRange(6)}>
              6 Meses
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => setYearRange(1)}>
              1 Año
            </button>
          </div>

          {/* Custom Date Range */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-xs">Fecha Inicio</span>
              </label>
              <input
                type="date"
                className="input-bordered input input-sm w-full sm:w-auto"
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text text-xs">Fecha Fin</span>
              </label>
              <input
                type="date"
                className="input-bordered input input-sm w-full sm:w-auto"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary btn-sm self-end"
              onClick={() => loadAllData()}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Cargando...
                </>
              ) : (
                'Actualizar'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Date Range Display */}
      <div className="alert alert-info">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="h-6 w-6 shrink-0 stroke-current"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <span>
          Mostrando datos del <strong>{new Date(dateRange.startDate).toLocaleDateString()}</strong>{' '}
          al <strong>{new Date(dateRange.endDate).toLocaleDateString()}</strong> (
          {Math.ceil(
            (new Date(dateRange.endDate) - new Date(dateRange.startDate)) / (1000 * 60 * 60 * 24)
          )}{' '}
          días)
        </span>
      </div>

      {/* Key Performance Indicators */}
      {dashboardData && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Sales KPI */}
          <div className="stats bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
            <div className="stat">
              <div className="stat-figure text-blue-200">
                <svg
                  className="inline-block h-8 w-8 stroke-current"
                  fill="none"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  ></path>
                </svg>
              </div>
              <div className="stat-title text-blue-100">Ventas Totales</div>
              <div className="stat-value">{dashboardData.sales?.total_sales || 0}</div>
              <div className="stat-desc text-blue-200">
                ${dashboardData.sales?.total_revenue?.toLocaleString() || 0}
              </div>
            </div>
          </div>

          {/* Purchases KPI */}
          <div className="stats bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg">
            <div className="stat">
              <div className="stat-figure text-orange-200">
                <svg
                  className="inline-block h-8 w-8 stroke-current"
                  fill="none"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 3H3m4 10v6a1 1 0 001 1h9a1 1 0 001-1v-6"
                  ></path>
                </svg>
              </div>
              <div className="stat-title text-orange-100">Compras Totales</div>
              <div className="stat-value">{dashboardData.purchases?.total_purchases || 0}</div>
              <div className="stat-desc text-orange-200">
                ${dashboardData.purchases?.total_spent?.toLocaleString() || 0}
              </div>
            </div>
          </div>

          {/* Profit KPI */}
          <div className="stats bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
            <div className="stat">
              <div className="stat-figure text-green-200">
                <svg
                  className="inline-block h-8 w-8 stroke-current"
                  fill="none"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  ></path>
                </svg>
              </div>
              <div className="stat-title text-green-100">Ganancia Bruta</div>
              <div className="stat-value">
                $
                {(
                  (dashboardData.sales?.total_revenue || 0) -
                  (dashboardData.purchases?.total_spent || 0)
                ).toLocaleString()}
              </div>
              <div className="stat-desc text-green-200">
                Margen:{' '}
                {Math.round(
                  ((dashboardData.sales?.total_revenue || 0) /
                    (dashboardData.purchases?.total_spent || 1) -
                    1) *
                    100
                )}
                %
              </div>
            </div>
          </div>

          {/* Inventory KPI */}
          <div className="stats bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg">
            <div className="stat">
              <div className="stat-figure text-purple-200">
                <svg
                  className="inline-block h-8 w-8 stroke-current"
                  fill="none"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  ></path>
                </svg>
              </div>
              <div className="stat-title text-purple-100">Inventario</div>
              <div className="stat-value">{dashboardData.inventory?.total_products || 0}</div>
              <div className="stat-desc text-purple-200">
                {dashboardData.inventory?.total_stock_units || 0} unidades
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Analysis Chart - Sales vs Purchases Comparison */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="card-title text-xl text-base-content">
                📈 Comparación: Ventas vs Compras
              </h2>
              <p className="text-base-content/60 text-sm">
                Análisis temporal de flujo de efectivo - Ingresos vs Gastos
              </p>
            </div>
            {loading && (
              <div className="flex items-center gap-2">
                <span className="loading loading-spinner loading-sm"></span>
                <span className="text-base-content/70 text-sm">Actualizando...</span>
              </div>
            )}
          </div>
          <div className="h-96">
            {salesVsPurchases && salesVsPurchases.length > 0 ? (
              <CombinedMetricsChart data={salesVsPurchases} />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mb-4 text-4xl">📊</div>
                  <p className="text-base-content/70">
                    {loading
                      ? 'Cargando datos de comparación...'
                      : 'No hay datos de comparación disponibles para este período'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Sales Trend */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-base-content">💰 Tendencia de Ventas</h2>
            <div className="h-80">
              {salesByMonth && salesByMonth.length > 0 ? (
                <InteractiveAreaChart data={salesByMonth} title="Ventas Mensuales" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mb-4 text-4xl">💰</div>
                    <p className="text-base-content/70">
                      {loading ? 'Cargando ventas...' : 'No hay ventas en este período'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Purchase Trend */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-base-content">🛒 Tendencia de Compras</h2>
            <div className="h-80">
              {purchasesByMonth && purchasesByMonth.length > 0 ? (
                <ModernBarChart
                  data={purchasesByMonth.map((item) => ({
                    name: item.month,
                    ventas: item.purchase_count,
                    ingresos: item.total_spent
                  }))}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mb-4 text-4xl">🛒</div>
                    <p className="text-base-content/70">
                      {loading ? 'Cargando compras...' : 'No hay compras en este período'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-base-content">🎯 Ventas por Categoría</h2>
            <div className="h-80">
              {salesByCategory && salesByCategory.length > 0 ? (
                <EnhancedPieChart data={salesByCategory} title="Distribución por Categoría" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mb-4 text-4xl">🎯</div>
                    <p className="text-base-content/70">
                      {loading
                        ? 'Cargando categorías...'
                        : 'No hay datos de categorías en este período'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-base-content">🏆 Productos Estrella</h2>
            <div className="h-80">
              {topProducts && topProducts.length > 0 ? (
                <ModernBarChart
                  data={topProducts.map((item) => ({
                    name: item.product_name || item.name,
                    ventas: item.total_sales || item.sales_count,
                    ingresos: item.total_revenue || item.revenue
                  }))}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <div className="mb-4 text-4xl">🏆</div>
                    <p className="text-base-content/70">
                      {loading
                        ? 'Cargando productos...'
                        : 'No hay datos de productos en este período'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profit Analysis Section */}
      {profitAnalysis && profitAnalysis.length > 0 && (
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-xl text-base-content">📊 Análisis de Rentabilidad</h2>
            <div className="h-80">
              <InteractiveAreaChart data={profitAnalysis} title="Análisis de Ganancias" />
            </div>
          </div>
        </div>
      )}

      {/* Business Summary */}
      {dashboardData && (
        <div className="card bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-xl text-white">📋 Resumen Ejecutivo</h2>
            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-lg bg-white/10 p-4 text-center">
                <div className="text-3xl font-bold text-blue-300">
                  {Math.round(
                    ((dashboardData.sales?.total_revenue || 0) /
                      (dashboardData.purchases?.total_spent || 1) -
                      1) *
                      100
                  )}
                  %
                </div>
                <div className="text-sm text-blue-100">Margen de Ganancia</div>
                <div className="mt-1 text-xs text-blue-200">Ingresos vs Costos</div>
              </div>
              <div className="rounded-lg bg-white/10 p-4 text-center">
                <div className="text-3xl font-bold text-green-300">
                  $
                  {(
                    (dashboardData.sales?.total_revenue || 0) /
                    (dashboardData.sales?.total_sales || 1)
                  ).toLocaleString()}
                </div>
                <div className="text-sm text-green-100">Venta Promedio</div>
                <div className="mt-1 text-xs text-green-200">Por transacción</div>
              </div>
              <div className="rounded-lg bg-white/10 p-4 text-center">
                <div className="text-3xl font-bold text-purple-300">
                  {(
                    dashboardData.sales?.total_products_sold /
                    (dashboardData.sales?.total_sales || 1)
                  ).toFixed(1)}
                </div>
                <div className="text-sm text-purple-100">Productos por Venta</div>
                <div className="mt-1 text-xs text-purple-200">Unidades promedio</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ComprehensiveStatistics
