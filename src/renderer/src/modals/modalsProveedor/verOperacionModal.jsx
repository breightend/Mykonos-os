import React from 'react'

function VerOperacionModal({ provider }) {
  return (
    <div>
      <dialog id="verOperacionModal" className="modal modal-open">
        <div className="modal-box w-11/12 max-w-5xl">
          <h3 className="text-lg font-bold">Detalles de la operación</h3>
          <div className="flex flex-col gap-4">
            <label htmlFor="">Fecha: </label>
            <input type="text" className="input" name="fecha" placeholder="Fecha de la operación" />
            <label htmlFor="">Tipo de operación: </label>
            <input
              type="text"
              className="input"
              name="tipoOperacion"
              placeholder="Tipo de operación"
            />
            <label htmlFor="">Monto: </label>
            <input type="text" className="input" name="monto" placeholder="Monto de la operación" />
            <label htmlFor="">Descripción: </label>
            <textarea
              className="textarea"
              name="descripcion"
              placeholder="Descripción de la operación"
            ></textarea>
          </div>
          <div className="modal-action">
            <button className="btn">Cerrar</button>
          </div>
        </div>
      </dialog>
    </div>
  )
}

export default VerOperacionModal
