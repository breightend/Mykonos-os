import { ArrowLeft, Plus, X } from 'lucide-react'
import React, { useEffect } from 'react'
import { useLocation, useSearchParams } from 'wouter'
import { useState } from 'react'
import {
  fetchEmployeeById,
  assignStorageToEmployee,
  removeStorageFromEmployee
} from '../services/employee/employeeService'
import { fetchSucursales } from '../services/sucursales/sucursalesService'
import toast, { Toaster } from 'react-hot-toast'

function InfoEmpleado() {
  const [, setLocation] = useLocation()
  const [searchParams] = useSearchParams()
  const empleadoId = searchParams.get('id')
  const [empleado, setEmpleado] = useState(null)
  const [sucursales, setSucursales] = useState([])
  const [availableSucursales, setAvailableSucursales] = useState([])
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        // Fetch employee data
        const employeeData = await fetchEmployeeById(empleadoId)
        console.log('Employee data:', employeeData)
        setEmpleado(employeeData.record)

        // Set assigned sucursales from the employee data
        if (employeeData.record.assigned_storages) {
          setSucursales(employeeData.record.assigned_storages)
        }

        // Fetch all available sucursales
        const allSucursales = await fetchSucursales()
        setAvailableSucursales(allSucursales)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Error al cargar la información del empleado')
      } finally {
        setLoading(false)
      }
    }
    if (empleadoId) {
      fetchData()
    }
  }, [empleadoId])

  const handleAssignSucursal = async (sucursalId) => {
    try {
      setLoading(true)
      await assignStorageToEmployee(empleadoId, sucursalId)

      // Refresh employee data to update the assigned sucursales
      const updatedEmployee = await fetchEmployeeById(empleadoId)
      setEmpleado(updatedEmployee.record)
      if (updatedEmployee.record.assigned_storages) {
        setSucursales(updatedEmployee.record.assigned_storages)
      }

      toast.success('Sucursal asignada correctamente')
      setShowAssignModal(false)
    } catch (error) {
      console.error('Error assigning sucursal:', error)
      toast.error('Error al asignar la sucursal')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveSucursal = async (sucursalId) => {
    try {
      setLoading(true)
      await removeStorageFromEmployee(empleadoId, sucursalId)

      // Refresh employee data to update the assigned sucursales
      const updatedEmployee = await fetchEmployeeById(empleadoId)
      setEmpleado(updatedEmployee.record)
      if (updatedEmployee.record.assigned_storages) {
        setSucursales(updatedEmployee.record.assigned_storages)
      }

      toast.success('Sucursal removida correctamente')
    } catch (error) {
      console.error('Error removing sucursal:', error)
      toast.error('Error al remover la sucursal')
    } finally {
      setLoading(false)
    }
  }

  // Get available sucursales that are not already assigned
  const getUnassignedSucursales = () => {
    const assignedIds = sucursales.map((s) => s.id)
    return availableSucursales.filter((s) => !assignedIds.includes(s.id))
  }

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
                  <div>
                    <h2 className="mt-2 text-2xl font-bold">Información Adicional</h2>

                    {/* Sucursales Section */}
                    <div className="mt-6">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Sucursales con acceso:</h3>
                        <button
                          onClick={() => setShowAssignModal(true)}
                          className="btn btn-primary btn-sm"
                          disabled={loading}
                        >
                          <Plus className="mr-1 h-4 w-4" />
                          Asignar Sucursal
                        </button>
                      </div>

                      {loading ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="loading loading-spinner loading-sm"></div>
                          <span className="ml-2">Cargando...</span>
                        </div>
                      ) : sucursales.length > 0 ? (
                        <div className="grid gap-3">
                          {sucursales.map((sucursal) => (
                            <div
                              key={sucursal.id}
                              className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                            >
                              <div>
                                <h4 className="font-medium">{sucursal.name}</h4>
                                {sucursal.address && (
                                  <p className="text-sm text-gray-600">{sucursal.address}</p>
                                )}
                              </div>
                              <button
                                onClick={() => handleRemoveSucursal(sucursal.id)}
                                className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
                                disabled={loading}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-lg bg-gray-50 py-8 text-center">
                          <p className="text-gray-500">No hay sucursales asignadas</p>
                          <p className="mt-1 text-sm text-gray-400">
                            Haga clic en Asignar Sucursal para comenzar
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for assigning sucursales */}
      {showAssignModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="mb-4 text-lg font-bold">Asignar Sucursal</h3>

            {getUnassignedSucursales().length > 0 ? (
              <div className="space-y-2">
                {getUnassignedSucursales().map((sucursal) => (
                  <div
                    key={sucursal.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                  >
                    <div>
                      <h4 className="font-medium">{sucursal.name}</h4>
                      {sucursal.address && (
                        <p className="text-sm text-gray-600">{sucursal.address}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleAssignSucursal(sucursal.id)}
                      className="btn btn-primary btn-sm"
                      disabled={loading}
                    >
                      Asignar
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-gray-500">
                No hay sucursales disponibles para asignar
              </p>
            )}

            <div className="modal-action">
              <button onClick={() => setShowAssignModal(false)} className="btn" disabled={loading}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  )
}

export default InfoEmpleado
