import { Info, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import MenuVertical from '../componentes especificos/menuVertical'
import Navbar from '../componentes especificos/navbar'
import { fetchEmployee } from '../services/employee/employeeService'

function Empleados() {
  const [location, setLocation] = useLocation()
  const [employee, setEmployee] = useState([])
  const [filteredEmployee, setFilteredEmployee] = useState([])
  const [selectedRow, setSelectedRow] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchById, setSearchById] = useState(false)
  const [employeeSeleccionado, setEmployeeSeleccionado] = useState(null)

  const handleRowClick = (row) => {
    setSelectedRow(row.id)
    console.log('Empleado seleccionado:', row)
    setEmployeeSeleccionado(row)
  }

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase()
    setSearchTerm(term)

    const filtered = employee.filter((row) => {
      if (searchById) {
        return row.id.toString().includes(term)
      } else {
        return row.entity_name.toLowerCase().includes(term) || row.cuit.includes(term)
      }
    })
    setFilteredEmployee(filtered)
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await fetchEmployee
        setEmployee(data)
        setFilteredEmployee(data) // Inicialmente mostrar todos
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [])
  return (
    <div>
      <MenuVertical currentPath={'/empleados'} />
      <Navbar />
      <div className="ml-20 flex-1">
        <h2 className="text-warning mb-6 text-2xl font-bold">Empleados</h2>
      </div>
      <div className="mr-5 mb-6 ml-20 flex items-center justify-between">
        <ul className="menu menu-horizontal bg-base-200 rounded-box gap-2">
          <li>
            <button
              className="btn btn-ghost tooltip tooltip-bottom"
              data-tip="Información del cliente"
              onClick={() => setLocation(`/infoEmpleado?id=${employeeSeleccionado.id}`)}
              disabled={!employeeSeleccionado}
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
              <th>CUIT</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployee.map((row, index) => (
              <tr
                key={row.id}
                className={`hover:bg-warning/10 cursor-pointer ${selectedRow === row.id ? 'bg-warning/20' : ''}`}
                onClick={() => handleRowClick(row)}
              >
                <td>{index + 1}</td>
                <td>{row.entity_name}</td>
                <td>{row.address}</td>
                <td>{row.phone}</td>
                <td>{row.cuit}</td>
              </tr>
            ))}

          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Empleados
