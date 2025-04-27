import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'wouter'
import { fetchProviderById } from '../services/proveedores/proveedorService'
import EditarProveedorModal from '../modals/modalsProveedor/editarProveedorModal'
import AgregarPagoModal from '../modals/modalsProveedor/agregarPagoModal'
import EliminarProveedorModal from '../modals/modalsProveedor/eliminarProveedorModal'
import AgregarCompraModal from '../modals/modalsProveedor/agregarCompraModal'

export default function InfoProvider() {
  const [, setLocation] = useLocation()
  const [searchParams] = useSearchParams()
  const providerId = searchParams.get('id')
  const [provider, setProvider] = useState(null)
  const [operacionSeleccionada, setOperacionSeleccionada] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await fetchProviderById(providerId)
        console.log(data)
        setProvider(data.record)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }
    fetchData()
  }, [providerId])


  const handleRowClick = (row) => {
    setOperacionSeleccionada(row.id)
    console.log('Proveedor seleccionado:', row)
  }

  return (
    <div>
      <div className="w-full rounded-2xl p-2">
        <div className="mb-4 flex items-center gap-4 rounded-2xl bg-gray-800 p-4 text-white dark:bg-gray-400 dark:text-black">
          <button
            className="btn btn-circle btn-ghost tooltip tooltip-bottom ml-5"
            data-tip="Volver"
            onClick={() => setLocation('/proveedores')}
          >
            <ArrowLeft />
          </button>
          <h3 className="text-2xl font-bold">{provider?.entity_name}</h3>
        </div>
        <div className="w-full">
          <div className="items-center justify-between gap-8 space-x-4">
            <button
              className="btn btn-dash mb-4 justify-end"
              onClick={() => document.getElementById('editandoProvider').showModal()}
            >
              <Pencil />
              Editar Proveedor
            </button>
            <button
              className="btn btn-error mb-4 justify-end"
              onClick={() => document.getElementById('eliminandoProvider').showModal()}
            >
              <Trash2 />
              Eliminar Proveedor
            </button>
          </div>
        </div>
        <div className="bg-base-200 overflow-x-auto rounded-lg border p-4 shadow-md">
          <table className="table-zebra table w-full">
            <thead>
              <tr>
                <th>Emrpesa</th>
                <th>CUIT</th>
                <th>Teléfono</th>
                <th>Nombre de Contacto</th>
                <th>Email</th>
                <th>Razon social</th>
                <th>Dirección</th>

              </tr>
            </thead>
            <tbody>
              <tr key={provider?.id} onClick={() => handleRowClick(provider)}>
                <td>{provider?.entity_name}</td>
                <td>{provider?.cuit}</td>
                <td>{provider?.phone_number}</td>
                <td>{provider?.contact_name}</td>
                <td>{provider?.email}</td>
                <td>{provider?.razon_social}</td>
                <td>{provider?.domicilio_comercial}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <hr className="mt-4 border-2" />
          <h1 className="text-3xl font-bold">Marcas: </h1>
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
        <button className="btn btn-primary" onClick={() => setLocation('/proveedores')}>
          Cerrar
        </button>
      </div>
      <EditarProveedorModal provider={provider} />
      <AgregarPagoModal provider={provider} />
      <EliminarProveedorModal provider={provider} />
      <AgregarCompraModal provider={provider} />
    </div>
  )
}
