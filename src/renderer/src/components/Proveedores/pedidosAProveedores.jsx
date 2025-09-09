import {
  ArrowLeft,
  Eye,
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Download,
  BarChart3
} from 'lucide-react'
import { useLocation } from 'wouter'
import {
  fetchPurchases,
  fetchPurchaseById,
  updatePurchaseStatus,
  receivePurchase,
  fetchPurchasesSummary
} from '../../services/proveedores/purchaseService'
import { useEffect, useState } from 'react'

export default function PedidosAProveedores() {
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [summary, setSummary] = useState({})
  const [location, setLocation] = useLocation()

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)

  const handleVolver = () => {
    setLocation('/proveedores')
  }

  const statusOptions = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'Pendiente de entrega', label: 'Pendiente de entrega' },
    { value: 'Recibido', label: 'Recibido' },
    { value: 'Cancelado', label: 'Cancelado' }
  ]

  const periodOptions = [
    { value: 'all', label: 'Todo el tiempo' },
    { value: '30', label: 'Últimos 30 días' },
    { value: '60', label: 'Últimos 60 días' },
    { value: '90', label: 'Últimos 90 días' }
  ]

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pendiente de entrega': {
        icon: <Clock className="h-4 w-4" />,
        class: 'badge-warning',
        text: 'Pendiente'
      },
      Recibido: {
        icon: <CheckCircle className="h-4 w-4" />,
        class: 'badge-success',
        text: 'Recibido'
      },
      Cancelado: {
        icon: <X className="h-4 w-4" />,
        class: 'badge-error',
        text: 'Cancelado'
      }
    }

    const config = statusConfig[status] || {
      icon: <AlertCircle className="h-4 w-4" />,
      class: 'badge-neutral',
      text: status
    }

    return (
      <div className={`badge ${config.class} gap-1`}>
        {config.icon}
        {config.text}
      </div>
    )
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const [purchasesData, summaryData] = await Promise.all([
        fetchPurchases(),
        fetchPurchasesSummary()
      ])
      setPurchases(purchasesData)
      setSummary(summaryData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (purchaseId, newStatus) => {
    try {
      await updatePurchaseStatus(purchaseId, newStatus)
      fetchData() // Refresh data
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleReceivePurchase = async (purchaseId, storageId = 1) => {
    try {
      await receivePurchase(purchaseId, storageId)
      fetchData() // Refresh data
    } catch (error) {
      console.error('Error receiving purchase:', error)
    }
  }

  const openPurchaseModal = async (purchaseId) => {
    try {
      setModalLoading(true)
      setShowModal(true)
      const purchaseDetails = await fetchPurchaseById(purchaseId)
      setSelectedPurchase(purchaseDetails)
    } catch (error) {
      console.error('Error fetching purchase details:', error)
    } finally {
      setModalLoading(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedPurchase(null)
  }

  const filterPurchases = () => {
    let filtered = purchases

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((purchase) => purchase.status === selectedStatus)
    }

    // Filter by period
    if (selectedPeriod !== 'all') {
      const days = parseInt(selectedPeriod)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      filtered = filtered.filter((purchase) => {
        const purchaseDate = new Date(purchase.purchase_date)
        return purchaseDate >= cutoffDate
      })
    }

    return filtered
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredPurchases = filterPurchases()

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <button className="btn btn-ghost" onClick={handleVolver}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-3xl font-bold">Pedidos a Proveedores</h1>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="stat rounded-box bg-base-200">
          <div className="stat-figure text-primary">
            <Package className="h-8 w-8" />
          </div>
          <div className="stat-title">Total Compras</div>
          <div className="stat-value text-primary">{summary.summary?.total_purchases || 0}</div>
        </div>

        <div className="stat rounded-box bg-base-200">
          <div className="stat-figure text-success">
            <TrendingUp className="h-8 w-8" />
          </div>
          <div className="stat-title">Monto Total</div>
          <div className="stat-value text-lg text-success">
            {formatCurrency(summary.summary?.total_amount)}
          </div>
        </div>

        <div className="stat rounded-box bg-base-200">
          <div className="stat-figure text-warning">
            <Clock className="h-8 w-8" />
          </div>
          <div className="stat-title">Pendientes</div>
          <div className="stat-value text-warning">{summary.summary?.pending_purchases || 0}</div>
        </div>

        <div className="stat rounded-box bg-base-200">
          <div className="stat-figure text-info">
            <CheckCircle className="h-8 w-8" />
          </div>
          <div className="stat-title">Recibidas</div>
          <div className="stat-value text-info">{summary.summary?.received_purchases || 0}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6 bg-base-200 p-4">
        <h2 className="mb-4 text-xl font-semibold">Filtros</h2>
        <div className="flex flex-wrap gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Período</span>
            </label>
            <select
              className="select-bordered select w-48"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Estado</span>
            </label>
            <select
              className="select-bordered select w-48"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">
            Información de Compras
            <div className="badge badge-secondary">{filteredPurchases.length} compras</div>
          </h2>

          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Proveedor</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Cambiar Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td>{purchase.id}</td>
                    <td>{formatDate(purchase.purchase_date)}</td>
                    <td>{purchase.provider_name}</td>
                    <td className="font-semibold">{formatCurrency(purchase.total)}</td>
                    <td>{getStatusBadge(purchase.status)}</td>
                    <td>
                      <div className="dropdown dropdown-end">
                        <button
                          tabIndex={0}
                          className="btn btn-outline btn-sm"
                          disabled={purchase.status === 'Recibido'}
                        >
                          Cambiar
                        </button>
                        <ul
                          tabIndex={0}
                          className="dropdown-content menu z-[1] w-52 rounded-box bg-base-100 p-2 shadow"
                        >
                          {purchase.status !== 'Recibido' && (
                            <li>
                              <button
                                onClick={() => handleStatusChange(purchase.id, 'Recibido')}
                                className="text-success"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Marcar como Recibido
                              </button>
                            </li>
                          )}
                          {purchase.status !== 'Cancelado' && (
                            <li>
                              <button
                                onClick={() => handleStatusChange(purchase.id, 'Cancelado')}
                                className="text-error"
                              >
                                <X className="h-4 w-4" />
                                Marcar como Cancelado
                              </button>
                            </li>
                          )}
                          {purchase.status === 'Pendiente de entrega' && (
                            <li>
                              <button
                                onClick={() => handleReceivePurchase(purchase.id)}
                                className="text-info"
                              >
                                <Package className="h-4 w-4" />
                                Recibir y Actualizar Stock
                              </button>
                            </li>
                          )}
                        </ul>
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => openPurchaseModal(purchase.id)}
                      >
                        <Eye className="h-4 w-4" />
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Purchase Details Modal */}
      {showModal && (
        <div className="modal-open modal">
          <div className="modal-box w-11/12 max-w-5xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Detalles de la Compra</h3>
              <button className="btn btn-ghost btn-sm btn-circle" onClick={closeModal}>
                ✕
              </button>
            </div>

            {modalLoading ? (
              <div className="flex h-64 items-center justify-center">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : (
              selectedPurchase && (
                <div className="space-y-6">
                  {/* Purchase Info */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="card bg-base-200">
                      <div className="card-body">
                        <h4 className="card-title text-sm">Información de la Compra</h4>
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>ID:</strong> #{selectedPurchase.id}
                          </p>
                          <p>
                            <strong>Fecha:</strong> {formatDate(selectedPurchase.purchase_date)}
                          </p>
                          <p>
                            <strong>Estado:</strong> {getStatusBadge(selectedPurchase.status)}
                          </p>
                          <p>
                            <strong>Subtotal:</strong> {formatCurrency(selectedPurchase.subtotal)}
                          </p>
                          <p>
                            <strong>Descuento:</strong> {formatCurrency(selectedPurchase.discount)}
                          </p>
                          <p>
                            <strong>Total:</strong>{' '}
                            <span className="font-bold">
                              {formatCurrency(selectedPurchase.total)}
                            </span>
                          </p>
                          {selectedPurchase.invoice_number && (
                            <p>
                              <strong>N° Factura:</strong> {selectedPurchase.invoice_number}
                            </p>
                          )}
                          {selectedPurchase.transaction_number && (
                            <p>
                              <strong>N° Transacción:</strong> {selectedPurchase.transaction_number}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="card bg-base-200">
                      <div className="card-body">
                        <h4 className="card-title text-sm">Información del Proveedor</h4>
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Nombre:</strong> {selectedPurchase.provider_name}
                          </p>
                          {selectedPurchase.provider_cuit && (
                            <p>
                              <strong>CUIT:</strong> {selectedPurchase.provider_cuit}
                            </p>
                          )}
                          {selectedPurchase.provider_phone && (
                            <p>
                              <strong>Teléfono:</strong> {selectedPurchase.provider_phone}
                            </p>
                          )}
                          {selectedPurchase.provider_email && (
                            <p>
                              <strong>Email:</strong> {selectedPurchase.provider_email}
                            </p>
                          )}
                          {selectedPurchase.provider_address && (
                            <p>
                              <strong>Dirección:</strong> {selectedPurchase.provider_address}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  {(selectedPurchase.payment_method_name || selectedPurchase.bank_name) && (
                    <div className="card bg-base-200">
                      <div className="card-body">
                        <h4 className="card-title text-sm">Información de Pago</h4>
                        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                          {selectedPurchase.payment_method_name && (
                            <p>
                              <strong>Método de Pago:</strong>{' '}
                              {selectedPurchase.payment_method_name}
                            </p>
                          )}
                          {selectedPurchase.bank_name && (
                            <p>
                              <strong>Banco:</strong> {selectedPurchase.bank_name}
                            </p>
                          )}
                          {selectedPurchase.payment_method_amount && (
                            <p>
                              <strong>Monto:</strong>{' '}
                              {formatCurrency(selectedPurchase.payment_method_amount)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Products Table */}
                  <div className="card bg-base-200">
                    <div className="card-body">
                      <h4 className="card-title text-sm">Productos Comprados</h4>
                      <div className="overflow-x-auto">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Producto</th>
                              <th>Marca</th>
                              <th>Código</th>
                              <th>Cantidad</th>
                              <th>Precio Costo</th>
                              <th>Descuento</th>
                              <th>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedPurchase.products?.map((product, index) => (
                              <tr key={index}>
                                <td>{product.product_name}</td>
                                <td>{product.brand_name || 'N/A'}</td>
                                <td>{product.provider_code || 'N/A'}</td>
                                <td>{product.quantity}</td>
                                <td>{formatCurrency(product.cost_price)}</td>
                                <td>{formatCurrency(product.discount)}</td>
                                <td className="font-semibold">
                                  {formatCurrency(product.subtotal)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="font-bold">
                              <td colSpan="6">Total:</td>
                              <td>{formatCurrency(selectedPurchase.total)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedPurchase.notes && (
                    <div className="card bg-base-200">
                      <div className="card-body">
                        <h4 className="card-title text-sm">Notas</h4>
                        <p className="text-sm">{selectedPurchase.notes}</p>
                      </div>
                    </div>
                  )}

                  {/* Attachments */}
                  {selectedPurchase.invoice_file_name && (
                    <div className="card bg-base-200">
                      <div className="card-body">
                        <h4 className="card-title text-sm">Archivos Adjuntos</h4>
                        <div className="flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          <span className="text-sm">{selectedPurchase.invoice_file_name}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            )}

            <div className="modal-action">
              <button className="btn" onClick={closeModal}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
