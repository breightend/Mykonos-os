import { useState, useEffect } from 'react'
import { X, Package, Check, Printer, Calendar } from 'lucide-react'
import {
  fetchPurchaseById,
  receivePurchase,
  generateBarcodes
} from '../services/proveedores/purchaseService'
import { fetchStorages } from '../services/sucursales/sucursalesService'
import toast from 'react-hot-toast'

export default function PurchaseDetailsModal({ purchaseId, isOpen, onClose, onUpdate }) {
  const [purchase, setPurchase] = useState(null)
  const [loading, setLoading] = useState(false)
  const [storages, setStorages] = useState([])
  const [selectedStorage, setSelectedStorage] = useState('')
  const [showReceiveModal, setShowReceiveModal] = useState(false)

  useEffect(() => {
    if (isOpen && purchaseId) {
      loadPurchaseDetails()
      loadStorages()
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
        // Aquí podrías abrir una ventana para imprimir o descargar los códigos
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
                          <td>${product.cost_price?.toFixed(2)}</td>
                          <td>{product.quantity}</td>
                          <td>${product.discount?.toFixed(2) || '0.00'}</td>
                          <td className="font-semibold">${product.subtotal?.toFixed(2)}</td>
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
                  <p className="text-lg font-semibold">${purchase.subtotal?.toFixed(2)}</p>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Descuento</span>
                  </label>
                  <p className="text-lg font-semibold">
                    ${purchase.discount?.toFixed(2) || '0.00'}
                  </p>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-bold">Total</span>
                  </label>
                  <p className="text-xl font-bold text-primary">${purchase.total?.toFixed(2)}</p>
                </div>
              </div>
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
