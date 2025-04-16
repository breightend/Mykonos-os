import React from 'react'

function agregarPagoModal() {
  return (
    <div>
      <dialog id="agregandoPago" className="modal">
        <div className="modal-box w-11/12 max-w-5xl">
          <h3 className="text-lg font-bold">Agregar un pago a: </h3>
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

export default agregarPagoModal
