import { useState } from 'react'
import { Layers3, TestTube } from 'lucide-react'
import MultiProductExchangeModal from '../modals/VentasModal/multiProductExchangeModal'

const MultiProductExchangeTestPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [testResults, setTestResults] = useState([])

  const handleExchangeComplete = (result) => {
    console.log('🎉 Exchange completed:', result)
    setTestResults([
      ...testResults,
      {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        result: result,
        type: 'multi-product'
      }
    ])
    setIsModalOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="flex items-center text-3xl font-bold text-gray-900">
            <TestTube className="mr-4 h-8 w-8 text-blue-600" />
            Prueba - Sistema Multi-Producto
          </h1>
          <p className="mt-2 text-gray-600">
            Página de pruebas para el nuevo sistema de intercambio multi-producto
          </p>
        </div>

        {/* Test Controls */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Controles de Prueba</h2>

            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary mb-4 flex w-full items-center justify-center"
            >
              <Layers3 className="mr-2 h-5 w-5" />
              Abrir Modal Multi-Producto
            </button>

            <div className="text-sm text-gray-500">
              <p>• Permite devolver múltiples productos</p>
              <p>• Permite intercambiar por múltiples productos nuevos</p>
              <p>• Calcula diferencias de precio automáticamente</p>
              <p>• Compatible con el formato anterior (single-product)</p>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Estado del Sistema</h2>

            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
                <span>Backend Multi-Producto: Activo</span>
              </div>
              <div className="flex items-center">
                <div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
                <span>API Endpoints: Funcionando</span>
              </div>
              <div className="flex items-center">
                <div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
                <span>Frontend Modal: Implementado</span>
              </div>
              <div className="flex items-center">
                <div className="mr-2 h-2 w-2 rounded-full bg-yellow-500"></div>
                <span>Integración con Ventas: En desarrollo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Resultados de Pruebas</h2>

          {testResults.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <Layers3 className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p>No hay pruebas ejecutadas aún</p>
              <p className="text-sm">Ejecute una prueba usando el botón de arriba</p>
            </div>
          ) : (
            <div className="space-y-4">
              {testResults.map((test) => (
                <div key={test.id} className="rounded border border-gray-200 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium">Intercambio Multi-Producto #{test.id}</span>
                    <span className="text-sm text-gray-500">{test.timestamp}</span>
                  </div>

                  <div className="text-sm">
                    <div className="mb-2">
                      <span className="font-medium">Estado: </span>
                      <span className={test.result.success ? 'text-green-600' : 'text-red-600'}>
                        {test.result.success ? '✅ Exitoso' : '❌ Error'}
                      </span>
                    </div>

                    {test.result.success && (
                      <>
                        <div className="mb-1">
                          <span className="font-medium">ID: </span>
                          {test.result.exchange_id}
                        </div>
                        <div className="mb-1">
                          <span className="font-medium">Productos devueltos: </span>
                          {test.result.return_products?.length || 0}
                        </div>
                        <div className="mb-1">
                          <span className="font-medium">Productos nuevos: </span>
                          {test.result.new_products?.length || 0}
                        </div>
                        <div className="mb-1">
                          <span className="font-medium">Diferencia de precio: </span>$
                          {test.result.price_difference}
                        </div>
                      </>
                    )}

                    {test.result.message && (
                      <div className="mt-2 text-xs text-gray-600">
                        Mensaje: {test.result.message}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 rounded-lg bg-blue-50 p-6">
          <h3 className="mb-3 font-semibold text-blue-900">Instrucciones de Prueba</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              1. <strong>Abra el modal multi-producto</strong> usando el botón de arriba
            </p>
            <p>
              2. <strong>Paso 1:</strong> Ingrese códigos de barras de productos a devolver
            </p>
            <p>
              3. <strong>Paso 2:</strong> (Opcional) Ingrese códigos de productos nuevos
            </p>
            <p>
              4. <strong>Paso 3:</strong> Revise el resumen y confirme el intercambio
            </p>
            <p>
              5. <strong>Resultado:</strong> El sistema procesará el intercambio y actualizará
              inventarios
            </p>
          </div>
        </div>
      </div>

      {/* Multi-Product Exchange Modal */}
      <MultiProductExchangeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onExchangeComplete={handleExchangeComplete}
        getCurrentBranchId={() => 1} // Default branch ID for testing
      />
    </div>
  )
}

export default MultiProductExchangeTestPage
