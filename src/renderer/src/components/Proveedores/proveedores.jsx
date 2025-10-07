import { Search, Package, FileChartPie, HousePlus, CalendarClock } from 'lucide-react'
import { pinwheel } from 'ldrs'
import MenuVertical from '../../componentes especificos/menuVertical'
import Navbar from '../../componentes especificos/navbar'
import { useEffect, useState } from 'react'
import { fetchProvider } from '../../services/proveedores/proveedorService'
import { fetchProviderJoinBrand } from '../../services/proveedores/brandService'
import toast, { Toaster } from 'react-hot-toast'
import { useSession } from '../../contexts/SessionContext'
import '../../assets/modal-improvements.css'
import { useHashLocation } from 'wouter/use-hash-location'

pinwheel.register()

export default function Proveedores() {
  const [, setLocation] = useHashLocation()
  const [proveedores, setProveedores] = useState([])
  const [filteredProveedores, setFilteredProveedores] = useState([])
  const [selectedRow, setSelectedRow] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchById, setSearchById] = useState(false)
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null)

  const [showBrandsModal, setShowBrandsModal] = useState(false)
  const [providerBrandData, setProviderBrandData] = useState([])
  const [brandSearchTerm, setBrandSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const { getCurrentUser } = useSession()
  const role = getCurrentUser()?.role || 'user'
  console.log('Rol del usuario :', role)

  const handleRowClick = (row) => {
    setSelectedRow(row.id)
    console.log('Proveedor seleccionado:', row)
    setProveedorSeleccionado(row)
  }

  const handleRowDoubleClick = (row) => {
    setLocation(`/infoProvider?id=${row.id}`)
  }

  const handleShowBrandsModal = async () => {
    try {
      setLoading(true)
      const data = await fetchProviderJoinBrand()
      setProviderBrandData(data)
      setShowBrandsModal(true)
    } catch (error) {
      console.error('Error fetching provider-brand data:', error)
      toast.error('Error al cargar las marcas')
    } finally {
      setLoading(false)
    }
  }

  const getFilteredProviderBrands = () => {
    if (!brandSearchTerm.trim()) {
      return providerBrandData
    }
    return providerBrandData.filter(
      (item) =>
        item.brand_name?.toLowerCase().includes(brandSearchTerm.toLowerCase()) ||
        item.entity_name?.toLowerCase().includes(brandSearchTerm.toLowerCase())
    )
  }

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase()
    setSearchTerm(term)

    const filtered = proveedores.filter((row) => {
      if (searchById) {
        return row.id.toString().includes(term)
      } else {
        return row.entity_name.toLowerCase().includes(term) || row.cuit.includes(term)
      }
    })
    setFilteredProveedores(filtered)
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await fetchProvider()
        setProveedores(data)
        setFilteredProveedores(data)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [])

  return (
    <div>
      <MenuVertical currentPath="/proveedores" />
      <Navbar />
      <div className="ml-20 flex-1">
        <h2 className="mb-6 text-2xl font-bold text-warning">Proveedores</h2>
      </div>
      <div className="mb-6 ml-20 mr-5 flex items-center justify-between">
        <ul className="menu menu-horizontal gap-2 rounded-box bg-base-200">
          <li>
            <button
              className="tooltip tooltip-bottom btn btn-ghost"
              data-tip="Nuevo proveedor"
              onClick={() => setLocation('/nuevoProveedor')}
            >
              <HousePlus className="h-5 w-5" />
            </button>
          </li>
          <li>
            <button
              className="tooltip tooltip-bottom btn btn-ghost"
              data-tip="Ver todas las marcas"
              onClick={handleShowBrandsModal}
              disabled={loading}
            >
              {loading ? (
                <l-pinwheel size="20" stroke="2" speed="0.9" color="#d97706"></l-pinwheel>
              ) : (
                <Package className="h-5 w-5" />
              )}
            </button>
          </li>
          {role === 'administrator' && (
            <li>
              <button
                className="tooltip tooltip-bottom btn btn-ghost"
                data-tip="Resumen proveedores"
                onClick={() => setLocation('/resumenProveedores')}
              >
                <FileChartPie className="h-5 w-5" />
              </button>
            </li>
          )}
          <li>
            <button
              className="tooltip tooltip-bottom btn btn-ghost"
              data-tip="Ver pedidos"
              onClick={() => setLocation('/pedidosProveedor')}
            >
              <CalendarClock className="h-5 w-5" />
            </button>
          </li>
        </ul>

        {/* Barra de búsqueda */}
        <div className="flex items-center gap-4">
          <label className="input-bordered input input-warning flex items-center gap-2">
            <input
              type="text"
              placeholder="Buscar..."
              className="grow"
              value={searchTerm}
              onChange={handleSearch}
            />
            <Search className="h-4 w-4" />
          </label>
        </div>
      </div>
      <div className="mb-10 ml-20 mr-5 overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Domicilio</th>
              <th>Teléfono</th>
              <th>Contacto</th>
              <th>CUIT</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProveedores.length > 0 &&
              filteredProveedores.map((row, index) => (
                <tr
                  key={row.id}
                  className={`selectable-item ${selectedRow === row.id ? 'selected' : ''}`}
                  onClick={() => handleRowClick(row)}
                  onDoubleClick={() => handleRowDoubleClick(row)}
                  title="Doble clic para ver información del proveedor"
                >
                  <td>{index + 1}</td>
                  <td>{row.entity_name}</td>
                  <td>{row.domicilio_comercial}</td>
                  <td>{row.phone_number}</td>
                  <td>{row.contact_name}</td>
                  <td>{row.cuit}</td>
                  <td>{row.observations}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Brands Modal */}
      {showBrandsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-5/6 max-w-6xl rounded-lg bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800">
                <Package className="h-6 w-6" />
                Marcas y Proveedores
              </h3>
              <button className="btn btn-sm btn-circle" onClick={() => setShowBrandsModal(false)}>
                ✕
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar por marca o proveedor..."
                value={brandSearchTerm}
                onChange={(e) => setBrandSearchTerm(e.target.value)}
                className="input-bordered input w-full"
              />
            </div>

            <div className="max-h-96 overflow-y-auto">
              <table className="table w-full">
                <thead className="sticky top-0 bg-gray-800 text-white">
                  <tr>
                    <th>ID Marca</th>
                    <th>Nombre Marca</th>
                    <th>Descripción Marca</th>
                    <th>Proveedor</th>
                    <th>CUIT</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredProviderBrands().length > 0 ? (
                    getFilteredProviderBrands().map((item, index) => (
                      <tr
                        key={`${item.id_brand}-${item.id_provider}-${index}`}
                        className="hover:bg-gray-50"
                      >
                        <td>{item.id_brand}</td>
                        <td className="font-semibold">{item.brand_name}</td>
                        <td>{item.description || 'N/A'}</td>
                        <td className="font-medium">{item.entity_name}</td>
                        <td>{item.cuit}</td>
                        <td>{item.phone_number}</td>
                        <td>{item.email}</td>
                        <td>
                          <button
                            onClick={() => {
                              setLocation(`/infoProvider?id=${item.id_provider}`)
                              setShowBrandsModal(false)
                            }}
                            className="btn btn-ghost btn-sm text-blue-600 hover:bg-blue-50"
                          >
                            Ver Proveedor
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="py-4 text-center text-gray-500">
                        {brandSearchTerm.trim()
                          ? 'No se encontraron marcas que coincidan con la búsqueda'
                          : 'No hay marcas registradas'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setShowBrandsModal(false)
                  setBrandSearchTerm('')
                }}
                className="btn"
                disabled={loading}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster position="bottom-right" />
    </div>
  )
}
