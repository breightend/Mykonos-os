import { Info, Search, UserPlus } from 'lucide-react'
import { useLocation } from 'wouter'
import MenuVertical from '../componentes especificos/menuVertical'
import Navbar from '../componentes especificos/navbar'
import { useEffect, useState } from 'react'
import { fetchProvider } from '../services/proveedores/proveedorService'

export default function Proveedores() {
  const [location, setLocation] = useLocation()
  const [proveedores, setProveedores] = useState([])
  const [filteredProveedores, setFilteredProveedores] = useState([])
  const [selectedRow, setSelectedRow] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchById, setSearchById] = useState(false)
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null)

  const handleRowClick = (row) => {
    setSelectedRow(row.id)
    console.log('Proveedor seleccionado:', row)
    setProveedorSeleccionado(row)
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
        setFilteredProveedores(data) // Inicialmente mostrar todos
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
        <h2 className="text-warning mb-6 text-2xl font-bold">Proveedores</h2>
      </div>
      <div className="mr-5 mb-6 ml-20 flex items-center justify-between">
        <ul className="menu menu-horizontal bg-base-200 rounded-box gap-2">
          <li>
            <button
              className="btn btn-ghost tooltip tooltip-bottom"
              data-tip="Nuevo proveedor"
              onClick={() => setLocation('/nuevoProveedor')}
            >
              <UserPlus className="h-5 w-5" />
            </button>
          </li>
          <li>
            <button
              className="btn btn-ghost tooltip tooltip-bottom"
              data-tip="Información del cliente"
              onClick={() => setLocation(`/infoProvider?id=${proveedorSeleccionado.id}`)}
              disabled={!proveedorSeleccionado}
            >
              <Info className="h-5 w-5" />
            </button>
          </li>
        </ul>

        {/* Barra de búsqueda */}
        <div className="flex items-center gap-4">
          <label className="input input-bordered input-warning flex items-center gap-2">
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
      <div className="mr-5 mb-10 ml-20 overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Domicilio</th>
              <th>Teléfono</th>
              <th>Contacto</th>
              <th>CUIT</th>
            </tr>
          </thead>
          <tbody>
            {filteredProveedores.length > 0 &&
              filteredProveedores.map((row, index) => (
                <tr
                  key={row.id}
                  className={`hover:bg-warning/10 cursor-pointer ${
                    selectedRow === row.id ? 'bg-warning/20' : ''
                  }`}
                  onClick={() => handleRowClick(row)}
                >
                  <td>{index + 1}</td>
                  <td>{row.entity_name}</td>
                  <td>{row.domicilio_comercial}</td>
                  <td>{row.phone_number}</td>
                  <td>{row.contact_name}</td>
                  <td>{row.cuit}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
