import { deleteData } from '../../services/clientes/clientsService'
import toast, { Toaster } from 'react-hot-toast'
import { useLocation } from 'wouter'
export default function EliminarClienteModal({ cliente }) {
  const [setLocation] = useLocation()
  const handleDelete = async () => {
    try {
      await deleteData(cliente.id)
      console.log('Cliente eliminado:', cliente.id)
      toast.success('Cliente eliminado correctamente')
      setLocation('/clientes')
    } catch (error) {
      console.error('Error eliminando cliente:', error)
      toast.error('Error eliminando cliente')
    }
  }
  return (
    <div>
      <dialog id="eliminandoCliente" className="modal">
        <div className="modal-box w-11/12 max-w-5xl">
          <h3 className="text-lg font-bold">Eliminar a: {cliente?.entity_name} </h3>
          <p className="py-4">¿Estás seguro que queres eliminar a {cliente?.entity_name}? </p>
          <div className="modal-action">
            <form method="dialog">
              <div className="space-x-4">
                <button className="btn btn-neutral">Cancelar</button>
<<<<<<< HEAD
                <button className="btn btn-success" onClick={handleDelete}>
                  Eliminar cliente
                </button>
                <Toaster position="bottom-right" />
=======
                <button className="btn btn-success" onClick={handleDeleteData}>Aceptar</button>
>>>>>>> 7ce02f673c5518107da1876da9c329b8fb75f3f2
              </div>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  )
}
