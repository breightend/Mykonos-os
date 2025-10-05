import { useState } from 'react'
import { useLocation } from 'wouter'
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

export default function MenuVertical({ currentPath }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [, setLocation] = useLocation()
  const { getCurrentUser } = useSession()
  const role = getCurrentUser()?.role || 'user'
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  return (
    <div
      className={`menu-vertical ${isMenuOpen ? 'w-48' : 'w-16'} backdrop-blur-sm`}
      data-menu="vertical"
      onMouseEnter={() => setIsMenuOpen(true)}
      onMouseLeave={() => setIsMenuOpen(false)}
    >
      <label className="btn-icon swap swap-rotate btn m-2 border-none">
        <input type="checkbox" checked={isMenuOpen} onChange={toggleMenu} />
        <Menu className="swap-off h-5 w-5 fill-current text-white" />
        <X className="swap-on h-5 w-5 fill-current text-white" />
      </label>

      <ul className="mt-2 flex flex-col space-y-1 p-2">
        <li>
          <button
            className={`btn btn-ghost w-full justify-start rounded-lg px-3 py-2 ${
              currentPath === '/usuario' ? 'active btn-active' : ''
            }`}
            onClick={() => setLocation('/usuario')}
          >
            <User size={20} className="flex-shrink-0" />
            {isMenuOpen && <span className="ml-3 font-medium">Usuario</span>}
          </button>
        </li>
        <li>
          <button
            className={`btn btn-ghost w-full justify-start rounded-lg px-3 py-2 ${
              currentPath === '/home' ? 'active btn-active' : ''
            }`}
            onClick={() => setLocation('/home')}
          >
            <NotebookTabs size={20} className="flex-shrink-0" />
            {isMenuOpen && <span className="ml-3 font-medium">Registro</span>}
          </button>
        </li>
        <li>
          <button
            className={`btn btn-ghost w-full justify-start rounded-lg px-3 py-2 ${
              currentPath === '/ventas' ? 'active btn-active' : ''
            }`}
            onClick={() => setLocation('/ventas')}
          >
            <ShoppingCart size={20} className="flex-shrink-0" />
            {isMenuOpen && <span className="ml-3 font-medium">Venta</span>}
          </button>
        </li>
        <li>
          <button
            className={`btn btn-ghost w-full justify-start rounded-lg px-3 py-2 ${
              currentPath === '/inventario' ? 'active btn-active' : ''
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
              className={`btn btn-ghost w-full justify-start rounded-lg px-3 py-2 ${
                currentPath === '/proveedores' ? 'active btn-active' : ''
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
            className={`btn btn-ghost w-full justify-start rounded-lg px-3 py-2 ${
              currentPath === '/clientes' ? 'active btn-active' : ''
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
              className={`btn btn-ghost w-full justify-start rounded-lg px-3 py-2 ${
                currentPath === '/empleados' ? 'active btn-active' : ''
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
              className={`btn btn-ghost w-full justify-start rounded-lg px-3 py-2 ${
                currentPath === '/sucursales' ? 'active btn-active' : ''
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
                className={`btn btn-ghost w-full justify-start rounded-lg px-3 py-2 ${
                  currentPath === '/estadisticas' ? 'active btn-active' : ''
                }`}
                onClick={() => setLocation('/estadisticas')}
              >
                <ChartLine size={20} className="flex-shrink-0" />
                {isMenuOpen && <span className="ml-3 font-medium">Estadísticas</span>}
              </button>
            </li>
            <li>
              <button
                className={`btn btn-ghost w-full justify-start rounded-lg px-3 py-2 ${
                  currentPath === '/informes' ? 'active btn-active' : ''
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
