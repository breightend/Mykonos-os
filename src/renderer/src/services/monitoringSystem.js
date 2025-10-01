/**
 * Inicializador central para todos los sistemas de monitoreo y optimización
 * Se ejecuta al iniciar la aplicación
 */

import { performanceMonitor } from './performanceMonitor.js'
import { apiHealthMonitor } from './apiHealthMonitor.js'
import { fallbackManager } from './fallbackManager.js'
import performanceDebug from '../utils/performanceDebug.js'

class MonitoringSystem {
    constructor() {
        this.isInitialized = false
        this.systems = []
    }

    /**
     * Inicializa todos los sistemas de monitoreo
     */
    async initialize() {
        if (this.isInitialized) return

        console.log('🚀 Initializing monitoring systems...')

        try {
            // 1. Inicializar performance monitor
            console.log('📊 Starting performance monitoring...')
            // Ya se inicializa automáticamente

            // 2. Inicializar API health monitor
            console.log('🩺 Starting API health monitoring...')
            // Ya se inicializa automáticamente

            // 3. Configurar fallback manager
            console.log('🔄 Configuring fallback strategies...')
            fallbackManager.prepareCommonFallbacks()

            // 4. Configurar listeners para eventos críticos
            this.setupCriticalEventListeners()

            // 5. Configurar reportes automáticos
            this.setupAutomaticReporting()

            // 6. Configurar debugging tools
            this.setupDebuggingTools()

            this.isInitialized = true
            console.log('✅ Monitoring systems initialized successfully')

            // Reporte inicial después de 10 segundos
            setTimeout(() => {
                this.generateInitialReport()
            }, 10000)

        } catch (error) {
            console.error('❌ Error initializing monitoring systems:', error)
        }
    }

    /**
     * Configura listeners para eventos críticos
     */
    setupCriticalEventListeners() {
        // Listener para cambios de salud de la API
        apiHealthMonitor.onHealthChange((isHealthy, reason, status) => {
            if (!isHealthy && status.consecutiveFailures >= 3) {
                console.error(`🚨 CRITICAL: API unhealthy for ${status.consecutiveFailures} consecutive checks`)

                // Opcional: Mostrar notificación al usuario
                this.notifyUser('critical', `Problemas de conectividad detectados: ${reason}`)
            }
        })

        // Listener para operaciones muy lentas
        performanceMonitor.addObserver((metric) => {
            if (metric.duration > 10000) { // Más de 10 segundos
                console.error(`🐌 EXTREMELY SLOW OPERATION: ${metric.name} took ${metric.duration}ms`)

                this.notifyUser('warning', `Operación muy lenta detectada: ${metric.name}`)
            }
        })
    }

    /**
     * Configura reportes automáticos
     */
    setupAutomaticReporting() {
        // Reporte cada 5 minutos
        setInterval(() => {
            this.generatePeriodicReport()
        }, 5 * 60 * 1000)

        // Cleanup automático cada 10 minutos
        setInterval(() => {
            performanceMonitor.cleanup()
            console.log('🧹 Performed automatic cleanup')
        }, 10 * 60 * 1000)
    }

    /**
     * Configura herramientas de debugging
     */
    setupDebuggingTools() {
        if (typeof window === 'undefined') return

        // Atajos de teclado para debugging
        window.addEventListener('keydown', (event) => {
            // Ctrl + Shift + D para dashboard de diagnóstico
            if (event.ctrlKey && event.shiftKey && event.key === 'D') {
                event.preventDefault()
                this.showDiagnosticDashboard()
            }

            // Ctrl + Shift + R para reporte de performance
            if (event.ctrlKey && event.shiftKey && event.key === 'R') {
                event.preventDefault()
                performanceDebug.generateReport()
            }
        })

        // Comandos de consola útiles
        window.debugCommands = {
            health: () => apiHealthMonitor.getHealthStatus(),
            performance: () => performanceDebug.generateReport(),
            slowOps: () => performanceDebug.getSlowOperations(),
            recommendations: () => performanceDebug.getOptimizationRecommendations(),
            forceHealthCheck: () => apiHealthMonitor.forceHealthCheck(),
            clearCache: () => {
                if (window.cacheService) {
                    window.cacheService.clear()
                    console.log('🗑️ Cache cleared')
                }
            }
        }

        console.log('🛠️ Debug commands available: window.debugCommands')
    }

    /**
     * Genera reporte inicial del sistema
     */
    generateInitialReport() {
        console.group('📊 INITIAL SYSTEM REPORT')

        const healthStatus = apiHealthMonitor.getHealthStatus()
        console.log('🩺 API Health:', healthStatus)

        const performanceStats = performanceDebug.getOperationStats()
        console.log('⚡ Performance Stats:', performanceStats)

        const recommendations = performanceDebug.getOptimizationRecommendations()
        if (recommendations.length > 0) {
            console.log('💡 Optimization Recommendations:', recommendations)
        }

        console.groupEnd()
    }

    /**
     * Genera reporte periódico
     */
    generatePeriodicReport() {
        const healthStats = apiHealthMonitor.getHealthStats()
        const performanceStats = performanceDebug.getOperationStats()

        // Solo reportar si hay datos significativos
        if (healthStats && healthStats.uptime < 90) {
            console.warn(`⚠️ LOW UPTIME: API uptime is ${healthStats.uptime.toFixed(1)}%`)
        }

        // Reportar operaciones consistentemente lentas
        const slowOperations = Object.entries(performanceStats)
            .filter(([_, stats]) => stats.avg > 5000 && stats.count > 3)

        if (slowOperations.length > 0) {
            console.warn('🐌 Consistently slow operations:', slowOperations)
        }
    }

    /**
     * Notifica al usuario sobre eventos importantes
     */
    notifyUser(type, message) {
        // Implementar según el sistema de notificaciones de la app
        console.log(`🔔 ${type.toUpperCase()}: ${message}`)

        // Opcional: Mostrar toast o modal
        if (typeof window !== 'undefined' && window.showNotification) {
            window.showNotification(type, message)
        }
    }

    /**
     * Muestra dashboard de diagnóstico
     */
    showDiagnosticDashboard() {
        if (typeof window !== 'undefined' && window.showDiagnosticDashboard) {
            window.showDiagnosticDashboard()
        } else {
            console.log('📊 Diagnostic dashboard not available. Use window.debugCommands instead.')
        }
    }

    /**
     * Obtiene estado general del sistema
     */
    getSystemStatus() {
        return {
            monitoring: {
                initialized: this.isInitialized,
                systems: this.systems.length
            },
            api: apiHealthMonitor.getHealthStatus(),
            performance: performanceDebug.getOperationStats(),
            recommendations: performanceDebug.getOptimizationRecommendations()
        }
    }
}

// Instancia global del sistema de monitoreo
export const monitoringSystem = new MonitoringSystem()

// Auto-inicializar cuando el DOM esté listo
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            monitoringSystem.initialize()
        })
    } else {
        // DOM ya está listo
        monitoringSystem.initialize()
    }
} else {
    // Entorno de Node.js (testing, etc.)
    monitoringSystem.initialize()
}

export default monitoringSystem