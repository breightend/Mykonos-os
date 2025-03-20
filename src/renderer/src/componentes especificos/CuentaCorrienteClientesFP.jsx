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

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <dialog id="cuentaCorriente" className="modal backdrop:bg-black/50 backdrop-blur-sm">
      <div className="modal-box">
        <div className="modal-header bg-gray-800 p-4 rounded-2xl flex justify-between items-center mb-4">
          <h3 className="font-bold text-2xl text-white">Seleccionar Cliente</h3>
          <button onClick={onClose} className="text-white">✖</button>
        </div>
        <div className="text-base-content space-y-4">
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input input-bordered w-full"
          />
          <ul className="space-y-2 max-h-60 overflow-auto">
            {filteredClients.map(client => (
              <li
                key={client.id}
                onClick={() => onSelectClient(client)}
                className="cursor-pointer p-2 rounded-lg hover:bg-gray-200"
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
