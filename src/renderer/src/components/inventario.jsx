import { PackagePlus, Search, Edit, Info, Boxes } from 'lucide-react'
import { useLocation } from 'wouter'
import { useState, useEffect, useCallback } from 'react'
import MenuVertical from '../componentes especificos/menuVertical'
import Navbar from '../componentes especificos/navbar'
import ProductsFamily from '../modals/modalsInventory/productsFamily'
import { inventoryService } from '../services/Inventory/inventoryService'
import { fetchSucursales } from '../services/sucursales/sucursalesService'

export default function Inventario() {
  const [, setLocation] = useLocation()
  const [selectedRow, setSelectedRow] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editedData, setEditedData] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [searchById, setSearchById] = useState(false)
  const [showData, setShowData] = useState(false)
  const [modalShowDataOpen, setModalShowDataOpen] = useState(false)

  // Estados para datos reales
  const [inventoryData, setInventoryData] = useState([])
  const [storageList, setStorageList] = useState([])
  const [selectedStorage, setSelectedStorage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadInventoryData = useCallback(async (storageId = null) => {
    try {
      setLoading(true)
      const response = await inventoryService.getProductsByStorage(storageId)
      if (response.status === 'success') {
        // Agrupar productos por ID para mostrar total por sucursal
        const groupedData = {}
        response.data.forEach((item) => {
          if (!groupedData[item.id]) {
            groupedData[item.id] = {
              id: item.id,
              producto: item.producto,
              marca: item.marca || 'Sin marca',
              cantidad: 0,
              colores: item.colores || 'Sin colores',
              fecha: item.fecha || new Date().toLocaleDateString(),
              sucursales: []
            }
          }
          groupedData[item.id].cantidad += parseInt(item.cantidad) || 0
          groupedData[item.id].sucursales.push({
            sucursal: item.sucursal,
            cantidad: item.cantidad
          })
        })

        setInventoryData(Object.values(groupedData))
      }
    } catch (err) {
      setError('Error al cargar el inventario')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true)
      const storagesResponse = await fetchSucursales()

      console.log('Cargando sucursales...', storagesResponse)
      if (!storagesResponse) {
        setError('No se pudieron cargar las sucursales')
        return
      }

      // fetchSucursales retorna directamente el array, no un objeto con status
      setStorageList(Array.isArray(storagesResponse) ? storagesResponse : [])
      console.log('Sucursales cargadas:', storagesResponse)

      // Cargar datos de inventario
      await loadInventoryData()
    } catch (err) {
      setError('Error al cargar los datos iniciales')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }, [loadInventoryData])

  // Cargar datos al montar el componente
  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // Cargar datos cuando cambie la sucursal seleccionada
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
        row.colores.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.fecha.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
  return (
    <div className="bg-base-100 min-h-screen">
      <MenuVertical currentPath="/inventario" />
      <Navbar />
      <div className="ml-20 flex-1">
        <h2 className="text-warning mb-6 text-2xl font-bold">Inventario</h2>

        {/* Mensaje de error */}
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
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
          </ul>

          {/* Filtros y búsqueda */}
          <div className="flex items-center gap-4">
            {/* Selector de sucursal */}
            <select
              className="select select-bordered select-warning"
              value={selectedStorage}
              onChange={handleStorageChange}
            >
              <option value="">Todas las sucursales</option>
              {storageList &&
                storageList.map((storage) => (
                  <option key={storage.id} value={storage.id}>
                    {storage.name}
                  </option>
                ))}
            </select>

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
                  <th className="text-warning">Colores</th>
                  <th className="text-warning">Fecha de edición</th>
                  {!selectedStorage && <th className="text-warning">Sucursales</th>}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-warning/10 cursor-pointer ${
                      selectedRow === row.id ? 'bg-warning/20' : ''
                    }`}
                    onClick={() => handleRowClick(row)}
                  >
                    <th>{row.id}</th>
                    <td>{row.producto}</td>
                    <td>{row.marca}</td>
                    <td>
                      <span
                        className={`badge ${row.cantidad > 0 ? 'badge-success' : 'badge-error'}`}
                      >
                        {row.cantidad}
                      </span>
                    </td>
                    <td>{row.colores}</td>
                    <td>{row.fecha}</td>
                    {!selectedStorage && (
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {row.sucursales?.map((sucursal, index) => (
                            <div key={index} className="badge badge-outline text-xs">
                              {sucursal.sucursal}: {sucursal.cantidad}
                            </div>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
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
        <ProductsFamily />
      </div>
    </div>
  )
}
