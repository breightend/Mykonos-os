import MenuVertical from "../componentes especificos/menuVertical"
import Navbar from "../componentes especificos/navbar"
import { useLocation } from 'wouter'
import {  Edit,  Info, Search, UserPlus } from 'lucide-react'

export default function Clientes() {
  const [location, setLocation] = useLocation()


  return (
    <div>
      <Navbar />
      <MenuVertical currentPath="/clientes" />
      <div className="flex-1 ml-20 ">
        <h2 className="text-2xl font-bold mb-6 text-warning">Clientes</h2>
      </div>
      <div className="flex items-center justify-between mb-6 ml-20 mr-5">
        <ul className="menu menu-horizontal bg-base-200 rounded-box gap-2">
          <li>
            <button
              className="btn btn-ghost tooltip tooltip-bottom"
              data-tip="Editar cliente"
            /*                 onClick={handleEditClick}
                            disabled={!selectedRow} */
            >
              <Edit className="w-5 h-5" />
            </button>
          </li>
          <li>
            <button
              className="btn btn-ghost tooltip tooltip-bottom"
              data-tip="Nuevo cliente"
              onClick={() => setLocation('/nuevoCliente')}
            >
              <UserPlus className="w-5 h-5" />
            </button>
          </li>
          <li>
            <button
              className="btn btn-ghost tooltip tooltip-bottom"
              data-tip="Información del cliente"
            /*                 onClick={handleInfoClick}
                            disabled={!selectedRow} */
            >
              <Info className="w-5 h-5" />
            </button>
          </li>
        </ul>

        {/* Barra de búsqueda */}
        <div className="flex items-center gap-4">
          <label className="input input-bordered flex items-center gap-2 input-warning">
            <input
              type="text"
              placeholder="Buscar..."
              className="grow"
            /*                 value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)} */
            />
            <Search className="w-4 h-4" />
          </label>
          <label className="label cursor-pointer gap-2">
            <span className="label-text">Buscar solo por ID</span>
            <input
              type="checkbox"
              /*                 checked={searchById}
                              onChange={(e) => setSearchById(e.target.checked)} */
              className="checkbox checkbox-warning"
            />
          </label>
        </div>
      </div>
    </div>
    
  )
}
