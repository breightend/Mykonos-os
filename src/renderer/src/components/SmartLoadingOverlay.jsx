import React, { useState, useEffect } from 'react'
import { AlertTriangle, Clock, Wifi, WifiOff, RefreshCw } from 'lucide-react'

/**
 * Loading overlay inteligente que maneja timeouts y errores de conectividad
 */
export const SmartLoadingOverlay = ({
  isLoading,
  operationName = 'Cargando',
  onCancel = null,
  onRetry = null,
  showNetworkStatus = true
}) => {
  const [loadingTime, setLoadingTime] = useState(0)
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine)
  const [showWarning, setShowWarning] = useState(false)
  const [showDanger, setShowDanger] = useState(false)

  useEffect(() => {
    let interval = null
    if (isLoading) {
      setLoadingTime(0)
      setShowWarning(false)
      setShowDanger(false)

      interval = setInterval(() => {
        setLoadingTime((prev) => {
          const newTime = prev + 1

          // Mostrar warning después de 5 segundos
          if (newTime === 5) {
            setShowWarning(true)
          }

          // Mostrar peligro después de 10 segundos
          if (newTime === 10) {
            setShowDanger(true)
          }

          return newTime
        })
      }, 1000)
    } else {
      setLoadingTime(0)
      setShowWarning(false)
      setShowDanger(false)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isLoading])

  useEffect(() => {
    const handleOnline = () => setNetworkStatus(true)
    const handleOffline = () => setNetworkStatus(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isLoading) return null

  const getLoadingMessage = () => {
    if (!networkStatus) {
      return 'Sin conexión a internet'
    }

    if (showDanger) {
      return `⚠️ ${operationName} está tardando más de lo normal (${loadingTime}s)`
    }

    if (showWarning) {
      return `🔄 ${operationName} (${loadingTime}s) - Conexión lenta`
    }

    return `${operationName}${loadingTime > 2 ? ` (${loadingTime}s)` : ''}`
  }

  const getBackgroundColor = () => {
    if (showDanger) return 'bg-red-900 bg-opacity-80'
    if (showWarning) return 'bg-yellow-900 bg-opacity-80'
    return 'bg-black bg-opacity-50'
  }

  const getIconColor = () => {
    if (!networkStatus) return 'text-red-500'
    if (showDanger) return 'text-red-400'
    if (showWarning) return 'text-yellow-400'
    return 'text-blue-500'
  }

  const getIcon = () => {
    if (!networkStatus) {
      return <WifiOff className={`h-6 w-6 ${getIconColor()}`} />
    }
    if (showDanger) {
      return <AlertTriangle className={`h-6 w-6 ${getIconColor()}`} />
    }
    if (showWarning) {
      return <Clock className={`h-6 w-6 ${getIconColor()}`} />
    }
    return <RefreshCw className={`h-6 w-6 animate-spin ${getIconColor()}`} />
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-colors duration-500 ${getBackgroundColor()}`}
    >
      <div className="mx-4 max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center space-x-3">
          {getIcon()}
          <div className="flex-1">
            <p className="font-medium text-gray-900">{getLoadingMessage()}</p>

            {showNetworkStatus && (
              <div className="mt-2 flex items-center space-x-2">
                {networkStatus ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm text-gray-600">
                  {networkStatus ? 'Conectado' : 'Sin conexión'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Mensajes de ayuda progresivos */}
        {showWarning && !showDanger && (
          <div className="mb-4 rounded border-l-4 border-yellow-400 bg-yellow-50 p-3">
            <p className="text-sm text-yellow-800">
              La conexión está más lenta de lo normal. Verificando conectividad...
            </p>
          </div>
        )}

        {showDanger && (
          <div className="mb-4 rounded border-l-4 border-red-400 bg-red-50 p-3">
            <p className="text-sm text-red-800">
              Hay problemas de conectividad. Esto puede tomar un tiempo o fallar.
            </p>
            <p className="mt-1 text-xs text-red-600">
              Tip: Verifica tu conexión a internet o intenta más tarde.
            </p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex space-x-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-300"
            >
              Cancelar
            </button>
          )}

          {onRetry && showDanger && (
            <button
              onClick={onRetry}
              className="flex-1 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default SmartLoadingOverlay
