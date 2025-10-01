/**
 * Sistema de monitoreo de salud de la API
 * Detecta problemas de conectividad y ajusta el comportamiento automáticamente
 */

import { fastClient, API_BASE_URL } from '../config/apiConfig.js'

export class ApiHealthMonitor {
    constructor() {
        this.isHealthy = true
        this.lastHealthCheck = null
        this.healthHistory = []
        this.consecutiveFailures = 0
        this.maxConsecutiveFailures = 3

        // Configuración
        this.checkInterval = 60000 // 1 minuto
        this.fastCheckInterval = 10000 // 10 segundos cuando hay problemas
        this.healthTimeout = 3000 // 3 segundos timeout para health checks

        // Listeners para cambios de estado
        this.listeners = []

        // Estado de la red
        this.networkStatus = {
            isOnline: navigator.onLine,
            lastOnlineCheck: Date.now(),
            rtt: null // Round trip time
        }

        this.startMonitoring()
    }

    /**
     * Inicia el monitoreo automático
     */
    startMonitoring() {
        // Primer check inmediato
        this.checkHealth()

        // Monitoreo periódico
        this.scheduleNextCheck()

        // Monitorear cambios de conectividad del navegador
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                console.log('🌐 Browser: Network ONLINE')
                this.networkStatus.isOnline = true
                this.networkStatus.lastOnlineCheck = Date.now()
                this.checkHealth() // Check inmediato cuando vuelve la conexión
            })

            window.addEventListener('offline', () => {
                console.warn('📵 Browser: Network OFFLINE')
                this.networkStatus.isOnline = false
                this.updateHealthStatus(false, 'Browser offline')
            })
        }
    }

    /**
     * Realiza un health check de la API
     */
    async checkHealth() {
        const startTime = performance.now()

        try {
            console.log('🔍 Checking API health...')

            // Intentar endpoint de health o fallback a endpoint simple
            const response = await fastClient.get('/api/health', {
                timeout: this.healthTimeout
            }).catch(async () => {
                // Fallback: intentar endpoint básico
                return await fastClient.get('/api/users/health-check', {
                    timeout: this.healthTimeout
                })
            })

            const endTime = performance.now()
            const rtt = endTime - startTime

            this.networkStatus.rtt = rtt

            if (response.status >= 200 && response.status < 300) {
                this.updateHealthStatus(true, `API healthy (${rtt.toFixed(0)}ms)`)
                console.log(`✅ API Health: OK (${rtt.toFixed(0)}ms)`)
            } else {
                this.updateHealthStatus(false, `API returned ${response.status}`)
                console.warn(`⚠️ API Health: Warning - Status ${response.status}`)
            }

        } catch (error) {
            const endTime = performance.now()
            const rtt = endTime - startTime

            this.updateHealthStatus(false, `API unreachable: ${error.message}`)
            console.error(`❌ API Health: FAILED (${rtt.toFixed(0)}ms) - ${error.message}`)
        }

        // Programar siguiente check
        this.scheduleNextCheck()
    }

    /**
     * Actualiza el estado de salud
     */
    updateHealthStatus(isHealthy, reason) {
        const previousHealth = this.isHealthy
        this.isHealthy = isHealthy
        this.lastHealthCheck = Date.now()

        // Actualizar contador de fallos consecutivos
        if (isHealthy) {
            this.consecutiveFailures = 0
        } else {
            this.consecutiveFailures++
        }

        // Guardar en historial
        this.healthHistory.push({
            timestamp: Date.now(),
            isHealthy,
            reason,
            rtt: this.networkStatus.rtt
        })

        // Mantener solo últimos 100 registros
        if (this.healthHistory.length > 100) {
            this.healthHistory = this.healthHistory.slice(-100)
        }

        // Notificar cambio de estado
        if (previousHealth !== isHealthy) {
            console.log(`🔄 API Health changed: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`)
            this.notifyListeners(isHealthy, reason)
        }
    }

    /**
     * Programa el siguiente health check
     */
    scheduleNextCheck() {
        const interval = this.isHealthy ? this.checkInterval : this.fastCheckInterval

        setTimeout(() => {
            this.checkHealth()
        }, interval)
    }

    /**
     * Obtiene el estado actual de salud
     */
    getHealthStatus() {
        return {
            isHealthy: this.isHealthy,
            lastCheck: this.lastHealthCheck,
            consecutiveFailures: this.consecutiveFailures,
            rtt: this.networkStatus.rtt,
            networkOnline: this.networkStatus.isOnline
        }
    }

    /**
     * Obtiene estadísticas de salud
     */
    getHealthStats() {
        if (this.healthHistory.length === 0) return null

        const recent = this.healthHistory.slice(-20) // Últimos 20 checks
        const healthyCount = recent.filter(h => h.isHealthy).length
        const avgRtt = recent
            .filter(h => h.rtt !== null)
            .reduce((sum, h, _, arr) => sum + h.rtt / arr.length, 0)

        return {
            uptime: (healthyCount / recent.length) * 100,
            averageRtt: avgRtt,
            totalChecks: this.healthHistory.length,
            recentFailures: recent.filter(h => !h.isHealthy).length
        }
    }

    /**
     * Agrega un listener para cambios de estado
     */
    onHealthChange(callback) {
        this.listeners.push(callback)
    }

    /**
     * Notifica a todos los listeners
     */
    notifyListeners(isHealthy, reason) {
        this.listeners.forEach(listener => {
            try {
                listener(isHealthy, reason, this.getHealthStatus())
            } catch (error) {
                console.error('Error in health change listener:', error)
            }
        })
    }

    /**
     * Verifica si la API está en estado crítico
     */
    isCriticalState() {
        return this.consecutiveFailures >= this.maxConsecutiveFailures
    }

    /**
     * Fuerza un health check inmediato
     */
    async forceHealthCheck() {
        await this.checkHealth()
        return this.getHealthStatus()
    }
}

// Instancia global del monitor
export const apiHealthMonitor = new ApiHealthMonitor()

// Hacer disponible globalmente para debugging
if (typeof window !== 'undefined') {
    window.apiHealthMonitor = apiHealthMonitor

    console.log('🩺 API Health Monitor available! Try:')
    console.log('  window.apiHealthMonitor.getHealthStatus()')
    console.log('  window.apiHealthMonitor.getHealthStats()')
    console.log('  window.apiHealthMonitor.forceHealthCheck()')
}

export default apiHealthMonitor