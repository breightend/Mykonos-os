import { PackagePlus, Search, House, Edit, Info } from 'lucide-react'
import { useLocation } from 'wouter'
import { useState } from 'react'
import MenuVertical from '../componentes especificos/menuVertical'
import Navbar from '../componentes especificos/navbar'

export default function Inventario() {
  const [, setLocation] = useLocation()
  const [selectedRow, setSelectedRow] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editedData, setEditedData] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [searchById, setSearchById] = useState(false)
  const [showData, setShowData] = useState(false)
  const [modalShowDataOpen, setModalShowDataOpen] = useState(false)

  const data = [
    // Datos de ejemplo para la tabla
    {
      id: 1,
      producto: 'Remera',
      marca: 'Moravia',
      cantidad: 50,
      colores: 'Negro, Blanco',
      fecha: '12/16/2020'
    },
    {
      id: 2,
      producto: 'Pantalón',
      marca: "Levi's",
      cantidad: 30,
      colores: 'Azul, Negro',
      fecha: '12/5/2020'
    },
    {
      id: 3,
      producto: 'Campera',
      marca: 'Zara',
      cantidad: 20,
      colores: 'Rojo, Verde',
      fecha: '8/15/2020'
    },
    {
      id: 4,
      producto: 'Buzo',
      marca: 'Adidas',
      cantidad: 40,
      colores: 'Gris, Blanco',
      fecha: '3/25/2021'
    }
  ]

  // Función para filtrar los datos
  const filteredData = data.filter((row) => {
    if (searchById) {
      return row.id.toString().includes(searchTerm)
    } else {
      return (
        row.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.colores.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.fecha.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.id.toString().includes(searchTerm)
      )
    }
  })

  const handleInfoClick = () => {
    if (selectedRow) {
      setModalShowDataOpen(true)
    }
  }

  const handleRowClick = (row) => {
    setSelectedRow(row.id)
    setEditedData(row)
  }

  const handleEditClick = () => {
    if (selectedRow) {
      setIsModalOpen(true)
    }
  }

  const handleSaveChanges = () => {
    console.log('Datos guardados:', editedData)
    setIsModalOpen(false)
  }

  const handleInputChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="bg-base-100 min-h-screen">
      <MenuVertical currentPath="/inventario" />
      <Navbar />
      <div className="ml-20 flex-1">
        <h2 className="text-warning mb-6 text-2xl font-bold">Inventario</h2>

        {/* Barra de navegación */}
        <div className="mb-6 flex items-center justify-between">
          <ul className="menu menu-horizontal bg-base-200 rounded-box gap-2">
            <li>
              <button
                className="btn btn-ghost tooltip tooltip-bottom"
                data-tip="Inicio"
                onClick={() => setLocation('/home')}
              >
                <House className="h-5 w-5" />
              </button>
            </li>
            <li>
              <button
                className="btn btn-ghost tooltip tooltip-bottom"
                data-tip="Editar producto"
                onClick={handleEditClick}
                disabled={!selectedRow}
              >
                <Edit className="h-5 w-5" />
              </button>
            </li>
            <li>
              <button
                className="btn btn-ghost tooltip tooltip-bottom"
                data-tip="Nuevo producto"
                onClick={() => setLocation('/nuevoProducto')}
              >
                <PackagePlus className="h-5 w-5" />
              </button>
            </li>
            <li>
              <button
                className="btn btn-ghost tooltip tooltip-bottom"
                data-tip="Información del producto"
                onClick={handleInfoClick}
                disabled={!selectedRow}
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="h-4 w-4" />
            </label>
            <label className="label cursor-pointer gap-2">
              <span className="label-text">Buscar solo por ID</span>
              <input
                type="checkbox"
                checked={searchById}
                onChange={(e) => setSearchById(e.target.checked)}
                className="checkbox checkbox-warning"
              />
            </label>
          </div>
        </div>

        {/* Tabla de inventario */}
        <div className="bg-base-200 overflow-x-auto rounded-lg shadow-lg">
          <table className="table w-full">
            <thead className="bg-warning/10">
              <tr>
                <th className="text-warning">#</th>
                <th className="text-warning">Producto</th>
                <th className="text-warning">Marca</th>
                <th className="text-warning">Cantidad</th>
                <th className="text-warning">Colores</th>
                <th className="text-warning">Fecha de edición</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row) => (
                <tr
                  key={row.id}
                  className={`hover:bg-warning/10 cursor-pointer ${
                    selectedRow === row.id ? 'bg-warning/20' : ''
                  }`}
                  onClick={() => handleRowClick(row)}
                >
                  <th>{row.id}</th>
                  <td>{row.producto}</td>
                  <td>{row.marca}</td>
                  <td>{row.cantidad}</td>
                  <td>{row.colores}</td>
                  <td>{row.fecha}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal de información */}
        {modalShowDataOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50">
            <div className="bg-base-100 w-96 rounded-lg p-6 shadow-2xl">
              <h3 className="text-warning mb-4 text-lg font-bold">Información del Producto</h3>
              <div className="space-y-2">
                <p>
                  <strong>Producto:</strong> {showData.producto}
                </p>
                <p>
                  <strong>Marca:</strong> {showData.marca}
                </p>
                <p>
                  <strong>Cantidad:</strong> {showData.cantidad}
                </p>
                <p>
                  <strong>Colores:</strong> {showData.colores}
                </p>
                <p>
                  <strong>Fecha de edición:</strong> {showData.fecha}
                </p>
              </div>
              <div className="mt-4 flex justify-end">
                <button className="btn btn-warning" onClick={() => setModalShowDataOpen(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de edición */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50">
            <div className="bg-base-100 w-96 rounded-lg p-6 shadow-2xl">
              <h3 className="text-warning mb-4 text-lg font-bold">Editar Producto</h3>
              <form className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Producto</label>
                  <input
                    type="text"
                    value={editedData.producto}
                    onChange={(e) => handleInputChange('producto', e.target.value)}
                    className="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Marca</label>
                  <input
                    type="text"
                    value={editedData.marca}
                    onChange={(e) => handleInputChange('marca', e.target.value)}
                    className="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Cantidad</label>
                  <input
                    type="number"
                    value={editedData.cantidad}
                    onChange={(e) => handleInputChange('cantidad', parseInt(e.target.value, 10))}
                    className="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Colores</label>
                  <input
                    type="text"
                    value={editedData.colores}
                    onChange={(e) => handleInputChange('colores', e.target.value)}
                    className="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Fecha de edición</label>
                  <input
                    type="text"
                    value={editedData.fecha}
                    onChange={(e) => handleInputChange('fecha', e.target.value)}
                    className="input input-bordered w-full"
                  />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancelar
                  </button>
                  <button type="button" className="btn btn-warning" onClick={handleSaveChanges}>
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
