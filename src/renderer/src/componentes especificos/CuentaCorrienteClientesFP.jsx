import { useState, useEffect } from 'react'
import { fetchCliente } from '../services/clientes/clientsService'
import { pinwheel } from 'ldrs'
import ClientAccountModal from '../components/ClientAccountModal'

// Register the pinwheel loader
pinwheel.register()

const CuentaCorrienteClientesFP = ({ isOpen, onClose, onSelectClient }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [selectedClientForAccount, setSelectedClientForAccount] = useState(null)

  useEffect(() => {
    if (isOpen) {
      const dialog = document.getElementById('cuentaCorriente')
      if (dialog instanceof HTMLDialogElement) {
        dialog.showModal()
      }
      dialog?.showModal()

      // Fetch clients from database when modal opens
      fetchClients()
    }
  }, [isOpen])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const data = await fetchCliente()
      setClients(data)
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(
    (client) =>
      client.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.cuit?.includes(searchTerm)
  )

  const handleClientSelect = (client) => {
    onSelectClient({
      id: client.id,
      name: client.entity_name,
      dni: client.cuit,
      ...client
    })
    onClose()
  }

  const handleViewAccount = (client, event) => {
    event.stopPropagation() // Prevent selecting the client
    setSelectedClientForAccount(client)
    setShowAccountModal(true)
  }

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
            placeholder="Buscar por nombre o DNI/CUIT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered w-full"
          />

          {loading ? (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="mb-4">
                <l-pinwheel size="35" stroke="3" speed="0.9" color="#d97706"></l-pinwheel>
              </div>
              <span className="text-warning text-sm font-medium">Cargando clientes...</span>
            </div>
          ) : (
            <ul className="max-h-60 space-y-2 overflow-auto">
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <li
                    key={client.id}
                    onClick={() => handleClientSelect(client)}
                    className="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {client.entity_name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          DNI/CUIT: {client.cuit}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleViewAccount(client, e)}
                        className="ml-2 rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 hover:bg-blue-200"
                        title="Ver cuenta corriente"
                      >
                        Ver Cuenta
                      </button>
                    </div>
                  </li>
                ))
              ) : (
                <li className="p-4 text-center text-gray-500">
                  {searchTerm ? 'No se encontraron clientes' : 'No hay clientes disponibles'}
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      {/* Modal de cuenta corriente */}
      {showAccountModal && selectedClientForAccount && (
        <ClientAccountModal
          isOpen={showAccountModal}
          onClose={() => {
            setShowAccountModal(false)
            setSelectedClientForAccount(null)
          }}
          clientId={selectedClientForAccount.id}
          clientName={selectedClientForAccount.entity_name}
        />
      )}
    </dialog>
  )
}

export default CuentaCorrienteClientesFP
