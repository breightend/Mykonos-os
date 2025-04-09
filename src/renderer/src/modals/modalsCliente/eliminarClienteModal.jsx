import { deleteData } from '../../services/clientes/clientsService'
export default function EliminarClienteModal({ cliente }) {
  const handleDeleteData = async () => {
    deleteData(cliente.id)
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
                <button className="btn btn-success">Aceptar</button>
              </div>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  )
}
