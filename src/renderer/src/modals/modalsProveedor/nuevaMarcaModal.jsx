export default function NuevaMarca(provider) {
  return (
    <div>
      <dialog id="nuevaMarca" className="modal">
        <h2 className="mb-4 text-2xl font-bold">Nueva Marca</h2>
        <div className="modal-box w-11/12 max-w-5xl">
          <h3 className="text-lg font-bold">Agregar una compra a: {provider?.entity_name} </h3>
          <p className="py-4">Acá van a ir los campos que se pueden agregar! </p>
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
