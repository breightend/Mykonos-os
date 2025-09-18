import { ArrowLeft, Pencil, Trash2, Package, RotateCcw, RefreshCw, Shirt } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'wouter'
import AgregarCompraModal from '../modals/modalsCliente/agregarCompraModal'
import AgregarPagoModal from '../modals/modalsCliente/agregarPagoModal'
import EditarClienteModal from '../modals/modalsCliente/editarClienteModal'
import VerOprecionModal from '../modals/modalsCliente/verOprecionModal'
import { fetchClienteById } from '../services/clientes/clientsService'
import EliminarClienteModal from '../modals/modalsCliente/eliminarClienteModal'
import { accountMovementsService } from '../services/accountMovements/accountMovementsService'
import { clientSalesService } from '../services/clientSales/clientSalesService'
import { toast } from 'react-hot-toast'

export default function InfoClientes() {
  const [, setLocation] = useLocation()
  const [searchParams] = useSearchParams()
  const clientId = searchParams.get('id')
  const [cliente, setCliente] = useState(null)
  const [operacionSeleccionada, setOperacionSeleccionada] = useState(null)
  const [movements, setMovements] = useState([])
  const [clientBalance, setClientBalance] = useState(0)
  const [loadingMovements, setLoadingMovements] = useState(false)
  const [salesHistory, setSalesHistory] = useState([])
  const [loadingSales, setLoadingSales] = useState(false)
  const [showOperations, setShowOperations] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch client data
        const data = await fetchClienteById(clientId)
        console.log(data)
        setCliente(data.record)

        // Fetch account movements and sales history
        if (clientId) {
          setLoadingMovements(true)
          setLoadingSales(true)
          try {
            const [movementsResponse, balanceResponse, salesResponse] = await Promise.all([
              accountMovementsService.getClientMovements(clientId),
              accountMovementsService.getClientBalance(clientId),
              clientSalesService.getClientSalesHistory(clientId)
            ])

            if (movementsResponse.success) {
              setMovements(movementsResponse.movements || [])
            }

            if (balanceResponse.success) {
              setClientBalance(balanceResponse.balance || 0)
            }

            if (salesResponse.success) {
              setSalesHistory(salesResponse.sales || [])
            }
          } catch (movementError) {
            console.error('Error fetching data:', movementError)
            setMovements([])
            setClientBalance(0)
            setSalesHistory([])
          } finally {
            setLoadingMovements(false)
            setLoadingSales(false)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [clientId])

  console.log('{Cliente}', { cliente })
  console.log('Nombre: ', cliente?.entity_name)
  console.log('Ciente: ', cliente)

  const handleRowClick = (movement) => {
    setOperacionSeleccionada(movement)
    console.log('Operación seleccionada:', movement)
  }

  const handleRowDoubleClick = (movement) => {
    setOperacionSeleccionada(movement)
    document.getElementById('verOprecionModal').showModal()
    console.log('Ver detalles de operación:', movement)
  }

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Handle return product
  const handleReturn = async (sale) => {
    if (
      confirm(`¿Está seguro de procesar la devolución de ${sale.product_name || 'este producto'}?`)
    ) {
      try {
        const returnData = {
          entity_id: clientId,
          original_sale_id: sale.sale_id,
          return_amount: sale.total_amount,
          return_reason: 'Devolución procesada desde interfaz'
        }
        const response = await clientSalesService.createReturn(returnData)
        if (response.success) {
          toast.success('Devolución procesada exitosamente')
          refreshMovements() // Refresh data
        } else {
          toast.error(response.message || 'Error al procesar la devolución')
        }
      } catch (error) {
        console.error('Error processing return:', error)
        toast.error('Error al procesar la devolución')
      }
    }
  }

  // Handle exchange product
  const handleExchange = async (sale) => {
    if (confirm(`¿Está seguro de procesar el cambio de ${sale.product_name || 'este producto'}?`)) {
      try {
        const exchangeData = {
          entity_id: clientId,
          original_sale_id: sale.sale_id,
          exchange_reason: 'Cambio procesado desde interfaz'
        }
        const response = await clientSalesService.createExchange(exchangeData)
        if (response.success) {
          toast.success('Cambio procesado exitosamente')
          refreshMovements() // Refresh data
        } else {
          toast.error(response.message || 'Error al procesar el cambio')
        }
      } catch (error) {
        console.error('Error processing exchange:', error)
        toast.error('Error al procesar el cambio')
      }
    }
  }

  const getOperationType = (movement) => {
    if (movement.debe > 0) {
      return 'Venta a Crédito'
    } else if (movement.haber > 0) {
      return 'Pago Recibido'
    }
    return 'Operación'
  }

  // Function to refresh movements after a payment is added
  const refreshMovements = async () => {
    if (clientId) {
      setLoadingMovements(true)
      setLoadingSales(true)
      try {
        const [movementsResponse, balanceResponse, salesResponse] = await Promise.all([
          accountMovementsService.getClientMovements(clientId),
          accountMovementsService.getClientBalance(clientId),
          clientSalesService.getClientSalesHistory(clientId)
        ])

        if (movementsResponse.success) {
          setMovements(movementsResponse.movements || [])
        }

        if (balanceResponse.success) {
          setClientBalance(balanceResponse.balance || 0)
        }

        if (salesResponse.success) {
          setSalesHistory(salesResponse.sales || [])
        }
      } catch (error) {
        console.error('Error refreshing data:', error)
      } finally {
        setLoadingMovements(false)
        setLoadingSales(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto max-w-7xl p-6">
        <div className="mb-6 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-primary to-secondary p-6 text-white shadow-lg">
          <button
            className="tooltip tooltip-bottom rounded-full bg-orange-600 px-3 py-2 hover:bg-orange-500"
            data-tip="Volver"
            onClick={() => setLocation('/clientes')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h3 className="text-3xl font-bold">{cliente?.entity_name}</h3>
            <p className="mt-1 text-blue-100">Información del cliente</p>
          </div>
        </div>
        <div className="card mb-6 bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="mb-4 flex flex-wrap gap-3">
              <button
                className="btn btn-primary gap-2 shadow-md transition-all hover:shadow-lg"
                onClick={() => document.getElementById('editandoCliente').showModal()}
              >
                <Pencil className="h-4 w-4" />
                Editar cliente
              </button>
              <button
                className="btn btn-error gap-2 shadow-md transition-all hover:shadow-lg"
                onClick={() => document.getElementById('eliminandoCliente').showModal()}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar cliente
              </button>
            </div>

            {cliente && (
              <div className="overflow-x-auto rounded-lg">
                <table className="table w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600">
                      <th className="text-slate-700 dark:text-slate-200">#</th>
                      <th className="text-slate-700 dark:text-slate-200">Nombre y apellido</th>
                      <th className="text-slate-700 dark:text-slate-200">DNI o CUIT</th>
                      <th className="text-slate-700 dark:text-slate-200">Celular</th>
                      <th className="text-slate-700 dark:text-slate-200">Domicilio</th>
                      <th className="text-slate-700 dark:text-slate-200">Mail</th>
                      <th className="text-slate-700 dark:text-slate-200">Razón Social</th>
                      <th className="text-slate-700 dark:text-slate-200">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                      onClick={() => handleRowClick(cliente)}
                    >
                      <th>1</th>
                      <td className="font-medium">{cliente?.entity_name}</td>
                      <td>{cliente?.cuit}</td>
                      <td>{cliente?.phone_number}</td>
                      <td>{cliente?.domicilio_comercial}</td>
                      <td>{cliente?.email}</td>
                      <td>{cliente?.razon_social}</td>
                      <td>{cliente?.observations}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        <div>
          <hr className="my-6 border-slate-200 dark:border-slate-600" />

          {/* Operations Section - Slideable */}
          <div className="card mb-6 bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-primary">Registro de operaciones</h2>
                  <button
                    className="btn btn-ghost btn-sm btn-circle"
                    onClick={() => setShowOperations(!showOperations)}
                  >
                    {showOperations ? (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Saldo actual:</div>
                  <div
                    className={`text-2xl font-bold ${clientBalance > 0 ? 'text-red-600' : clientBalance < 0 ? 'text-green-600' : 'text-gray-600'}`}
                  >
                    {formatCurrency(clientBalance)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {clientBalance > 0 ? 'Debe' : clientBalance < 0 ? 'A favor' : 'Sin deuda'}
                  </div>
                </div>
              </div>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${showOperations ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <div className="mb-4 flex justify-end">
                  <button
                    className="btn btn-primary gap-2 shadow-md transition-all hover:shadow-lg"
                    onClick={() => document.getElementById('agregandoPago').showModal()}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Agregar pago
                  </button>
                </div>

                <div className="overflow-x-auto rounded-lg">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600">
                        <th className="text-slate-700 dark:text-slate-200">#</th>
                        <th className="text-slate-700 dark:text-slate-200">Fecha</th>
                        <th className="text-slate-700 dark:text-slate-200">Operación</th>
                        <th className="text-slate-700 dark:text-slate-200">Método de Pago</th>
                        <th className="text-slate-700 dark:text-slate-200">Detalles del Pago</th>
                        <th className="text-slate-700 dark:text-slate-200">Debe</th>
                        <th className="text-slate-700 dark:text-slate-200">Haber</th>
                        <th className="text-slate-700 dark:text-slate-200">Saldo</th>
                        <th className="text-slate-700 dark:text-slate-200">Descripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingMovements ? (
                        <tr>
                          <td colSpan="9" className="py-8 text-center">
                            <div className="flex items-center justify-center">
                              <div className="loading loading-spinner loading-md mr-2"></div>
                              <span className="text-slate-600 dark:text-slate-300">
                                Cargando movimientos...
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : movements.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="py-8 text-center">
                            <div className="text-slate-500 dark:text-slate-400">
                              <Package className="mx-auto mb-2 h-12 w-12 opacity-50" />
                              No hay movimientos registrados
                            </div>
                          </td>
                        </tr>
                      ) : (
                        movements.map((movement, index) => (
                          <tr
                            key={movement.id || index}
                            className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                            onClick={() => handleRowClick(movement)}
                            onDoubleClick={() => handleRowDoubleClick(movement)}
                          >
                            <th className="font-medium">{index + 1}</th>
                            <td className="font-medium">{formatDate(movement.created_at)}</td>
                            <td>
                              <span
                                className={`badge ${movement.debe > 0 ? 'badge-error' : 'badge-success'} shadow-sm`}
                              >
                                {getOperationType(movement)}
                              </span>
                            </td>
                            <td>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {movement.payment_method_display_name ||
                                    movement.medio_pago ||
                                    'N/A'}
                                </span>
                                {movement.bank_name && (
                                  <span className="text-xs text-gray-500">
                                    {movement.bank_name}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="flex flex-col text-xs">
                                {movement.numero_de_comprobante && (
                                  <span className="font-mono text-blue-600">
                                    #{movement.numero_de_comprobante}
                                  </span>
                                )}
                                {movement.payment_amount && (
                                  <span className="font-medium text-green-600">
                                    {formatCurrency(movement.payment_amount)}
                                  </span>
                                )}
                                {movement.payment_details_id && (
                                  <span className="text-xs text-gray-500">
                                    ID: {movement.payment_details_id}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className={movement.debe > 0 ? 'font-bold text-red-600' : ''}>
                              {movement.debe > 0 ? formatCurrency(movement.debe) : '-'}
                            </td>
                            <td className={movement.haber > 0 ? 'font-bold text-green-600' : ''}>
                              {movement.haber > 0 ? formatCurrency(movement.haber) : '-'}
                            </td>
                            <td
                              className={`font-bold ${movement.saldo > 0 ? 'text-red-600' : movement.saldo < 0 ? 'text-green-600' : 'text-gray-600'}`}
                            >
                              {formatCurrency(movement.saldo)}
                            </td>
                            <td className="max-w-xs truncate" title={movement.descripcion}>
                              {movement.descripcion || 'Sin descripción'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {movements.length > 0 && (
                    <div className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
                      💡 Haz doble clic en una operación para ver los detalles completos
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex justify-center">
        <button
          className="btn btn-primary btn-wide gap-2 shadow-lg transition-all hover:shadow-xl"
          onClick={() => setLocation('/clientes')}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Clientes
        </button>
      </div>

      {/* Sales History Section */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title flex items-center gap-2 text-xl text-primary dark:text-slate-200">
            <Shirt className="h-5 w-5" />
            Historial de productos vendidos
          </h3>

          {loadingSales ? (
            <div className="flex justify-center py-8">
              <div className="flex items-center gap-3">
                <span className="loading loading-spinner loading-md"></span>
                <span className="text-slate-600 dark:text-slate-300">Cargando historial...</span>
              </div>
            </div>
          ) : salesHistory.length === 0 ? (
            <div className="py-8 text-center">
              <Package className="mx-auto mb-4 h-16 w-16 text-slate-300 dark:text-slate-600" />
              <div className="text-slate-500 dark:text-slate-400">
                No hay ventas registradas para este cliente
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg">
              <table className="table table-zebra w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600">
                    <th className="text-slate-700 dark:text-slate-200">Fecha</th>
                    <th className="text-slate-700 dark:text-slate-200">Producto</th>
                    <th className="text-slate-700 dark:text-slate-200">Cantidad</th>
                    <th className="text-slate-700 dark:text-slate-200">Precio Unit.</th>
                    <th className="text-slate-700 dark:text-slate-200">Total</th>
                    <th className="text-slate-700 dark:text-slate-200">Estado</th>
                    <th className="text-slate-700 dark:text-slate-200">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {salesHistory.map((sale) => (
                    <tr
                      key={sale.id}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      <td className="font-medium">
                        {new Date(sale.sale_date).toLocaleDateString()}
                      </td>
                      <td className="font-medium">{sale.product_name || 'Producto N/A'}</td>
                      <td>{sale.quantity}</td>
                      <td className="font-mono">${Number(sale.unit_price || 0).toFixed(2)}</td>
                      <td className="font-mono font-bold">
                        ${Number(sale.total_amount || 0).toFixed(2)}
                      </td>
                      <td>
                        <span
                          className={`badge shadow-sm ${
                            sale.status === 'vendido'
                              ? 'badge-success'
                              : sale.status === 'devuelto'
                                ? 'badge-error'
                                : sale.status === 'cambiado'
                                  ? 'badge-warning'
                                  : 'badge-neutral'
                          }`}
                        >
                          {sale.status || 'vendido'}
                        </span>
                      </td>
                      <td>
                        {sale.status === 'vendido' && (
                          <div className="flex gap-2">
                            <button
                              className="btn btn-warning btn-xs gap-1 shadow-sm transition-all hover:shadow-md"
                              onClick={() => handleReturn(sale)}
                            >
                              <RotateCcw className="h-3 w-3" />
                              Devolución
                            </button>
                            <button
                              className="btn btn-info btn-xs gap-1 shadow-sm transition-all hover:shadow-md"
                              onClick={() => handleExchange(sale)}
                            >
                              <RefreshCw className="h-3 w-3" />
                              Cambio
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {/* Modals */}
      <EditarClienteModal cliente={cliente} />
      <AgregarCompraModal cliente={cliente} />
      <AgregarPagoModal cliente={cliente} onPaymentAdded={refreshMovements} />
      <VerOprecionModal cliente={cliente} operacion={operacionSeleccionada} />
      <EliminarClienteModal cliente={cliente} />
    </div>
  )
}
