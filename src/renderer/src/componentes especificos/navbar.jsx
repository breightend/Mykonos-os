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
      <div className="ml-20">
        <div className="navbar grid grid-cols-3 gap-4 border-b border-base-300 bg-base-100 shadow-sm">
          {/* Logo/Home Section */}
          <div className="navbar-start col-span-2">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-3xl font-bold text-orange-500">Mykonos OS</h1>
                <p className="text-sm text-gray-600">Sistema de Gestión</p>
              </div>
            </div>
          </div>

          {/* Sucursal Section */}
          <div className="navbar-end mb-2">
            <div
              className={`card-compact card shadow-lg ${
                hasSucursal
                  ? 'border border-emerald-200 bg-emerald-50'
                  : 'border border-amber-200 bg-amber-50'
              }`}
            >
              <div className="card-body">
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-full p-3 ${
                      hasSucursal ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                    }`}
                  >
                    {hasSucursal ? (
                      <Building2 className="h-5 w-5" />
                    ) : (
                      <MapPin className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-sm font-bold uppercase tracking-wide ${
                        hasSucursal ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {hasSucursal ? 'Sucursal Activa' : 'Sin Sucursal'}
                    </p>
                    <p className="text-lg font-bold text-gray-800">{sucursalName}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
