import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'wouter'
import { fetchProviderById } from '../services/proveedores/proveedorService'

export default function InfoProvider({ provider }) {
  const [, setLocation] = useLocation()
    const [searchParams] = useSearchParams()
    const clientId = searchParams.get('id')
    const [cliente, setCliente] = useState(null)
    const [operacionSeleccionada, setOperacionSeleccionada] = useState(null)
  
    useEffect(() => {
      async function fetchData() {
        try {
          const data = await fetchProviderById(clientId)
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
  
    const handleRowClick = (row) => {
      setOperacionSeleccionada(row.id)
      console.log('Cliente seleccionado:', row)
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
              className="btn btn-dash mb-4 justify-end"
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
                <th>ID</th>
                <th>Nombre</th>
                <th>CUIT</th>
                <th>Teléfono</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              <tr key={provider?.id}>
                <td>{provider?.id}</td>
                <td>{provider?.entity_name}</td>
                <td>{provider?.cuit}</td>
                <td>{provider?.phone}</td>
                <td>{provider?.email}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
