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
      return '🛒'
    } else if (movement.haber > 0) {
      return '💰'
    }
    return '📝'
  }

  return (
    <div>
      <dialog id="verOprecionModal" className="modal">
        <div className="modal-box w-11/12 max-w-6xl">
          <div className="mb-6 flex items-center gap-3">
            <span className="text-3xl">{getOperationIcon(operacion)}</span>
            <div>
              <h3 className="text-2xl font-bold text-accent">Detalles de la Operación</h3>
              <p className="text-sm text-gray-600">Cliente: {cliente?.entity_name}</p>
            </div>
          </div>

          {operacion ? (
            <div className="space-y-6">
              <div className="gap-6 md:grid-cols-2">
                <div className="rounded-lg bg-primary/10 p-4">
                  <h4 className="mb-3 font-semibold">Información General</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="">Tipo de operación:</span>
                      <span
                        className={`badge p-2 ${operacion.debe > 0 ? 'badge-error' : 'badge-success'}`}
                      >
                        {getOperationType(operacion)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Fecha: </span>
                      <span className="font-medium"> {formatDate(operacion.created_at)}</span>
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
                <br />
                <div className="rounded-lg bg-secondary/10 p-4">
                  <h4 className="mb-3 font-semibold">Información Financiera</h4>
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
                <div className="rounded-lg bg-accent/10 p-4">
                  <h4 className="mb-2 font-semibold">Descripción</h4>
                  <p className="">{operacion.descripcion}</p>
                </div>
              )}

              {/* Purchase ID if available */}
              {operacion.purchase_id && (
                <div className="rounded-lg p-4">
                  <h4 className="mb-2 font-semibold">Información de Venta</h4>
                  <p className="">
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
              <div className="rounded-lg bg-primary/20 p-3 ">
                <div className="flex justify-between text-sm ">
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
