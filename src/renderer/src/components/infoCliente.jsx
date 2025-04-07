import { ArrowLeft } from 'lucide-react'
import { fetchClienteById } from '../services/clientes/clientsService'
import { useEffect } from 'react'
import { useLocation, useSearchParams } from 'wouter'
import { useState } from 'react'
import EditarClienteModal from '../modals/modalsCliente/editarClienteModal'
import AgregarCompraModal from '../modals/modalsCliente/agregarCompraModal'
import AgregarPagoModal from '../modals/modalsCliente/agregarPagoModal'
import VerOprecionModal from '../modals/modalsCliente/verOprecionModal'
//TODO: ver operaciones va a ser con doble click
export default function InfoClientes() {
  const [, setLocation] = useLocation()
  const [searchParams] = useSearchParams()
  const clientId = searchParams.get('id')
  const [cliente, setCliente] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await fetchClienteById(clientId)
        console.log(data)
        setCliente(data.record)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [clientId])

  console.log('{Cliente}', { cliente })
  console.log('Nombre: ', cliente?.entity_name)
  console.log('Ciente: ', cliente)

  return (
    <div>
      <div className="w-full rounded-2xl p-2">
        <div className="mb-4 flex items-center gap-4 rounded-2xl bg-gray-800 p-4 text-white dark:bg-gray-400 dark:text-black">
          <button
            className="btn btn-circle btn-ghost tooltip tooltip-bottom ml-5"
            data-tip="Volver"
            onClick={() => setLocation('/clientes')}
          >
            <ArrowLeft />
          </button>
          <h3 className="text-2xl font-bold">{cliente?.entity_name}</h3>
        </div>
        <div className="flex w-full">
          <div className="flex items-center justify-end">
            <button
              className="btn btn-dash mb-4 justify-end"
              onClick={() => document.getElementById('editandoCliente').showModal()}
            >
              Editar cliente
            </button>
          </div>
        </div>
        <div className="text-base-content flex flex-col items-center gap-4">
          <div className="overflow-x-auto">
            {/* head */}
            {cliente && (
              <table className="table w-full text-sm">
                <thead className="rounded-2xl bg-gray-800 text-white">
                  <tr>
                    <th>#</th>
                    <th>Nombre y apellido</th>
                    <th>DNI o CUIT</th>
                    <th>Celular</th>
                    <th>Domicilio</th>
                    <th>Mail</th>
                    <th>Razon Social</th>
                    <th>Observaciones</th>
                  </tr>
                </thead>
                <tbody className="">
                  <tr>
                    <th>1</th>
                    <td>{cliente?.entity_name}</td>
                    <td>{cliente?.cuit}</td>
                    <td>{cliente?.phone_number}</td>
                    <td>{cliente?.domicilio_comercial}</td>
                    <td>{cliente?.email}</td>
                    <td>{cliente?.razon_social}</td>
                    <td>{cliente?.observations}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
          <div>
            <hr className="mt-4 border-2" />
            <h1 className="text-3xl font-bold"> Registro de operaciones </h1>
          </div>
          <div className="w-full">
            <div className="flex justify-end gap-4">
              <button
                className="btn btn-accent"
                onClick={() => document.getElementById('agregandoCompra').showModal()}
              >
                Agregar compra
              </button>
              <button
                className="btn btn-primary"
                onClick={() => document.getElementById('agregandoPago').showModal()}
              >
                Agregar pago
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table-xs table-zebra w-full">
              {/* head */}
              <thead>
                <tr>
                  <th></th>
                  <th>Fecha</th>
                  <th>Operación</th>
                  <th>Cantidad</th>
                  <th>Monto</th>
                  <th>Descripción</th>
                  <th>Vendedor</th>
                </tr>
              </thead>
              <tbody>
                {/* row 1 */}
                <tr>
                  <th>1</th>
                  <td>Cy Ganderton</td>
                  <td>Quality Control Specialist</td>
                  <td>Blue</td>
                </tr>
                {/* row 2 */}
                <tr>
                  <th>2</th>
                  <td>Hart Hagerty</td>
                  <td>Desktop Support Technician</td>
                  <td>Purple</td>
                </tr>
                {/* row 3 */}
                <tr>
                  <th>3</th>
                  <td>Brice Swyre</td>
                  <td>Tax Accountant</td>
                  <td>Red</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-4 mr-4 flex justify-end">
          <button className="btn btn-primary">Cerrar</button>
        </div>
      </div>

      {/* A partir de acá para editar cliente! */}
      <EditarClienteModal cliente={cliente} />
      <AgregarCompraModal cliente={cliente} />
      <AgregarPagoModal cliente={cliente} />
      <VerOprecionModal cliente={cliente} />
    </div>
  )
}
