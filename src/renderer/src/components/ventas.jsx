import { useLocation } from 'wouter'
import { ArrowLeft, Trash2 } from 'lucide-react'
import MenuVertical from '../componentes especificos/menuVertical'
import { useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import Navbar from '../componentes especificos/navbar'

//TODO: Arreglar mejor selector
//TODO: arreglar eliminar productos
const mockProductosDB = {
  1: {
    codigo: '1',
    descripcion: 'Pantalón deportivo',
    tipo: 'Pantalón',
    precio: 5000,
    marca: 'Nike'
  },
  2: {
    codigo: '2',
    descripcion: 'Remera básica',
    tipo: 'Remera',
    precio: 2500,
    marca: 'Adidas'
  },
  3: {
    codigo: '3',
    descripcion: 'Remera estampada',
    tipo: 'Remera',
    precio: 500,
    marca: 'Adidas'
  }
}

function Ventas() {
  const [, setLocation] = useLocation()
  const [codigoInput, setCodigoInput] = useState('')
  const [productos, setProductos] = useState([]) // lista de productos en la venta
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [cantidadAEliminar, setCantidadAEliminar] = useState(0)

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
      toast.error('Producto no encontrado', {
        duration: 2000
      })
    }
  }

  const eliminarProducto = () => {
    if (!productoSeleccionado) return;

    const index = productos.findIndex((p) => p.codigo === productoSeleccionado.codigo);
    if (index === -1) return;

    let cantidadEliminar = cantidadAEliminar || 1; // Si no se ingresó cantidad, se elimina 1 por defecto
    const eliminarTodos = document.getElementById('eliminarTodosCheckbox')?.checked;

    if (eliminarTodos || cantidadEliminar >= productos[index].cantidad) {
      // Elimina el producto completamente si está marcado el checkbox o la cantidad a eliminar es igual/mayor a la cantidad total
      setProductos(productos.filter((p) => p.codigo !== productoSeleccionado.codigo));
    } else {
      // Resta la cantidad indicada
      const nuevosProductos = [...productos];
      nuevosProductos[index].cantidad -= cantidadEliminar;
      setProductos(nuevosProductos);
    }

    setProductoSeleccionado(null);
    setCantidadAEliminar(0); // Resetea el input de cantidad
  };


  const total = productos.reduce((acc, prod) => acc + prod.precio * prod.cantidad, 0)

  return (
    <div>
      <MenuVertical currentPath="/ventas" />
      <Navbar />
      <div className="wl-20 flex-1">
        <button className="btn btn-circle" onClick={() => setLocation('/home')}>
          <ArrowLeft />
        </button>

        <div className="ml-20 flex-1 mr-3 ">
          <h2 className="text-2xl font-bold mb-6 text-warning">Venta</h2>

          <div className="card bg-base-200 p-5 shadow-xl ">
            <div className="card-body pt-0.5">
              <p>Ingrese o escanee el código:</p>
              <div className="flex flex-row items-center gap-6">
                <input
                  type="text"
                  placeholder="##########"
                  value={codigoInput}
                  onChange={(e) => setCodigoInput(e.target.value)}
                  className="input input-bordered input-accent w-full max-w-xs"
                  onKeyDown={(e) => e.key === 'Enter' && agregarProducto()}
                />
                <button className="btn btn-accent" onClick={agregarProducto}>
                  Aceptar
                </button>
                <button
                  className={`btn btn-error ${!productoSeleccionado ? 'pointer-events-none opacity-50' : ''}`}
                  onClick={() => document.getElementById('eliminarProducto').showModal()}
                >
                  <Trash2 />
                </button>
                {/* Modal eliminar producto seleccionado */}
                <dialog id="eliminarProducto" className="modal">
                  <div className="modal-box">
                    <h3 className="text-lg font-bold">Eliminar producto</h3>
                    {productoSeleccionado && (
                      <div>
                        <p>{productoSeleccionado.descripcion}</p>
                        <p>Cantidad: {productoSeleccionado.cantidad}</p>
                        {productoSeleccionado.cantidad > 1 && (
                          <div className="mt-4">
                            <label htmlFor="cantidadInput">Ingresa la cantidad a eliminar:</label>
                            <input
                              type="number"
                              id="cantidadInput"
                              className="input w-20 ml-2"
                              min="1"
                              max={productoSeleccionado.cantidad}
                              value={cantidadAEliminar}
                              onChange={(e) => {
                                setCantidadAEliminar(Number(e.target.value));
                                document.getElementById('eliminarTodosCheckbox').checked = false; // Desmarca el checkbox si el usuario ingresa una cantidad
                              }}
                            />
                            <label className="ml-4 cursor-pointer flex items-center">
                              <input
                                type="checkbox"
                                id="eliminarTodosCheckbox"
                                className="checkbox checkbox-warning"
                                defaultChecked={true}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setCantidadAEliminar(productoSeleccionado.cantidad);
                                  }
                                }}
                              />
                              <span className="ml-2">Eliminar todos</span>
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="modal-action">
                      <form method="dialog">
                        <div className=' flex space-x-4'>
                          <button className='btn btn-neutral' onClick={() => document.getElementById('eliminarProducto').close()}>Cancelar</button>
                          <button className="btn btn-primary" onClick={eliminarProducto}>Aceptar</button>
                        </div>
                      </form>
                    </div>
                  </div>


                </dialog>
              </div>

              <div className="mt-6 overflow-x-auto">
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
                            ? 'bg-secondary/20 cursor-pointer rounded-3xl'
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

          <div className="mt-4 ">
            <p className="text-xl font-bold">Total: ${total.toLocaleString()}</p>
            <div className='flex justify-end'>
              <button
                className={`flex justify-end  ${productos.length > 0 ? 'btn btn-success' : 'btn btn-disabled'}`}
                onClick={() => setLocation('/formaPago')}
              >
                Confirmar venta
              </button>
            </div>
            <Toaster position="bottom-right" />
          </div>
        </div>
      </div >
    </div >
  )
}

export default Ventas
