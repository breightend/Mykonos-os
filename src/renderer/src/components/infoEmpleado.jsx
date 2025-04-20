import { ArrowLeft } from 'lucide-react'
import React, { useEffect } from 'react'
import { useLocation, useSearchParams } from 'wouter'
import { useState } from 'react'
import { fetchEmployeeById } from '../services/employee/employeeService'

function InfoEmpleado() {
  const [, setLocation] = useLocation()
  const [searchParams] = useSearchParams()
  const empleadoId = searchParams.get('id')
  const [empleado, setEmpleado] = useState(null)
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await fetchEmployeeById(empleadoId)
        console.log(data)
        setEmpleado(data.record)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [empleadoId])

  return (
    <div>
      <div className="w-full rounded-2xl p-2">
        <div className="mb-4 flex items-center gap-4 rounded-2xl bg-gray-800 p-4 text-white dark:bg-gray-400 dark:text-black">
          <button
            onClick={() => setLocation('/empleados')}
            className="btn btn-ghost btn-circle tooltip tooltip-bottom mb-4"
            data-tip="Volver"
          >
            <ArrowLeft />
          </button>
          <h1 className="mb-4 text-2xl font-bold">
            Información del Empleado: {empleado?.fullname}
          </h1>
        </div>
        <div className="w-full rounded-lg bg-white p-6 shadow-md">
          <div className="text-base-content flex flex-col items-center gap-4">
            <div className="verflow-x-auto">
              {empleado && (
                <div>
                  <div className="avatar flex justify-center">
                    <div className="ring-primary ring-offset-base-100 w-36 justify-center rounded-full ring ring-offset-2">
                      <img src={empleado.profile_image} />
                    </div>
                  </div>
                  <table className="mt-8 table w-full text-sm">
                    <thead className="rounded-2xl bg-gray-800 text-white">
                      <tr>
                        <th>#</th>
                        <th>Nombre</th>
                        <th>Domicilio</th>
                        <th>Celular</th>
                        <th>Mail</th>
                        <th>CUIT</th>
                        <th>Estado</th>
                        <th>Creado en:</th>
                      </tr>
                    </thead>
                    <tbody className="text-base-content">
                      <tr>
                        <td> </td>
                        <td>{empleado.fullname}</td>
                        <td>{empleado.domicilio}</td>
                        <td>{empleado.phone}</td>
                        <td>{empleado.email}</td>
                        <td>{empleado.cuit}</td>
                        <td>{empleado.status}</td>
                        <td>{empleado.created_at}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InfoEmpleado
