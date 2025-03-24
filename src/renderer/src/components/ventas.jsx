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

  const eliminarProducto = (cantidadAEliminar) => {
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
      console.log('Cantidad a eliminar: ', cantidadAEliminar)
      if (isNaN(cantidadAEliminar) || cantidadAEliminar <= 0) return

      const nuevosProductos = [...productos]
      if (cantidadAEliminar >= nuevosProductos[index].cantidad) {
        nuevosProductos.splice(index, 1)
      } else {
        nuevosProductos[index].cantidad -= cantidadAEliminar
      }
      setProductos(nuevosProductos)
      setProductoSeleccionado(null)
      console.log('Productos: ', productos)
    }
  }

  const handleEliminarProducto = (cantidadAEliminar) => {
    setCantidadAEliminar(cantidadAEliminar)
    console.log('Cantidad a eliminar: ', cantidadAEliminar)
  }

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
                    {productos.map((producto) => (
                      <p key={producto.codigo}>
                        {productoSeleccionado?.codigo === producto.codigo && (
                          <p>
                            <span>{producto.precio.toLocaleString()}</span>
                            <span>{producto.tipo}</span>
                            <table className=" justify-center w-full table-auto items-center border-none">
                              <thead className=''>
                                <tr>
                                  <th className="">{producto.descripcion}</th>
                                </tr>
                              </thead>
                              <tbody className='items-center text-center'>
                                <tr>
                                  <td className="">Codigo: {producto.codigo}</td>
                                </tr>
                                <tr>
                                  <td className="">Cantidad: {producto.cantidad}</td>
                                </tr>
                                <tr>
                                  <td className="">Tipo: {producto.tipo}</td>
                                </tr>
                                <tr>
                                  <td className="">Marca: {producto.marca}</td>
                                </tr>
                                <tr>
                                  <td className="">Precio: ${producto.precio}</td>
                                </tr>

                              </tbody>
                            </table>
                            <div className='flex space-x-4 grid-cols-2 mt-4 items-center'>
                              <label htmlFor="">Ingresa la cantidad a eliminar:</label>
                              <div className='w-1/5'>
                                <input type="text" className='input' placeholder='#####' />
                              </div>
                            </div>
                          </p>
                        )}
                      </p>
                    ))}
                    <div className="modal-action">
                      <form method="dialog">
                        <div className=' flex space-x-4'>
                          <button className='btn btn-neutral'>Cancelar</button>
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
      </div>
    </div>
  )
}

export default Ventas
