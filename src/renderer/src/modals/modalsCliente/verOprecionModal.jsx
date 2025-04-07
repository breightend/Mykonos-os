export default function VerOprecionModal({ cliente }) {
  return (
    <div>
      <dialog id="verOprecionModal" className="modal">
        <div className="modal-box w-11/12 max-w-5xl">
          <h3 className="text-lg font-bold">Ver la informacion de: {cliente?.entity_name} </h3>
          <p className="py-4">Acá van a ir los campos que se pueden ver! </p>
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
