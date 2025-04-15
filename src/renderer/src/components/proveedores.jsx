import MenuVertical from '../componentes especificos/menuVertical'
import Navbar from '../componentes especificos/navbar'
import { useLocation } from 'wouter'
import { Edit, Info, Search, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { fetchProvider } from '../services/proveedores/proveedorService'

export default function Proveedores() {
  const [location, setLocation] = useLocation()

  return (
    <div>
      <MenuVertical currentPath="/proveedores" />
      <Navbar />
      <div className="ml-20 flex-1">
        <h2 className="text-warning mb-6 text-2xl font-bold">Proveedores</h2>
      </div>
      <div className="mr-5 mb-6 ml-20 flex items-center justify-between">
        <ul className="menu menu-horizontal bg-base-200 rounded-box gap-2">
          <li>
            <button
              className="btn btn-ghost tooltip tooltip-bottom"
              data-tip="Editar proveedor"
              /*                 onClick={handleEditClick}
                            disabled={!selectedRow} */
            >
              <Edit className="h-5 w-5" />
            </button>
          </li>
          <li>
            <button
              className="btn btn-ghost tooltip tooltip-bottom"
              data-tip="Nuevo proveedor"
              onClick={() => setLocation('/nuevoProveedor')}
            >
              <UserPlus className="h-5 w-5" />
            </button>
          </li>
          <li>
            <button
              className="btn btn-ghost tooltip tooltip-bottom"
              data-tip="Información del proveedor"
              /*                 onClick={handleInfoClick}
                            disabled={!selectedRow} */
            >
              <Info className="h-5 w-5" />
            </button>
          </li>
        </ul>

        {/* Barra de búsqueda */}
        <div className="flex items-center gap-4">
          <label className="input input-bordered input-warning flex items-center gap-2">
            <input
              type="text"
              placeholder="Buscar..."
              className="grow"
              /*                 value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)} */
            />
            <Search className="h-4 w-4" />
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
