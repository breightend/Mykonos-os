import {
  Archive,
  DollarSign,
  Package,
  Search,
  X,
  Replace,
  RotateCcw,
  Calendar,
  Filter,
  FilterX
} from 'lucide-react'
import MenuVertical from '../componentes especificos/menuVertical'
import Navbar from '../componentes especificos/navbar'
import { useState, useEffect, useCallback } from 'react'
import { DayPicker } from 'react-day-picker'
import { es } from 'react-day-picker/locale'
import { useSession } from '../contexts/SessionContext'
import { salesService } from '../services/salesService'
import toast, { Toaster } from 'react-hot-toast'

export default function RegistroVentas() {
  const [range, setRange] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [salesList, setSalesList] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedSale, setSelectedSale] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [saleDetails, setSaleDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [stats, setStats] = useState({
    total_revenue: 0,
    total_products_sold: 0,
    total_sales: 0
  })
  const [showCalendar, setShowCalendar] = useState(false)

  const { getCurrentStorage } = useSession()
  const currentStorage = getCurrentStorage()

  // Obtener el texto que se mostrará en el botón del calendario
  const getLabel = () => {
    if (!range) return 'Seleccionar rango de fechas'
    if (range.from && !range.to) return `Desde: ${range.from.toLocaleDateString()}`
    if (range.from && range.to)
      return `${range.from.toLocaleDateString()} - ${range.to.toLocaleDateString()}`
    return 'Seleccionar rango de fechas'
  }

  // Limpiar filtros
  const clearFilters = () => {
    setRange(null)
    setSearchTerm('')
    setShowCalendar(false)
  }

  // Toggle calendario
  const toggleCalendar = () => {
    setShowCalendar(!showCalendar)
  }

  // Funciones de acceso rápido para rangos de fechas
  const setQuickRange = (days) => {
    const today = new Date()
    const from = new Date(today)
    from.setDate(today.getDate() - days + 1)
    setRange({ from, to: today })
  }

  // Cargar estadísticas
  const loadStats = useCallback(async () => {
    try {
      const filters = {
        storage_id: currentStorage?.id
      }

      // Agregar filtro de fecha de hoy
      const today = new Date().toISOString().split('T')[0]
      filters.start_date = today
      filters.end_date = today

      const response = await salesService.getSalesStats(filters)

      if (response.status === 'success') {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }, [currentStorage?.id])

  // Cargar lista de ventas
  const loadSales = useCallback(async () => {
    try {
      setLoading(true)

      const filters = {
        storage_id: currentStorage?.id,
        limit: 100
      }

      // Agregar filtros de fecha si están definidos
      if (range?.from) {
        filters.start_date = range.from.toISOString().split('T')[0]
      }
      if (range?.to) {
        filters.end_date = range.to.toISOString().split('T')[0]
      }

      // Agregar filtro de búsqueda
      if (searchTerm.trim()) {
        filters.search = searchTerm.trim()
      }

      const response = await salesService.getSalesList(filters)

      if (response.status === 'success') {
        setSalesList(response.data)
      } else {
        toast.error('Error al cargar las ventas')
      }
    } catch (error) {
      console.error('Error cargando ventas:', error)
      toast.error('Error al cargar las ventas')
    } finally {
      setLoading(false)
    }
  }, [currentStorage?.id, range, searchTerm])

  // Cargar detalles de una venta
  const loadSaleDetails = async (saleId) => {
    try {
      setLoadingDetails(true)
      const response = await salesService.getSaleDetails(saleId)

      if (response.status === 'success') {
        setSaleDetails(response.data)
        setShowModal(true)
      } else {
        toast.error('Error al cargar detalles de la venta')
      }
    } catch (error) {
      console.error('Error cargando detalles:', error)
      toast.error('Error al cargar detalles de la venta')
    } finally {
      setLoadingDetails(false)
    }
  }

  // Manejar doble click en una fila
  const handleRowDoubleClick = (sale) => {
    setSelectedSale(sale)
    setShowModal(true) // Agregar esta línea para abrir el modal
    loadSaleDetails(sale.id)
  }

  // Cerrar modal
  const closeModal = () => {
    setShowModal(false)
    setSaleDetails(null)
    setSelectedSale(null)
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    if (currentStorage?.id) {
      loadSales()
      loadStats()
    }
  }, [currentStorage?.id, loadSales, loadStats])

  // Cerrar calendar al hacer click fuera y atajos de teclado
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowCalendar(false)
      }
      // Atajo Ctrl+F para enfocar búsqueda
      if (event.ctrlKey && event.key === 'f') {
        event.preventDefault()
        document.querySelector('input[type="text"]')?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showCalendar])

  // Buscar automáticamente después de que el usuario deje de escribir
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== '' || range) {
        loadSales()
      }
    }, 500) // Esperar 500ms después de que deje de escribir

    return () => clearTimeout(timeoutId)
  }, [searchTerm, range, loadSales])

  // Formatear fecha para mostrar
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  // Formatear precio
  const formatPrice = (price) => {
    return parseFloat(price || 0).toFixed(2)
  }

  return (
    <>
      {/* Menú lateral */}
      <MenuVertical currentPath="/home" />
      <Navbar />
      <div className={`transition-all duration-300 ease-in-out`}>
        <div className="ml-20 flex-1">
          {/* Aca resto del contenido*/}
          <div className="mr-4 flex justify-end">
            <div className="stats stats-horizontal shadow" data-page="registro-ventas">
              <div className="stat">
                <div className="stat-figure text-orange-500">
                  <DollarSign className="h-8 w-8" />
                </div>
                <div className="stat-title">Total vendido hoy</div>
                <div className="stat-value text-orange-500">
                  ${formatPrice(stats.total_revenue)}
                </div>
                <div className="stat-desc">{new Date().toLocaleDateString()}</div>
              </div>

              <div className="stat">
                <div className="stat-figure text-indigo-500">
                  <Package className="h-8 w-8" />
                </div>
                <div className="stat-title">Productos vendidos</div>
                <div className="stat-value text-indigo-500">{stats.total_products_sold}</div>
                <div className="stat-desc">Unidades hoy</div>
              </div>

              <div className="stat">
                <div className="stat-figure text-cyan-500">
                  <Archive className="h-8 w-8" />
                </div>
                <div className="stat-title">Ventas realizadas</div>
                <div className="stat-value text-cyan-500">{stats.total_sales}</div>
                <div className="stat-desc">Transacciones hoy</div>
              </div>
            </div>
          </div>
          <h2 className="mb-6 mt-4 text-3xl font-bold text-warning">
            Registro de ventas: {currentStorage?.id}
          </h2>
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-4">
              {/* Buscador */}
              <label className="input-bordered input input-warning flex flex-1 items-center gap-2">
                <input
                  type="text"
                  placeholder="Buscar por notas, número de factura, cliente..."
                  className="grow"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="h-4 w-4 text-gray-500" />
              </label>

              {/* Botón del calendario */}
              <div className="relative">
                <button
                  type="button"
                  className={`btn btn-warning btn-outline min-w-[200px] ${showCalendar ? 'btn-active' : ''}`}
                  onClick={toggleCalendar}
                >
                  <Calendar className="h-4 w-4" />
                  {getLabel()}
                </button>

                {/* Modal del calendario centrado */}
                {showCalendar && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) {
                        setShowCalendar(false)
                      }
                    }}
                  >
                    <div className="relative mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-base-100 p-6 shadow-xl">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Seleccionar período</h3>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-circle"
                          onClick={() => setShowCalendar(false)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Botones de acceso rápido */}
                      <div className="mb-4 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => setQuickRange(1)}
                        >
                          Hoy
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => setQuickRange(7)}
                        >
                          Últimos 7 días
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => setQuickRange(30)}
                        >
                          Últimos 30 días
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            const today = new Date()
                            const firstDayOfMonth = new Date(
                              today.getFullYear(),
                              today.getMonth(),
                              1
                            )
                            setRange({ from: firstDayOfMonth, to: today })
                          }}
                        >
                          Este mes
                        </button>
                      </div>

                      {/* Calendario */}
                      <div className="flex justify-center">
                        <DayPicker
                          classNames={{
                            root: 'react-day-picker text-sm',
                            today: 'border-2 border-amber-500 rounded font-bold',
                            selected:
                              'bg-amber-500 border-amber-500 text-white rounded font-semibold',
                            range_start: 'bg-amber-600 text-white rounded-l font-semibold',
                            range_end: 'bg-amber-600 text-white rounded-r font-semibold',
                            range_middle: 'bg-amber-200 text-amber-900',
                            day_button:
                              'w-9 h-9 text-sm rounded hover:bg-amber-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-300',
                            nav_button: 'btn btn-sm btn-ghost hover:bg-amber-100',
                            nav_button_next: 'btn btn-sm btn-ghost hover:bg-amber-100',
                            nav_button_previous: 'btn btn-sm btn-ghost hover:bg-amber-100',
                            caption: 'text-lg font-semibold mb-3 text-center text-amber-700',
                            weekdays: 'text-xs font-medium text-gray-600 mb-1',
                            week: 'mb-1',
                            day: 'text-sm font-medium p-1'
                          }}
                          mode="range"
                          selected={range}
                          onSelect={setRange}
                          locale={es}
                          disabled={{ after: new Date() }}
                          showOutsideDays={false}
                          fixedWeeks={false}
                          numberOfMonths={1}
                        />
                      </div>

                      {/* Información del rango seleccionado */}
                      {range && (
                        <div className="mt-4 rounded bg-amber-50 p-3">
                          <p className="text-sm font-medium text-amber-800">Rango seleccionado:</p>
                          <p className="text-sm text-amber-700">
                            {range.from?.toLocaleDateString()}
                            {range.to && ` - ${range.to.toLocaleDateString()}`}
                          </p>
                        </div>
                      )}

                      {/* Botones de acción */}
                      <div className="mt-6 flex justify-end gap-2">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setRange(null)
                            setShowCalendar(false)
                          }}
                        >
                          <FilterX className="mr-1 h-4 w-4" />
                          Limpiar
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setShowCalendar(false)}
                        >
                          <Filter className="mr-1 h-4 w-4" />
                          Aplicar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2">
              {/* Botón para limpiar filtros */}
              {(range || searchTerm) && (
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  onClick={clearFilters}
                  title="Limpiar filtros"
                >
                  <FilterX className="h-4 w-4" />
                  Limpiar
                </button>
              )}

              {/* Botón filtrar */}
              <button
                className="btn btn-primary"
                type="button"
                onClick={loadSales}
                disabled={loading}
              >
                <Filter className="h-4 w-4" />
                {loading ? 'Cargando...' : 'Filtrar'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg bg-base-200 shadow-lg">
            <table className="table w-full">
              {/* head */}
              <thead className="bg-warning/10">
                <tr>
                  <th className="text-warning">#</th>
                  <th className="text-warning">Fecha</th>
                  <th className="text-warning">Cliente</th>
                  <th className="text-warning">Productos</th>
                  <th className="text-warning">Método de Pago</th>
                  <th className="text-warning">Total</th>
                  <th className="text-warning">Estado</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center">
                      <span className="loading loading-spinner loading-md"></span>
                      <span className="ml-2">Cargando ventas...</span>
                    </td>
                  </tr>
                ) : salesList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-500">
                      No se encontraron ventas
                    </td>
                  </tr>
                ) : (
                  salesList.map((sale) => (
                    <tr
                      key={sale.id}
                      className={`hover:bg-warning/10 cursor-pointer transition-colors`}
                      onDoubleClick={() => handleRowDoubleClick(sale)}
                      title="Doble click para ver detalles"
                    >
                      <td className="font-mono">{sale.id}</td>
                      <td>{formatDate(sale.sale_date)}</td>
                      <td>{sale.customer_name || 'Cliente Anónimo'}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="badge badge-primary badge-sm">
                            {sale.total_quantity || 0} items
                          </span>
                          {sale.notes?.includes('intercambio') && (
                            <span className="badge badge-warning badge-sm">
                              <Replace className="mr-1 h-3 w-3" />
                              Intercambio
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{sale.payment_method}</td>
                      <td className="font-semibold">${formatPrice(sale.total)}</td>
                      <td>
                        <div
                          className={`badge ${
                            sale.status === 'Completada'
                              ? 'badge-success'
                              : sale.status === 'Cancelada'
                                ? 'badge-error'
                                : 'badge-warning'
                          } badge-sm`}
                        >
                          {sale.status}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Modal de Detalles de Venta */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="mx-4 my-8 max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-base-100 shadow-2xl">
                <div className="p-6">
                  <div className="mb-6 flex items-center justify-between border-b border-base-300 pb-4">
                    <h3 className="text-2xl font-bold text-warning">
                      Detalles de Venta #{selectedSale?.id}
                    </h3>
                    <button
                      className="hover:bg-warning/10 btn btn-ghost btn-sm btn-circle"
                      onClick={closeModal}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {loadingDetails ? (
                    <div className="flex items-center justify-center py-8">
                      <span className="loading loading-spinner loading-lg"></span>
                      <span className="ml-2">Cargando detalles...</span>
                    </div>
                  ) : saleDetails ? (
                    <div className="space-y-6">
                      {/* Información General */}
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-lg bg-base-200 p-4">
                          <h4 className="mb-2 font-semibold">Información de Venta</h4>
                          <p>
                            <strong>Fecha:</strong> {formatDate(saleDetails.sale.sale_date)}
                          </p>
                          <p>
                            <strong>Estado:</strong>
                            <span
                              className={`badge ml-2 ${
                                saleDetails.sale.status === 'Completada'
                                  ? 'badge-success'
                                  : 'badge-warning'
                              } badge-sm`}
                            >
                              {saleDetails.sale.status}
                            </span>
                          </p>
                          <p>
                            <strong>Método de Pago:</strong> {saleDetails.sale.payment_method}
                          </p>
                          {saleDetails.sale.payment_reference && (
                            <p>
                              <strong>Referencia:</strong> {saleDetails.sale.payment_reference}
                            </p>
                          )}
                        </div>

                        <div className="rounded-lg bg-base-200 p-4">
                          <h4 className="mb-2 font-semibold">Cliente</h4>
                          <p>
                            <strong>Nombre:</strong>{' '}
                            {saleDetails.sale.customer_name || 'Cliente Anónimo'}
                          </p>
                          {saleDetails.sale.customer_phone && (
                            <p>
                              <strong>Teléfono:</strong> {saleDetails.sale.customer_phone}
                            </p>
                          )}
                          {saleDetails.sale.customer_email && (
                            <p>
                              <strong>Email:</strong> {saleDetails.sale.customer_email}
                            </p>
                          )}
                        </div>

                        <div className="rounded-lg bg-base-200 p-4">
                          <h4 className="mb-2 font-semibold">Totales</h4>
                          <p>
                            <strong>Subtotal:</strong> ${formatPrice(saleDetails.sale.subtotal)}
                          </p>
                          {saleDetails.sale.discount > 0 && (
                            <p>
                              <strong>Descuento:</strong> ${formatPrice(saleDetails.sale.discount)}
                            </p>
                          )}
                          <p>
                            <strong>Total:</strong>{' '}
                            <span className="text-lg font-bold text-warning">
                              ${formatPrice(saleDetails.sale.total)}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Productos Vendidos */}
                      {saleDetails.products_sold.length > 0 && (
                        <div>
                          <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                            <Package className="h-5 w-5 text-warning" />
                            Productos Vendidos ({saleDetails.products_sold.length})
                          </h4>
                          <div className="overflow-x-auto rounded-lg">
                            <table className="table w-full">
                              <thead className="bg-warning/10">
                                <tr>
                                  <th className="text-warning">Producto</th>
                                  <th className="text-warning">Talle</th>
                                  <th className="text-warning">Color</th>
                                  <th className="text-warning">Cantidad</th>
                                  <th className="text-warning">Precio Unit.</th>
                                  <th className="text-warning">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {saleDetails.products_sold.map((product, index) => (
                                  <tr key={index}>
                                    <td>
                                      <div>
                                        <div className="font-semibold">{product.product_name}</div>
                                        {product.brand_name && (
                                          <div className="text-sm text-gray-500">
                                            {product.brand_name}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                    <td>
                                      {product.size_name && (
                                        <span className="badge badge-outline">
                                          {product.size_name}
                                        </span>
                                      )}
                                    </td>
                                    <td>
                                      {product.color_name && (
                                        <span className="badge badge-secondary">
                                          {product.color_name}
                                        </span>
                                      )}
                                    </td>
                                    <td className="font-semibold">{product.quantity}</td>
                                    <td>${formatPrice(product.sale_price)}</td>
                                    <td className="font-semibold">${formatPrice(product.total)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Productos Devueltos (si es intercambio) */}
                      {saleDetails.has_exchange && saleDetails.products_returned.length > 0 && (
                        <div>
                          <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-red-600">
                            <RotateCcw className="h-5 w-5" />
                            Productos Devueltos ({saleDetails.products_returned.length})
                          </h4>
                          <div className="overflow-x-auto rounded-lg">
                            <table className="table w-full">
                              <thead className="bg-red-50">
                                <tr>
                                  <th className="text-red-600">Producto</th>
                                  <th className="text-red-600">Talle</th>
                                  <th className="text-red-600">Color</th>
                                  <th className="text-red-600">Cantidad</th>
                                  <th className="text-red-600">Precio Unit.</th>
                                  <th className="text-red-600">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {saleDetails.products_returned.map((product, index) => (
                                  <tr key={index}>
                                    <td>
                                      <div>
                                        <div className="font-semibold">{product.product_name}</div>
                                        {product.brand_name && (
                                          <div className="text-sm text-gray-500">
                                            {product.brand_name}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                    <td>
                                      {product.size_name && (
                                        <span className="badge badge-outline">
                                          {product.size_name}
                                        </span>
                                      )}
                                    </td>
                                    <td>
                                      {product.color_name && (
                                        <span className="badge badge-secondary">
                                          {product.color_name}
                                        </span>
                                      )}
                                    </td>
                                    <td className="font-semibold text-red-600">
                                      -{product.quantity}
                                    </td>
                                    <td>${formatPrice(product.sale_price)}</td>
                                    <td className="font-semibold text-red-600">
                                      -${formatPrice(Math.abs(product.total))}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Notas */}
                      {saleDetails.sale.notes && (
                        <div>
                          <h4 className="mb-2 text-lg font-semibold">Notas</h4>
                          <div className="rounded-lg bg-base-200 p-4">
                            <p className="text-sm">{saleDetails.sale.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      Error al cargar los detalles
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Toaster />
    </>
  )
}
