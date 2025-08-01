import MenuVertical from '../componentes especificos/menuVertical'
import { useLocation } from 'wouter'
import Navbar from '../componentes especificos/navbar'
import { useSession } from '../contexts/SessionContext'
import { useState, useEffect } from 'react'
import { toast, Toaster } from 'react-hot-toast'
import { pinwheel } from 'ldrs'

export default function Usuario() {
  pinwheel.register()
  const [, setLocation] = useLocation()
  const { getCurrentUser, getCurrentStorage, logout, changeBranchStorage } = useSession()

  const currentUser = getCurrentUser()
  const currentStorage = getCurrentStorage()

  const [availableStorages, setAvailableStorages] = useState([])
  const [selectedStorageId, setSelectedStorageId] = useState('')
  const [isChangingStorage, setIsChangingStorage] = useState(false)

  // Cargar sucursales disponibles para el usuario
  useEffect(() => {
    const loadUserStorages = async () => {
      try {
        const sessionToken = localStorage.getItem('session_token')
        if (!sessionToken) return

        console.log('🏪 Cargando sucursales disponibles para el usuario...')
        const response = await fetch('http://localhost:5000/api/auth/user-storages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ session_token: sessionToken })
        })

        const data = await response.json()

        if (data.success) {
          console.log('✅ Sucursales cargadas:', data.storages)
          setAvailableStorages(data.storages || [])
        } else {
          console.error('❌ Error cargando sucursales:', data.message)
          toast.error('Error al cargar las sucursales disponibles')
        }
      } catch (error) {
        console.error('❌ Error de conexión cargando sucursales:', error)
        toast.error('Error de conexión al cargar sucursales')
      }
    }

    if (currentUser) {
      loadUserStorages()
    }
  }, [currentUser])

  // Establecer sucursal seleccionada cuando cambie la sucursal actual
  useEffect(() => {
    if (currentStorage?.id) {
      setSelectedStorageId(currentStorage.id.toString())
    } else {
      setSelectedStorageId('')
    }
  }, [currentStorage])

  const handleStorageChange = async (e) => {
    const newStorageId = e.target.value
    setSelectedStorageId(newStorageId)

    if (newStorageId === currentStorage?.id?.toString()) {
      // No cambio realmente
      return
    }

    try {
      setIsChangingStorage(true)
      console.log('🔄 Cambiando a sucursal:', newStorageId)

      const result = await changeBranchStorage(newStorageId === '' ? null : parseInt(newStorageId))

      if (result.success) {
        toast.success(`Sucursal cambiada exitosamente`)
        console.log('✅ Sucursal cambiada exitosamente')
      } else {
        toast.error(result.message)
        // Revertir selección si falla
        setSelectedStorageId(currentStorage?.id?.toString() || '')
      }
    } catch (error) {
      console.error('❌ Error cambiando sucursal:', error)
      toast.error('Error al cambiar sucursal')
      // Revertir selección si falla
      setSelectedStorageId(currentStorage?.id?.toString() || '')
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

  return (
    <div>
      <MenuVertical currentPath="/usuario" />
      <Navbar />
      <div className="flex h-screen w-full flex-col items-center justify-center">
        <div className="card bg-base-100 from-base-200 to-base-300 w-96 transform bg-gradient-to-br p-6 shadow-xl transition-all hover:scale-105">
          <figure className="px-10 pt-6">
            <img
              src="/src/images/user_icon.webp"
              alt="Usuario"
              className="border-primary h-40 w-40 rounded-full border-4 object-cover shadow-lg"
            />
          </figure>
          <div className="card-body items-center space-y-4 text-center">
            <h2 className="card-title text-2xl font-bold">{currentUser?.fullname}</h2>
            <div className="badge badge-primary badge-outline p-3 text-lg">
              Rol: {currentUser?.role === 'administrator' ? 'Administrador' : 'Empleado'}
            </div>

            {/* Información de sucursal actual */}
            <div className="bg-base-200 w-full rounded-lg p-3">
              <p className="text-sm font-medium text-gray-600">Sucursal Actual:</p>
              <p className="text-primary text-lg font-bold">
                {currentStorage?.name || 'Sin sucursal asignada'}
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
                  <option value="">Sin sucursal</option>
                  {availableStorages.map((storage) => (
                    <option key={storage.id} value={storage.id}>
                      {storage.name}
                      {storage.id === currentStorage?.id ? ' (Actual)' : ''}
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

              <button className="btn btn-primary btn-wide shadow-md">Editar Perfil</button>

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
