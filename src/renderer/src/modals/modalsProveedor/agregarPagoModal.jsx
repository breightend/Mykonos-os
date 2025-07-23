import React from 'react'

function AgregarPagoModal({ provider }) {

  return (
    <div>
      <dialog id="agregandoPago" className="modal">
        <div className="modal-box w-11/12 max-w-5xl">
          <h3 className="text-lg font-bold">Agregar un pago a: {}</h3>
          <p className="py-4">Ingrese los detalles del pago a continuación: </p>
          <form>
            <div className="form-control">
              <label htmlFor="monto" className="label">
                <span className="label-text">Monto</span>
              </label>
              <input type="number" id="monto" className="input" />
            </div>
            <div className="form-control">
              <label htmlFor="forma_pago" className="label">
                <span className="label-text">Forma de pago</span>
              </label>
              <input type="text" id="forma_pago" className="input" />
            </div>
            <p>Subir comprobante</p>
            <p>Aca se va a poder subir comprbante</p>
          </form>
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

export default AgregarPagoModal
