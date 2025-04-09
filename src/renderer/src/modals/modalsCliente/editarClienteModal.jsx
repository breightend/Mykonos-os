import React from 'react'
import { putData } from '../../services/clientes/clientsService'

function EditarClienteModal({ cliente }) {

  const handleEdit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const clienteData = Object.fromEntries(formData.entries())
    console.log(clienteData)

    try {
      await putData(cliente.id, clienteData)
      alert('Cliente editado con exito')
    } catch (error) {
      console.error('Error al editar el cliente:', error)
    }
  }

  return (
    <div>
      <dialog id="editandoCliente" className="modal">
        <div className="modal-box w-11/12 max-w-5xl">
          <h3 className="text-lg font-bold">Editar la informacion de: {cliente?.entity_name} </h3>
          <div className="flex flex-col gap-4">
            <label htmlFor="" className=''>Nombre y apellido: </label>
            <input type="text" className="input" placeholder={cliente?.entity_name} />
            <label htmlFor="">Dirección: </label>
            <input type="text" className="input" placeholder={cliente?.domicilio_comercial} />
            <label htmlFor="">Numero de teléfono: </label>
            <input type="text" className="input" placeholder={cliente?.phone_number} />
            <label htmlFor="">Mail: </label>
            <input type="text" className="input" placeholder={cliente?.email} />
            <label htmlFor="">Obervaciones: </label>
            <input type="text" className="input" placeholder={cliente?.observations} />
          </div>
          <div className="modal-action">
            <form method="dialog">
              <div className="space-x-4">
                <button className="btn btn-neutral" onClick={handleEdit()}>
                  Cancelar
                </button>
                <button className="btn btn-success">Aceptar</button>
              </div>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  )
}

export default EditarClienteModal
