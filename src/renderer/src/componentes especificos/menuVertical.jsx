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

export default function MenuVertical({ currentPath }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const setLocation = (path) => {
    window.location.href = path
  }

  return (
    <div
      className={`bg-accent dark:bg-secondary fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out dark:text-black ${isMenuOpen ? 'w-48' : 'w-16'}`}
      onMouseEnter={() => setIsMenuOpen(true)}
      onMouseLeave={() => setIsMenuOpen(false)}
    >
      <label className="btn btn-circle swap swap-rotate m-2">
        <input type="checkbox" checked={isMenuOpen} onChange={toggleMenu} />
        <Menu size={24} className="swap-off fill-current" />
        <X className="swap-on fill-current" />
      </label>

      <ul className="mt-2 flex flex-col space-y-2 p-2">
        <li className="flex items-center">
          <button
            className={`btn btn-ghost w-full justify-start ${currentPath === '/usuario' ? 'bg-primary' : ''}`}
            onClick={() => setLocation('/usuario')}
          >
            <User />
            {isMenuOpen && <span className="ml-2">Usuario</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost w-full justify-start ${currentPath === '/home' ? 'bg-primary' : ''}`}
            onClick={() => setLocation('/home')}
          >
            <NotebookTabs />
            {isMenuOpen && <span className="ml-2">Registro</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost w-full justify-start ${currentPath === '/ventas' ? 'bg-primary' : ''}`}
            onClick={() => setLocation('/ventas')}
          >
            <ShoppingCart />
            {isMenuOpen && <span className="ml-2">Venta</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost w-full justify-start ${currentPath === '/inventario' ? 'bg-primary' : ''}`}
            onClick={() => setLocation('/inventario')}
          >
            <Package />
            {isMenuOpen && <span className="ml-2">Inventario</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost w-full justify-start ${currentPath === '/proveedores' ? 'bg-primary' : ''}`}
            onClick={() => setLocation('/proveedores')}
          >
            <Factory />
            {isMenuOpen && <span className="ml-2">Proveedores</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost w-full justify-start ${currentPath === '/clientes' ? 'bg-primary' : ''}`}
            onClick={() => setLocation('/clientes')}
          >
            <Users />
            {isMenuOpen && <span className="ml-2">Clientes</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost w-full justify-start ${currentPath === '/empleados' ? 'bg-primary' : ''}`}
            onClick={() => setLocation('/empleados')}
          >
            <BriefcaseBusiness />
            {isMenuOpen && <span className="ml-2">Empleados</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost w-full justify-start ${currentPath === '/sucursales' ? 'bg-primary' : ''}`}
            onClick={() => setLocation('/sucursales')}
          >
            <Store />
            {isMenuOpen && <span className="ml-2">Sucursales</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost w-full justify-start ${currentPath === '/estadisticas' ? 'bg-primary' : ''}`}
            onClick={() => setLocation('/estadisticas')}
          >
            <ChartLine />
            {isMenuOpen && <span className="ml-2">Estadísticas</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost w-full justify-start ${currentPath === '/informes' ? 'bg-primary' : ''}`}
            onClick={() => setLocation('/informe')}
          >
            <ClipboardType />
            {isMenuOpen && <span className="ml-2">Informe</span>}
          </button>
        </li>
        <li className="absolute bottom-0 items-center">
          <SettingsLog />
        </li>
      </ul>
    </div>
  )
}
