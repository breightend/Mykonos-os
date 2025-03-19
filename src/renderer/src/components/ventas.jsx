import { useLocation } from 'wouter'
import { ArrowLeft, Trash2 } from 'lucide-react'
import MenuVertical from '../componentes especificos/menuVertical'

function Ventas() {
  const [, setLocation] = useLocation()

  return (
    <div>
      <MenuVertical currentPath="/ventas" />
      <div className="flex-1 wl-20">
        <button className="btn btn-circle" onClick={() => setLocation('/home')}>
          <ArrowLeft />
        </button>

        <div className="flex-1 ml-20 ">
          <div className="card bg-base-200 shadow-sm p-10">
            <div className="card-title">
              <h1>Ventas</h1>
            </div>
            <div className="card-body ">
              <div className="flex flex-row grid grid-flow-col">
                <div className="">
                  <p>Ingrese o escanee el código: </p>
                  <input
                    type="text"
                    placeholder="##########"
                    className="input input-bordered input-accent w-full max-w-xs"
                  />
                  <button className="btn btn-accent ml-10">Aceptar</button>
                  <button className="btn btn-error ml-4 ">
                    <Trash2 />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="table mt-4">
                  <thead>
                    <tr>
                      <th>Codigo de barras</th>
                      <th>Descripción</th>
                      <th>Cantidad</th>
                      <th>Tipo</th>
                      <th>Precio</th>
                      <th>Marca</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* row 1 */}
                    <tr>
                      <th>1</th>``
                      <td>Cy Ganderton</td>
                      <td>1</td>
                      <td>Pantalon</td>
                      <td>Blue</td>
                      <td>Cy Ganderton</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <p className="font-bold ">Total: </p>
          <div className="flex justify-end">
            <button
              className="btn btn-success  justify-end"
              onClick={() => setLocation('/formaPago')}
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Ventas
