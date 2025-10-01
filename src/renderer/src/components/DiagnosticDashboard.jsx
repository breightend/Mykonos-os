import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff, Activity, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

/**
 * Dashboard de diagnóstico para monitorear performance y conectividad en tiempo real
 */
export const DiagnosticDashboard = ({ isVisible, onClose }) => {
  const [healthStatus, setHealthStatus] = useState(null)
  const [healthStats, setHealthStats] = useState(null)
  const [performanceStats, setPerformanceStats] = useState(null)
  const [recentErrors, setRecentErrors] = useState([])

  useEffect(() => {
    if (!isVisible) return

    const updateData = () => {
      // Actualizar estado de salud de la API
      if (window.apiHealthMonitor) {
        setHealthStatus(window.apiHealthMonitor.getHealthStatus())
        setHealthStats(window.apiHealthMonitor.getHealthStats())
      }

      // Actualizar estadísticas de performance
      if (window.performanceDebug) {
        setPerformanceStats(window.performanceDebug.getOperationStats())

        // Obtener errores recientes
        const slowOps = window.performanceDebug.getSlowOperations(3000)
        setRecentErrors(slowOps.slice(0, 5))
      }
    }

    // Actualizar inmediatamente
    updateData()

    // Actualizar cada 5 segundos
    const interval = setInterval(updateData, 5000)

    return () => clearInterval(interval)
  }, [isVisible])

  if (!isVisible) return null

  const getHealthColor = (isHealthy) => (isHealthy ? 'text-green-500' : 'text-red-500')
  const getHealthIcon = (isHealthy) => (isHealthy ? CheckCircle : XCircle)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="max-h-[80vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">🩺 Diagnóstico del Sistema</h2>
          <button onClick={onClose} className="text-xl font-bold text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Estado de Conectividad */}
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="mb-3 flex items-center">
              {healthStatus?.networkOnline ? (
                <Wifi className="mr-2 h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="mr-2 h-5 w-5 text-red-500" />
              )}
              <h3 className="font-semibold">Conectividad</h3>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Estado de Red:</span>
                <span className={healthStatus?.networkOnline ? 'text-green-600' : 'text-red-600'}>
                  {healthStatus?.networkOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              <div className="flex justify-between">
                <span>API Server:</span>
                <div className="flex items-center">
                  {healthStatus &&
                    React.createElement(getHealthIcon(healthStatus.isHealthy), {
                      className: `h-4 w-4 ${getHealthColor(healthStatus.isHealthy)} mr-1`
                    })}
                  <span className={getHealthColor(healthStatus?.isHealthy)}>
                    {healthStatus?.isHealthy ? 'Healthy' : 'Unhealthy'}
                  </span>
                </div>
              </div>

              {healthStatus?.rtt && (
                <div className="flex justify-between">
                  <span>Latencia:</span>
                  <span className={healthStatus.rtt > 1000 ? 'text-red-600' : 'text-green-600'}>
                    {Math.round(healthStatus.rtt)}ms
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Fallos Consecutivos:</span>
                <span
                  className={
                    healthStatus?.consecutiveFailures > 2 ? 'text-red-600' : 'text-gray-600'
                  }
                >
                  {healthStatus?.consecutiveFailures || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Estadísticas de Performance */}
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="mb-3 flex items-center">
              <Activity className="mr-2 h-5 w-5 text-blue-500" />
              <h3 className="font-semibold">Performance</h3>
            </div>

            {healthStats && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Uptime:</span>
                  <span className={healthStats.uptime > 90 ? 'text-green-600' : 'text-red-600'}>
                    {healthStats.uptime.toFixed(1)}%
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>RTT Promedio:</span>
                  <span
                    className={healthStats.averageRtt > 2000 ? 'text-red-600' : 'text-green-600'}
                  >
                    {Math.round(healthStats.averageRtt)}ms
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Checks Totales:</span>
                  <span className="text-gray-600">{healthStats.totalChecks}</span>
                </div>

                <div className="flex justify-between">
                  <span>Fallos Recientes:</span>
                  <span
                    className={healthStats.recentFailures > 3 ? 'text-red-600' : 'text-gray-600'}
                  >
                    {healthStats.recentFailures}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Operaciones Más Lentas */}
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="mb-3 flex items-center">
              <Clock className="mr-2 h-5 w-5 text-orange-500" />
              <h3 className="font-semibold">Operaciones Lentas</h3>
            </div>

            {performanceStats && (
              <div className="space-y-2 text-sm">
                {Object.entries(performanceStats)
                  .sort((a, b) => b[1].avg - a[1].avg)
                  .slice(0, 4)
                  .map(([operation, stats]) => (
                    <div key={operation} className="flex justify-between">
                      <span className="truncate">{operation.substring(0, 15)}...</span>
                      <span className={stats.avg > 3000 ? 'text-red-600' : 'text-orange-600'}>
                        {Math.round(stats.avg)}ms
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Errores y Advertencias Recientes */}
        {recentErrors.length > 0 && (
          <div className="mt-6">
            <div className="mb-3 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
              <h3 className="font-semibold">Operaciones Problemáticas Recientes</h3>
            </div>

            <div className="rounded-lg bg-red-50 p-4">
              <div className="space-y-2">
                {recentErrors.map((error, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{error.name}</span>
                      {error.context.url && (
                        <span className="ml-2 text-gray-600">
                          {error.context.method} {error.context.url}
                        </span>
                      )}
                    </div>
                    <div className="font-medium text-red-600">{Math.round(error.duration)}ms</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Acciones Rápidas */}
        <div className="mt-6 flex space-x-4">
          <button
            onClick={() => window.apiHealthMonitor?.forceHealthCheck()}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Verificar Conectividad
          </button>

          <button
            onClick={() => window.performanceDebug?.generateReport()}
            className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
          >
            Generar Reporte
          </button>

          <button
            onClick={() => {
              const data = {
                health: healthStatus,
                stats: healthStats,
                performance: performanceStats,
                errors: recentErrors,
                timestamp: new Date().toISOString()
              }
              console.log('📊 Diagnostic Data:', data)

              // Opcional: copiar al clipboard
              navigator.clipboard
                ?.writeText(JSON.stringify(data, null, 2))
                .then(() => alert('Datos copiados al clipboard'))
                .catch(() => console.log('No se pudo copiar al clipboard'))
            }}
            className="rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600"
          >
            Exportar Datos
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook para usar el diagnóstico fácilmente
export const useDiagnostic = () => {
  const [isVisible, setIsVisible] = useState(false)

  const showDiagnostic = () => setIsVisible(true)
  const hideDiagnostic = () => setIsVisible(false)

  return {
    DiagnosticDashboard: (props) => (
      <DiagnosticDashboard {...props} isVisible={isVisible} onClose={hideDiagnostic} />
    ),
    showDiagnostic,
    hideDiagnostic,
    isVisible
  }
}

export default DiagnosticDashboard
