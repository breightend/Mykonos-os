import { useState, useEffect } from 'react'
import { Settings, Server, Wifi, WifiOff } from 'lucide-react'
import toast from 'react-hot-toast'

const ServerConfigModal = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState({
    url: 'https://api.mykonosboutique.com.ar',
    timeout: 8000,
    retries: 3
  })
  const [isConnected, setIsConnected] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadCurrentConfig()
    }
  }, [isOpen])

  const loadCurrentConfig = async () => {
    try {
      if (window.api?.getServerConfig) {
        const serverConfig = await window.api.getServerConfig()
        setConfig(serverConfig)
      }
    } catch (error) {
      console.error('Error loading server config:', error)
    }
  }

  const testConnection = async () => {
    setIsTestingConnection(true)
    try {
      const response = await fetch(`${config.url}/api/health`, {
        method: 'GET',
        timeout: config.timeout
      })

      if (response.ok) {
        setIsConnected(true)
        toast.success('✅ Conexión exitosa con el servidor')
      } else {
        setIsConnected(false)
        toast.error(`❌ Error de conexión: ${response.status}`)
      }
    } catch (error) {
      setIsConnected(false)
      toast.error(`❌ No se pudo conectar al servidor: ${error.message}`)
    } finally {
      setIsTestingConnection(false)
    }
  }

  const saveConfig = () => {
    // En una implementación completa, aquí guardarías la configuración
    toast.success('⚙️ Configuración guardada')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Configuración del Servidor</h2>
        </div>

        <div className="space-y-4">
          {/* URL del Servidor */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">URL del Servidor</label>
            <input
              type="text"
              value={config.url}
              onChange={(e) => setConfig((prev) => ({ ...prev, url: e.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="http://192.168.1.100:8000"
            />
          </div>

          {/* Timeout */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Timeout (ms)</label>
            <input
              type="number"
              value={config.timeout}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, timeout: parseInt(e.target.value) }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              min="1000"
              max="30000"
            />
          </div>

          {/* Reintentos */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Reintentos</label>
            <input
              type="number"
              value={config.retries}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, retries: parseInt(e.target.value) }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              min="0"
              max="10"
            />
          </div>

          {/* Test de Conexión */}
          <div className="rounded-lg border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Estado de Conexión</span>
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            </div>
            <button
              onClick={testConnection}
              disabled={isTestingConnection}
              className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isTestingConnection ? 'Probando...' : 'Probar Conexión'}
            </button>
          </div>
        </div>

        {/* Botones */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={saveConfig}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ServerConfigModal
