import { useState, useEffect } from 'react'
import { X, Calendar, DollarSign, FileText, CreditCard } from 'lucide-react'
import { accountMovementsService } from '../services/accountMovements/accountMovementsService'

const ClientAccountModal = ({ isOpen, onClose, clientId, clientName }) => {
  const [movements, setMovements] = useState([])
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadClientData = async () => {
      if (!isOpen || !clientId) return

      try {
        setLoading(true)
        setError(null)

        // Cargar movimientos y balance del cliente
        const [movementsResponse, balanceResponse] = await Promise.all([
          accountMovementsService.getClientMovements(clientId),
          accountMovementsService.getClientBalance(clientId)
        ])

        if (movementsResponse.success) {
          setMovements(movementsResponse.movements)
        }

        if (balanceResponse.success) {
          setBalance(balanceResponse.balance)
        }
      } catch (err) {
        console.error('Error loading client data:', err)
        setError('Error al cargar los datos del cliente')
      } finally {
        setLoading(false)
      }
    }

    loadClientData()
  }, [isOpen, clientId])

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible'
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center space-x-3">
            <CreditCard className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Cuenta Corriente</h2>
              <p className="text-blue-100">{clientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer p-1 transition-colors hover:scale-110 hover:text-gray-200"
            type="button"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Cargando movimientos...</span>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-6">
              {/* Balance Summary */}
              <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
                <h3 className="mb-4 text-xl font-semibold text-gray-800">Resumen de Cuenta</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg bg-white p-4 text-center shadow-sm">
                    <DollarSign className="mx-auto mb-2 h-8 w-8 text-blue-600" />
                    <p className="text-sm text-gray-600">Saldo Actual</p>
                    <p
                      className={`text-2xl font-bold ${balance > 0 ? 'text-red-600' : balance < 0 ? 'text-green-600' : 'text-gray-800'}`}
                    >
                      {formatCurrency(balance)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white p-4 text-center shadow-sm">
                    <FileText className="mx-auto mb-2 h-8 w-8 text-gray-600" />
                    <p className="text-sm text-gray-600">Total Movimientos</p>
                    <p className="text-2xl font-bold text-gray-800">{movements.length}</p>
                  </div>
                  <div className="rounded-lg bg-white p-4 text-center shadow-sm">
                    <Calendar className="mx-auto mb-2 h-8 w-8 text-purple-600" />
                    <p className="text-sm text-gray-600">Último Movimiento</p>
                    <p className="text-sm font-medium text-gray-800">
                      {movements.length > 0
                        ? formatDate(movements[0].created_at)
                        : 'Sin movimientos'}
                    </p>
                  </div>
                </div>

                {balance > 0 && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-sm text-red-700">
                      <strong>Nota:</strong> El cliente tiene una deuda pendiente de{' '}
                      {formatCurrency(balance)}
                    </p>
                  </div>
                )}
              </div>

              {/* Movements List */}
              <div className="rounded-lg border border-gray-200 bg-white">
                <div className="border-b border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-800">Historial de Movimientos</h3>
                </div>

                {movements.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                    <p>No hay movimientos registrados para este cliente.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                            Fecha
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                            Descripción
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                            Método
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                            Debe
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                            Haber
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                            Saldo
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {movements.map((movement, index) => (
                          <tr
                            key={movement.id}
                            className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                          >
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatDate(movement.created_at)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800">
                              <div className="max-w-xs truncate" title={movement.descripcion}>
                                {movement.descripcion}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                                {movement.medio_pago}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm">
                              {movement.debe > 0 && (
                                <span className="font-medium text-red-600">
                                  {formatCurrency(movement.debe)}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-sm">
                              {movement.haber > 0 && (
                                <span className="font-medium text-green-600">
                                  {formatCurrency(movement.haber)}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-sm">
                              <span
                                className={`font-medium ${movement.saldo > 0 ? 'text-red-600' : movement.saldo < 0 ? 'text-green-600' : 'text-gray-800'}`}
                              >
                                {formatCurrency(movement.saldo)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-600 px-6 py-2 text-white hover:bg-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientAccountModal
