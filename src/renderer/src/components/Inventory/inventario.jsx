import {
  PackagePlus,
  Search,
  Edit,
  Boxes,
  Truck,
  ListPlus,
  Printer,
  Loader,
  Scan
} from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { pinwheel } from 'ldrs'
import MenuVertical from '../../componentes especificos/menuVertical'
import Navbar from '../../componentes especificos/navbar'
import ProductsFamily from '../../modals/modalsInventory/productsFamily'
import ProductDetailModal from '../../modals/ProductDetailModal/ProductDetailModal'
import PrintBarcodeModal from '../../modals/modalsInventory/printBarcodeModal'
import ModalColoresYTalles from '../../modals/modalsProduct/modalColoresYTallesInventario'
import { inventoryService } from '../../services/inventory/inventoryService'
import { fetchSucursales } from '../../services/sucursales/sucursalesService'
import { salesService } from '../../services/salesService'
import { useSession } from '../../contexts/SessionContext'
import toast from 'react-hot-toast'
import { useHashLocation } from 'wouter/use-hash-location'
pinwheel.register()

//TODO: agregar que si no hay una sucursal logueada no se pueda acceder a nuevos productos ni mover productos entre sucursales.
export default function Inventario() {
  const [, setLocation] = useHashLocation()
  const { getCurrentStorage } = useSession()
  const [selectedRow, setSelectedRow] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editedData, setEditedData] = useState({})
  const [searchTerm, setSearchTerm] = useState('')

  // Estados para búsqueda por código de barras
  const [barcodeSearch, setBarcodeSearch] = useState('')
  const [searchingBarcode, setSearchingBarcode] = useState(false)
  const [highlightedProductId, setHighlightedProductId] = useState(null)
  const [barcodeFilteredProductId, setBarcodeFilteredProductId] = useState(null)

  // Refs para funcionalidad de barcode
  const barcodeInputRef = useRef(null)
  const autoSearchTimeoutRef = useRef(null)

  // Ref para trackear el último storage usado en el modal
  const lastModalStorageRef = useRef(null)

  // Nuevo estado para el modal de detalles
  const [productDetailModalOpen, setProductDetailModalOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState(null)

  // Nuevo estado para el modal de impresión de códigos de barras
  const [printBarcodeModalOpen, setPrintBarcodeModalOpen] = useState(false)
  const [selectedProductForPrint, setSelectedProductForPrint] = useState(null)

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

      try {
        const storagesResponse = await fetchSucursales()

        let storageArray = []
        if (Array.isArray(storagesResponse)) {
          storageArray = storagesResponse
        } else if (
          storagesResponse &&
          storagesResponse.status === 'success' &&
          Array.isArray(storagesResponse.data)
        ) {
          storageArray = storagesResponse.data
        } else {
          storageArray = []
        }

        setStorageList(storageArray)

        if (storageArray.length === 0) {
          console.warn('⚠️ No se encontraron sucursales o hubo un problema en la carga')
        }
      } catch (storageError) {
        console.error('❌ Error específico al cargar sucursales:', storageError)
        setStorageList([])
      }

      const storage = getCurrentStorage()
      if (storage?.id) {
        setSelectedStorage(storage.id.toString())
      } else {
        setSelectedStorage('')
      }

      const initialStorageId = storage?.id || null
      const response = await inventoryService.getProductsSummary(initialStorageId)

      if (response.status === 'success') {
        setInventoryData(response.data)
      } else {
        setError('La respuesta del servidor no fue exitosa')
      }
    } catch (err) {
      const errorMessage = err.message || 'Error desconocido al cargar datos iniciales'
      setError(errorMessage)
      console.error('Error en loadInitialData:', err)
    } finally {
      setLoading(false)
    }
  }, [getCurrentStorage])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  useEffect(() => {
    if (selectedStorage !== '' && selectedStorage !== currentStorage?.id?.toString()) {
      loadInventoryData(selectedStorage)
    } else if (selectedStorage === '' && storageList.length > 0) {
      loadInventoryData()
    }
  }, [selectedStorage, loadInventoryData, currentStorage?.id, storageList.length])

  // Cleanup timeout cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (autoSearchTimeoutRef.current) {
        clearTimeout(autoSearchTimeoutRef.current)
      }
    }
  }, [])

  const getAllGroupIds = (groupData, targetGroupId) => {
    if (!groupData) return [targetGroupId]

    let allIds = [targetGroupId]

    const collectChildrenIds = (children) => {
      if (!children || !Array.isArray(children)) return

      children.forEach((child) => {
        allIds.push(child.id.toString())
        if (child.children && child.children.length > 0) {
          collectChildrenIds(child.children)
        }
      })
    }

    if (groupData.children && groupData.children.length > 0) {
      collectChildrenIds(groupData.children)
    }

    return [...new Set(allIds)]
  }

  const filteredData = inventoryData.filter((row) => {
    // Si hay un producto filtrado por código de barras, mostrar solo ese
    if (barcodeFilteredProductId !== null) {
      return row.id === barcodeFilteredProductId
    }

    let matchesSearch = true
    if (searchTerm) {
      matchesSearch =
        row.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.fecha_edicion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.grupo && row.grupo.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    let matchesGroup = true
    if (selectedGroup && selectedGroup !== '') {
      if (selectedGroupData) {
        const allGroupIds = getAllGroupIds(selectedGroupData, selectedGroup)
        matchesGroup = allGroupIds.includes(row.group_id?.toString())
      } else {
        matchesGroup = row.group_id?.toString() === selectedGroup
      }
    }

    return matchesSearch && matchesGroup
  })

  const handleRowDoubleClick = (row) => {
    const currentStorageId = currentStorage?.id
    console.log('🎯 Opening modal for product:', row.id)
    console.log('🏪 Current storage from session:', currentStorageId)
    console.log('� Selected storage from inventory:', selectedStorage)
    console.log('🔍 Full currentStorage object:', currentStorage)
    console.log('💾 Modal will use storageId:', currentStorageId)

    // Force cache clear if storage changed since last modal open
    if (lastModalStorageRef.current && lastModalStorageRef.current !== currentStorageId) {
      console.log('🔄 Storage changed since last modal, will force fresh data')
    }

    lastModalStorageRef.current = currentStorageId
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
      setIsModalOpen(false)
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

  const handleGroupSelect = (groupId, groupName, groupData = null) => {
    setSelectedGroup(groupId ? groupId.toString() : '')
    setSelectedGroupData(groupData)
    // Limpiar filtro de código de barras al seleccionar grupo
    setBarcodeFilteredProductId(null)
  }

  const handleMoveInventoryClick = () => {
    setLocation('/moveInventory')
  }

  const handlePrintBarcodeClick = () => {
    if (selectedRow) {
      setSelectedProductForPrint(selectedRow)
      setPrintBarcodeModalOpen(true)
    }
  }

  // Función para buscar productos por código de barras
  const searchByBarcode = async (barcode) => {
    if (!barcode.trim()) return

    try {
      setSearchingBarcode(true)
      setBarcodeSearch('') // Limpiar inmediatamente para próximo escaneo
      console.log('🔍 Buscando producto por código de barras:', barcode)

      const response = await salesService.getProductByVariantBarcodeForExchange(barcode)

      if (response.status === 'success' && response.data) {
        const variantData = response.data

        // Buscar el producto en la lista actual usando el product_id
        const foundProduct = inventoryData.find((product) => product.id === variantData.product_id)

        if (foundProduct) {
          // Limpiar otros filtros
          setSearchTerm('')
          setSelectedGroup('')
          setSelectedGroupData(null)

          // Filtrar tabla para mostrar solo este producto
          setBarcodeFilteredProductId(foundProduct.id)
          setSelectedRow(foundProduct)

          // Resaltar el producto encontrado
          setHighlightedProductId(foundProduct.id)

          // Quitar el resaltado después de 3 segundos pero mantener el filtro
          setTimeout(() => {
            setHighlightedProductId(null)
          }, 3000)

          toast.success(
            `Producto encontrado: ${variantData.product_name} (${variantData.size_name}-${variantData.color_name})`,
            {
              duration: 3000,
              position: 'top-center'
            }
          )

          console.log('✅ Producto encontrado:', foundProduct)
        } else {
          toast.error(
            `Producto encontrado pero no está en la sucursal actual: ${variantData.product_name}`,
            {
              duration: 3000,
              position: 'top-center'
            }
          )
        }
      } else {
        toast.error('Producto no encontrado', {
          duration: 2500,
          position: 'top-center'
        })
      }
    } catch (error) {
      console.error('❌ Error buscando por código de barras:', error)
      if (error.response?.status === 404) {
        toast.error('Producto no encontrado', {
          duration: 2500,
          position: 'top-center'
        })
      } else {
        toast.error('Error al buscar el producto: ' + error.message, {
          duration: 3000,
          position: 'top-center'
        })
      }
    } finally {
      setSearchingBarcode(false)

      // Refocus el input para próximo escaneo
      setTimeout(() => {
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus()
        }
      }, 100)
    }
  }

  // Manejar input de código de barras
  const handleBarcodeInput = (e) => {
    const value = e.target.value
    setBarcodeSearch(value)

    // Limpiar timeout anterior si existe
    if (autoSearchTimeoutRef.current) {
      clearTimeout(autoSearchTimeoutRef.current)
    }

    // Si se presiona Enter, buscar inmediatamente
    if (e.key === 'Enter' && value.trim()) {
      searchByBarcode(value.trim())
      return
    }

    // Auto-búsqueda después de que el scanner termine de escribir
    // Los scanners suelen escribir muy rápido, así que esperamos 150ms sin nuevos caracteres
    if (value.trim() && value.length >= 8) {
      // Mínimo 8 caracteres para un código válido
      autoSearchTimeoutRef.current = setTimeout(() => {
        if (value.trim() === barcodeSearch.trim()) {
          // Verificar que no cambió mientras esperábamos
          searchByBarcode(value.trim())
        }
      }, 150)
    }
  }
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }
  const sortedData = [...filteredData].sort((a, b) => {
    if (
      (a.cantidad_total > 0 && b.cantidad_total > 0) ||
      (a.cantidad_total === 0 && b.cantidad_total === 0)
    ) {
      return 0
    }
    if (a.cantidad_total === 0) return 1
    if (b.cantidad_total === 0) return -1
    return 0
  })

  return (
    <div className="min-h-screen bg-base-100">
      <MenuVertical currentPath="/inventario" />
      <Navbar />
      <div className="ml-20 flex-1">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-warning">Inventario</h2>
            {selectedStorage ? (
              <p className="mt-1 text-sm text-gray-600">
                {selectedStorage === currentStorage?.id?.toString()
                  ? `Mostrando productos de: ${currentStorage?.name} (Mi sucursal)`
                  : `Mostrando productos de: ${
                      storageList.find((s) => s.id.toString() === selectedStorage)?.name ||
                      'Sucursal desconocida'
                    }`}
              </p>
            ) : (
              <p className="mt-1 text-sm text-gray-600">
                Mostrando productos de todas las sucursales
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
                className="btn btn-error btn-outline btn-sm"
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
              <span>No se pudieron cargar las sucursales. Mostrando todos los productos.</span>
              <button className="btn btn-info btn-outline btn-sm" onClick={() => loadInitialData()}>
                Reintentar cargar sucursales
              </button>
            </div>
          </div>
        )}

        {/* Barra de navegación */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <ul className="menu menu-horizontal gap-3 rounded-box bg-base-200 p-2">
              <li>
                <button
                  className="tooltip tooltip-bottom btn btn-ghost btn-md"
                  data-tip="Grupos"
                  onClick={() => document.getElementById('productsFamily').showModal()}
                >
                  <Boxes className="h-6 w-6" />
                </button>
              </li>
              <li>
                <button
                  className="tooltip tooltip-bottom btn btn-ghost btn-md"
                  data-tip="Editar producto"
                  onClick={handleEditClick}
                  disabled={!selectedRow}
                >
                  <Edit className="h-6 w-6" />
                </button>
              </li>
              <li>
                <button
                  className="tooltip tooltip-bottom btn btn-ghost btn-md"
                  data-tip="Imprimir código de barras"
                  onClick={handlePrintBarcodeClick}
                  disabled={!selectedRow}
                >
                  <Printer className="h-6 w-6" />
                </button>
              </li>
              <li>
                <button
                  className="tooltip tooltip-bottom btn btn-ghost btn-md"
                  data-tip="Nuevo producto"
                  onClick={() => setLocation('/nuevoProducto')}
                >
                  <PackagePlus className="h-6 w-6" />
                </button>
              </li>

              <li>
                <button
                  className="tooltip tooltip-bottom btn btn-ghost btn-md"
                  data-tip="Mover producto entre sucursales"
                  onClick={handleMoveInventoryClick}
                >
                  <Truck className="h-6 w-6" />
                </button>
              </li>
              <li>
                <button
                  className="tooltip tooltip-bottom btn btn-ghost btn-md"
                  data-tip="Agregar colores y talles"
                  onClick={() => document.getElementById('sizeColorModal').showModal()}
                >
                  <ListPlus className="h-6 w-6" />
                </button>
              </li>
            </ul>
            <div className="flex items-center gap-2">
              {/* Selector de sucursal */}
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-gray-600">Sucursal:</span>
                <select
                  className="select-enhanced"
                  value={selectedStorage}
                  onChange={handleStorageChange}
                >
                  <option value="">Todas las sucursales</option>
                  {currentStorage && (
                    <option value={currentStorage.id} className="font-semibold">
                      {currentStorage.name} (Mi sucursal)
                    </option>
                  )}
                  {storageList &&
                    storageList
                      .filter((storage) => storage.id !== currentStorage?.id)
                      .map((storage) => (
                        <option key={storage.id} value={storage.id}>
                          {storage.name}
                        </option>
                      ))}
                </select>
              </div>
            </div>
          </div>

          {/* Filtros y búsqueda */}
          <div>
            {/* Filtro de grupo mejorado y compacto */}
            {selectedGroup ? (
              <div className="flex items-center gap-1">
                <div className="badge badge-warning gap-1 px-2 py-3 text-sm font-medium">
                  <span className="text-xs">📦</span>
                  <span className="max-w-32 truncate">
                    {selectedGroupData?.group_name || `Grupo ${selectedGroup}`}
                  </span>
                  {selectedGroupData?.children && selectedGroupData.children.length > 0 && (
                    <span className="badge badge-outline badge-xs ml-1">
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

            {/* Barras de búsqueda */}
            <div className="flex items-center gap-2">
              {/* Búsqueda por texto */}
              <label className="search-enhanced input-bordered input flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Buscar productos, marcas o grupos..."
                  className="grow text-sm"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    // Limpiar filtro de código de barras al usar búsqueda normal
                    setBarcodeFilteredProductId(null)
                  }}
                />
                <Search className="h-4 w-4 opacity-70" />
              </label>

              {/* Búsqueda por código de barras */}
              <label className="input-bordered border-primary/30 bg-primary/10 input flex items-center gap-2">
                <input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder={searchingBarcode ? 'Procesando...' : 'Escanear código...'}
                  className="grow bg-transparent text-sm"
                  value={barcodeSearch}
                  onChange={(e) => setBarcodeSearch(e.target.value)}
                  onKeyDown={handleBarcodeInput}
                  disabled={searchingBarcode}
                />
                {searchingBarcode ? (
                  <l-pinwheel size="16" stroke="2" speed="0.9" color="currentColor"></l-pinwheel>
                ) : (
                  <Scan className="h-4 w-4 opacity-70" />
                )}
              </label>
            </div>

            {/* Texto de ayuda para búsqueda por código de barras */}
            <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
              {highlightedProductId && (
                <span className="animate-bounce font-medium text-success">
                  ✅ Producto encontrado y resaltado
                </span>
              )}
              {barcodeFilteredProductId && (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-info">
                    🔍 Mostrando solo producto escaneado
                  </span>
                  <button
                    onClick={() => {
                      setBarcodeFilteredProductId(null)
                      setHighlightedProductId(null)
                      setBarcodeSearch('')
                    }}
                    className="btn btn-ghost btn-xs text-info hover:text-info-content"
                    title="Mostrar todos los productos"
                  >
                    ✕ Limpiar filtro
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* boton para recargar solo la tabla*/}

        <div>
          <button
            onClick={loadInitialData}
            className="ml-10 transition-transform duration-500 hover:rotate-180"
            title="Recargar tabla"
          >
            <Loader />
          </button>
        </div>
        {/* Tabla de inventario */}
        <div className="overflow-x-auto rounded-lg shadow-lg">
          {loading ? (
            <div className="flex flex-col items-center justify-center rounded-lg bg-base-100 p-12">
              <div className="mb-4">
                <l-pinwheel size="45" stroke="3.5" speed="0.9" color="#d97706"></l-pinwheel>
              </div>
              <span className="text-lg font-medium text-orange-600">Cargando inventario...</span>
              <span className="mt-1 text-sm text-base-content">Por favor espera un momento</span>
            </div>
          ) : (
            <table className="table-modern table w-full">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Marca</th>
                  <th>Grupo</th>
                  <th>{selectedStorage ? 'Cantidad en sucursal' : 'Cantidad total'}</th>
                  <th>Precio</th>
                  <th>Fecha de edición</th>
                  {!selectedStorage && <th>Sucursales con stock</th>}
                </tr>
              </thead>
              <tbody>
                {sortedData.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={selectedStorage ? 6 : 7} className="p-8 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="text-4xl">📦</div>
                        <div>
                          <p className="text-lg font-semibold">No hay productos disponibles</p>
                          <p className="mt-1 text-sm text-gray-500">
                            {searchTerm || barcodeSearch || barcodeFilteredProductId
                              ? 'No se encontraron productos que coincidan con tu búsqueda'
                              : selectedStorage
                                ? 'Esta sucursal no tiene productos en stock'
                                : 'No hay productos cargados en el sistema'}
                          </p>
                          {!searchTerm && !barcodeSearch && !barcodeFilteredProductId && (
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
                  sortedData.map((row) => (
                    <tr
                      key={row.id}
                      className={`cursor-pointer ${selectedRow === row.id ? 'selected' : ''} ${row.cantidad_total === 0 ? 'row-out-of-stock' : ''} ${highlightedProductId === row.id ? 'bg-success/20 animate-pulse border-l-4 border-success' : ''}`}
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
            <div className="w-96 rounded-lg bg-base-100 p-6 shadow-2xl">
              <h3 className="mb-4 text-lg font-bold text-warning">Editar Producto</h3>
              <form className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Producto</label>
                  <input
                    type="text"
                    value={editedData.producto}
                    onChange={(e) => handleInputChange('producto', e.target.value)}
                    className="input-bordered input w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Marca</label>
                  <input
                    type="text"
                    value={editedData.marca}
                    onChange={(e) => handleInputChange('marca', e.target.value)}
                    className="input-bordered input w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Cantidad</label>
                  <input
                    type="number"
                    value={editedData.cantidad}
                    onChange={(e) => handleInputChange('cantidad', parseInt(e.target.value, 10))}
                    className="input-bordered input w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Colores</label>
                  <input
                    type="text"
                    value={editedData.colores}
                    onChange={(e) => handleInputChange('colores', e.target.value)}
                    className="input-bordered input w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Fecha de edición</label>
                  <input
                    type="text"
                    value={editedData.fecha}
                    onChange={(e) => handleInputChange('fecha', e.target.value)}
                    className="input-bordered input w-full"
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
          key={`product-${selectedProductId}-storage-${selectedStorage || currentStorage?.id}`}
          isOpen={productDetailModalOpen}
          onClose={() => {
            setProductDetailModalOpen(false)
          }}
          productId={selectedProductId}
          storageId={selectedStorage || currentStorage?.id}
        />

        {/* Modal de impresión de códigos de barras */}
        <PrintBarcodeModal
          isOpen={printBarcodeModalOpen}
          onClose={() => setPrintBarcodeModalOpen(false)}
          productId={selectedProductForPrint}
          currentStorageId={currentStorage?.id}
        />

        <ProductsFamily onGroupSelect={handleGroupSelect} selectedGroupId={selectedGroup} />

        <ModalColoresYTalles onRefresh={loadInitialData} />
      </div>
    </div>
  )
}
