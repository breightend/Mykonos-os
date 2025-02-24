import {
  Menu,

  Cog,
  X,
  User,
  Users,
  ChartLine,
  ShoppingCart,
  Package,
  Factory,
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useState } from 'react';

export default function Home() {
  const [, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="bg-base-100 min-h-screen flex">
      {/* Menú lateral */}
      <div
        className={`fixed left-0 top-0 h-screen bg-base-200 transition-all duration-300 ease-in-out ${isMenuOpen ? 'w-48' : 'w-16'}`}
      >
        <label className="btn btn-circle swap swap-rotate m-2">
          <input type="checkbox" checked={isMenuOpen} onChange={toggleMenu} />
          <Menu size={24} className="swap-off fill-current" />
          <X className="swap-on fill-current" />
        </label>

        {/* Lista de ítems del menú */}
        <ul className="flex flex-col space-y-2 p-2">
          <li className="flex items-center">
            <button
              className="btn btn-ghost justify-start w-full"
              onClick={() => setLocation('/usuario')}
            >
              <User />
              {isMenuOpen && <span className="ml-2">Usuario</span>}
            </button>
          </li>
          <li className="flex items-center">
            <button
              className="btn btn-ghost justify-start w-full"
              onClick={() => setLocation('/venta')}
            >
              <ShoppingCart />
              {isMenuOpen && <span className="ml-2">Venta</span>}
            </button>
          </li>
          <li className="flex items-center">
            <button
              className="btn btn-ghost justify-start w-full"
              onClick={() => setLocation('/inventario')}
            >
              <Package />
              {isMenuOpen && <span className="ml-2">Inventario</span>}
            </button>
          </li>
          <li className="flex items-center">
            <button
              className="btn btn-ghost justify-start w-full"
              onClick={() => setLocation('/proveedores')}
            >
              <Factory />
              {isMenuOpen && <span className="ml-2">Proveedores</span>}
            </button>
          </li>
          <li className="flex items-center">
            <button
              className="btn btn-ghost justify-start w-full"
              onClick={() => setLocation('/clientes')}
            >
              <Users />
              {isMenuOpen && <span className="ml-2">Clientes</span>}
            </button>
          </li>
          <li className="flex items-center">
            <button
              className="btn btn-ghost justify-start w-full"
              onClick={() => setLocation('/estadisticas')}
            >
              <ChartLine />
              {isMenuOpen && <span className="ml-2">Estadísticas</span>}
            </button>
          </li>
          <li className="flex items-center">
            <button
              className="btn btn-ghost justify-start w-full"
              onClick={() => setLocation('/configuraciones')}
            >
              <Cog />
              {isMenuOpen && <span className="ml-2">Configuraciones</span>}
            </button>
          </li>
        </ul>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 ml-16">
        <div className="navbar bg-base-100">
          <div className="flex-1">
            <a className="btn btn-ghost text-xl">Mykonos OS HOME</a>
          </div>
        </div>
      </div>
    </div>
  );
}