import { useState, useEffect } from 'react'
import {
  X,
  Package,
  Check,
  Printer,
  Calendar,
  DollarSign,
  Plus,
  CreditCard,
  Download,
  FileText
} from 'lucide-react'
import {
  fetchPurchaseById,
  receivePurchase,
  generateBarcodes
} from '../services/proveedores/purchaseService'
import {
  getPurchasePayments,
  createPurchasePayment,
  deletePurchasePayment
} from '../services/proveedores/paymentService'
import { fetchStorages } from '../services/sucursales/sucursalesService'
import toast from 'react-hot-toast'

export default function PurchaseDetailsModal({ purchaseId, isOpen, onClose, onUpdate }) {
  const [purchase, setPurchase] = useState(null)
  const [loading, setLoading] = useState(false)
  const [storages, setStorages] = useState([])
  const [selectedStorage, setSelectedStorage] = useState('')
  const [showReceiveModal, setShowReceiveModal] = useState(false)

  // Payment management state
  const [payments, setPayments] = useState([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [newPayment, setNewPayment] = useState({
    payment_method: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  useEffect(() => {
    if (isOpen && purchaseId) {
      loadPurchaseDetails()
      loadStorages()
      loadPurchasePayments()
    }
  }, [isOpen, purchaseId])

  const loadPurchaseDetails = async () => {
    try {
      setLoading(true)
      const data = await fetchPurchaseById(purchaseId)
      setPurchase(data)
    } catch (error) {
      console.error('Error loading purchase details:', error)
      toast.error('Error al cargar los detalles de la compra')
    } finally {
      setLoading(false)
    }
  }

  const loadStorages = async () => {
    try {
      const data = await fetchStorages()
      setStorages(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading storages:', error)
      toast.error('Error al cargar las sucursales')
    }
  }

  const loadPurchasePayments = async () => {
    if (!purchaseId) return

    try {
      setLoadingPayments(true)
      const data = await getPurchasePayments(purchaseId)
      if (data.status === 'success') {
        setPayments(data.payments || [])
      }
    } catch (error) {
      console.error('Error loading purchase payments:', error)
      toast.error('Error al cargar los pagos de la compra')
    } finally {
      setLoadingPayments(false)
    }
  }

  const handleCreatePayment = async () => {
    if (!newPayment.payment_method || !newPayment.amount || parseFloat(newPayment.amount) <= 0) {
      toast.error('Por favor complete todos los campos requeridos')
      return
    }

    try {
      const paymentData = {
        ...newPayment,
        amount: parseFloat(newPayment.amount)
      }

      const result = await createPurchasePayment(purchaseId, paymentData)

      if (result.status === 'success') {
        toast.success('Pago registrado exitosamente')
        setNewPayment({
          payment_method: '',
          amount: '',
          payment_date: new Date().toISOString().split('T')[0],
          notes: ''
        })
        setShowPaymentForm(false)
        loadPurchasePayments()
      } else {
        toast.error(result.message || 'Error al registrar el pago')
      }
    } catch (error) {
      console.error('Error creating payment:', error)
      toast.error('Error al registrar el pago')
    }
  }

  const handleDeletePayment = async (paymentId) => {
    if (!confirm('¿Está seguro de que desea eliminar este pago?')) {
      return
    }

    try {
      const result = await deletePurchasePayment(purchaseId, paymentId)

      if (result.status === 'success') {
        toast.success('Pago eliminado exitosamente')
        loadPurchasePayments()
      } else {
        toast.error(result.message || 'Error al eliminar el pago')
      }
    } catch (error) {
      console.error('Error deleting payment:', error)
      toast.error('Error al eliminar el pago')
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount)
  }

  const getTotalPaid = () => {
    return payments.reduce((total, payment) => total + parseFloat(payment.amount || 0), 0)
  }

  const getRemainingAmount = () => {
    const totalPaid = getTotalPaid()
    const purchaseTotal = parseFloat(purchase?.total || 0)
    return Math.max(0, purchaseTotal - totalPaid)
  }

  const handleDownloadFile = async (fileId, fileName) => {
    if (!fileId) {
      toast.error('No hay archivo disponible para descargar')
      return
    }

    try {
      const response = await fetch(`http://localhost:5000/api/purchases/attachment/${fileId}`)

      if (!response.ok) {
        throw new Error('Error al descargar el archivo')
      }

      const data = await response.json()

      // Convert base64 to blob
      const byteCharacters = atob(data.file_content)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/pdf' })

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = data.file_name || fileName || 'archivo.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Archivo descargado exitosamente')
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error('Error al descargar el archivo')
    }
  }

  const handleReceivePurchase = async () => {
    if (!selectedStorage) {
      toast.error('Por favor seleccione una sucursal')
      return
    }

    try {
      setLoading(true)
      await receivePurchase(purchaseId, selectedStorage)
      toast.success('Compra recibida e inventario actualizado exitosamente')

      // Recargar detalles
      await loadPurchaseDetails()
      setShowReceiveModal(false)

      // Notificar al componente padre para actualizar la lista
      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error receiving purchase:', error)
      toast.error('Error al recibir la compra')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateBarcodes = async () => {
    try {
      setLoading(true)
      const result = await generateBarcodes(purchaseId)

      if (result.status === 'éxito') {
        toast.success('Códigos de barras generados exitosamente')
        console.log('Barcodes to print:', result.barcodes)
      }
    } catch (error) {
      console.error('Error generating barcodes:', error)
      toast.error('Error al generar códigos de barras')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-xl font-bold">
            <Package className="h-6 w-6" />
            Detalles de Compra #{purchase?.id}
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="loading loading-spinner loading-lg"></div>
            <span className="ml-2">Cargando detalles...</span>
          </div>
        ) : purchase ? (
          <div className="space-y-6">
            {/* Información general */}
            <div className="rounded-lg bg-base-200 p-4">
              <h4 className="mb-4 font-semibold">Información General</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Proveedor</span>
                  </label>
                  <p className="text-lg">{purchase.provider_name}</p>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Fecha</span>
                  </label>
                  <p>
                    {purchase.purchase_date
                      ? new Date(purchase.purchase_date).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Estado</span>
                  </label>
                  <span
                    className={`badge ${
                      purchase.status === 'Recibido'
                        ? 'badge-success'
                        : purchase.status === 'Pendiente de entrega'
                          ? 'badge-warning'
                          : 'badge-error'
                    }`}
                  >
                    {purchase.status}
                  </span>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Método de Pago</span>
                  </label>
                  <p>{purchase.payment_method || 'N/A'}</p>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-semibold">N° Factura</span>
                  </label>
                  <p>{purchase.invoice_number || 'N/A'}</p>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-semibold">N° Transacción</span>
                  </label>
                  <p>{purchase.transaction_number || 'N/A'}</p>
                </div>

                {purchase.delivery_date && (
                  <div>
                    <label className="label">
                      <span className="label-text font-semibold">Fecha de Entrega</span>
                    </label>
                    <p>{new Date(purchase.delivery_date).toLocaleDateString()}</p>
                  </div>
                )}

                {purchase.notes && (
                  <div className="lg:col-span-3">
                    <label className="label">
                      <span className="label-text font-semibold">Notas</span>
                    </label>
                    <p className="rounded border bg-white p-2 text-sm">{purchase.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Archivos Adjuntos */}
            {(purchase.invoice_file_name || purchase.file_id) && (
              <div className="rounded-lg bg-base-200 p-4">
                <h4 className="mb-4 flex items-center gap-2 font-semibold">
                  <FileText className="h-5 w-5" />
                  Archivos Adjuntos
                </h4>
                <div className="space-y-2">
                  {purchase.invoice_file_name && (
                    <div className="flex items-center justify-between rounded bg-white p-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <Download className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-gray-900">{purchase.invoice_file_name}</p>
                          <p className="text-sm text-gray-500">
                            Factura de compra •{' '}
                            {purchase.invoice_file_extension?.toUpperCase() || 'PDF'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleDownloadFile(purchase.file_id, purchase.invoice_file_name)
                        }
                        className="btn btn-primary btn-outline btn-sm"
                        disabled={!purchase.file_id}
                      >
                        <Download className="h-4 w-4" />
                        Descargar
                      </button>
                    </div>
                  )}
                  {!purchase.invoice_file_name && purchase.file_id && (
                    <div className="flex items-center justify-between rounded bg-white p-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <Download className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-gray-900">Archivo adjunto</p>
                          <p className="text-sm text-gray-500">Documento de compra</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadFile(purchase.file_id, 'archivo-compra')}
                        className="btn btn-primary btn-outline btn-sm"
                      >
                        <Download className="h-4 w-4" />
                        Descargar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Productos */}
            <div className="rounded-lg bg-base-200 p-4">
              <h4 className="mb-4 font-semibold">Productos</h4>
              {purchase.products && purchase.products.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Código</th>
                        <th>Precio Costo</th>
                        <th>Cantidad</th>
                        <th>Descuento</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchase.products.map((product, index) => (
                        <tr key={index}>
                          <td className="font-medium">{product.product_name}</td>
                          <td>{product.barcode}</td>
                          <td>${parseFloat(product.cost_price || 0).toFixed(2)}</td>
                          <td>{product.quantity}</td>
                          <td>${parseFloat(product.discount || 0).toFixed(2)}</td>
                          <td className="font-semibold">
                            ${parseFloat(product.subtotal || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-4 text-center text-gray-500">No hay productos en esta compra</p>
              )}
            </div>

            {/* Totales */}
            <div className="rounded-lg bg-base-200 p-4">
              <h4 className="mb-4 font-semibold">Totales</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="label">
                    <span className="label-text">Subtotal</span>
                  </label>
                  <p className="text-lg font-semibold">
                    ${parseFloat(purchase.subtotal || 0).toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Descuento</span>
                  </label>
                  <p className="text-lg font-semibold">
                    ${parseFloat(purchase.discount || 0).toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-bold">Total</span>
                  </label>
                  <p className="text-xl font-bold text-primary">
                    ${parseFloat(purchase.total || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Management */}
            <div className="rounded-lg bg-base-200 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="font-semibold">Gestión de Pagos</h4>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowPaymentForm(!showPaymentForm)}
                >
                  <Plus className="h-4 w-4" />
                  Agregar Pago
                </button>
              </div>

              {/* Payment Summary */}
              <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded bg-green-100 p-3">
                  <label className="label">
                    <span className="label-text font-semibold text-green-700">Total Pagado</span>
                  </label>
                  <p className="text-lg font-bold text-green-700">
                    {formatCurrency(getTotalPaid())}
                  </p>
                </div>
                <div className="rounded bg-orange-100 p-3">
                  <label className="label">
                    <span className="label-text font-semibold text-orange-700">Pendiente</span>
                  </label>
                  <p className="text-lg font-bold text-orange-700">
                    {formatCurrency(getRemainingAmount())}
                  </p>
                </div>
                <div className="rounded bg-blue-100 p-3">
                  <label className="label">
                    <span className="label-text font-semibold text-blue-700">Estado</span>
                  </label>
                  <span
                    className={`badge ${getRemainingAmount() <= 0 ? 'badge-success' : 'badge-warning'}`}
                  >
                    {getRemainingAmount() <= 0 ? 'Pagado Completo' : 'Pago Pendiente'}
                  </span>
                </div>
              </div>

              {/* Payment Form */}
              {showPaymentForm && (
                <div className="mb-4 rounded-lg bg-base-100 p-4">
                  <h5 className="mb-3 font-semibold">Nuevo Pago</h5>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Método de Pago</span>
                      </label>
                      <select
                        className="select-bordered select"
                        value={newPayment.payment_method}
                        onChange={(e) =>
                          setNewPayment({ ...newPayment, payment_method: e.target.value })
                        }
                      >
                        <option value="">Seleccionar método</option>
                        <option value="efectivo">Efectivo</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="cheque">Cheque</option>
                        <option value="tarjeta">Tarjeta</option>
                      </select>
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Monto</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="input-bordered input"
                        value={newPayment.amount}
                        onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Fecha de Pago</span>
                      </label>
                      <input
                        type="date"
                        className="input-bordered input"
                        value={newPayment.payment_date}
                        onChange={(e) =>
                          setNewPayment({ ...newPayment, payment_date: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Notas</span>
                      </label>
                      <input
                        type="text"
                        className="input-bordered input"
                        value={newPayment.notes}
                        onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                        placeholder="Notas adicionales"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      className="btn btn-primary"
                      onClick={handleCreatePayment}
                      disabled={!newPayment.payment_method || !newPayment.amount}
                    >
                      <DollarSign className="h-4 w-4" />
                      Registrar Pago
                    </button>
                    <button className="btn btn-ghost" onClick={() => setShowPaymentForm(false)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Payments List */}
              {loadingPayments ? (
                <div className="flex items-center justify-center py-4">
                  <div className="loading loading-spinner"></div>
                  <span className="ml-2">Cargando pagos...</span>
                </div>
              ) : payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Método</th>
                        <th>Monto</th>
                        <th>Notas</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td>
                            {payment.payment_date
                              ? new Date(payment.payment_date).toLocaleDateString('es-AR')
                              : 'N/A'}
                          </td>
                          <td>
                            <span className="badge badge-outline">{payment.payment_method}</span>
                          </td>
                          <td className="font-semibold text-green-600">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td>{payment.notes || '-'}</td>
                          <td>
                            <button
                              className="btn btn-error btn-xs"
                              onClick={() => handleDeletePayment(payment.id)}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-4 text-center text-gray-500">
                  <CreditCard className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                  <p>No hay pagos registrados para esta compra</p>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-2">
              {purchase.status === 'Pendiente de entrega' && (
                <button
                  className="btn btn-success"
                  onClick={() => setShowReceiveModal(true)}
                  disabled={loading}
                >
                  <Check className="h-4 w-4" />
                  Marcar como Recibido
                </button>
              )}

              {purchase.status === 'Recibido' && (
                <button
                  className="btn btn-info"
                  onClick={handleGenerateBarcodes}
                  disabled={loading}
                >
                  <Printer className="h-4 w-4" />
                  Generar Códigos de Barras
                </button>
              )}

              <button className="btn" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            No se encontraron detalles de la compra
          </div>
        )}
      </div>

      {/* Modal para recibir compra */}
      {showReceiveModal && (
        <div className="z-60 fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-lg bg-white p-6 shadow-2xl">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
              <Calendar className="h-5 w-5" />
              Recibir Compra
            </h3>

            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Seleccionar Sucursal/Almacén *</span>
                </label>
                <select
                  value={selectedStorage}
                  onChange={(e) => setSelectedStorage(e.target.value)}
                  className="select-bordered select w-full"
                  required
                >
                  <option value="">Seleccionar sucursal...</option>
                  {storages.map((storage) => (
                    <option key={storage.id} value={storage.id}>
                      {storage.name} - {storage.address}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded border border-yellow-200 bg-yellow-50 p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Atención:</strong> Al recibir la compra, los productos se agregarán
                  automáticamente al inventario de la sucursal seleccionada.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setShowReceiveModal(false)
                  setSelectedStorage('')
                }}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleReceivePurchase}
                disabled={loading || !selectedStorage}
              >
                {loading ? 'Procesando...' : 'Recibir Compra'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
