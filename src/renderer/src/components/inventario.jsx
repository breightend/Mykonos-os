import { PackagePlus, Search, House, Edit } from 'lucide-react'
import { useLocation } from 'wouter'
import { useState } from 'react'
import MenuVertical from '../componentes especificos/menuVertical'

export default function Inventario() {
  const [, setLocation] = useLocation()
  const [selectedRow, setSelectedRow] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editedData, setEditedData] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [searchById, setSearchById] = useState(false)

  // Datos de ejemplo para la tabla
  const data = [
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
      // Buscar solo por ID
      return row.id.toString().includes(searchTerm)
    } else {
      // Buscar en todos los campos
      return (
        row.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.colores.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.fecha.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.id.toString().includes(searchTerm)
      )
    }
  })

  // Función para seleccionar una fila
  const handleRowClick = (row) => {
    setSelectedRow(row.id)
    setEditedData(row) // Cargar los datos de la fila seleccionada en el estado de edición
  }

  // Función para abrir el modal
  const handleEditClick = () => {
    if (selectedRow) {
      setIsModalOpen(true)
    }
  }

  // Función para guardar los cambios
  const handleSaveChanges = () => {
    console.log('Datos guardados:', editedData)
    setIsModalOpen(false) // Cerrar el modal después de guardar
  }

  // Función para manejar cambios en los campos del modal
  const handleInputChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="p-6 bg-base-100 min-h-screen">
      <MenuVertical currentPath="/inventario" />
      <div className="flex-1 ml-20">
        <h2 className="text-2xl font-bold mb-6">Inventario</h2>

        {/* Barra de navegación */}
        <div className="columns-3 gap-2 flex  items-center mb-6">
          <ul className="menu menu-horizontal bg-base-200 w-4xs gap-2 rounded-box">
            <li>
              <button
                className="tooltip tooltip-bottom"
                data-tip="Inicio"
                onClick={() => setLocation('/home')}
              >
                <House className="w-7 h-7" />
              </button>
            </li>
            <li>
              <button
                className="tooltip tooltip-bottom"
                data-tip="Editar producto"
                onClick={handleEditClick}
                disabled={!selectedRow}
              >
                <Edit className="w-7 h-7" />
              </button>
            </li>
            <li>
              <button
                className="tooltip tooltip-bottom"
                data-tip="Nuevo producto"
                onClick={() => setLocation('/nuevoProducto')}
              >
                <PackagePlus className="w-7 h-7" />
              </button>
            </li>
          </ul>

          {/* Barra de búsqueda */}
          <div className=" items-center  col-span-2">
            <label className="input input-bordered flex items-center gap-2 input-warning">
              <input
                type="text"
                placeholder="Buscar..."
                className="grow w-max"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="w-4 h-4" />
            </label>
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">Buscar solo por código de barra</span>
                <input
                  type="checkbox"
                  checked={searchById}
                  onChange={(e) => setSearchById(e.target.checked)}
                  className="checkbox checkbox-warning"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Tabla de inventario */}
        <div className="overflow-x-auto bg-base-200 rounded-lg shadow">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Producto</th>
                <th>Marca</th>
                <th>Cantidad</th>
                <th>Colores</th>
                <th>Fecha de edición</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row) => (
                <tr
                  key={row.id}
                  className={`cursor-pointer ${selectedRow === row.id ? 'bg-warning/20' : ''}`}
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

        {/* Modal de edición */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-base-100 p-6 rounded-lg w-96">
              <h3 className="text-lg font-bold mb-4">Editar Producto</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Producto</label>
                  <input
                    type="text"
                    value={editedData.producto}
                    onChange={(e) => handleInputChange('producto', e.target.value)}
                    className="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Marca</label>
                  <input
                    type="text"
                    value={editedData.marca}
                    onChange={(e) => handleInputChange('marca', e.target.value)}
                    className="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cantidad</label>
                  <input
                    type="number"
                    value={editedData.cantidad}
                    onChange={(e) => handleInputChange('cantidad', parseInt(e.target.value, 10))}
                    className="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Colores</label>
                  <input
                    type="text"
                    value={editedData.colores}
                    onChange={(e) => handleInputChange('colores', e.target.value)}
                    className="input input-bordered w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha de edición</label>
                  <input
                    type="text"
                    value={editedData.fecha}
                    onChange={(e) => handleInputChange('fecha', e.target.value)}
                    className="input input-bordered w-full"
                  />
                </div>
                <div className="flex justify-end gap-2">
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
