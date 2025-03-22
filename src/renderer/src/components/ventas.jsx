import { useLocation } from 'wouter'
import { ArrowLeft, Trash2 } from 'lucide-react'
import MenuVertical from '../componentes especificos/menuVertical'
import { useState } from 'react'

const mockProductosDB = {
  '1': {
    codigo: '1',
    descripcion: 'Pantalón deportivo',
    tipo: 'Pantalón',
    precio: 5000,
    marca: 'Nike',
  },
  '2': {
    codigo: '2',
    descripcion: 'Remera básica',
    tipo: 'Remera',
    precio: 2500,
    marca: 'Adidas',
  },
  '3': {
    codigo: '3',
    descripcion: 'Remera estampada',
    tipo: 'Remera',
    precio: 500,
    marca: 'Adidas',
  },

}

function Ventas() {
  const [, setLocation] = useLocation()
  const [codigoInput, setCodigoInput] = useState('')
  const [productos, setProductos] = useState([]) // lista de productos en la venta
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)

  const agregarProducto = () => {
    const productoEncontrado = mockProductosDB[codigoInput.trim()]
    if (productoEncontrado) {
      const index = productos.findIndex((p) => p.codigo === productoEncontrado.codigo)
      if (index >= 0) {
        const nuevosProductos = [...productos]
        nuevosProductos[index].cantidad += 1
        setProductos(nuevosProductos)
      } else {
        setProductos([...productos, { ...productoEncontrado, cantidad: 1 }])
      }
      setCodigoInput('')
    } else {
      alert('Producto no encontrado')
    }
  }

  const eliminarProducto = () => {
    if (!productoSeleccionado) return

    const index = productos.findIndex((p) => p.codigo === productoSeleccionado.codigo)
    if (index >= 0) {
      const cantidadAEliminar = parseInt(
        prompt(
          `¿Cuántas unidades de "${productoSeleccionado.descripcion}" querés eliminar? (Cantidad actual: ${productos[index].cantidad})`,
          '1'
        ),
        10
      )
      if (isNaN(cantidadAEliminar) || cantidadAEliminar <= 0) return

      const nuevosProductos = [...productos]
      if (cantidadAEliminar >= nuevosProductos[index].cantidad) {
        nuevosProductos.splice(index, 1)
      } else {
        nuevosProductos[index].cantidad -= cantidadAEliminar
      }
      setProductos(nuevosProductos)
      setProductoSeleccionado(null)
    }
  }

  const total = productos.reduce((acc, prod) => acc + prod.precio * prod.cantidad, 0)

  return (
    <div>
      <MenuVertical currentPath="/ventas" />
      <div className="flex-1 wl-20">
        <button className="btn btn-circle" onClick={() => setLocation('/home')}>
          <ArrowLeft />
        </button>

        <div className="flex-1 ml-20">
          <div className="card bg-base-200 shadow-sm p-10">
            <div className="card-title">
              <h1>Ventas</h1>
            </div>
            <div className="card-body">
              <div className="flex flex-row items-center gap-4">
                <p>Ingrese o escanee el código:</p>
                <input
                  type="text"
                  placeholder="##########"
                  value={codigoInput}
                  onChange={(e) => setCodigoInput(e.target.value)}
                  className="input input-bordered input-accent w-full max-w-xs"
                />
                <button className="btn btn-accent" onClick={agregarProducto}>
                  Aceptar
                </button>
                <button
                  className={`btn btn-error ${!productoSeleccionado ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={eliminarProducto}
                >
                  <Trash2 />
                </button>
              </div>

              <div className="overflow-x-auto mt-6">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Descripción</th>
                      <th>Cantidad</th>
                      <th>Tipo</th>
                      <th>Precio unitario</th>
                      <th>Marca</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((producto) => (
                      <tr
                        key={producto.codigo}
                        className={
                          productoSeleccionado?.codigo === producto.codigo
                            ? 'bg-red-100 cursor-pointer'
                            : 'cursor-pointer'
                        }
                        onClick={() => setProductoSeleccionado(producto)}
                      >
                        <td>{producto.codigo}</td>
                        <td>{producto.descripcion}</td>
                        <td>{producto.cantidad}</td>
                        <td>{producto.tipo}</td>
                        <td>${producto.precio.toLocaleString()}</td>
                        <td>{producto.marca}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <p className="font-bold text-xl">Total: ${total.toLocaleString()}</p>
            <button className=`btn btn-success ${productoSeleccionado>0 &&(
              
            ) }` onClick={() => setLocation('/formaPago')}>
              Confirmar venta
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Ventas
