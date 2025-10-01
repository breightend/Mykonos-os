import { useState, useEffect } from 'react'
import { Loader2, Wifi, WifiOff, AlertCircle } from 'lucide-react'

/**
 * Hook para manejar estados de loading con mejor UX
 */
export const useOptimizedLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [startTime, setStartTime] = useState(null)

  const startLoading = (message = 'Cargando...') => {
    setIsLoading(true)
    setLoadingMessage(message)
    setStartTime(Date.now())
  }

  const stopLoading = () => {
    const duration = Date.now() - startTime
    console.log(`⏱️ Loading completed in ${duration}ms`)

    setIsLoading(false)
    setLoadingMessage('')
    setStartTime(null)
  }

  return { isLoading, loadingMessage, startLoading, stopLoading }
}

/**
 * Componente de loading optimizado con información de network
 */
export const OptimizedLoader = ({
  isLoading,
  message = 'Cargando...',
  showNetworkStatus = true
}) => {
  const [networkStatus, setNetworkStatus] = useState('online')
  const [loadingTime, setLoadingTime] = useState(0)

  useEffect(() => {
    let interval = null
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingTime((prev) => prev + 1)
      }, 1000)
    } else {
      setLoadingTime(0)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isLoading])

  useEffect(() => {
    const handleOnline = () => setNetworkStatus('online')
    const handleOffline = () => setNetworkStatus('offline')

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isLoading) return null

  const getLoadingIcon = () => {
    if (networkStatus === 'offline') {
      return <WifiOff className="h-6 w-6 text-red-500" />
    }
    if (loadingTime > 10) {
      return <AlertCircle className="h-6 w-6 text-yellow-500" />
    }
    return <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
  }

  const getLoadingMessage = () => {
    if (networkStatus === 'offline') {
      return 'Sin conexión a internet'
    }
    if (loadingTime > 10) {
      return `${message} (${loadingTime}s) - Conexión lenta detectada`
    }
    return `${message}${loadingTime > 3 ? ` (${loadingTime}s)` : ''}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="mx-4 max-w-sm rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-center space-x-3">
          {getLoadingIcon()}
          <div>
            <p className="font-medium text-gray-900">{getLoadingMessage()}</p>
            {showNetworkStatus && (
              <div className="mt-2 flex items-center space-x-2">
                {networkStatus === 'online' ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm text-gray-600">
                  {networkStatus === 'online' ? 'Conectado' : 'Sin conexión'}
                </span>
              </div>
            )}
            {loadingTime > 5 && (
              <p className="mt-1 text-xs text-gray-500">Tip: Verifica tu conexión a internet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * HOC para wrappear componentes con loading automático
 */
export const withOptimizedLoading = (WrappedComponent) => {
  return function OptimizedLoadingWrapper(props) {
    const { isLoading, loadingMessage, startLoading, stopLoading } = useOptimizedLoading()

    return (
      <>
        <WrappedComponent {...props} startLoading={startLoading} stopLoading={stopLoading} />
        <OptimizedLoader isLoading={isLoading} message={loadingMessage} />
      </>
    )
  }
}

export default OptimizedLoader
