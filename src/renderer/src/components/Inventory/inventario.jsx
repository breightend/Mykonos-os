import { PackagePlus, Search, Edit, Boxes, Truck } from 'lucide-react'
import { useLocation } from 'wouter'
import { useState, useEffect, useCallback } from 'react'
import { pinwheel } from 'ldrs'
import MenuVertical from '../../componentes especificos/menuVertical'
import Navbar from '../../componentes especificos/navbar'
import ProductsFamily from '../../modals/modalsInventory/productsFamily'
import ProductDetailModal from '../../modals/ProductDetailModal/ProductDetailModal'
import { inventoryService } from '../../services/inventory/inventoryService'
import { fetchSucursales } from '../../services/sucursales/sucursalesService'
import { useSession } from '../../contexts/SessionContext'

pinwheel.register()
//TODO: agregar que si no hay una sucursal logueada no se pueda acceder a nuevos productos ni mover productos entre sucursales.
export default function Inventario() {
  const [, setLocation] = useLocation()
  const { getCurrentStorage } = useSession()
  const [selectedRow, setSelectedRow] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editedData, setEditedData] = useState({})
  const [searchTerm, setSearchTerm] = useState('')

  // Nuevo estado para el modal de detalles
  const [productDetailModalOpen, setProductDetailModalOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState(null)

  const [inventoryData, setInventoryData] = useState([])
  const [storageList, setStorageList] = useState([])
  const [selectedStorage, setSelectedStorage] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedGroupData, setSelectedGroupData] = useState(null) // Para almacenar datos del grupo seleccionado
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const currentStorage = getCurrentStorage()

  const loadInventoryData = useCallback(async (storageId = null) => {
    try {
      setLoading(true)

      const response = await inventoryService.getProductsSummary(storageId)

      if (response.status === 'success') {
        setInventoryData(response.data)
      } else {
        setError('La respuesta del servidor no fue exitosa')
      }
    } catch (err) {
      setError('Error al cargar el inventario')
      console.error('Error al cargar inventario:', err)
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

      // Primero cargar las sucursales
      try {
        const storagesResponse = await fetchSucursales()

        // Verificar si la respuesta es un array directamente o un objeto con status
        let storageArray = []
        if (Array.isArray(storagesResponse)) {
          // Si es un array directamente
          storageArray = storagesResponse
        } else if (
          storagesResponse &&
          storagesResponse.status === 'success' &&
          Array.isArray(storagesResponse.data)
        ) {
          // Si es un objeto con status y data
          storageArray = storagesResponse.data
        } else {
          // Si no es ninguno de los formatos esperados
          storageArray = []
        }

        setStorageList(storageArray)

        if (storageArray.length === 0) {
          console.warn('⚠️ No se encontraron sucursales o hubo un problema en la carga')
        }
      } catch (storageError) {
        console.error('❌ Error específico al cargar sucursales:', storageError)
        setStorageList([])
        // No lanzar el error aquí, continuar con la carga del inventario
      }

      // Establecer la sucursal por defecto basada en la sesión del usuario
      if (currentStorage?.id) {
        setSelectedStorage(currentStorage.id.toString())
      } else {
        setSelectedStorage('')
      }

      // Luego cargar el inventario
      const initialStorageId = currentStorage?.id || null
      await loadInventoryData(initialStorageId)
    } catch (err) {
      const errorMessage = err.message || 'Error desconocido al cargar datos iniciales'
      setError(errorMessage)
      console.error('Error en loadInitialData:', err)
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

  // Función para obtener todos los IDs de un grupo y sus hijos recursivamente
  const getAllGroupIds = (groupData, targetGroupId) => {
    if (!groupData) return [targetGroupId]

    let allIds = [targetGroupId]

    // Función recursiva para recolectar IDs de hijos
    const collectChildrenIds = (children) => {
      if (!children || !Array.isArray(children)) return

      children.forEach((child) => {
        allIds.push(child.id.toString())
        if (child.children && child.children.length > 0) {
          collectChildrenIds(child.children)
        }
      })
    }

    // Si tenemos datos del grupo, recolectar sus hijos
    if (groupData.children && groupData.children.length > 0) {
      collectChildrenIds(groupData.children)
    }

    return [...new Set(allIds)] // Eliminar duplicados
  }

  // Función para filtrar los datos
  const filteredData = inventoryData.filter((row) => {
    // Filtro por término de búsqueda
    let matchesSearch = true
    if (searchTerm) {
      matchesSearch =
        row.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.fecha_edicion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.grupo && row.grupo.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // Filtro por grupo de producto (incluyendo hijos)
    let matchesGroup = true
    if (selectedGroup && selectedGroup !== '') {
      if (selectedGroupData) {
        // Filtro jerárquico: incluir grupo seleccionado y todos sus hijos
        const allGroupIds = getAllGroupIds(selectedGroupData, selectedGroup)
        matchesGroup = allGroupIds.includes(row.group_id?.toString())
      } else {
        // Filtro simple por group_id directo
        matchesGroup = row.group_id?.toString() === selectedGroup
      }
    }

    return matchesSearch && matchesGroup
  })

  // Nueva función para manejar doble clic en una fila
  const handleRowDoubleClick = (row) => {
    setSelectedProductId(row.id)
    setProductDetailModalOpen(true)
  }

  const handleRowClick = (row) => {
    setSelectedRow(row.id)
    setEditedData(row)
  }

  const handleEditClick = () => {
    if (selectedRow) {
      setLocation(`/editarProducto?id=${selectedRow}`)
    }
  }

  const handleSaveChanges = async () => {
    try {
      // Aquí puedes implementar la lógica para guardar cambios
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

  // Nueva función para manejar la selección de grupos desde el modal ProductsFamily
  const handleGroupSelect = (groupId, groupName, groupData = null) => {
    setSelectedGroup(groupId ? groupId.toString() : '')
    setSelectedGroupData(groupData) // Almacenar información completa del grupo
  }

  const handleMoveInventoryClick = () => {
    setLocation('/moveInventory')
  }
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
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
          <div className="alert alert-info mb-4">
            <div className="flex items-center justify-between">
              <span>ℹ️ No se pudieron cargar las sucursales. Mostrando todos los productos.</span>
              <button className="btn btn-sm btn-outline btn-info" onClick={() => loadInitialData()}>
                Reintentar cargar sucursales
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
                data-tip="Mover producto entre sucursales"
                onClick={handleMoveInventoryClick}
              >
                <Truck className="h-5 w-5" />
              </button>
            </li>
          </ul>

          {/* Filtros y búsqueda */}
          <div className="flex items-center gap-2">
            {/* Selector de sucursal */}
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-gray-600">Sucursal:</span>
              <select
                className="select select-bordered select-warning select-sm w-44"
                value={selectedStorage}
                onChange={handleStorageChange}
              >
                <option value="">🌍 Todas</option>
                {currentStorage && (
                  <option value={currentStorage.id} className="font-semibold">
                    🏢 {currentStorage.name}
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

            {/* Filtro de grupo mejorado y compacto */}
            {selectedGroup ? (
              <div className="flex items-center gap-1">
                <div className="badge badge-warning gap-1 px-2 py-3 text-sm font-medium">
                  <span className="text-xs">📦</span>
                  <span className="max-w-32 truncate">
                    {selectedGroupData?.group_name || `Grupo ${selectedGroup}`}
                  </span>
                  {selectedGroupData?.children && selectedGroupData.children.length > 0 && (
                    <span className="badge badge-xs badge-outline ml-1">
                      +
                      {(() => {
                        const allIds = getAllGroupIds(selectedGroupData, selectedGroup)
                        return allIds.length - 1 // -1 porque no contamos el grupo padre
                      })()}
                    </span>
                  )}
                  <button
                    className="ml-1 rounded-full p-0.5 transition-colors hover:bg-red-200 hover:text-red-700"
                    onClick={() => {
                      setSelectedGroup('')
                      setSelectedGroupData(null)
                    }}
                    title="Quitar filtro de grupo"
                  >
                    <span className="text-xs leading-none">✕</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="tooltip" data-tip="Usa el botón 'Grupos' para filtrar por categoría">
                <div className="badge badge-ghost gap-1 px-2 py-3 text-xs">
                  <span className="opacity-50">📦</span>
                  <span className="italic opacity-50">Sin filtro</span>
                </div>
              </div>
            )}

            {/* Barra de búsqueda más compacta */}
            <div className="flex items-center gap-1">
              <label className="input input-bordered input-warning input-sm flex w-48 items-center gap-2">
                <input
                  type="text"
                  placeholder="Buscar por producto, marca o grupo..."
                  className="grow text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="h-3 w-3" />
              </label>
              {/* Ahora busca por producto, marca y grupo (sin código de barras general) */}
            </div>
          </div>
        </div>

        {/* Tabla de inventario */}
        <div className="bg-base-200 overflow-x-auto rounded-lg shadow-lg">
          {loading ? (
            <div className="from-warning/5 to-warning/10 flex flex-col items-center justify-center rounded-lg bg-gradient-to-br p-12">
              <div className="mb-4">
                <l-pinwheel size="45" stroke="3.5" speed="0.9" color="#d97706"></l-pinwheel>
              </div>
              <span className="text-warning text-lg font-medium">Cargando inventario...</span>
              <span className="mt-1 text-sm text-gray-500">Por favor espera un momento</span>
            </div>
          ) : (
            <table className="table w-full">
              <thead className="bg-warning/10">
                <tr>
                  <th className="text-warning">Producto</th>
                  <th className="text-warning">Marca</th>
                  <th className="text-warning">Grupo</th>
                  <th className="text-warning">
                    {selectedStorage ? 'Cantidad en sucursal' : 'Cantidad total'}
                  </th>
                  <th className="text-warning">Precio</th>
                  <th className="text-warning">Fecha de edición</th>
                  {!selectedStorage && <th className="text-warning">Sucursales con stock</th>}
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={selectedStorage ? 6 : 7} className="p-8 text-center">
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
                      <td>{row.producto}</td>
                      <td>{row.marca}</td>
                      <td>
                        <span className="badge badge-outline">{row.grupo || 'Sin grupo'}</span>
                      </td>
                      <td>
                        <span
                          className={`badge ${row.cantidad_total > 0 ? 'badge-success' : 'badge-error'}`}
                        >
                          {row.cantidad_total}
                        </span>
                      </td>
                      <td>{formatCurrency(row.sale_price)}</td>
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

        <ProductsFamily onGroupSelect={handleGroupSelect} selectedGroupId={selectedGroup} />
      </div>
    </div>
  )
}
