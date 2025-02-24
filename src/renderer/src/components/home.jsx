import { Menu, Ellipsis, Cog } from 'lucide-react'
import { useLocation } from 'wouter'
export default function Home() {
  const [, setLocation] = useLocation()
  return (
    <div className="bg-base-100">
      <div className="navbar bg-base-100">
        <div className="flex-none">
          <button className="btn btn-square btn-ghost">
            <Menu size={24} className="justify-center items-center" />
          </button>
        </div>
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">Mykonos OS</a>
        </div>
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn m-1">
            <Ellipsis />
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
          >
            <li>
              <a>
                {' '}
                <Cog /> Configuraciones
              </a>
            </li>
            <li>
              <a>Item 2</a>
            </li>
          </ul>
        </div>
      </div>
      <button className="btn btn-accent" onClick={() => setLocation('/')}>
        Volver
      </button>
      <button className="btn btn-accent" onClick={() => setLocation('/inventario')}>
        Inventario
      </button>
    </div>
  )
}
