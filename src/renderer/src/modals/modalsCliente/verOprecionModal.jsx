export default function VerOprecionModal({ cliente, operacion }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible'
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getOperationType = (movement) => {
    if (!movement) return 'Operación'
    if (movement.debe > 0) {
      return 'Venta a Crédito'
    } else if (movement.haber > 0) {
      return 'Pago Recibido'
    }
    return 'Operación'
  }

  const getOperationIcon = (movement) => {
    if (!movement) return '📝'
    if (movement.debe > 0) {
      return '🛒' // Shopping cart for sales
    } else if (movement.haber > 0) {
      return '💰' // Money bag for payments
    }
    return '📝'
  }

  return (
    <div>
      <dialog id="verOprecionModal" className="modal">
        <div className="modal-box w-11/12 max-w-5xl">
          <div className="mb-6 flex items-center gap-3">
            <span className="text-3xl">{getOperationIcon(operacion)}</span>
            <div>
              <h3 className="text-2xl font-bold">Detalles de la Operación</h3>
              <p className="text-sm text-gray-600">Cliente: {cliente?.entity_name}</p>
            </div>
          </div>

          {operacion ? (
            <div className="space-y-6">
              {/* Operation Type and Status */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                  <h4 className="mb-3 font-semibold text-gray-700 dark:text-gray-300">
                    Información General
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Tipo de operación:</span>
                      <span
                        className={`badge ${operacion.debe > 0 ? 'badge-error' : 'badge-success'}`}
                      >
                        {getOperationType(operacion)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Fecha:</span>
                      <span className="font-medium">{formatDate(operacion.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Número de operación:</span>
                      <span className="font-mono">{operacion.numero_operacion || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Método de pago:</span>
                      <span className="font-medium">{operacion.medio_pago || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                  <h4 className="mb-3 font-semibold text-blue-700 dark:text-blue-300">
                    Información Financiera
                  </h4>
                  <div className="space-y-2">
                    {operacion.debe > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Monto adeudado:</span>
                        <span className="font-bold text-red-600">
                          {formatCurrency(operacion.debe)}
                        </span>
                      </div>
                    )}
                    {operacion.haber > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Monto pagado:</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(operacion.haber)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600 dark:text-gray-400">Saldo después:</span>
                      <span
                        className={`text-lg font-bold ${operacion.saldo > 0 ? 'text-red-600' : operacion.saldo < 0 ? 'text-green-600' : 'text-gray-600'}`}
                      >
                        {formatCurrency(operacion.saldo)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {operacion.descripcion && (
                <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                  <h4 className="mb-2 font-semibold text-yellow-700 dark:text-yellow-300">
                    Descripción
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300">{operacion.descripcion}</p>
                </div>
              )}

              {/* Purchase ID if available */}
              {operacion.purchase_id && (
                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                  <h4 className="mb-2 font-semibold text-green-700 dark:text-green-300">
                    Información de Venta
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300">
                    ID de Venta: <span className="font-mono">{operacion.purchase_id}</span>
                  </p>
                </div>
              )}

              {/* Receipt number if available */}
              {operacion.numero_de_comprobante && (
                <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
                  <h4 className="mb-2 font-semibold text-purple-700 dark:text-purple-300">
                    Comprobante
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300">
                    Número: <span className="font-mono">{operacion.numero_de_comprobante}</span>
                  </p>
                </div>
              )}

              {/* Update information */}
              <div className="rounded-lg bg-gray-100 p-3 dark:bg-gray-700">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Creado: {formatDate(operacion.created_at)}</span>
                  {operacion.updated_at && operacion.updated_at !== operacion.created_at && (
                    <span>Actualizado: {formatDate(operacion.updated_at)}</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500">No hay información de operación disponible</p>
            </div>
          )}

          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-primary">Cerrar</button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  )
}
