import React, { useState, useEffect } from 'react'

const clients = [
  { id: 1, name: 'Client A' },
  { id: 2, name: 'Client B' },
  { id: 3, name: 'Client C' }
]

const CuentaCorrienteClientesFP = ({ isOpen, onClose, onSelectClient }) => {
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (isOpen) {
      const dialog = document.getElementById('cuentaCorriente')
      if (dialog instanceof HTMLDialogElement) {
        dialog.showModal()
      }
      dialog?.showModal()
    }
  }, [isOpen])

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <dialog id="cuentaCorriente" className="modal backdrop-blur-sm backdrop:bg-black/50">
      <div className="modal-box">
        <div className="modal-header mb-4 flex items-center justify-between rounded-2xl bg-gray-800 p-4">
          <h3 className="text-2xl font-bold text-white">Seleccionar Cliente</h3>
          <button onClick={onClose} className="text-white">
            ✖
          </button>
        </div>
        <div className="text-base-content space-y-4">
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered w-full"
          />
          <ul className="max-h-60 space-y-2 overflow-auto">
            {filteredClients.map((client) => (
              <li
                key={client.id}
                onClick={() => onSelectClient(client)}
                className="cursor-pointer rounded-lg p-2 hover:bg-gray-200"
              >
                {client.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </dialog>
  )
}

export default CuentaCorrienteClientesFP
