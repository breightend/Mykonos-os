import { X, Download, FileText, Calendar, DollarSign, CreditCard } from 'lucide-react'
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
                      // Navegar a los detalles de la compra
                      console.log('Navigate to purchase details:', operation.purchase_id)
                    }}
                    className="btn btn-primary btn-sm gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Ver Compra Relacionada
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