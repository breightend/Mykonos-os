import { useSession } from '../contexts/SessionContext'
import { Building2, MapPin } from 'lucide-react'

export default function Navbar() {
  const { getCurrentStorage } = useSession()

  // Obtener información de la sucursal actual
  const sucursalInfo = getCurrentStorage()
  const sucursalName = sucursalInfo?.name || 'Sin sucursal'
  const hasSucursal = sucursalInfo?.id !== null

  return (
    <>
      <div className="ml-16">
        <div className="navbar bg-base-100 border-base-300 border-b shadow-sm">
          {/* Logo/Home Section */}
          <div className="navbar-start">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-primary text-3xl font-bold">Mykonos OS</h1>
                <p className="text-base-content/70 text-sm">Sistema de Gestión</p>
              </div>
            </div>
          </div>

          {/* Sucursal Section */}
          <div className="navbar-end">
            <div className="bg-base-200 flex items-center gap-2 rounded-lg px-4 py-2">
              <div
                className={`rounded-full p-2 ${hasSucursal ? 'bg-success text-success-content' : 'bg-warning text-warning-content'}`}
              >
                {hasSucursal ? <Building2 className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
              </div>
              <div className="text-right">
                <p className="text-base-content/80 text-sm font-medium">
                  {hasSucursal ? 'Sucursal Activa' : 'Sin Sucursal'}
                </p>
                <p className={`text-lg font-bold ${hasSucursal ? 'text-success' : 'text-warning'}`}>
                  {sucursalName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
