import { useEffect, useState } from 'react'
import inventoryService from '../../services/inventory/inventoryService'
import { useLocation } from 'wouter'
import { ArrowLeft, Package, CheckSquare, Square, ArrowRight } from 'lucide-react'

export default function MoveInventory() {
  const [storageList, setStorageList] = useState([]) // Lista de sucursales
  const [productsList, setProductsList] = useState([]) // Lista de productos
  const [selectedProducts, setSelectedProducts] = useState([]) // Productos seleccionados para mover
  const [selectedDestination, setSelectedDestination] = useState('') // Sucursal seleccionada
  const [selectedOrigin, setSelectedOrigin] = useState('') // Sucursal de origen
  const [, setLocation] = useLocation()
  const [loading, setLoading] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [error, setError] = useState(null)
  const [step, setStep] = useState(1) // 1: Seleccionar origen, 2: Seleccionar productos, 3: Seleccionar destino

  const handleDestinationChange = (event) => {
    setSelectedDestination(event.target.value)
  }

  const handleOriginChange = (event) => {
    setSelectedOrigin(event.target.value)
    setStep(2) // Avanzar al paso de selección de productos
    loadProductsFromOrigin(event.target.value)
  }

  const loadProductsFromOrigin = async (originStorageId) => {
    try {
      setLoadingProducts(true)
      console.log('📦 Cargando productos de sucursal:', originStorageId)

      const response = await inventoryService.getProductsSummary(originStorageId)
      console.log('📦 Productos recibidos:', response)

      if (response.status === 'success' && response.data) {
        // Filtrar solo productos con stock > 0
        const productsWithStock = response.data.filter((product) => product.cantidad_total > 0)
        setProductsList(productsWithStock)
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
      setStep(3)
    }
  }

  const resetSelection = () => {
    setStep(1)
    setSelectedOrigin('')
    setSelectedDestination('')
    setSelectedProducts([])
    setProductsList([])
  }

  useEffect(() => {
    const loadSucursales = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('🏪 Cargando sucursales...')

        const response = await inventoryService.getStorageList()
        console.log('🏪 Respuesta completa:', response)

        if (response.status === 'success' && response.data) {
          console.log('🏪 Sucursales recibidas:', response.data)
          setStorageList(response.data)
        } else {
          console.error('❌ Respuesta inesperada:', response)
          setError('Formato de respuesta inesperado')
        }
      } catch (error) {
        console.error('❌ Error al cargar las sucursales:', error)
        setError(error.message || 'Error al cargar sucursales')
      } finally {
        setLoading(false)
      }
    }
    loadSucursales()
  }, [])

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

      <p className="mb-4">Selecciona productos de una sucursal y muévelos a otra sucursal.</p>

      {/* Indicador de pasos */}
      <div className="mb-6">
        <ul className="steps w-full">
          <li className={`step ${step >= 1 ? 'step-primary' : ''}`}>Sucursal Origen</li>
          <li className={`step ${step >= 2 ? 'step-primary' : ''}`}>Seleccionar Productos</li>
          <li className={`step ${step >= 3 ? 'step-primary' : ''}`}>Sucursal Destino</li>
        </ul>
      </div>

      {/* Paso 1: Seleccionar sucursal de origen */}
      {step === 1 && (
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h4 className="card-title">Paso 1: Selecciona la sucursal de origen</h4>

            {loading && (
              <div className="flex items-center gap-2">
                <span className="loading loading-spinner loading-sm"></span>
                <span>Cargando sucursales...</span>
              </div>
            )}

            {error && (
              <div className="alert alert-error">
                <span>❌ {error}</span>
              </div>
            )}

            {!loading && !error && (
              <div>
                <select
                  value={selectedOrigin}
                  onChange={handleOriginChange}
                  className="select select-bordered w-full max-w-md"
                >
                  <option value="">Seleccione la sucursal de origen</option>
                  {storageList.map((storage) => {
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
            )}
          </div>
        </div>
      )}

      {/* Paso 2: Seleccionar productos */}
      {step === 2 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Tabla de productos disponibles */}
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="card-title">Productos Disponibles</h4>
                <div className="flex gap-2">
                  <button onClick={handleSelectAllProducts} className="btn btn-sm btn-outline">
                    {selectedProducts.length === productsList.length && productsList.length > 0 ? (
                      <Square className="h-4 w-4" />
                    ) : (
                      <CheckSquare className="h-4 w-4" />
                    )}
                    {selectedProducts.length === productsList.length && productsList.length > 0
                      ? 'Deseleccionar Todo'
                      : 'Seleccionar Todo'}
                  </button>
                  <button onClick={resetSelection} className="btn btn-sm btn-ghost">
                    Cambiar Origen
                  </button>
                </div>
              </div>

              {loadingProducts && (
                <div className="flex items-center gap-2">
                  <span className="loading loading-spinner loading-sm"></span>
                  <span>Cargando productos...</span>
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
                        <th>Codigo de barra</th>

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
                            <span className="badge badge-primary">{product.cantidad_total}</span>
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
                        <th>Codigo de barras</th>
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
                            <span className="badge badge-outline">{product.cantidad_total}</span>
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

      {/* Paso 3: Seleccionar destino */}
      {step === 3 && (
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h4 className="card-title">Paso 3: Selecciona la sucursal de destino</h4>

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
                  .filter((storage) => storage[0] != selectedOrigin) // Excluir origen
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
                  <strong>Desde:</strong> {storageList.find((s) => s[0] == selectedOrigin)?.[1]}
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
              <button onClick={() => setStep(2)} className="btn btn-ghost">
                <ArrowLeft className="h-4 w-4" />
                Volver a Productos
              </button>

              {selectedDestination && (
                <button
                  className="btn btn-success"
                  onClick={() => {
                    alert('Funcionalidad de mover productos pendiente de implementar')
                    // Aquí iría la lógica para ejecutar el movimiento
                  }}
                >
                  Ejecutar Movimiento
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
