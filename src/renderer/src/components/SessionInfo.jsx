import { LogOut, User, MapPin, Clock } from 'lucide-react'
import { useSession } from '../contexts/SessionContext'
import { useLocation } from 'wouter'

const SessionInfo = () => {
  const { session, logout, getCurrentUser, getCurrentStorage } = useSession()
  const [, setLocation] = useLocation()

  const handleLogout = async () => {
    try {
      await logout()
      setLocation('/')
    } catch (error) {
      console.error('Error en logout:', error)
      // Aún así redirigir al login en caso de error
      setLocation('/')
    }
  }

  if (!session) {
    return null
  }

  const user = getCurrentUser()
  const storage = getCurrentStorage()

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar placeholder">
        <div className="bg-neutral text-neutral-content w-10 rounded-full">
          <User className="h-5 w-5" />
        </div>
      </div>
      <ul
        tabIndex={0}
        className="menu dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-80 border p-2 shadow-lg"
      >
        {/* Información del usuario */}
        <li className="menu-title">
          <span className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Información de Usuario
          </span>
        </li>
        <li className="px-4 py-2">
          <div className="text-sm">
            <div className="font-semibold">{user?.fullname}</div>
            <div className="text-gray-500">@{user?.username}</div>
            <div className="badge badge-outline badge-sm mt-1">
              {user?.role === 'administrator' ? 'Administrador' : 'Empleado'}
            </div>
          </div>
        </li>

        <div className="divider my-1"></div>

        {/* Información de la sucursal */}
        <li className="menu-title">
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Sucursal Actual
          </span>
        </li>
        <li className="px-4 py-2">
          <div className="text-sm">
            <div className="text-primary font-semibold">{storage?.name}</div>
            <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              Sesión activa
            </div>
          </div>
        </li>

        <div className="divider my-1"></div>

        {/* Acciones */}
        <li>
          <button
            onClick={handleLogout}
            className="text-error hover:bg-error hover:text-error-content"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </button>
        </li>
      </ul>
    </div>
  )
}

export default SessionInfo
