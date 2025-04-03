import MenuVertical from "../componentes especificos/menuVertical"
import Navbar from "../componentes especificos/navbar"
import { useLocation } from 'wouter'
import { Edit,  Search, UserPlus } from 'lucide-react'
import { fetchCliente } from "../services/clientes/clientsService"
import { useEffect, useState } from "react"
import InfoClientes from "../modals/infoCliente"

export default function Clientes() {
  const [location, setLocation] = useLocation()
  const [clientes, setClientes] = useState([])
  const [filteredClientes, setFilteredClientes] = useState([])
  const [selectedRow, setSelectedRow] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchById, setSearchById] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await fetchCliente()
        setClientes(data)
        setFilteredClientes(data) // Inicialmente mostrar todos
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }
    fetchData()
  }, [])

  const handleRowClick = (row) => {
    setSelectedRow(row.id)
    console.log("Cliente seleccionado:", row)
  }

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase()
    setSearchTerm(term)

    const filtered = clientes.filter(row => {
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
      <div className="flex-1 ml-20 ">
        <h2 className="text-2xl font-bold mb-6 text-warning">Clientes</h2>
      </div>
      <div className="flex items-center justify-between mb-6 ml-20 mr-5">
        <ul className="menu menu-horizontal bg-base-200 rounded-box gap-2">
          <li>
            <button
              className="btn btn-ghost tooltip tooltip-bottom"
              data-tip="Editar cliente"
              disabled={!selectedRow} // Deshabilitar si no hay nada seleccionado
            >
              <Edit className="w-5 h-5" />
            </button>
          </li>
          <li>
            <button
              className="btn btn-ghost tooltip tooltip-bottom"
              data-tip="Nuevo cliente"
              onClick={() => setLocation('/nuevoCliente')}
            >
              <UserPlus className="w-5 h-5" />
            </button>
          </li>
          <li>
            <InfoClientes clientes={selectedRow} />
          </li>
        </ul>

        {/* Barra de búsqueda */}
        <div className="flex items-center gap-4">
          <label className="input input-bordered flex items-center gap-2 input-warning">
            <input
              type="text"
              placeholder="Buscar..."
              className="grow"
              value={searchTerm}
              onChange={handleSearch}
            />
            <Search className="w-4 h-4" />
          </label>
        </div>
      </div>
      <div className="ml-20">
        <h1>Registro de clientes</h1>
        <table className="table w-full">
          <thead className="bg-warning/10 text-warning">
            <tr>
              <th>#</th>
              <th>Nombre y apellido</th>
              <th>DNI o CUIT</th>
              <th>Celular</th>
              <th>Mail</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredClientes.map((row, index) => (
              <tr
                key={row.id} // Usamos el id único del cliente como key
                className={`hover:bg-warning/10 cursor-pointer ${
                  selectedRow === row.id ? 'bg-warning/20' : ''
                }`}
                onClick={() => handleRowClick(row)}
              >
                <td>{index + 1}</td>
                <td>{row.entity_name}</td>
                <td>{row.cuit}</td>
                <td>{row.domicilio_comercial}</td>
                <td>{row.email || 'Sin Email'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
