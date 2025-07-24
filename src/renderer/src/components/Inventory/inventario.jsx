import { PackagePlus, Search, Edit, Info, Boxes, Truck } from 'lucide-react'
import { useLocation } from 'wouter'
import { useState, useEffect, useCallback } from 'react'
import MenuVertical from '../../componentes especificos/menuVertical'
import Navbar from '../../componentes especificos/navbar'
import ProductsFamily from '../../modals/modalsInventory/productsFamily'
import ProductDetailModal from '../../modals/ProductDetailModal/ProductDetailModal'
import { inventoryService } from '../../services/inventory/inventoryService'
import { fetchSucursales } from '../../services/sucursales/sucursalesService'
import { useSession } from '../../contexts/SessionContext'

export default function Inventario() {
  const [, setLocation] = useLocation()
  const { getCurrentStorage } = useSession()
  const [selectedRow, setSelectedRow] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editedData, setEditedData] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [searchById, setSearchById] = useState(false)
  const [showData, setShowData] = useState(false)
  const [modalShowDataOpen, setModalShowDataOpen] = useState(false)

  // Nuevo estado para el modal de detalles
  const [productDetailModalOpen, setProductDetailModalOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState(null)

  const [inventoryData, setInventoryData] = useState([])
  const [storageList, setStorageList] = useState([])
  const [selectedStorage, setSelectedStorage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Obtener información de la sucursal actual
  const currentStorage = getCurrentStorage()

  const loadInventoryData = useCallback(async (storageId = null) => {
    try {
      setLoading(true)
      console.log('📦 Cargando resumen de productos...')

      const response = await inventoryService.getProductsSummary(storageId)

      if (response.status === 'success') {
        console.log('✅ Resumen de productos cargado:', response.data)
        setInventoryData(response.data)
      } else {
        console.error('❌ Respuesta del servidor no exitosa:', response)
        setError('La respuesta del servidor no fue exitosa')
      }
    } catch (err) {
      setError('Error al cargar el inventario')
      console.error('💥 Error completo:', err)
      console.error('📄 Mensaje del error:', err.message)
      if (err.response) {
        console.error('🌐 Respuesta del error:', err.response.data)
        console.error('🔢 Status del error:', err.response.status)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener información de la sucursal actual del usuario
      const currentStorage = getCurrentStorage()
      console.log('🏪 Sucursal actual del usuario:', currentStorage)

      // Primero cargar las sucursales
      console.log('🏪 Cargando sucursales...')
      const storagesResponse = await fetchSucursales()
      console.log('✅ Respuesta de sucursales:', storagesResponse)

      if (!storagesResponse || storagesResponse.status !== 'success') {
        throw new Error('No se pudieron cargar las sucursales - respuesta no exitosa')
      }
      const storageArray = Array.isArray(storagesResponse.data) ? storagesResponse.data : []
      setStorageList(storageArray)
      console.log('✅ Sucursales cargadas:', storageArray.length, 'sucursales')

      // Establecer la sucursal por defecto basada en la sesión del usuario
      if (currentStorage?.id) {
        console.log('🏪 Estableciendo sucursal por defecto:', currentStorage.id)
        setSelectedStorage(currentStorage.id.toString())
      } else {
        console.log('🏪 No hay sucursal asignada, mostrando todas')
        setSelectedStorage('')
      }

      // Luego cargar el inventario
      console.log('📦 Cargando inventario inicial...')
      const initialStorageId = currentStorage?.id || null
      await loadInventoryData(initialStorageId)
    } catch (err) {
      const errorMessage = err.message || 'Error desconocido al cargar datos iniciales'
      setError(errorMessage)
      console.error('💥 Error en loadInitialData:', err)

      // Si fallan las sucursales, al menos intentamos cargar productos
      if (err.message?.includes('sucursales')) {
        console.log('🔄 Intentando cargar inventario sin sucursales...')
        try {
          await loadInventoryData()
        } catch (inventoryErr) {
          console.error('💥 También falló la carga de inventario:', inventoryErr)
        }
      }
    } finally {
      setLoading(false)
    }
  }, [loadInventoryData, getCurrentStorage])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  useEffect(() => {
    if (selectedStorage) {
      loadInventoryData(selectedStorage)
    } else {
      loadInventoryData()
    }
  }, [selectedStorage, loadInventoryData])

  // Función para filtrar los datos
  const filteredData = inventoryData.filter((row) => {
    if (searchById) {
      return row.id.toString().includes(searchTerm)
    } else {
      return (
        row.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.fecha_edicion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.id.toString().includes(searchTerm)
      )
    }
  })

  const handleInfoClick = () => {
    if (selectedRow) {
      const selectedProduct = inventoryData.find((item) => item.id === selectedRow)
      setShowData(selectedProduct)
      setModalShowDataOpen(true)
    }
  }

  // Nueva función para manejar doble clic en una fila
  const handleRowDoubleClick = (row) => {
    console.log('🔍 Doble clic en producto:', row.id)
    setSelectedProductId(row.id)
    setProductDetailModalOpen(true)
  }

  const handleRowClick = (row) => {
    setSelectedRow(row.id)
    setEditedData(row)
  }

  const handleEditClick = () => {
    if (selectedRow) {
      setIsModalOpen(true)
    }
  }

  const handleSaveChanges = async () => {
    try {
      // Aquí puedes implementar la lógica para guardar cambios
      console.log('Datos guardados:', editedData)
      setIsModalOpen(false)
      // Recargar datos después de guardar
      await loadInventoryData(selectedStorage)
    } catch (err) {
      console.error('Error al guardar cambios:', err)
    }
  }

  const handleInputChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }))
  }

  const handleStorageChange = (e) => {
    setSelectedStorage(e.target.value)
  }
  const handleMoveInventoryClick = () => {
    setLocation('/moveInventory')
  }
  return (
    <div className="bg-base-100 min-h-screen">
      <MenuVertical currentPath="/inventario" />
      <Navbar />
      <div className="ml-20 flex-1">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-warning text-2xl font-bold">Inventario</h2>
            {selectedStorage ? (
              <p className="mt-1 text-sm text-gray-600">
                {selectedStorage === currentStorage?.id?.toString()
                  ? `🏢 Mostrando productos de: ${currentStorage?.name} (Mi sucursal)`
                  : `🏪 Mostrando productos de: ${
                      storageList.find((s) => s.id.toString() === selectedStorage)?.name ||
                      'Sucursal desconocida'
                    }`}
              </p>
            ) : (
              <p className="mt-1 text-sm text-gray-600">
                🌍 Mostrando productos de todas las sucursales
              </p>
            )}
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="alert alert-error mb-4">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button
                className="btn btn-sm btn-outline btn-error"
                onClick={() => {
                  setError(null)
                  loadInitialData()
                }}
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Info sobre la carga de sucursales */}
        {storageList.length === 0 && !loading && !error && (
          <div className="alert alert-warning mb-4">
            <div className="flex items-center justify-between">
              <span>⚠️ No se pudieron cargar las sucursales. Mostrando todos los productos.</span>
              <button
                className="btn btn-sm btn-outline btn-warning"
                onClick={() => loadInitialData()}
              >
                Recargar sucursales
              </button>
            </div>
          </div>
        )}

        {/* Barra de navegación */}
        <div className="mb-6 flex items-center justify-between">
          <ul className="menu menu-horizontal bg-base-200 rounded-box gap-2">
            <li>
              <button
                className="btn btn-ghost tooltip tooltip-bottom"
                data-tip="Grupos"
                onClick={() => document.getElementById('productsFamily').showModal()}
              >
                <Boxes className="h-5 w-5" />
              </button>
            </li>
            <li>
              <button
                className="btn btn-ghost tooltip tooltip-bottom"
                data-tip="Editar producto"
                onClick={handleEditClick}
                disabled={!selectedRow}
              >
                <Edit className="h-5 w-5" />
              </button>
            </li>
            <li>
              <button
                className="btn btn-ghost tooltip tooltip-bottom"
                data-tip="Nuevo producto"
                onClick={() => setLocation('/nuevoProducto')}
              >
                <PackagePlus className="h-5 w-5" />
              </button>
            </li>
            <li>
              <button
                className="btn btn-ghost tooltip tooltip-bottom"
                data-tip="Información del producto"
                onClick={handleInfoClick}
                disabled={!selectedRow}
              >
                <Info className="h-5 w-5" />
              </button>
            </li>
            <li>
              <button
                className="btn btn-ghost tooltip tooltip-bottom"
                data-tip="Mover producto entre sucursales"
                onClick={handleMoveInventoryClick}
              >
                <Truck className="h-5 w-5" />
              </button>
            </li>
          </ul>

          {/* Filtros y búsqueda */}
          <div className="flex items-center gap-4">
            {/* Selector de sucursal */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Sucursal:</span>
              <select
                className="select select-bordered select-warning min-w-48"
                value={selectedStorage}
                onChange={handleStorageChange}
              >
                <option value="">🌍 Todas las sucursales</option>
                {currentStorage && (
                  <option value={currentStorage.id} className="font-semibold">
                    🏢 {currentStorage.name} (Mi sucursal)
                  </option>
                )}
                {storageList &&
                  storageList
                    .filter((storage) => storage.id !== currentStorage?.id)
                    .map((storage) => (
                      <option key={storage.id} value={storage.id}>
                        🏪 {storage.name}
                      </option>
                    ))}
              </select>
            </div>

            {/* Barra de búsqueda */}
            <label className="input input-bordered input-warning flex items-center gap-2">
              <input
                type="text"
                placeholder="Buscar..."
                className="grow"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="h-4 w-4" />
            </label>
            <label className="label cursor-pointer gap-2">
              <span className="label-text">Buscar solo por ID</span>
              <input
                type="checkbox"
                checked={searchById}
                onChange={(e) => setSearchById(e.target.checked)}
                className="checkbox checkbox-warning"
              />
            </label>
          </div>
        </div>

        {/* Tabla de inventario */}
        <div className="bg-base-200 overflow-x-auto rounded-lg shadow-lg">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <span className="loading loading-spinner loading-lg"></span>
              <span className="ml-2">Cargando inventario...</span>
            </div>
          ) : (
            <table className="table w-full">
              <thead className="bg-warning/10">
                <tr>
                  <th className="text-warning">#</th>
                  <th className="text-warning">Producto</th>
                  <th className="text-warning">Marca</th>
                  <th className="text-warning">
                    {selectedStorage ? 'Cantidad en sucursal' : 'Cantidad total'}
                  </th>
                  <th className="text-warning">Fecha de edición</th>
                  {!selectedStorage && <th className="text-warning">Sucursales con stock</th>}
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={selectedStorage ? 5 : 6} className="p-8 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="text-4xl">📦</div>
                        <div>
                          <p className="text-lg font-semibold">No hay productos disponibles</p>
                          <p className="mt-1 text-sm text-gray-500">
                            {searchTerm
                              ? 'No se encontraron productos que coincidan con tu búsqueda'
                              : selectedStorage
                                ? 'Esta sucursal no tiene productos en stock'
                                : 'No hay productos cargados en el sistema'}
                          </p>
                          {!searchTerm && (
                            <button
                              className="btn btn-warning btn-sm mt-3"
                              onClick={() => loadInitialData()}
                            >
                              Recargar datos
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-warning/10 cursor-pointer ${
                        selectedRow === row.id ? 'bg-warning/20' : ''
                      }`}
                      onClick={() => handleRowClick(row)}
                      onDoubleClick={() => handleRowDoubleClick(row)}
                      title="Doble clic para ver detalles completos"
                    >
                      <th>{row.barcode}</th>
                      <td>{row.producto}</td>
                      <td>{row.marca}</td>
                      <td>
                        <span
                          className={`badge ${row.cantidad_total > 0 ? 'badge-success' : 'badge-error'}`}
                        >
                          {row.cantidad_total}
                        </span>
                      </td>
                      <td>
                        {new Date(row.fecha_edicion).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      {!selectedStorage && (
                        <td>
                          <span className="badge badge-outline">
                            {row.sucursales_con_stock} sucursales
                          </span>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal de información */}
        {modalShowDataOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50">
            <div className="bg-base-100 w-96 rounded-lg p-6 shadow-2xl">
              <h3 className="text-warning mb-4 text-lg font-bold">Información del Producto</h3>
              <div className="space-y-2">
                <p>
                  <strong>Producto:</strong> {showData.producto}
                </p>
                <p>
                  <strong>Marca:</strong> {showData.marca}
                </p>
                <p>
                  <strong>Cantidad:</strong> {showData.cantidad}
                </p>
                <p>
                  <strong>Colores:</strong> {showData.colores}
                </p>
                <p>
                  <strong>Fecha de edición:</strong> {showData.fecha}
                </p>
              </div>
              <div className="mt-4 flex justify-end">
                <button className="btn btn-warning" onClick={() => setModalShowDataOpen(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de edición */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50">
            <div className="bg-base-100 w-96 rounded-lg p-6 shadow-2xl">
              <h3 className="text-warning mb-4 text-lg font-bold">Editar Producto</h3>
              <form className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Producto</label>
                  <input
                    type="text"
                    value={editedData.producto}
                    onChange={(e) => handleInputChange('producto', e.target.value)}
                    className="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Marca</label>
                  <input
                    type="text"
                    value={editedData.marca}
                    onChange={(e) => handleInputChange('marca', e.target.value)}
                    className="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Cantidad</label>
                  <input
                    type="number"
                    value={editedData.cantidad}
                    onChange={(e) => handleInputChange('cantidad', parseInt(e.target.value, 10))}
                    className="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Colores</label>
                  <input
                    type="text"
                    value={editedData.colores}
                    onChange={(e) => handleInputChange('colores', e.target.value)}
                    className="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Fecha de edición</label>
                  <input
                    type="text"
                    value={editedData.fecha}
                    onChange={(e) => handleInputChange('fecha', e.target.value)}
                    className="input input-bordered w-full"
                  />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button type="button" className="btn btn-warning" onClick={handleSaveChanges}>
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de detalles del producto */}
        <ProductDetailModal
          isOpen={productDetailModalOpen}
          onClose={() => setProductDetailModalOpen(false)}
          productId={selectedProductId}
        />

        <ProductsFamily />
      </div>
    </div>
  )
}
