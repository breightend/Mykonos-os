import { Info, Search, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { pinwheel } from 'ldrs'
import MenuVertical from '../componentes especificos/menuVertical'
import Navbar from '../componentes especificos/navbar'
import { fetchCliente } from '../services/clientes/clientsService'

// Register the pinwheel loader
pinwheel.register()

//TODO: Modal de editar informacion del cliente.
export default function Clientes() {
  const [location, setLocation] = useLocation()
  const [clientes, setClientes] = useState([])
  const [filteredClientes, setFilteredClientes] = useState([])
  const [selectedRow, setSelectedRow] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchById, setSearchById] = useState(false)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const data = await fetchCliente()
        setClientes(data)
        setFilteredClientes(data)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleRowClick = (row) => {
    setSelectedRow(row.id)
    console.log('Cliente seleccionado:', row)
    setClienteSeleccionado(row)
  }

  const handleRowDoubleClick = (row) => {
    setLocation(`/infoCliente?id=${row.id}`)
  }

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase()
    setSearchTerm(term)

    const filtered = clientes.filter((row) => {
      if (searchById) {
        return row.id.toString().includes(term)
      } else {
        return row.entity_name.toLowerCase().includes(term) || row.cuit.includes(term)
      }
    })
    setFilteredClientes(filtered)
  }

  return (
    <div>
      <Navbar />
      <MenuVertical currentPath="/clientes" />
      <div className="ml-20 flex-1">
        <h2 className="text-warning mb-6 text-2xl font-bold">Clientes</h2>
      </div>
      <div className="mr-5 mb-6 ml-20 flex items-center justify-between">
        <ul className="menu menu-horizontal bg-base-200 rounded-box gap-2">
          <li>
            <button
              className="btn btn-ghost tooltip tooltip-bottom"
              data-tip="Nuevo cliente"
              onClick={() => setLocation('/nuevoCliente')}
            >
              <UserPlus className="h-5 w-5" />
            </button>
          </li>
          <li>
            <button
              className="btn btn-ghost tooltip tooltip-bottom"
              data-tip="Información del cliente"
              onClick={() => setLocation(`/infoCliente?id=${clienteSeleccionado.id}`)}
              disabled={!clienteSeleccionado}
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
      <div className="ml-20">
        <h1 className="text-2xl font-medium">Registro de clientes</h1>
        {loading ? (
          <div className="from-warning/5 to-warning/10 flex flex-col items-center justify-center rounded-lg bg-gradient-to-br p-12">
            <div className="mb-4">
              <l-pinwheel size="45" stroke="3.5" speed="0.9" color="#d97706"></l-pinwheel>
            </div>
            <span className="text-warning text-lg font-medium">Cargando clientes...</span>
            <span className="mt-1 text-sm text-gray-500">Por favor espera un momento</span>
          </div>
        ) : (
          <table className="table w-full">
            <thead className="bg-warning/10 text-warning">
              <tr>
                <th>#</th>
                <th>Nombre y apellido</th>
                <th>DNI o CUIT</th>
                <th>Celular</th>
                <th>Domicilio</th>
                <th>Mail</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.length > 0 &&
                filteredClientes.map((row, index) => (
                  <tr
                    key={row.id} // Usamos el id único del cliente como key
                    className={`hover:bg-warning/10 cursor-pointer ${
                      selectedRow === row.id ? 'bg-warning/20' : ''
                    }`}
                    onClick={() => handleRowClick(row)}
                    onDoubleClick={() => handleRowDoubleClick(row)}
                  >
                    <td>{index + 1}</td>
                    <td>{row.entity_name}</td>
                    <td>{row.cuit}</td>
                    <td>{row.phone_number}</td>
                    <td>{row.domicilio_comercial}</td>
                    <td>{row.email || 'Sin Email'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
