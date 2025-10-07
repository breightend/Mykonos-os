import { Info, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { pinwheel } from 'ldrs'
import MenuVertical from '../componentes especificos/menuVertical'
import Navbar from '../componentes especificos/navbar'
import { fetchEmployee } from '../services/employee/employeeService'
import '../assets/modal-improvements.css'
import { useHashLocation } from 'wouter/use-hash-location'

pinwheel.register()

function Empleados() {
  const [, setLocation] = useHashLocation()
  const [employee, setEmployee] = useState([])
  const [filteredEmployee, setFilteredEmployee] = useState([])
  const [selectedRow, setSelectedRow] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchById, setSearchById] = useState(false)
  const [employeeSeleccionado, setEmployeeSeleccionado] = useState(null)
  const [loading, setLoading] = useState(true)

  const handleRowClick = (row) => {
    setSelectedRow(row.id)
    console.log('Empleado seleccionado:', row)
    setEmployeeSeleccionado(row)
  }

  const handleRowDoubleClick = (row) => {
    console.log('Navegando a info del empleado:', row)
    setLocation(`/infoEmpleado?id=${row.id}`)
  }

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase()
    setSearchTerm(term)

    const filtered = employee.filter((row) => {
      if (searchById) {
        return row.id.toString().includes(term)
      } else {
        return row.fullname.toLowerCase().includes(term) || row.cuit.includes(term)
      }
    })
    setFilteredEmployee(filtered)
  }

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const data = await fetchEmployee()
        setEmployee(data)
        setFilteredEmployee(data)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div>
      <MenuVertical currentPath={'/empleados'} />
      <Navbar />
      <div className="ml-20 flex-1">
        <h2 className="mb-6 text-2xl font-bold text-warning">Empleados</h2>
      </div>
      <div className="mb-6 ml-20 mr-5 flex items-center justify-between">
        <ul className="menu menu-horizontal gap-2 rounded-box bg-base-200">
          <li>
            <button
              className="tooltip tooltip-right btn btn-ghost"
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
        {loading ? (
          <div className="from-warning/5 to-warning/10 flex flex-col items-center justify-center rounded-lg bg-gradient-to-br p-12">
            <div className="mb-4">
              <l-pinwheel size="45" stroke="3.5" speed="0.9" color="#d97706"></l-pinwheel>
            </div>
            <span className="text-lg font-medium text-warning">Cargando empleados...</span>
            <span className="mt-1 text-sm text-gray-500">Por favor espera un momento</span>
          </div>
        ) : (
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
              {filteredEmployee.length > 0 &&
                filteredEmployee.map((row, index) => (
                  <tr
                    key={row.id}
                    className={`selectable-item ${selectedRow === row.id ? 'selected' : ''}`}
                    onClick={() => handleRowClick(row)}
                    onDoubleClick={() => handleRowDoubleClick(row)}
                  >
                    <td>{index + 1}</td>
                    <td>{row.fullname}</td>
                    <td>{row.domicilio}</td>
                    <td>{row.phone}</td>
                    <td>{row.cuit}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Empleados
