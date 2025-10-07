import { ArrowLeft, Edit2, Save, CircleX, Trash2, Plus, X, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import {  useSearchParams } from 'wouter'
import {
  fetchSucursalById,
  fetchSucursalEmployees,
  putData,
  deleteData,
  assignEmployeeToSucursal,
  removeEmployeeFromSucursal
} from '../services/sucursales/sucursalesService'
import { fetchEmployee } from '../services/employee/employeeService'
import toast, { Toaster } from 'react-hot-toast'
import { useHashLocation } from 'wouter/use-hash-location'

function InfoSucursal() {
  const [, setLocation] = useHashLocation()
  const [searchParams] = useSearchParams()
  const sucursalId = searchParams.get('id')
  const [sucursal, setSucursal] = useState(null)
  const [employees, setEmployees] = useState([])
  const [allEmployees, setAllEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const [editFormData, setEditFormData] = useState({
    name: '',
    address: '',
    postal_code: '',
    phone_number: '',
    area: '',
    description: '',
    status: ''
  })
  const [editErrors, setEditErrors] = useState({})

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const data = await fetchSucursalById(sucursalId)
        setSucursal(data.record)

        setEditFormData({
          name: data.record.name || '',
          address: data.record.address || '',
          postal_code: data.record.postal_code || '',
          phone_number: data.record.phone_number || '',
          area: data.record.area || '',
          description: data.record.description || '',
          status: data.record.status || 'Active'
        })

        const employeesData = await fetchSucursalEmployees(sucursalId)
        console.log('Fetched employees data:', employeesData)
        setEmployees(employeesData || [])

        const allEmployeesData = await fetchEmployee()
        setAllEmployees(allEmployeesData || [])
      } catch (error) {
        console.error('Error fetching data:', error)
        if (error.message.includes('employees')) {
          toast.error(`Error al cargar empleados: ${error.message}`)
        } else {
          toast.error('Error al cargar la información de la sucursal')
        }
      } finally {
        setLoading(false)
      }
    }
    if (sucursalId) {
      fetchData()
    }
  }, [sucursalId])

  const handleEditClick = () => {
    setIsEditing(true)
    setEditErrors({})
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditErrors({})
    setEditFormData({
      name: sucursal.name || '',
      address: sucursal.address || '',
      postal_code: sucursal.postal_code || '',
      phone_number: sucursal.phone_number || '',
      area: sucursal.area || '',
      description: sucursal.description || '',
      status: sucursal.status || 'Active'
    })
  }

  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setEditFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 'Active' : 'Inactive') : value
    }))

    if (editErrors[name]) {
      setEditErrors((prev) => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateEditForm = () => {
    const errors = {}

    if (!editFormData.name?.trim()) {
      errors.name = 'El nombre de la sucursal es requerido'
    }

    setEditErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveEdit = async () => {
    if (!validateEditForm()) {
      return
    }

    try {
      setLoading(true)
      await putData(sucursalId, editFormData)

      // Refresh sucursal data
      const updatedSucursal = await fetchSucursalById(sucursalId)
      setSucursal(updatedSucursal.record)

      // Update edit form data with new values
      setEditFormData({
        name: updatedSucursal.record.name || '',
        address: updatedSucursal.record.address || '',
        postal_code: updatedSucursal.record.postal_code || '',
        phone_number: updatedSucursal.record.phone_number || '',
        area: updatedSucursal.record.area || '',
        description: updatedSucursal.record.description || '',
        status: updatedSucursal.record.status || 'Active'
      })

      setIsEditing(false)
      toast.success('Información de la sucursal actualizada correctamente')
    } catch (error) {
      console.error('Error updating sucursal:', error)
      toast.error('Error al actualizar la información de la sucursal')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSucursal = async () => {
    try {
      setLoading(true)
      await deleteData(sucursalId)
      toast.success('Sucursal eliminada correctamente')
      setLocation('/sucursales')
    } catch (error) {
      console.error('Error deleting sucursal:', error)
      toast.error('Error al eliminar la sucursal')
    } finally {
      setLoading(false)
      setShowDeleteModal(false)
    }
  }

  const handleAssignEmployee = async (employeeId) => {
    try {
      setLoading(true)
      await assignEmployeeToSucursal(sucursalId, employeeId)

      // Refresh employees data
      const updatedEmployees = await fetchSucursalEmployees(sucursalId)
      setEmployees(updatedEmployees || [])

      toast.success('Empleado asignado correctamente')
      setShowAssignModal(false)
    } catch (error) {
      console.error('Error assigning employee:', error)
      toast.error('Error al asignar el empleado')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveEmployee = async (employeeId) => {
    try {
      setLoading(true)
      await removeEmployeeFromSucursal(sucursalId, employeeId)

      // Refresh employees data
      const updatedEmployees = await fetchSucursalEmployees(sucursalId)
      setEmployees(updatedEmployees || [])

      toast.success('Empleado removido correctamente')
    } catch (error) {
      console.error('Error removing employee:', error)
      toast.error('Error al remover el empleado')
    } finally {
      setLoading(false)
    }
  }

  const getUnassignedEmployees = () => {
    const assignedIds = employees.map((emp) => emp.id)
    return allEmployees.filter((emp) => !assignedIds.includes(emp.id))
  }

  const getFilteredUnassignedEmployees = () => {
    const unassigned = getUnassignedEmployees()
    if (!searchTerm.trim()) {
      return unassigned
    }

    return unassigned.filter(
      (employee) =>
        employee.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.cuit?.includes(searchTerm)
    )
  }

  const handleEmployeeDoubleClick = (employeeId) => {
    setLocation(`/infoEmpleado?id=${employeeId}`)
  }

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
          <div className="text-base-content flex flex-col gap-4">
            {/* Action buttons */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex gap-2">
                {!isEditing ? (
                  <>
                    <button
                      onClick={handleEditClick}
                      className="btn btn-primary btn-sm"
                      disabled={loading}
                    >
                      <Edit2 className="mr-1 h-4 w-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="btn btn-error btn-sm"
                      disabled={loading}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Eliminar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      className="btn btn-success btn-sm"
                      disabled={loading}
                    >
                      <Save className="mr-1 h-4 w-4" />
                      Guardar
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="btn btn-outline btn-sm"
                      disabled={loading}
                    >
                      <CircleX className="mr-1 h-4 w-4" />
                      Cancelar
                    </button>
                  </>
                )}
              </div>

              {loading && (
                <div className="flex items-center">
                  <div className="loading loading-spinner loading-sm mr-2"></div>
                  <span>Cargando...</span>
                </div>
              )}
            </div>

            {sucursal && (
              <div className="w-full overflow-x-auto">
                {!isEditing ? (
                  /* View Mode */
                  <table className="table w-full text-sm">
                    <thead className="rounded-2xl bg-gray-800 text-white">
                      <tr>
                        <th>Nombre</th>
                        <th>Dirección</th>
                        <th>Código Postal</th>
                        <th>Teléfono</th>
                        <th>Área</th>
                        <th>Descripción</th>
                        <th>Estado</th>
                        <th>Creado en</th>
                      </tr>
                    </thead>
                    <tbody className="text-base-content">
                      <tr>
                        <td>{sucursal.name}</td>
                        <td>{sucursal.address || 'N/A'}</td>
                        <td>{sucursal.postal_code || 'N/A'}</td>
                        <td>{sucursal.phone_number || 'N/A'}</td>
                        <td>{sucursal.area || 'N/A'}</td>
                        <td>{sucursal.description || 'N/A'}</td>
                        <td>
                          <span
                            className={`badge ${sucursal.status === 'Active' ? 'badge-success' : 'badge-error'}`}
                          >
                            {sucursal.status}
                          </span>
                        </td>
                        <td>
                          {sucursal.created_at
                            ? new Date(sucursal.created_at).toLocaleDateString()
                            : 'N/A'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  /* Edit Mode */
                  <div className="space-y-4">
                    <h3 className="mb-4 text-lg font-semibold">
                      Editar Información de la Sucursal
                    </h3>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="label">
                          <span className="label-text">Nombre *</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={editFormData.name}
                          onChange={handleEditInputChange}
                          className={`input input-bordered w-full ${editErrors.name ? 'input-error' : ''}`}
                          placeholder="Nombre de la sucursal"
                        />
                        {editErrors.name && (
                          <p className="text-error mt-1 text-sm">{editErrors.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="label">
                          <span className="label-text">Dirección</span>
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={editFormData.address}
                          onChange={handleEditInputChange}
                          className="input input-bordered w-full"
                          placeholder="Dirección"
                        />
                      </div>

                      <div>
                        <label className="label">
                          <span className="label-text">Código Postal</span>
                        </label>
                        <input
                          type="text"
                          name="postal_code"
                          value={editFormData.postal_code}
                          onChange={handleEditInputChange}
                          className="input input-bordered w-full"
                          placeholder="Código postal"
                        />
                      </div>

                      <div>
                        <label className="label">
                          <span className="label-text">Teléfono</span>
                        </label>
                        <input
                          type="text"
                          name="phone_number"
                          value={editFormData.phone_number}
                          onChange={handleEditInputChange}
                          className="input input-bordered w-full"
                          placeholder="Número de teléfono"
                        />
                      </div>

                      <div>
                        <label className="label">
                          <span className="label-text">Área</span>
                        </label>
                        <input
                          type="text"
                          name="area"
                          value={editFormData.area}
                          onChange={handleEditInputChange}
                          className="input input-bordered w-full"
                          placeholder="Área o sección"
                        />
                      </div>

                      <div>
                        <label className="label cursor-pointer">
                          <span className="label-text">Estado Activo</span>
                          <input
                            type="checkbox"
                            name="status"
                            checked={editFormData.status === 'Active'}
                            onChange={handleEditInputChange}
                            className="checkbox checkbox-success"
                          />
                        </label>
                        <div className="mt-1 text-sm text-gray-500">
                          {editFormData.status === 'Active'
                            ? 'Sucursal activa'
                            : 'Sucursal inactiva'}
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="label">
                          <span className="label-text">Descripción</span>
                        </label>
                        <textarea
                          name="description"
                          value={editFormData.description}
                          onChange={handleEditInputChange}
                          className="textarea textarea-bordered w-full"
                          placeholder="Descripción de la sucursal"
                          rows="3"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Employees Section */}
        <div className="w-full rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Users className="h-5 w-5" />
              Empleados de la Sucursal
            </h2>
            <button
              onClick={() => setShowAssignModal(true)}
              className="btn btn-primary btn-sm"
              disabled={loading}
            >
              <Plus className="mr-1 h-4 w-4" />
              Asignar Empleado
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="table w-full text-sm">
              <thead className="rounded-2xl bg-gray-800 text-white">
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>CUIT</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody className="text-base-content">
                {employees.length > 0 ? (
                  employees.map((employee) => (
                    <tr
                      key={employee.id}
                      onDoubleClick={() => handleEmployeeDoubleClick(employee.id)}
                      className="cursor-pointer transition-colors hover:bg-gray-50"
                      title="Doble clic para ver información del empleado"
                    >
                      <td>{employee.id}</td>
                      <td>{employee.fullname}</td>
                      <td>{employee.email}</td>
                      <td>{employee.phone}</td>
                      <td>{employee.cuit}</td>
                      <td>
                        <span
                          className={`badge ${employee.status === 'active' ? 'badge-success' : 'badge-error'}`}
                        >
                          {employee.status}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleRemoveEmployee(employee.id)}
                          className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
                          disabled={loading}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-4 text-center">
                      No hay empleados asignados a esta sucursal
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold">Confirmar Eliminación</h3>
            <p className="py-4">
              ¿Estás seguro de que deseas eliminar la sucursal &quot;{sucursal?.name}&quot;? Esta
              acción no se puede deshacer.
            </p>
            <div className="modal-action">
              <button onClick={() => setShowDeleteModal(false)} className="btn" disabled={loading}>
                Cancelar
              </button>
              <button onClick={handleDeleteSucursal} className="btn btn-error" disabled={loading}>
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Employee Modal */}
      {showAssignModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="mb-4 text-lg font-bold">Asignar Empleado</h3>

            {getUnassignedEmployees().length > 0 ? (
              <>
                {/* Search bar */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Buscar empleado por nombre, email o CUIT..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input input-bordered w-full"
                  />
                </div>

                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {getFilteredUnassignedEmployees().length > 0 ? (
                    getFilteredUnassignedEmployees().map((employee) => (
                      <div
                        key={employee.id}
                        className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                      >
                        <div>
                          <h4 className="font-medium">{employee.fullname}</h4>
                          <p className="text-sm text-gray-600">{employee.email}</p>
                          <p className="text-sm text-gray-500">CUIT: {employee.cuit}</p>
                        </div>
                        <button
                          onClick={() => handleAssignEmployee(employee.id)}
                          className="btn btn-primary btn-sm"
                          disabled={loading}
                        >
                          Asignar
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="py-4 text-center text-gray-500">
                      No se encontraron empleados que coincidan con la búsqueda
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="py-4 text-center text-gray-500">
                No hay empleados disponibles para asignar
              </p>
            )}

            <div className="modal-action">
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setSearchTerm('')
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

      <Toaster />
    </div>
  )
}

export default InfoSucursal
