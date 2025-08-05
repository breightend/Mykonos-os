import { ArrowLeft, Pencil, Trash2, Package, RotateCcw, RefreshCw } from 'lucide-react'
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
//TODO: ver operaciones va a ser con doble click
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
    <div>
      <div className="w-full rounded-2xl p-2">
        <div className="mb-4 flex items-center gap-4 rounded-2xl bg-gray-800 p-4 text-white dark:bg-gray-400 dark:text-black">
          <button
            className="btn btn-circle btn-ghost tooltip tooltip-bottom ml-5"
            data-tip="Volver"
            onClick={() => setLocation('/clientes')}
          >
            <ArrowLeft />
          </button>
          <h3 className="text-2xl font-bold">{cliente?.entity_name}</h3>
        </div>
        <div className="w-full">
          <div className="items-center justify-between gap-8 space-x-4">
            <button
              className="btn btn-dash mb-4 justify-end"
              onClick={() => document.getElementById('editandoCliente').showModal()}
            >
              <Pencil />
              Editar cliente
            </button>
            <button
              className="btn btn-error mb-4 justify-end"
              onClick={() => document.getElementById('eliminandoCliente').showModal()}
            >
              <Trash2 className="" />
              Eliminar cliente
            </button>
          </div>
        </div>
        <div className="text-base-content items-center">
          <div className="overflow-x-auto">
            {/* head */}
            {cliente && (
              <table className="table w-full text-sm">
                <thead className="rounded-2xl bg-gray-800 text-white">
                  <tr>
                    <th>#</th>
                    <th>Nombre y apellido</th>
                    <th>DNI o CUIT</th>
                    <th>Celular</th>
                    <th>Domicilio</th>
                    <th>Mail</th>
                    <th>Razon Social</th>
                    <th>Observaciones</th>
                  </tr>
                </thead>
                <tbody className="">
                  <tr onClick={() => handleRowClick(cliente)}>
                    <th>1</th>
                    <td>{cliente?.entity_name}</td>
                    <td>{cliente?.cuit}</td>
                    <td>{cliente?.phone_number}</td>
                    <td>{cliente?.domicilio_comercial}</td>
                    <td>{cliente?.email}</td>
                    <td>{cliente?.razon_social}</td>
                    <td>{cliente?.observations}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
          <div>
            <hr className="mt-4 border-2" />
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-3xl font-bold">Registro de operaciones</h1>
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
          </div>
          <div className="w-full">
            <div className="flex justify-end gap-4">
              <button
                className="btn btn-primary"
                onClick={() => document.getElementById('agregandoPago').showModal()}
              >
                Agregar pago
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table-xs table-zebra w-full">
              {/* head */}
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Operación</th>
                  <th>Método de Pago</th>
                  <th>Debe</th>
                  <th>Haber</th>
                  <th>Saldo</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {loadingMovements ? (
                  <tr>
                    <td colSpan="8" className="py-4 text-center">
                      <div className="flex items-center justify-center">
                        <div className="loading loading-spinner loading-md mr-2"></div>
                        Cargando movimientos...
                      </div>
                    </td>
                  </tr>
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-4 text-center text-gray-500">
                      No hay movimientos registrados
                    </td>
                  </tr>
                ) : (
                  movements.map((movement, index) => (
                    <tr
                      key={movement.id || index}
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleRowClick(movement)}
                      onDoubleClick={() => handleRowDoubleClick(movement)}
                    >
                      <th>{index + 1}</th>
                      <td>{formatDate(movement.created_at)}</td>
                      <td>
                        <span
                          className={`badge ${movement.debe > 0 ? 'badge-error' : 'badge-success'}`}
                        >
                          {getOperationType(movement)}
                        </span>
                      </td>
                      <td>{movement.medio_pago || 'N/A'}</td>
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
              <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                💡 Haz doble clic en una operación para ver los detalles completos
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 mr-4 flex justify-end">
          <button className="btn btn-primary" onClick={() => setLocation('/clientes')}>
            Cerrar
          </button>
        </div>

        {/* Sales History Section */}
        <div className="card bg-base-100 mt-4 shadow-xl">
          <div className="card-body">
            <h3 className="card-title text-lg">Historial de Ventas</h3>

            {loadingSales ? (
              <div className="flex justify-center py-4">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            ) : salesHistory.length === 0 ? (
              <div className="py-4 text-center text-gray-500">
                No hay ventas registradas para este cliente
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-zebra table w-full">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio Unit.</th>
                      <th>Total</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesHistory.map((sale) => (
                      <tr key={sale.id}>
                        <td>{new Date(sale.sale_date).toLocaleDateString()}</td>
                        <td>{sale.product_name || 'Producto N/A'}</td>
                        <td>{sale.quantity}</td>
                        <td>${Number(sale.unit_price || 0).toFixed(2)}</td>
                        <td>${Number(sale.total_amount || 0).toFixed(2)}</td>
                        <td>
                          <span
                            className={`badge ${
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
                                className="btn btn-xs btn-warning"
                                onClick={() => handleReturn(sale)}
                              >
                                Devolución
                              </button>
                              <button
                                className="btn btn-xs btn-info"
                                onClick={() => handleExchange(sale)}
                              >
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
      </div>{' '}
      {/* A partir de acá para editar cliente! */}
      <EditarClienteModal cliente={cliente} />
      <AgregarCompraModal cliente={cliente} />
      <AgregarPagoModal cliente={cliente} onPaymentAdded={refreshMovements} />
      <VerOprecionModal cliente={cliente} operacion={operacionSeleccionada} />
      <EliminarClienteModal cliente={cliente} />
    </div>
  )
}
