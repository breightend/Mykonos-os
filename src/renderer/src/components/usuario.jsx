import MenuVertical from '../componentes especificos/menuVertical'
import Navbar from '../componentes especificos/navbar'
import { useSession } from '../contexts/SessionContext'
import { useState, useEffect } from 'react'
import { toast, Toaster } from 'react-hot-toast'
import { pinwheel } from 'ldrs'
import { fetchEmployeeById, fetchEmployeeStorages } from '../services/employee/employeeService'
import { fetchSucursalById } from '../services/sucursales/sucursalesService'
import { useHashLocation } from 'wouter/use-hash-location'

export default function Usuario() {
  pinwheel.register()
  const [, setLocation] = useHashLocation()
  const { session, logout, setCurrentStorage } = useSession()

  const [currentUser, setCurrentUser] = useState(null)
  const [localActual, setLocalActual] = useState(null)
  const [availableStorages, setAvailableStorages] = useState([])
  const [selectedStorageId, setSelectedStorageId] = useState('')
  const [isChangingStorage, setIsChangingStorage] = useState(false)
  const [userBd, setUserDd] = useState(null)

  const getEmployeeData = async () => {
    try {
      const response = await fetchEmployeeById(session.user_id)
      if (response.success) {
        setUserDd(response.record)
      } else {
        console.error('❌ Error al cargar datos del usuario:', response.message)
        toast.error('Error al cargar datos del usuario')
      }
    } catch (error) {
      console.error('❌ Error de conexión cargando datos del usuario:', error)
      toast.error('Error de conexión al cargar datos del usuario')
    }
  }

  const getStorageData = async () => {
    try {
      const response = await fetchSucursalById(session.storage_id)
      console.log('Datos de la sucursal:', response)
      if (response.success) {
        setLocalActual(response.record)
      } else {
        console.error('❌ Error al cargar datos de la sucursal:')
        toast.error('Error al cargar datos de la sucursal')
      }
    } catch (error) {
      console.error('❌ Error de conexión cargando datos de la sucursal:', error)
      toast.error('Error de conexión al cargar datos de la sucursal')
    }
  }

  const getStorageAllow = async () => {
    try {
      const response = await fetchEmployeeStorages(session.user_id)
      const data = await response

      if (data) {
        setAvailableStorages(data)
      } else {
        console.error('❌ Error al cargar datos de la sucursal:')
        toast.error('Error al cargar datos de la sucursal')
      }
    } catch (error) {
      console.error('❌ Error de conexión cargando datos de la sucursal:', error)
      toast.error('Error de conexión al cargar datos de la sucursal')
    }
  }

  console.log(
    'Sucursal actual:',
    localActual && localActual.name ? localActual.name : 'Sin sucursal asignada'
  )
  useEffect(() => {
    if (session) {
      const user = {
        id: session.user_id,
        username: session.username,
        fullname: session.fullname,
        role: session.role
      }
      getEmployeeData()
      getStorageData()
      if (localActual && localActual.id) {
        setSelectedStorageId(localActual.id.toString())
      } else {
        setSelectedStorageId('')
      }
      setCurrentUser(user)
    } else {
      setCurrentUser(null)
      setLocalActual(null)
    }
  }, [session])

  useEffect(() => {
    getStorageAllow()
  }, [currentUser])

  useEffect(() => {
    if (localActual?.id) {
      setSelectedStorageId(localActual.id.toString())
    } else {
      setSelectedStorageId('')
    }
  }, [localActual])

  const handleStorageChange = async (e) => {
    const newStorageId = e.target.value
    setSelectedStorageId(newStorageId)

    if (newStorageId === localActual?.id?.toString()) {
      return
    }

    try {
      setIsChangingStorage(true)
      console.log('🔄 Cambiando a sucursal:', newStorageId)
      setSelectedStorageId(localActual && localActual.id ? localActual.id.toString() : '')
      setCurrentStorage({
        id: newStorageId === '' ? null : parseInt(newStorageId),
        name:
          availableStorages.find((s) => s.id === parseInt(newStorageId))?.name ||
          'Sucursal desconocida'
      })
      setLocalActual({
        id: newStorageId === '' ? null : parseInt(newStorageId),
        name:
          availableStorages.find((s) => s.id === parseInt(newStorageId))?.name ||
          'Sucursal desconocida'
      })
    } catch (error) {
      console.error('❌ Error cambiando sucursal:', error)
      toast.error('Error de conexión al cambiar sucursal')
      setSelectedStorageId(localActual?.id?.toString() || '')
    } finally {
      setIsChangingStorage(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      setLocation('/')
    } catch (error) {
      console.error('Error en logout:', error)
      setLocation('/')
    }
  }
  console.log(
    'Sucursal actual:',
    localActual && localActual.name ? localActual.name : 'Sin sucursal asignada'
  )
  return (
    <div>
      <MenuVertical currentPath="/usuario" />
      <Navbar />
      <div className="mt-4 flex w-full flex-col items-center justify-center">
        <div className="card w-96 transform bg-base-100 bg-gradient-to-br from-base-200 to-base-300 p-6 shadow-xl transition-all hover:scale-105">
          <figure className="px-10">
            {userBd ? (
              <img
                src={userBd.profile_image}
                alt="Usuario"
                className="h-40 w-40 rounded-full border-4 border-primary object-cover shadow-lg"
              />
            ) : (
              <img
                src="/src/images/user_icon.webp"
                alt="Usuario"
                className="h-40 w-40 rounded-full border-4 border-primary object-cover shadow-lg"
              />
            )}
          </figure>
          <div className="card-body items-center space-y-4 text-center">
            <h2 className="card-title text-2xl font-bold">{currentUser?.fullname}</h2>
            <div className="badge badge-outline badge-primary p-3 text-lg">
              Rol: {currentUser?.role === 'administrator' ? 'Administrador' : 'Empleado'}
            </div>

            {/* Información de sucursal actual */}
            <div className="w-full rounded-lg bg-base-200 p-3">
              <p className="text-sm font-medium text-gray-600">Sucursal Actual:</p>
              <p className="text-lg font-bold text-primary">
                {localActual && localActual.name ? localActual.name : 'Sin sucursal asignada'}
              </p>
            </div>

            <div className="card-actions mt-4 w-full space-y-3">
              {/* Selector de sucursal */}
              <div className="w-full">
                <label className="label">
                  <span className="label-text font-medium">Cambiar Sucursal:</span>
                </label>
                <select
                  className="select select-primary w-full"
                  value={selectedStorageId}
                  onChange={handleStorageChange}
                  disabled={isChangingStorage || availableStorages.length === 0}
                >
                  {availableStorages.map((storage) => (
                    <option key={storage.id} value={storage.id}>
                      {storage && storage.name ? storage.name : 'Sucursal desconocida'}
                      {localActual && storage.id === localActual.id ? ' (Actual)' : ''}
                    </option>
                  ))}
                </select>
                {isChangingStorage && (
                  <div className="mt-2 flex items-center justify-center">
                    <l-pinwheel size="35" stroke="3.5" speed="0.9" color="black"></l-pinwheel>
                    <span className="text-sm">Cambiando sucursal...</span>
                  </div>
                )}
                {availableStorages.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    {currentUser?.role === 'administrator'
                      ? 'Cargando sucursales...'
                      : 'No tienes sucursales asignadas'}
                  </p>
                )}
              </div>

              <button className="btn btn-accent btn-wide shadow-md" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff'
          }
        }}
      />
    </div>
  )
}
