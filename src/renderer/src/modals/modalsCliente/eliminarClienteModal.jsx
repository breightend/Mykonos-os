export default function EliminarClienteModal({ cliente }) {
  return (
    <div>
      <dialog id="eliminandoCliente" className="modal">
        <div className="modal-box w-11/12 max-w-5xl">
          <h3 className="text-lg font-bold">Eliminar a: {cliente?.entity_name} </h3>
          <p className="py-4">¿Estás seguro que queres eliminar a {cliente?.entity_name}? </p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">Aceptar</button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  )
}
