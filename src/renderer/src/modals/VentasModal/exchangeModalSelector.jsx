import { useState } from 'react'
import { ArrowRightLeft, Package2, Layers3 } from 'lucide-react'
import CambioProductoModal from './cambioModal'
import MultiProductExchangeModal from './multiProductExchangeModal'

const ExchangeModalSelector = ({ isOpen, onClose, onExchangeComplete, selectedProduct }) => {
  const [exchangeMode, setExchangeMode] = useState('single') // 'single' or 'multi'

  if (!isOpen) return null

  // If a specific product is pre-selected, start with single mode
  const initialMode = selectedProduct ? 'single' : exchangeMode

  return (
    <>
      {/* Mode Selection Modal */}
      {!selectedProduct && exchangeMode === 'single' && !selectedProduct && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <div className="mb-6 text-center">
              <ArrowRightLeft className="mx-auto mb-4 h-12 w-12 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Tipo de Intercambio</h2>
              <p className="mt-2 text-sm text-gray-500">
                Seleccione el tipo de intercambio que desea realizar
              </p>
            </div>

            <div className="space-y-4">
              {/* Single Product Exchange */}
              <button
                onClick={() => setExchangeMode('single-start')}
                className="group flex w-full items-center rounded-lg border border-gray-200 p-4 text-left transition-all hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 group-hover:bg-blue-200">
                  <Package2 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">Intercambio Simple</h3>
                  <p className="text-sm text-gray-500">Cambiar un producto por otro (1 a 1)</p>
                </div>
              </button>

              {/* Multi Product Exchange */}
              <button
                onClick={() => setExchangeMode('multi')}
                className="group flex w-full items-center rounded-lg border border-gray-200 p-4 text-left transition-all hover:border-green-300 hover:bg-green-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 group-hover:bg-green-200">
                  <Layers3 className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-medium text-gray-900">Intercambio Multi-Producto</h3>
                  <p className="text-sm text-gray-500">
                    Devolver múltiples productos y/o cambiar por varios
                  </p>
                </div>
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={onClose} className="btn btn-outline">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Product Exchange Modal */}
      {(initialMode === 'single' || exchangeMode === 'single-start') && (
        <CambioProductoModal
          selectedProduct={selectedProduct}
          onExchangeComplete={(result) => {
            setExchangeMode('single')
            onExchangeComplete(result)
          }}
          onClose={() => {
            if (selectedProduct) {
              onClose()
            } else {
              setExchangeMode('single')
            }
          }}
        />
      )}

      {/* Multi Product Exchange Modal */}
      {exchangeMode === 'multi' && (
        <MultiProductExchangeModal
          isOpen={true}
          onClose={() => {
            setExchangeMode('single')
          }}
          onExchangeComplete={(result) => {
            setExchangeMode('single')
            onExchangeComplete(result)
          }}
          getCurrentBranchId={() => {
            // Import the getCurrentBranchId function or implement it here
            return 1 // Default branch ID
          }}
        />
      )}
    </>
  )
}

export default ExchangeModalSelector
