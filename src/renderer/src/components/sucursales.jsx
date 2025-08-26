import { Info, Search, Plus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { pinwheel } from 'ldrs'
import MenuVertical from '../componentes especificos/menuVertical'
import Navbar from '../componentes especificos/navbar'
import {
  fetchSucursales,
  fetchSucursalEmployees,
  postData as createSucursal
} from '../services/sucursales/sucursalesService'
import toast, { Toaster } from 'react-hot-toast'
import '../assets/modal-improvements.css'

// Register the pinwheel loader
pinwheel.register()

function Sucursales() {
  const [, setLocation] = useLocation()
  const [sucursales, setSucursales] = useState([])
  const [filteredSucursales, setFilteredSucursales] = useState([])
  const [selectedRow, setSelectedRow] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEmployeesModal, setShowEmployeesModal] = useState(false)
  const [employees, setEmployees] = useState([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [loading, setLoading] = useState(true)

  // Form state for creating new sucursal
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    postal_code: '',
    phone_number: '',
    area: '',
    description: '',
    status: 'Active'
  })

  const handleRowClick = (row) => {
    setSelectedRow(row.id)
    console.log('Sucursal seleccionada:', row)
    setSucursalSeleccionada(row)
  }

  const handleRowDoubleClick = (row) => {
    setLocation(`/infoSucursal?id=${row.id}`)
  }

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase()
    setSearchTerm(term)

    const filtered = sucursales.filter((row) => {
      return (
        row.name.toLowerCase().includes(term) ||
        row.address?.toLowerCase().includes(term) ||
        row.phone_number?.includes(term) ||
        row.area?.toLowerCase().includes(term)
      )
    })
    setFilteredSucursales(filtered)
  }
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 'Active' : 'Inactive') : value
    }))
  }

  const handleCreateSucursal = async (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('El nombre de la sucursal es requerido')
      return
    }

    try {
      await createSucursal(formData)
      toast.success('Sucursal creada exitosamente')
      setShowCreateModal(false)
      setFormData({
        name: '',
        address: '',
        postal_code: '',
        phone_number: '',
        area: '',
        description: '',
        status: 'Active'
      })
      // Refresh data
      fetchData()
    } catch (error) {
      console.error('Error creating sucursal:', error)
      toast.error('Error al crear la sucursal')
    }
  }

  const handleShowEmployees = async () => {
    if (!sucursalSeleccionada) {
      toast.error('Selecciona una sucursal primero')
      return
    }

    setLoadingEmployees(true)
    try {
      const employeeData = await fetchSucursalEmployees(sucursalSeleccionada.id)
      setEmployees(employeeData)
      setShowEmployeesModal(true)
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast.error('Error al cargar empleados')
    } finally {
      setLoadingEmployees(false)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      console.log('🔄 Iniciando fetchData...')
      const response = await fetchSucursales()
      console.log('📊 Respuesta completa recibida en fetchData:', response)
      console.log('📊 Tipo de respuesta:', typeof response)
      console.log('📊 Status de respuesta:', response?.status)
      console.log('📊 Datos en respuesta:', response?.data)

      // El servicio devuelve un objeto con {status, data, message}
      if (response && response.status === 'success' && Array.isArray(response.data)) {
        setSucursales(response.data)
        setFilteredSucursales(response.data)
        console.log('✅ Sucursales establecidas exitosamente:', response.data.length, 'elementos')
      } else if (response && response.status === 'error') {
        console.warn('⚠️ Error en la respuesta del servicio:', response.message)
        setSucursales([])
        setFilteredSucursales([])
        toast.error(`Error del servidor: ${response.message}`)
      } else {
        console.warn('⚠️ Formato de respuesta inesperado:', response)
        setSucursales([])
        setFilteredSucursales([])
        toast.error('Formato de respuesta inesperado del servidor')
      }
    } catch (error) {
      console.error('❌ Error fetching data:', error)
      toast.error(`Error al cargar sucursales: ${error.message}`)
      // Establecer arrays vacíos en caso de error
      setSucursales([])
      setFilteredSucursales([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div>
      <MenuVertical currentPath={'/sucursales'} />
      <Navbar />
      <div className="ml-20 flex-1">
        <h2 className="mb-6 text-2xl font-bold text-warning">Sucursales</h2>
      </div>

      <div className="mb-6 ml-20 mr-5 flex items-center justify-between">
        <ul className="menu menu-horizontal gap-2 rounded-box bg-base-200">
          <li>
            <button
              className="tooltip tooltip-right btn btn-ghost"
              data-tip="Empleados en sucursal"
              onClick={handleShowEmployees}
              disabled={!sucursalSeleccionada || loadingEmployees}
            >
              {loadingEmployees ? (
                <l-pinwheel size="20" stroke="2" speed="0.9" color="#d97706"></l-pinwheel>
              ) : (
                <Users className="h-5 w-5" />
              )}
            </button>
          </li>
          <li>
            <button
              className="tooltip tooltip-bottom btn btn-ghost"
              data-tip="Crear nueva sucursal"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-5 w-5" />
            </button>
          </li>
        </ul>

        {/* Search bar */}
        <div className="flex items-center gap-4">
          <label className="input-bordered input input-warning flex items-center gap-2">
            <input
              type="text"
              placeholder="Buscar sucursales..."
              className="grow"
              value={searchTerm}
              onChange={handleSearch}
            />
            <Search className="h-4 w-4" />
          </label>
        </div>
      </div>

      {/* Sucursales table */}
      <div className="mb-10 ml-20 mr-5 overflow-x-auto">
        {loading ? (
          <div className="from-warning/5 to-warning/10 flex flex-col items-center justify-center rounded-lg bg-gradient-to-br p-12">
            <div className="mb-4">
              <l-pinwheel size="45" stroke="3.5" speed="0.9" color="#d97706"></l-pinwheel>
            </div>
            <span className="text-lg font-medium text-warning">Cargando sucursales...</span>
            <span className="mt-1 text-sm text-gray-500">Por favor espera un momento</span>
          </div>
        ) : (
          <table className="table w-full">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Dirección</th>
                <th>Código Postal</th>
                <th>Teléfono</th>
                <th>Área</th>
                <th>Descripción</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {' '}
              {filteredSucursales.length > 0 &&
                filteredSucursales.map((row, index) => (
                  <tr
                    key={row.id}
                    className={`selectable-item cursor-pointer ${selectedRow === row.id ? 'selectable-item-selected' : ''}`}
                    onClick={() => handleRowClick(row)}
                    onDoubleClick={() => handleRowDoubleClick(row)}
                    title="Doble clic para ver información de la sucursal"
                  >
                    <td>{index + 1}</td>
                    <td className="font-semibold">{row.name}</td>
                    <td>{row.address || 'N/A'}</td>
                    <td>{row.postal_code || 'N/A'}</td>
                    <td>{row.phone_number || 'N/A'}</td>
                    <td>{row.area || 'N/A'}</td>
                    <td>{row.description || 'N/A'}</td>
                    <td>{row.status || 'N/D'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
        {!loading && filteredSucursales.length === 0 && (
          <div className="py-8 text-center text-gray-500">No se encontraron sucursales</div>
        )}
      </div>

      {/* Create Sucursal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-lg bg-base-100 p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-warning">Nueva Sucursal</h3>
            <form onSubmit={handleCreateSucursal} className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Nombre *</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input-bordered input w-full"
                  placeholder="Nombre de la sucursal"
                  required
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Dirección</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="input-bordered input w-full"
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
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  className="input-bordered input w-full"
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
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className="input-bordered input w-full"
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
                  value={formData.area}
                  onChange={handleInputChange}
                  className="input-bordered input w-full"
                  placeholder="Área o sección"
                />
              </div>

              <div>
                <label className="label cursor-pointer">
                  <span className="label-text">Estado Activo</span>
                  <input
                    type="checkbox"
                    name="status"
                    checked={formData.status === 'Active'}
                    onChange={handleInputChange}
                    className="checkbox checkbox-success"
                  />
                </label>
                <div className="mt-1 text-sm text-gray-500">
                  {formData.status === 'Active' ? 'Sucursal activa' : 'Sucursal inactiva'}
                </div>
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Descripción</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="textarea-bordered textarea w-full"
                  placeholder="Descripción de la sucursal"
                  rows="3"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button type="button" className="btn" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-warning">
                  Crear Sucursal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employees Modal */}
      {showEmployeesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-3/4 max-w-4xl rounded-lg bg-base-100 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-warning">
                Empleados - {sucursalSeleccionada?.name}
              </h3>
              <button
                className="btn btn-sm btn-circle"
                onClick={() => setShowEmployeesModal(false)}
              >
                ✕
              </button>
            </div>

            {employees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nombre Completo</th>
                      <th>Usuario</th>
                      <th>Email</th>
                      <th>Teléfono</th>
                      <th>CUIT</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee, index) => (
                      <tr key={employee.id}>
                        <td>{index + 1}</td>
                        <td>{employee.fullname}</td>
                        <td>{employee.username}</td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                No hay empleados asignados a esta sucursal
              </div>
            )}
          </div>
        </div>
      )}

      <Toaster position="bottom-right" />
    </div>
  )
}

export default Sucursales
