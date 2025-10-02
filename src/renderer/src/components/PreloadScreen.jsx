import React, { useState, useEffect } from 'react'
import { useGlobalData } from '../contexts/GlobalDataContext'
import { Loader2, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'

const PreloadScreen = ({ onComplete }) => {
  const { isLoading, errors, globalData, refreshData } = useGlobalData()
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('Inicializando...')
  const [showDetails, setShowDetails] = useState(false)

  const steps = [
    { key: 'colors', label: 'Cargando colores' },
    { key: 'sizes', label: 'Cargando talles' },
    { key: 'categories', label: 'Cargando categorías' },
    { key: 'brands', label: 'Cargando marcas' },
    { key: 'payment_methods', label: 'Cargando métodos de pago' }
  ]

  useEffect(() => {
    if (!isLoading) {
      setProgress(100)
      setCurrentStep('Completado')

      // Pequeño delay para mostrar completado antes de continuar
      const timer = setTimeout(() => {
        onComplete?.()
      }, 500)

      return () => clearTimeout(timer)
    } else {
      // Simular progreso basado en datos cargados
      const loadedCount = Object.keys(globalData).length
      const totalSteps = steps.length
      const newProgress = Math.round((loadedCount / totalSteps) * 100)

      setProgress(newProgress)

      // Determinar paso actual
      if (loadedCount < totalSteps) {
        const currentStepData = steps[loadedCount]
        setCurrentStep(currentStepData?.label || 'Cargando...')
      }
    }
  }, [isLoading, globalData, onComplete])

  const retryFailedData = async () => {
    const failedKeys = Object.keys(errors)
    for (const key of failedKeys) {
      try {
        await refreshData(key)
      } catch (error) {
        console.error(`Error retrying ${key}:`, error)
      }
    }
  }

  const hasErrors = Object.keys(errors).length > 0
  const canContinue = !isLoading && Object.keys(globalData).length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-8 backdrop-blur-lg">
        {/* Logo o título */}
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-3xl font-bold text-white">Mykonos OS</h1>
          <p className="text-white/70">Preparando el sistema...</p>
        </div>

        {/* Barra de progreso */}
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-sm text-white/80">
            <span>{currentStep}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/20">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Ícono de estado */}
        <div className="mb-4 flex justify-center">
          {isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          ) : hasErrors ? (
            <AlertTriangle className="h-8 w-8 text-yellow-400" />
          ) : (
            <CheckCircle className="h-8 w-8 text-green-400" />
          )}
        </div>

        {/* Detalles y errores */}
        {hasErrors && (
          <div className="mb-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-yellow-400 underline hover:text-yellow-300"
            >
              {showDetails ? 'Ocultar' : 'Mostrar'} detalles ({Object.keys(errors).length} errores)
            </button>

            {showDetails && (
              <div className="mt-2 rounded border border-yellow-400/30 bg-yellow-900/30 p-3">
                <div className="space-y-1 text-xs text-yellow-100">
                  {Object.entries(errors).map(([key, error]) => (
                    <div key={key}>
                      <strong>{key}:</strong> {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-center gap-2">
          {hasErrors && (
            <button
              onClick={retryFailedData}
              className="flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-sm text-white transition-colors hover:bg-yellow-700"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </button>
          )}

          {canContinue && (
            <button
              onClick={onComplete}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm text-white transition-colors hover:bg-blue-700"
            >
              Continuar
            </button>
          )}
        </div>

        {/* Status de datos cargados */}
        <div className="mt-4 text-center">
          <div className="text-xs text-white/60">
            Datos cargados: {Object.keys(globalData).length}/{steps.length}
          </div>
          {canContinue && hasErrors && (
            <div className="mt-1 text-xs text-yellow-400">
              Algunos datos no se pudieron cargar, pero puedes continuar
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PreloadScreen
