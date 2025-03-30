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
  BriefcaseBusiness
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
      className={`fixed left-0 top-0 h-screen bg-accent dark:bg-secondary dark:text-black z-50  transition-all duration-300 ease-in-out ${isMenuOpen ? 'w-48' : 'w-16'}`}
      onMouseEnter={() => setIsMenuOpen(true)}
      onMouseLeave={() => setIsMenuOpen(false)}
    >
      <label className="btn btn-circle swap swap-rotate m-2">
        <input type="checkbox" checked={isMenuOpen} onChange={toggleMenu} />
        <Menu size={24} className="swap-off fill-current" />
        <X className="swap-on fill-current" />
      </label>

      <ul className="flex flex-col space-y-2 p-2 mt-2">
        <li className="flex items-center">
          <button
            className={`btn btn-ghost justify-start w-full ${currentPath === '/usuario' ? 'bg-primary' : ''}`}
            onClick={() => setLocation('/usuario')}
          >
            <User />
            {isMenuOpen && <span className="ml-2">Usuario</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost justify-start w-full ${currentPath === '/home' ? 'bg-primary' : ''}`}
            onClick={() => setLocation('/home')}
          >
            <NotebookTabs />
            {isMenuOpen && <span className="ml-2">Registro</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost justify-start w-full ${currentPath === '/ventas' ? 'bg-primary' : ''}`}
            onClick={() => setLocation('/ventas')}
          >
            <ShoppingCart />
            {isMenuOpen && <span className="ml-2">Venta</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost justify-start w-full ${currentPath === '/inventario' ? 'bg-primary' : ''}`}
            onClick={() => setLocation('/inventario')}
          >
            <Package />
            {isMenuOpen && <span className="ml-2">Inventario</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost justify-start w-full ${currentPath === '/proveedores' ? 'bg-primary' : ''}`}
            onClick={() => setLocation('/proveedores')}
          >
            <Factory />
            {isMenuOpen && <span className="ml-2">Proveedores</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost justify-start w-full ${currentPath === '/clientes' ? 'bg-primary' : ''}`}
            onClick={() => setLocation('/clientes')}
          >
            <Users />
            {isMenuOpen && <span className="ml-2">Clientes</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost justify-start w-full ${currentPath === '/empleados' ? 'bg-primary' : ''}`}
            onClick={() => setLocation('/empleados')}
          >
            <BriefcaseBusiness />
            {isMenuOpen && <span className="ml-2">Empleados</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost justify-start w-full ${currentPath === '/estadisticas' ? 'bg-primary' : ''}`}
            onClick={() => setLocation('/estadisticas')}
          >
            <ChartLine />
            {isMenuOpen && <span className="ml-2">Estadísticas</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost justify-start w-full ${currentPath === '/informes' ? 'bg-primary' : ''}`}
            onClick={() => setLocation('/informe')}
          >
            <ClipboardType />
            {isMenuOpen && <span className="ml-2">Informe</span>}
          </button>
        </li>
        <li className=" items-center absolute bottom-0 ">
          <SettingsLog />
        </li>
      </ul>
    </div>
  )
}
