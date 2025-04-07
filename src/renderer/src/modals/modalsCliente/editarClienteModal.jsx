import React from 'react'

function EditarClienteModal({ cliente }) {
  return (
    <div>
      <dialog id="editandoCliente" className="modal">
        <div className="modal-box w-11/12 max-w-5xl">
          <h3 className="text-lg font-bold">Editar la informacion de: {cliente?.entity_name} </h3>
          <p className="py-4">Acá van a ir los campos que se pueden editar! </p>
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

export default EditarClienteModal
