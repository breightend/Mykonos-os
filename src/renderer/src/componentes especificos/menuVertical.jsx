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
  Cog,
  X,
  NotebookTabs
} from 'lucide-react'

export default function MenuVertical(currentPath) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const setLocation = (path) => {
    window.location.href = path
  }

  return (
    <div
      className={`fixed left-0 top-0 h-screen bg-base-300 transition-all duration-300 ease-in-out ${isMenuOpen ? 'w-48' : 'w-16'}`}
    >
      <label className="btn btn-circle swap swap-rotate m-2">
        <input type="checkbox" checked={isMenuOpen} onChange={toggleMenu} />
        <Menu size={24} className="swap-off fill-current" />
        <X className="swap-on fill-current" />
      </label>

      <ul className="flex flex-col space-y-2 p-2">
        <li className="flex items-center">
          <button
            className={`btn btn-ghost justify-start w-full ${currentPath === '/usuario' ? 'bg-blue-500' : ''}`}
            onClick={() => setLocation('/usuario')}
          >
            <User />
            {isMenuOpen && <span className="ml-2">Usuario</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost justify-start w-full ${currentPath === '/home' ? 'bg-blue-500' : ''}`}
            onClick={() => setLocation('/home')}
          >
            <NotebookTabs />
            {isMenuOpen && <span className="ml-2">Registro</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost justify-start w-full ${currentPath === '/ventas' ? 'bg-blue-500' : ''}`}
            onClick={() => setLocation('/ventas')}
          >
            <ShoppingCart />
            {isMenuOpen && <span className="ml-2">Venta</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost justify-start w-full ${currentPath === '/inventario' ? 'bg-blue-500' : ''}`}
            onClick={() => setLocation('/inventario')}
          >
            <Package />
            {isMenuOpen && <span className="ml-2">Inventario</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost justify-start w-full ${currentPath === '/proveedores' ? 'bg-blue-500' : ''}`}
            onClick={() => setLocation('/proveedores')}
          >
            <Factory />
            {isMenuOpen && <span className="ml-2">Proveedores</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost justify-start w-full ${currentPath === '/clientes' ? 'bg-blue-500' : ''}`}
            onClick={() => setLocation('/clientes')}
          >
            <Users />
            {isMenuOpen && <span className="ml-2">Clientes</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost justify-start w-full ${currentPath === '/estadisticas' ? 'bg-blue-500' : ''}`}
            onClick={() => setLocation('/estadisticas')}
          >
            <ChartLine />
            {isMenuOpen && <span className="ml-2">Estadísticas</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost justify-start w-full ${currentPath === '/informes' ? 'bg-blue-500' : ''}`}
            onClick={() => setLocation('/informes')}
          >
            <ClipboardType />
            {isMenuOpen && <span className="ml-2">Informe</span>}
          </button>
        </li>
        <li className="flex items-center">
          <button
            className={`btn btn-ghost justify-start w-full ${currentPath === '/configuraciones' ? 'bg-blue-500' : ''}`}
            onClick={() => setLocation('/configuraciones')}
          >
            <Cog />
            {isMenuOpen && <span className="ml-2">Configuraciones</span>}
          </button>
        </li>
      </ul>
    </div>
  )
}
