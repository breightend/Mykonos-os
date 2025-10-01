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
        <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900 flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full mx-4 border border-white/20">
                {/* Logo o título */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-white mb-2">Mykonos OS</h1>
                    <p className="text-white/70">Preparando el sistema...</p>
                </div>

                {/* Barra de progreso */}
                <div className="mb-6">
                    <div className="flex justify-between text-sm text-white/80 mb-2">
                        <span>{currentStep}</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                        <div 
                            className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Ícono de estado */}
                <div className="flex justify-center mb-4">
                    {isLoading ? (
                        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
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
                            className="text-yellow-400 text-sm underline hover:text-yellow-300"
                        >
                            {showDetails ? 'Ocultar' : 'Mostrar'} detalles ({Object.keys(errors).length} errores)
                        </button>
                        
                        {showDetails && (
                            <div className="mt-2 p-3 bg-yellow-900/30 rounded border border-yellow-400/30">
                                <div className="text-yellow-100 text-xs space-y-1">
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
                <div className="flex gap-2 justify-center">
                    {hasErrors && (
                        <button
                            onClick={retryFailedData}
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Reintentar
                        </button>
                    )}
                    
                    {canContinue && (
                        <button
                            onClick={onComplete}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                        >
                            Continuar
                        </button>
                    )}
                </div>

                {/* Status de datos cargados */}
                <div className="mt-4 text-center">
                    <div className="text-white/60 text-xs">
                        Datos cargados: {Object.keys(globalData).length}/{steps.length}
                    </div>
                    {canContinue && hasErrors && (
                        <div className="text-yellow-400 text-xs mt-1">
                            Algunos datos no se pudieron cargar, pero puedes continuar
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default PreloadScreen