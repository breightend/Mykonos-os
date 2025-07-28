import { useEffect, useState } from 'react'
import { pinwheel } from 'ldrs'
import inventoryService from '../../services/inventory/inventoryService'
import { useLocation } from 'wouter'
import {
  ArrowLeft,
  Package,
  CheckSquare,
  Square,
  ArrowRight,
  Truck,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useSession } from '../../contexts/SessionContext'

pinwheel.register()
//TODO: hacer que ande! Y que se conecten entre sucursales
export default function MoveInventory() {
  const [storageList, setStorageList] = useState([]) // Lista de sucursales
  const [productsList, setProductsList] = useState([]) // Lista de productos
  const [selectedProducts, setSelectedProducts] = useState([]) // Productos seleccionados para mover
  const [selectedDestination, setSelectedDestination] = useState('') // Sucursal seleccionada
  const [, setLocation] = useLocation()
  const [loading, setLoading] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [error, setError] = useState(null)
  const [step, setStep] = useState(1) // 1: Seleccionar productos, 2: Seleccionar destino
  const [showPendingShipments, setShowPendingShipments] = useState(false)
  const [showSentShipments, setShowSentShipments] = useState(false)
  const [pendingShipments, setPendingShipments] = useState([])
  const [sentShipments, setSentShipments] = useState([])
  const [loadingShipments, setLoadingShipments] = useState(false)

  const { getCurrentStorage, getCurrentUser } = useSession()
  const currentStorage = getCurrentStorage()
  const currentUser = getCurrentUser()

  
  const handleDestinationChange = (event) => {
    setSelectedDestination(event.target.value)
  }

  const loadProductsFromCurrentStorage = async () => {
    if (!currentStorage?.id) {
      setError('No hay sucursal actual seleccionada')
      return
    }

    try {
      setLoadingProducts(true)
      console.log('📦 Cargando productos de sucursal actual:', currentStorage.id)

      const response = await inventoryService.getProductsSummary(currentStorage.id)
      console.log('📦 Productos recibidos:', response)

      if (response.status === 'success' && response.data) {
        // Filtrar solo productos con stock > 0
        const productsWithStock = response.data.filter((product) => product.cantidad_total > 0)
        setProductsList(productsWithStock)
        setError(null) // Limpiar errores previos
      } else {
        setError('No se pudieron cargar los productos')
      }
    } catch (error) {
      console.error('❌ Error cargando productos:', error)
      setError(error.message || 'Error al cargar productos')
    } finally {
      setLoadingProducts(false)
    }
  }

  const loadSentShipments = async () => {
    try {
      setLoadingShipments(true)
      if (currentStorage?.id) {
        const response = await inventoryService.getSentShipments(currentStorage.id)
        if (response.status === 'success' && response.data) {
          setSentShipments(response.data)
        } else {
          // Datos de ejemplo si no hay envíos todavía
          setSentShipments([])
        }
      }
    } catch (error) {
      console.error('❌ Error cargando envíos salientes:', error)
      setError(error.message || 'Error al cargar envíos salientes')
      // Mostrar datos de ejemplo en caso de error (para desarrollo)
      const mockSentShipments = [
        {
          id: 3,
          fromStorage: currentStorage?.name || 'Mi Sucursal',
          toStorage: 'Sucursal Norte',
          products: [
            { name: 'Producto X', quantity: 10 },
            { name: 'Producto Y', quantity: 5 }
          ],
          status: 'empacado',
          createdAt: '2024-01-16'
        },
        {
          id: 4,
          fromStorage: currentStorage?.name || 'Mi Sucursal',
          toStorage: 'Sucursal Sur',
          products: [{ name: 'Producto Z', quantity: 3 }],
          status: 'en_transito',
          createdAt: '2024-01-15'
        }
      ]
      setSentShipments(mockSentShipments)
    } finally {
      setLoadingShipments(false)
    }
  }

  const updateSentShipmentStatus = async (shipmentId, newStatus) => {
    try {
      const response = await inventoryService.updateShipmentStatus(shipmentId, newStatus)

      if (response.status === 'success') {
        setSentShipments((prev) =>
          prev.map((shipment) =>
            shipment.id === shipmentId ? { ...shipment, status: newStatus } : shipment
          )
        )
        console.log(`✅ Envío ${shipmentId} actualizado a estado: ${newStatus}`)
      }
    } catch (error) {
      console.error('❌ Error actualizando estado del envío:', error)
      // Actualizar localmente mientras tanto
      setSentShipments((prev) =>
        prev.map((shipment) =>
          shipment.id === shipmentId ? { ...shipment, status: newStatus } : shipment
        )
      )
    }
  }

  const loadPendingShipments = async () => {
    try {
      setLoadingShipments(true)
      if (currentStorage?.id) {
        const response = await inventoryService.getPendingShipments(currentStorage.id)
        if (response.status === 'success' && response.data) {
          setPendingShipments(response.data)
        } else {
          // Datos de ejemplo si no hay envíos todavía
          setPendingShipments([])
        }
      }
    } catch (error) {
      console.error('❌ Error cargando envíos pendientes:', error)
      setError(error.message || 'Error al cargar envíos pendientes')
      // Mostrar datos de ejemplo en caso de error (para desarrollo)
      const mockShipments = [
        {
          id: 1,
          fromStorage: 'Sucursal Centro',
          toStorage: currentStorage?.name || 'Mi Sucursal',
          products: [
            { name: 'Producto A', quantity: 5 },
            { name: 'Producto B', quantity: 3 }
          ],
          status: 'en_transito',
          createdAt: '2024-01-15'
        },
        {
          id: 2,
          fromStorage: 'Sucursal Norte',
          toStorage: currentStorage?.name || 'Mi Sucursal',
          products: [{ name: 'Producto C', quantity: 2 }],
          status: 'empacado',
          createdAt: '2024-01-14'
        }
      ]
      setPendingShipments(mockShipments)
    } finally {
      setLoadingShipments(false)
    }
  }

  const markShipmentReceived = async (shipmentId, received) => {
    try {
      const status = received ? 'recibido' : 'no_recibido'
      const response = await inventoryService.updateShipmentStatus(shipmentId, status)

      if (response.status === 'success') {
        setPendingShipments((prev) =>
          prev.map((shipment) =>
            shipment.id === shipmentId ? { ...shipment, status: status } : shipment
          )
        )
        console.log(`✅ Envío ${shipmentId} marcado como ${status}`)
      }
    } catch (error) {
      console.error('❌ Error actualizando estado del envío:', error)
      // Actualizar localmente mientras tanto
      setPendingShipments((prev) =>
        prev.map((shipment) =>
          shipment.id === shipmentId
            ? { ...shipment, status: received ? 'recibido' : 'no_recibido' }
            : shipment
        )
      )
      console.log(`Envío ${shipmentId} marcado como ${received ? 'recibido' : 'no recibido'}`)
    }
  }

  const executeMovement = async () => {
    if (!selectedDestination || selectedProducts.length === 0) return

    try {
      const products = selectedProducts.map((product) => ({
        id: product.id,
        quantity: product.moveQuantity
      }))

      const response = await inventoryService.createMovement(
        currentStorage.id,
        selectedDestination,
        products
      )

      if (response.status === 'success') {
        alert('✅ Movimiento ejecutado exitosamente')
        resetSelection()
      } else {
        alert('❌ Error al ejecutar el movimiento')
      }
    } catch (error) {
      console.error('❌ Error ejecutando movimiento:', error)
      alert('❌ Error al ejecutar el movimiento: ' + error.message)
    }
  }

  const handleProductSelect = (product) => {
    setSelectedProducts((prev) => {
      const isSelected = prev.find((p) => p.id === product.id)
      if (isSelected) {
        // Deseleccionar
        return prev.filter((p) => p.id !== product.id)
      } else {
        // Seleccionar con cantidad por defecto 1
        return [...prev, { ...product, moveQuantity: 1 }]
      }
    })
  }

  const handleQuantityChange = (productId, quantity) => {
    setSelectedProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, moveQuantity: Math.min(Math.max(1, parseInt(quantity) || 1), p.cantidad_total) }
          : p
      )
    )
  }

  const handleSelectAllProducts = () => {
    if (selectedProducts.length === productsList.length) {
      // Deseleccionar todos
      setSelectedProducts([])
    } else {
      // Seleccionar todos con cantidad 1
      setSelectedProducts(productsList.map((product) => ({ ...product, moveQuantity: 1 })))
    }
  }

  const isProductSelected = (productId) => {
    return selectedProducts.find((p) => p.id === productId)
  }

  const proceedToDestination = () => {
    if (selectedProducts.length > 0) {
      setStep(2)
    }
  }

  const resetSelection = () => {
    setStep(1)
    setSelectedDestination('')
    setSelectedProducts([])
    setProductsList([])
    setShowPendingShipments(false)
    setShowSentShipments(false)
  }

  const startProductSelection = () => {
    setShowPendingShipments(false)
    setShowSentShipments(false)
    setStep(1)
    loadProductsFromCurrentStorage()
  }

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('🏪 Cargando datos iniciales...')

        // Cargar sucursales
        const storageResponse = await inventoryService.getStorageList()
        console.log('🏪 Respuesta sucursales:', storageResponse)

        if (storageResponse.status === 'success' && storageResponse.data) {
          console.log('🏪 Sucursales recibidas:', storageResponse.data)
          setStorageList(storageResponse.data)
        } else {
          console.error('❌ Respuesta inesperada:', storageResponse)
          setError('Formato de respuesta inesperado')
        }

        // Cargar productos si tenemos currentStorage
        if (currentStorage?.id) {
          console.log('📦 Cargando productos de sucursal actual:', currentStorage.id)
          const productsResponse = await inventoryService.getProductsSummary(currentStorage.id)
          console.log('📦 Productos recibidos:', productsResponse)

          if (productsResponse.status === 'success' && productsResponse.data) {
            const productsWithStock = productsResponse.data.filter(
              (product) => product.cantidad_total > 0
            )
            setProductsList(productsWithStock)
          } else {
            setError('No se pudieron cargar los productos')
          }
        }
      } catch (error) {
        console.error('❌ Error al cargar datos iniciales:', error)
        setError(error.message || 'Error al cargar datos iniciales')
      } finally {
        setLoading(false)
        setLoadingProducts(false)
      }
    }

    loadInitialData()
  }, []) // Solo ejecutar una vez al montar el componente

  const handleBackClick = () => {
    setLocation('/inventario')
  }

  return (
    <div className="bg-base-100 min-h-screen p-4">
      <div className="mb-4 flex items-center gap-4">
        <button onClick={handleBackClick} className="btn btn-neutral mb-4">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h3 className="text-xl font-bold">Movimiento de Inventario</h3>
      </div>

      {/* Información de la sucursal actual */}
      <div className="bg-base-200 mb-4 rounded-lg p-4">
        <p className="text-sm opacity-70">Sucursal actual:</p>
        <p className="text-lg font-semibold">{currentStorage?.name || 'No seleccionada'}</p>
      </div>

      {/* Botones principales */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={startProductSelection}
          className="btn btn-primary"
          disabled={!currentStorage?.id}
        >
          <Package className="h-5 w-5" />
          Enviar Productos
        </button>
        <button
          onClick={() => {
            setShowPendingShipments(true)
            setShowSentShipments(false)
            loadPendingShipments()
          }}
          className="btn btn-secondary"
        >
          <Clock className="h-5 w-5" />
          Envíos Pendientes
        </button>
        <button
          onClick={() => {
            setShowSentShipments(true)
            setShowPendingShipments(false)
            loadSentShipments()
          }}
          className="btn btn-accent"
        >
          <Truck className="h-5 w-5" />
          Envíos Realizados
        </button>
      </div>

      {/* Vista de envíos pendientes */}
      {showPendingShipments && (
        <div className="card bg-base-200 mb-6 shadow-xl">
          <div className="card-body">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="card-title">Envíos Pendientes</h4>
              <button
                onClick={() => setShowPendingShipments(false)}
                className="btn btn-ghost btn-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </button>
            </div>

            {loadingShipments && (
              <div className="flex items-center gap-3">
                <l-pinwheel size="25" stroke="2.5" speed="0.9" color="#d97706"></l-pinwheel>
                <span className="text-warning font-medium">Cargando envíos pendientes...</span>
              </div>
            )}

            {!loadingShipments && pendingShipments.length === 0 && (
              <div className="py-8 text-center">
                <Truck className="mx-auto mb-2 h-12 w-12 opacity-50" />
                <p>No hay envíos pendientes</p>
              </div>
            )}

            {!loadingShipments && pendingShipments.length > 0 && (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Desde</th>
                      <th>Productos</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingShipments.map((shipment) => (
                      <tr key={shipment.id} className="hover">
                        <td>
                          <div className="font-medium">{shipment.fromStorage}</div>
                        </td>
                        <td>
                          <div className="text-sm">
                            {shipment.products.map((product, idx) => (
                              <div key={idx}>
                                {product.name} (x{product.quantity})
                              </div>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div
                            className={`badge ${
                              shipment.status === 'en_transito'
                                ? 'badge-warning'
                                : shipment.status === 'empacado'
                                  ? 'badge-info'
                                  : shipment.status === 'recibido'
                                    ? 'badge-success'
                                    : 'badge-error'
                            }`}
                          >
                            {shipment.status === 'en_transito'
                              ? 'En tránsito'
                              : shipment.status === 'empacado'
                                ? 'Empacado'
                                : shipment.status === 'recibido'
                                  ? 'Recibido'
                                  : 'No recibido'}
                          </div>
                        </td>
                        <td>{shipment.createdAt}</td>
                        <td>
                          {shipment.status !== 'recibido' && shipment.status !== 'no_recibido' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => markShipmentReceived(shipment.id, true)}
                                className="btn btn-success btn-xs"
                                title="Marcar como recibido"
                              >
                                <CheckCircle className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => markShipmentReceived(shipment.id, false)}
                                className="btn btn-error btn-xs"
                                title="Marcar como no recibido"
                              >
                                <XCircle className="h-3 w-3" />
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
      )}

      {/* Vista de envíos realizados */}
      {showSentShipments && (
        <div className="card bg-base-200 mb-6 shadow-xl">
          <div className="card-body">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="card-title">Envíos Realizados</h4>
              <button onClick={() => setShowSentShipments(false)} className="btn btn-ghost btn-sm">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </button>
            </div>

            {loadingShipments && (
              <div className="flex items-center gap-3">
                <l-pinwheel size="25" stroke="2.5" speed="0.9" color="#d97706"></l-pinwheel>
                <span className="text-warning font-medium">Cargando envíos realizados...</span>
              </div>
            )}

            {!loadingShipments && sentShipments.length === 0 && (
              <div className="py-8 text-center">
                <Truck className="mx-auto mb-2 h-12 w-12 opacity-50" />
                <p>No hay envíos realizados</p>
              </div>
            )}

            {!loadingShipments && sentShipments.length > 0 && (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Hacia</th>
                      <th>Productos</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sentShipments.map((shipment) => (
                      <tr key={shipment.id} className="hover">
                        <td>
                          <div className="font-medium">{shipment.toStorage}</div>
                        </td>
                        <td>
                          <div className="text-sm">
                            {shipment.products.map((product, idx) => (
                              <div key={idx}>
                                {product.name} (x{product.quantity})
                              </div>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div
                            className={`badge ${
                              shipment.status === 'empacado'
                                ? 'badge-info'
                                : shipment.status === 'en_transito'
                                  ? 'badge-warning'
                                  : shipment.status === 'entregado'
                                    ? 'badge-success'
                                    : 'badge-error'
                            }`}
                          >
                            {shipment.status === 'empacado'
                              ? 'Empacado'
                              : shipment.status === 'en_transito'
                                ? 'En tránsito'
                                : shipment.status === 'entregado'
                                  ? 'Entregado'
                                  : 'Cancelado'}
                          </div>
                        </td>
                        <td>{shipment.createdAt}</td>
                        <td>
                          {shipment.status === 'empacado' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateSentShipmentStatus(shipment.id, 'en_transito')}
                                className="btn btn-warning btn-xs"
                                title="Marcar como en tránsito"
                              >
                                🚚 En tránsito
                              </button>
                            </div>
                          )}
                          {shipment.status === 'en_transito' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateSentShipmentStatus(shipment.id, 'entregado')}
                                className="btn btn-success btn-xs"
                                title="Marcar como entregado"
                              >
                                ✅ Entregado
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
      )}

      {/* Pasos de envío de productos */}
      {!showPendingShipments && !showSentShipments && (
        <>
          <div className="mb-6">
            <ul className="steps w-full">
              <li className={`step ${step >= 1 ? 'step-primary' : ''}`}>Seleccionar Productos</li>
              <li className={`step ${step >= 2 ? 'step-primary' : ''}`}>Sucursal Destino</li>
            </ul>
          </div>

          {/* Paso 1: Seleccionar productos */}
          {step === 1 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Tabla de productos disponibles */}
              <div className="card bg-base-200 shadow-xl">
                <div className="card-body">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="card-title">Productos Disponibles</h4>
                    <div className="flex gap-2">
                      <button onClick={handleSelectAllProducts} className="btn btn-sm btn-outline">
                        {selectedProducts.length === productsList.length &&
                        productsList.length > 0 ? (
                          <Square className="h-4 w-4" />
                        ) : (
                          <CheckSquare className="h-4 w-4" />
                        )}
                        {selectedProducts.length === productsList.length && productsList.length > 0
                          ? 'Deseleccionar Todo'
                          : 'Seleccionar Todo'}
                      </button>
                      <button onClick={resetSelection} className="btn btn-sm btn-ghost">
                        Reiniciar
                      </button>
                    </div>
                  </div>

                  {loadingProducts && (
                    <div className="flex items-center gap-3">
                      <l-pinwheel size="25" stroke="2.5" speed="0.9" color="#d97706"></l-pinwheel>
                      <span className="text-warning font-medium">Cargando productos...</span>
                    </div>
                  )}

                  {!loadingProducts && productsList.length === 0 && (
                    <div className="py-8 text-center">
                      <Package className="mx-auto mb-2 h-12 w-12 opacity-50" />
                      <p>No hay productos con stock en esta sucursal</p>
                    </div>
                  )}

                  {!loadingProducts && productsList.length > 0 && (
                    <div className="max-h-96 overflow-x-auto">
                      <table className="table-sm table-pin-rows table">
                        <thead>
                          <tr>
                            <th>Seleccionar</th>
                            <th>Código de barra</th>
                            <th>Producto</th>
                            <th>Marca</th>
                            <th>Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productsList.map((product) => (
                            <tr key={product.id} className="hover">
                              <td>
                                <input
                                  type="checkbox"
                                  className="checkbox checkbox-sm"
                                  checked={!!isProductSelected(product.id)}
                                  onChange={() => handleProductSelect(product)}
                                />
                              </td>
                              <td>{product.barcode}</td>
                              <td>{product.producto}</td>
                              <td>{product.marca}</td>
                              <td>
                                <span className="badge badge-primary">
                                  {product.cantidad_total}
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

              {/* Tabla de productos seleccionados */}
              <div className="card bg-base-200 shadow-xl">
                <div className="card-body">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="card-title">Productos a Mover ({selectedProducts.length})</h4>
                    {selectedProducts.length > 0 && (
                      <button onClick={proceedToDestination} className="btn btn-primary btn-sm">
                        <ArrowRight className="h-4 w-4" />
                        Continuar
                      </button>
                    )}
                  </div>

                  {selectedProducts.length === 0 && (
                    <div className="py-8 text-center">
                      <CheckSquare className="mx-auto mb-2 h-12 w-12 opacity-50" />
                      <p>Selecciona productos de la tabla de la izquierda</p>
                    </div>
                  )}

                  {selectedProducts.length > 0 && (
                    <div className="max-h-96 overflow-x-auto">
                      <table className="table-sm table-pin-rows table">
                        <thead>
                          <tr>
                            <th>Código de barras</th>
                            <th>Producto</th>
                            <th>Stock Total</th>
                            <th>Cantidad a Mover</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedProducts.map((product) => (
                            <tr key={product.id} className="hover">
                              <td>{product.barcode}</td>
                              <td>
                                <div>
                                  <div className="font-medium">{product.producto}</div>
                                  <div className="text-sm opacity-70">{product.marca}</div>
                                </div>
                              </td>
                              <td>
                                <span className="badge badge-outline">
                                  {product.cantidad_total}
                                </span>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="input input-sm input-bordered w-20"
                                  min="1"
                                  max={product.cantidad_total}
                                  value={product.moveQuantity}
                                  onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Paso 2: Seleccionar destino */}
          {step === 2 && (
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <h4 className="card-title">Paso 2: Selecciona la sucursal de destino</h4>

                <div className="mb-4">
                  <label className="label">
                    <span className="label-text">Sucursal de destino</span>
                  </label>
                  <select
                    value={selectedDestination}
                    onChange={handleDestinationChange}
                    className="select select-bordered w-full max-w-md"
                  >
                    <option value="">Seleccione la sucursal de destino</option>
                    {storageList
                      .filter((storage) => storage[0] != currentStorage?.id) // Excluir origen
                      .map((storage) => {
                        const id = storage[0]
                        const name = storage[1]
                        return (
                          <option key={id} value={id}>
                            {name}
                          </option>
                        )
                      })}
                  </select>
                </div>

                {selectedDestination && (
                  <div className="bg-base-100 mb-4 rounded-lg p-4">
                    <h5 className="mb-2 font-semibold">Resumen del movimiento:</h5>
                    <p>
                      <strong>Desde:</strong> {currentStorage?.name}
                    </p>
                    <p>
                      <strong>Hacia:</strong>{' '}
                      {storageList.find((s) => s[0] == selectedDestination)?.[1]}
                    </p>
                    <p>
                      <strong>Productos:</strong> {selectedProducts.length} artículos
                    </p>
                  </div>
                )}

                <div className="card-actions justify-between">
                  <button onClick={() => setStep(1)} className="btn btn-ghost">
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Productos
                  </button>

                  {selectedDestination && (
                    <button className="btn btn-success" onClick={executeMovement}>
                      Ejecutar Movimiento
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
