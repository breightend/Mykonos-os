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
      className={`bg-primary/80 dark:bg-secondary fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out dark:text-black ${isMenuOpen ? 'w-48' : 'w-16'}`}
      onMouseEnter={() => setIsMenuOpen(true)}
      onMouseLeave={() => setIsMenuOpen(false)}
    >
      <label className="btn btn-circle swap swap-rotate m-2 bg-transparent border-none hover:bg-white/20">
        <input type="checkbox" checked={isMenuOpen} onChange={toggleMenu} />
        <Menu size={20} className="swap-off fill-current text-white" />
        <X size={20} className="swap-on fill-current text-white" />
      </label>

      <ul className="mt-2 flex flex-col space-y-2 p-2">
        <li className="flex items-center">
          <button
            className={`btn btn-ghost w-full justify-start text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 ${
              currentPath === '/usuario' ? 'bg-white/20 text-white' : ''
            }`}
            onClick={() => setLocation('/usuario')}
          >
            <User size={20} />
            {isMenuOpen && <span className="ml-2">Usuario</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost w-full justify-start text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 ${
              currentPath === '/home' ? 'bg-white/20 text-white' : ''
            }`}
            onClick={() => setLocation('/home')}
          >
            <NotebookTabs size={20} />
            {isMenuOpen && <span className="ml-2">Registro</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost w-full justify-start text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 ${
              currentPath === '/ventas' ? 'bg-white/20 text-white' : ''
            }`}
            onClick={() => setLocation('/ventas')}
          >
            <ShoppingCart size={20} />
            {isMenuOpen && <span className="ml-2">Venta</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost w-full justify-start text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 ${
              currentPath === '/inventario' ? 'bg-white/20 text-white' : ''
            }`}
            onClick={() => setLocation('/inventario')}
          >
            <Package size={20} />
            {isMenuOpen && <span className="ml-2">Inventario</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost w-full justify-start text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 ${
              currentPath === '/proveedores' ? 'bg-white/20 text-white' : ''
            }`}
            onClick={() => setLocation('/proveedores')}
          >
            <Factory size={20} />
            {isMenuOpen && <span className="ml-2">Proveedores</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost w-full justify-start text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 ${
              currentPath === '/clientes' ? 'bg-white/20 text-white' : ''
            }`}
            onClick={() => setLocation('/clientes')}
          >
            <Users size={20} />
            {isMenuOpen && <span className="ml-2">Clientes</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost w-full justify-start text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 ${
              currentPath === '/empleados' ? 'bg-white/20 text-white' : ''
            }`}
            onClick={() => setLocation('/empleados')}
          >
            <BriefcaseBusiness size={20} />
            {isMenuOpen && <span className="ml-2">Empleados</span>}
          </button>
        </li>

        <li className="flex items-center">
          <button
            className={`btn btn-ghost w-full justify-start text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 ${
              currentPath === '/sucursales' ? 'bg-white/20 text-white' : ''
            }`}
            onClick={() => setLocation('/sucursales')}
          >
            <Store size={20} />
            {isMenuOpen && <span className="ml-2">Sucursales</span>}
          </button>
        </li>

        <li className="flex items-center">
          <button
            className={`btn btn-ghost w-full justify-start text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 ${
              currentPath === '/estadisticas' ? 'bg-white/20 text-white' : ''
            }`}
            onClick={() => setLocation('/estadisticas')}
          >
            <ChartLine size={20} />
            {isMenuOpen && <span className="ml-2">Estadísticas</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost w-full justify-start text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 ${
              currentPath === '/informes' ? 'bg-white/20 text-white' : ''
            }`}
            onClick={() => setLocation('/informes')}
          >
            <ClipboardType size={20} />
            {isMenuOpen && <span className="ml-2">Informes</span>}
          </button>
        </li>
        <li className="absolute bottom-0 items-center">
          <SettingsLog />
        </li>
      </ul>
    </div>
  )
}
