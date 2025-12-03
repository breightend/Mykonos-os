import { useState } from 'react'
import {
  User,
  ShoppingCart,
  Package,
  Factory,
  Users,
  ChartLine,
  ClipboardType,
  Menu,
  X,
  NotebookTabs,
  BriefcaseBusiness,
  Store
} from 'lucide-react'
import SettingsLog from './settingsLog'
import { useSession } from '../contexts/SessionContext'
import { useHashLocation } from 'wouter/use-hash-location'

export default function MenuVertical({ currentPath }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [, setLocation] = useHashLocation()
  const { getCurrentUser } = useSession()
  const role = getCurrentUser()?.role || 'user'
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  return (
    <div
      className={`bg-primary/60 fixed left-0 top-0 z-40 h-screen shadow-lg transition-all duration-300 ${isMenuOpen ? 'w-48' : 'w-16'} backdrop-blur-md`}
      data-menu="vertical"
      onMouseEnter={() => setIsMenuOpen(true)}
      onMouseLeave={() => setIsMenuOpen(false)}
    >
      <div className="flex items-center justify-center p-4">
        <button className="btn btn-ghost btn-circle border-0" onClick={toggleMenu}>
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <ul className="mt-2 flex flex-col space-y-1 p-2">
        <li>
          <button
            className={`btn btn-ghost w-full justify-start rounded-lg border-0 px-3 py-2 hover:bg-primary ${
              currentPath === '/usuario' ? 'bg-primary/70' : ''
            }`}
            onClick={() => setLocation('/usuario')}
          >
            <User size={20} className="flex-shrink-0" />
            {isMenuOpen && <span className="ml-3 font-medium">Usuario</span>}
          </button>
        </li>
        <li>
          <button
            className={`btn btn-ghost w-full justify-start rounded-lg border-0 px-3 py-2 hover:bg-primary ${
              currentPath === '/home' ? 'bg-primary/70' : ''
            }`}
            onClick={() => setLocation('/home')}
          >
            <NotebookTabs size={20} className="flex-shrink-0" />
            {isMenuOpen && <span className="ml-3 font-medium">Registro</span>}
          </button>
        </li>
        <li>
          <button
            className={`btn btn-ghost w-full justify-start rounded-lg border-0 px-3 py-2 hover:bg-primary hover:shadow-lg ${
              currentPath === '/ventas' ? 'bg-primary/70' : ''
            }`}
            onClick={() => setLocation('/ventas')}
          >
            <ShoppingCart size={20} className="flex-shrink-0" />
            {isMenuOpen && <span className="ml-3 font-medium">Venta</span>}
          </button>
        </li>
        <li>
          <button
            className={`btn btn-ghost w-full justify-start rounded-lg border-0 px-3 py-2 hover:bg-primary ${
              currentPath === '/inventario' ? 'bg-primary/70' : ''
            }`}
            onClick={() => setLocation('/inventario')}
          >
            <Package size={20} className="flex-shrink-0" />
            {isMenuOpen && <span className="ml-3 font-medium">Inventario</span>}
          </button>
        </li>
        {role === 'administrator' && (
          <li>
            <button
              className={`btn btn-ghost w-full justify-start rounded-lg border-0 px-3 py-2 hover:bg-primary ${
                currentPath === '/proveedores' ? 'bg-primary/70' : ''
              }`}
              onClick={() => setLocation('/proveedores')}
            >
              <Factory size={20} className="flex-shrink-0" />
              {isMenuOpen && <span className="ml-3 font-medium">Proveedores</span>}
            </button>
          </li>
        )}
        <li>
          <button
            className={`btn btn-ghost w-full justify-start rounded-lg border-0 px-3 py-2 hover:bg-primary ${
              currentPath === '/clientes' ? 'bg-primary/70' : ''
            }`}
            onClick={() => setLocation('/clientes')}
          >
            <Users size={20} className="flex-shrink-0" />
            {isMenuOpen && <span className="ml-3 font-medium">Clientes</span>}
          </button>
        </li>
        {role === 'administrator' && (
          <li>
            <button
              className={`btn btn-ghost w-full justify-start rounded-lg border-0 px-3 py-2 hover:bg-primary ${
                currentPath === '/empleados' ? 'bg-primary/70' : ''
              }`}
              onClick={() => setLocation('/empleados')}
            >
              <BriefcaseBusiness size={20} className="flex-shrink-0" />
              {isMenuOpen && <span className="ml-3 font-medium">Empleados</span>}
            </button>
          </li>
        )}
        {role === 'administrator' && (
          <li>
            <button
              className={`btn btn-ghost w-full justify-start rounded-lg border-0 px-3 py-2 hover:bg-primary ${
                currentPath === '/sucursales' ? 'bg-primary/70' : ''
              }`}
              onClick={() => setLocation('/sucursales')}
            >
              <Store size={20} className="flex-shrink-0" />
              {isMenuOpen && <span className="ml-3 font-medium">Sucursales</span>}
            </button>
          </li>
        )}
        {role === 'administrator' && (
          <div>
            <li>
              <button
                className={`btn btn-ghost w-full hover:bg-primary justify-start rounded-lg border-0 px-3 py-2 ${
                  currentPath === '/estadisticas' ? 'bg-primary/70' : ''
                }`}
                onClick={() => setLocation('/estadisticas')}
              >
                <ChartLine size={20} className="flex-shrink-0" />
                {isMenuOpen && <span className="ml-3 font-medium">Estadísticas</span>}
              </button>
            </li>
            <li>
              <button
                className={`btn btn-ghost w-full hover:bg-primary justify-start rounded-lg border-0 px-3 py-2 ${
                  currentPath === '/informes' ? 'bg-primary/70' : ''
                }`}
                onClick={() => setLocation('/informes')}
              >
                <ClipboardType size={20} className="flex-shrink-0" />
                {isMenuOpen && <span className="ml-3 font-medium">Informes</span>}
              </button>
            </li>
          </div>
        )}

        {/* Configuraciones al final del menú */}
        <li className="absolute bottom-4 left-2 right-2">
          <SettingsLog isMenuOpen={isMenuOpen} />
        </li>
      </ul>
    </div>
  )
}
