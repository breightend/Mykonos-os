import { useState, useEffect } from 'react'
import { Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react'

const NetworkHealthMonitor = () => {
  const [connectionStatus, setConnectionStatus] = useState({
    isOnline: navigator.onLine,
    serverReachable: null,
    responseTime: null,
    lastCheck: null
  })

  const checkServerHealth = async () => {
    const startTime = Date.now()

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      // Usar un endpoint que sabemos que funciona - employees retorna algo incluso sin auth
      const response = await fetch(
        `${window.API_BASE_URL || 'http://190.3.63.58:8000'}/api/user/employees`,
        {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          }
        }
      )

      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime

      // Considerar como exitoso si el servidor responde (incluso con 401/403)
      // Lo importante es que el servidor esté disponible
      const isServerUp = response.status < 500

      setConnectionStatus((prev) => ({
        ...prev,
        serverReachable: isServerUp,
        responseTime,
        lastCheck: new Date()
      }))
    } catch (error) {
      const responseTime = Date.now() - startTime

      // Solo loggear si no es error de abort (cancelación manual)
      if (error.name !== 'AbortError') {
        console.log('❌ Server health check failed:', error.message)
      }

      setConnectionStatus((prev) => ({
        ...prev,
        serverReachable: false,
        responseTime: responseTime > 5000 ? 5000 : responseTime,
        lastCheck: new Date()
      }))
    }
  }

  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus((prev) => ({ ...prev, isOnline: true }))
      checkServerHealth()
    }

    const handleOffline = () => {
      setConnectionStatus((prev) => ({
        ...prev,
        isOnline: false,
        serverReachable: false
      }))
    }

    // Configurar listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check inicial
    checkServerHealth()

    // Check periódico cada 30 segundos
    const interval = setInterval(checkServerHealth, 30000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  const getStatusColor = () => {
    if (!connectionStatus.isOnline) return 'text-red-500'
    if (connectionStatus.serverReachable === false) return 'text-orange-500'
    if (connectionStatus.responseTime > 3000) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getStatusIcon = () => {
    if (!connectionStatus.isOnline) return <WifiOff className="h-4 w-4" />
    if (connectionStatus.serverReachable === false) return <AlertTriangle className="h-4 w-4" />
    if (connectionStatus.responseTime > 3000) return <Wifi className="h-4 w-4" />
    return <CheckCircle className="h-4 w-4" />
  }

  const getStatusText = () => {
    if (!connectionStatus.isOnline) return 'Sin conexión a internet'
    if (connectionStatus.serverReachable === false) return 'Servidor no accesible'
    if (connectionStatus.responseTime > 3000)
      return `Conexión lenta (${connectionStatus.responseTime}ms)`
    if (connectionStatus.responseTime) return `Conexión buena (${connectionStatus.responseTime}ms)`
    return 'Verificando...'
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${getStatusColor()}`}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      {connectionStatus.lastCheck && (
        <span className="text-xs opacity-60">
          {connectionStatus.lastCheck.toLocaleTimeString()}
        </span>
      )}
    </div>
  )
}

export default NetworkHealthMonitor
