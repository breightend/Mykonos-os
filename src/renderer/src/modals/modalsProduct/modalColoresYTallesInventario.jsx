export default function ModalColoresYTalles() {
    
  return (
    <>
      <dialog id="sizeColorModal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="text-lg font-bold">Colores y Talles</h3>
          <p className="py-4">
            Aquí puedes agregar o editar los colores y talles disponibles para el producto.
          </p>
          <div className="modal-action">
            <button
              className="btn"
              onClick={() => document.getElementById('sizeColorModal').close()}
            >
              Cerrar
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
