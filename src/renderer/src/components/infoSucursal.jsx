import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'wouter'
import { fetchSucursalById, fetchSucursalEmployees } from '../services/sucursales/sucursalesService'

function InfoSucursal() {
  const [, setLocation] = useLocation()
  const [searchParams] = useSearchParams()
  const sucursalId = searchParams.get('id')
  const [sucursal, setSucursal] = useState(null)
  const [employees, setEmployees] = useState([])

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await fetchSucursalById(sucursalId)
        console.log(data)
        setSucursal(data.record)

        // Fetch employees for this sucursal
        const employeesData = await fetchSucursalEmployees(sucursalId)
        setEmployees(employeesData.records || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [sucursalId])

  return (
    <div>
      <div className="w-full rounded-2xl p-2">
        <div className="mb-4 flex items-center gap-4 rounded-2xl bg-gray-800 p-4 text-white dark:bg-gray-400 dark:text-black">
          <button
            onClick={() => setLocation('/sucursales')}
            className="btn btn-ghost btn-circle tooltip tooltip-bottom mb-4"
            data-tip="Volver"
          >
            <ArrowLeft />
          </button>
          <h1 className="mb-4 text-2xl font-bold">Información de la Sucursal: {sucursal?.name}</h1>
        </div>

        <div className="mb-6 w-full rounded-lg bg-white p-6 shadow-md">
          <div className="text-base-content flex flex-col items-center gap-4">
            <div className="w-full overflow-x-auto">
              {sucursal && (
                <div>
                  <table className="table w-full text-sm">
                    <thead className="rounded-2xl bg-gray-800 text-white">
                      <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Dirección</th>
                        <th>Celular</th>
                        <th>Estado</th>
                        <th>Creado en</th>
                      </tr>
                    </thead>
                    <tbody className="text-base-content">
                      <tr>
                        <td>{sucursal.id}</td>
                        <td>{sucursal.name}</td>
                        <td>{sucursal.address}</td>
                        <td>{sucursal.phone_number}</td>
                        <td>
                          <span
                            className={`badge ${sucursal.status === 'Active' ? 'badge-success' : 'badge-error'}`}
                          >
                            {sucursal.status}
                          </span>
                        </td>
                        <td>{new Date(sucursal.created_at).toLocaleDateString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Employees Section */}
        <div className="w-full rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-bold">Empleados de la Sucursal</h2>
          <div className="overflow-x-auto">
            <table className="table w-full text-sm">
              <thead className="rounded-2xl bg-gray-800 text-white">
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Celular</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody className="text-base-content">
                {employees.length > 0 ? (
                  employees.map((employee) => (
                    <tr key={employee.id}>
                      <td>{employee.id}</td>
                      <td>{employee.fullname}</td>
                      <td>{employee.email}</td>
                      <td>{employee.phone}</td>
                      <td>
                        <span
                          className={`badge ${employee.status === 'Active' ? 'badge-success' : 'badge-error'}`}
                        >
                          {employee.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-4 text-center">
                      No hay empleados asignados a esta sucursal
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InfoSucursal
