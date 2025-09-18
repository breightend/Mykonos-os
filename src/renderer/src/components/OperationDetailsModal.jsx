import { X, Download, FileText, Calendar, DollarSign, CreditCard, Check } from 'lucide-react'
import { formatCurrency, formatMovementType } from '../services/proveedores/accountMovementsService'

export default function OperationDetailsModal({ operation, isOpen, onClose }) {
  if (!isOpen || !operation) return null

  const movementType = formatMovementType(operation)

  const handleDownloadFile = () => {
    if (operation.numero_de_comprobante) {
      // Simular descarga - puedes implementar la lógica real aquí
      const link = document.createElement('a')
      link.href = `http://localhost:5000/api/files/comprobante/${operation.numero_de_comprobante}`
      link.download = `comprobante_${operation.numero_de_comprobante}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      alert('No hay archivo vinculado a esta operación')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-800">Detalles de la Operación</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="rounded-lg bg-gray-50 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-700">
              <FileText className="h-5 w-5" />
              Información General
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-500">Número de Operación</label>
                <p className="font-mono text-lg text-gray-900">#{operation.numero_operacion}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Tipo de Movimiento</label>
                <span className={`badge ${movementType.badge} badge-lg`}>{movementType.label}</span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Descripción</label>
                <p className="text-gray-900">{operation.descripcion || 'Sin descripción'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Método de Pago</label>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span className="capitalize">{operation.medio_pago || 'No especificado'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div className="rounded-lg bg-blue-50 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-blue-700">
              <DollarSign className="h-5 w-5" />
              Detalles Financieros
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Debe</label>
                <p
                  className={`text-xl font-bold ${operation.debe > 0 ? 'text-red-600' : 'text-gray-400'}`}
                >
                  {formatCurrency(operation.debe)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Haber</label>
                <p
                  className={`text-xl font-bold ${operation.haber > 0 ? 'text-green-600' : 'text-gray-400'}`}
                >
                  {formatCurrency(operation.haber)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Saldo Resultante</label>
                <p
                  className={`text-xl font-bold ${operation.saldo > 0 ? 'text-red-600' : operation.saldo < 0 ? 'text-green-600' : 'text-gray-600'}`}
                >
                  {formatCurrency(operation.saldo)}
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Payment Details (if available) */}
          {(operation.payment_details_id ||
            operation.payment_method_name ||
            operation.bank_name) && (
            <div className="rounded-lg bg-green-50 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-green-700">
                <CreditCard className="h-5 w-5" />
                Detalles del Pago
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {operation.payment_method_display_name && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Método de Pago</label>
                    <div className="flex items-center gap-2">
                      {operation.payment_method_icon && (
                        <span className="text-lg">{operation.payment_method_icon}</span>
                      )}
                      <span className="font-medium text-green-700">
                        {operation.payment_method_display_name}
                      </span>
                    </div>
                    {operation.payment_method_description && (
                      <p className="mt-1 text-xs text-gray-600">
                        {operation.payment_method_description}
                      </p>
                    )}
                  </div>
                )}

                {operation.bank_name && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Banco</label>
                    <p className="font-medium text-gray-900">{operation.bank_name}</p>
                    {operation.bank_swift_code && (
                      <p className="font-mono text-xs text-gray-600">
                        SWIFT: {operation.bank_swift_code}
                      </p>
                    )}
                  </div>
                )}

                {operation.payment_amount && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Monto del Pago</label>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(operation.payment_amount)}
                    </p>
                  </div>
                )}

                {operation.numero_de_comprobante && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Número de Comprobante
                    </label>
                    <p className="font-mono text-gray-900">{operation.numero_de_comprobante}</p>
                  </div>
                )}
              </div>

              {operation.payment_method_requires_reference && !operation.numero_de_comprobante && (
                <div className="mt-3 rounded-md bg-yellow-100 p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Este método de pago requiere número de referencia pero no se proporcionó uno.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Purchase Details (if available) */}
          {operation.purchase_id && (
            <div className="rounded-lg bg-purple-50 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-purple-700">
                <FileText className="h-5 w-5" />
                Detalles de la Compra Relacionada
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-500">ID de Compra</label>
                  <p className="font-mono text-purple-600">#{operation.purchase_id}</p>
                </div>
                {operation.purchase_status && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Estado de la Compra</label>
                    <span className="badge badge-secondary">{operation.purchase_status}</span>
                  </div>
                )}
                {operation.purchase_subtotal && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Subtotal de la Compra
                    </label>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(operation.purchase_subtotal)}
                    </p>
                  </div>
                )}
                {operation.purchase_total && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total de la Compra</label>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(operation.purchase_total)}
                    </p>
                  </div>
                )}
                {operation.purchase_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Fecha de Compra</label>
                    <p className="text-gray-900">
                      {new Date(operation.purchase_date).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                )}
                {operation.purchase_delivery_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Fecha de Entrega</label>
                    <p className="text-gray-900">
                      {new Date(operation.purchase_delivery_date).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                )}
                {operation.purchase_invoice_number && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Número de Factura</label>
                    <p className="font-mono text-gray-900">{operation.purchase_invoice_number}</p>
                  </div>
                )}
                {operation.purchase_notes && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">Notas de la Compra</label>
                    <p className="text-gray-900">{operation.purchase_notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Information (if available) */}
          {operation.purchase_id && (operation.total_payments || operation.payment_count) && (
            <div className="rounded-lg bg-green-50 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-green-700">
                <DollarSign className="h-5 w-5" />
                Información de Pagos de la Compra
              </h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {operation.total_payments && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Pagado</label>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(operation.total_payments)}
                    </p>
                  </div>
                )}
                {operation.payment_count && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Número de Pagos</label>
                    <p className="font-semibold text-gray-900">{operation.payment_count}</p>
                  </div>
                )}
                {operation.last_payment_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Último Pago</label>
                    <p className="text-gray-900">
                      {new Date(operation.last_payment_date).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                )}
                {operation.payment_methods && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Métodos de Pago</label>
                    <p className="text-gray-900">{operation.payment_methods}</p>
                  </div>
                )}
                {/* Payment Status */}
                {operation.purchase_total && operation.total_payments && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">Estado de Pago</label>
                    <div className="flex items-center gap-2">
                      {operation.total_payments >= operation.purchase_total ? (
                        <span className="badge badge-success gap-1">
                          <Check className="h-3 w-3" />
                          Pagado Completamente
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="badge badge-warning gap-1">
                            <DollarSign className="h-3 w-3" />
                            Pago Parcial
                          </span>
                          <span className="text-sm text-gray-600">
                            Pendiente:{' '}
                            {formatCurrency(operation.purchase_total - operation.total_payments)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dates and References */}
          <div className="rounded-lg bg-yellow-50 p-4">
            <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-yellow-700">
              <Calendar className="h-5 w-5" />
              Fechas y Referencias
            </h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-500">Fecha de Creación</label>
                <p className="text-gray-900">
                  {operation.created_at
                    ? new Date(operation.created_at).toLocaleString('es-AR')
                    : 'No disponible'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Última Modificación</label>
                <p className="text-gray-900">
                  {operation.updated_at
                    ? new Date(operation.updated_at).toLocaleString('es-AR')
                    : 'No disponible'}
                </p>
              </div>
              {operation.purchase_id && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    ID de Compra Relacionada
                  </label>
                  <p className="font-mono text-blue-600">#{operation.purchase_id}</p>
                </div>
              )}
              {operation.numero_de_comprobante && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Número de Comprobante</label>
                  <p className="font-mono text-gray-900">{operation.numero_de_comprobante}</p>
                </div>
              )}
            </div>
          </div>

          {/* Additional Details */}
          {(operation.numero_de_comprobante || operation.purchase_id) && (
            <div className="rounded-lg bg-green-50 p-4">
              <h4 className="mb-3 text-lg font-semibold text-green-700">Archivos y Documentos</h4>
              <div className="flex flex-wrap gap-3">
                {operation.numero_de_comprobante && (
                  <button onClick={handleDownloadFile} className="btn btn-success btn-sm gap-2">
                    <Download className="h-4 w-4" />
                    Descargar Comprobante
                  </button>
                )}
                {operation.purchase_id && (
                  <button
                    onClick={() => {
                      // Show more purchase info or navigate to purchase details
                      console.log('Purchase details available in operation data:', {
                        id: operation.purchase_id,
                        status: operation.purchase_status,
                        total: operation.purchase_total,
                        date: operation.purchase_date
                      })
                      // You can implement navigation or show additional details here
                    }}
                    className="btn btn-primary btn-sm gap-2"
                    title="Información de la compra disponible arriba"
                  >
                    <FileText className="h-4 w-4" />
                    Ver Compra #{operation.purchase_id}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="btn btn-primary">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
