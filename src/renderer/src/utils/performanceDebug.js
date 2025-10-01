import { performanceMonitor } from '../services/performanceMonitor.js'

/**
 * Utilidades de debugging para performance
 */
export const performanceDebug = {
    /**
     * Genera reporte completo de performance
     */
    generateReport() {
        return performanceMonitor.generateReport()
    },

    /**
     * Obtiene métricas de operaciones lentas
     */
    getSlowOperations(minDuration = 2000) {
        return performanceMonitor.getMetrics({ minDuration })
    },

    /**
     * Obtiene estadísticas por tipo de operación
     */
    getOperationStats() {
        return performanceMonitor.getStats()
    },

    /**
     * Obtiene métricas de API calls
     */
    getApiMetrics() {
        return performanceMonitor.getMetrics()
            .filter(m => m.name === 'api_request')
            .sort((a, b) => b.duration - a.duration)
    },

    /**
     * Identifica los endpoints más lentos
     */
    getSlowestEndpoints(limit = 10) {
        const apiMetrics = this.getApiMetrics()
        const byEndpoint = new Map()

        apiMetrics.forEach(metric => {
            const endpoint = metric.context.url || 'unknown'
            if (!byEndpoint.has(endpoint)) {
                byEndpoint.set(endpoint, [])
            }
            byEndpoint.get(endpoint).push(metric.duration)
        })

        const endpointStats = []
        byEndpoint.forEach((durations, endpoint) => {
            const avg = durations.reduce((a, b) => a + b, 0) / durations.length
            endpointStats.push({
                endpoint,
                avgDuration: avg,
                maxDuration: Math.max(...durations),
                minDuration: Math.min(...durations),
                callCount: durations.length
            })
        })

        return endpointStats
            .sort((a, b) => b.avgDuration - a.avgDuration)
            .slice(0, limit)
    },

    /**
     * Analiza patrones de uso
     */
    analyzeUsagePatterns() {
        const metrics = performanceMonitor.getMetrics()
        const hourlyDistribution = new Array(24).fill(0)
        const methodDistribution = new Map()

        metrics.forEach(metric => {
            if (metric.startTime) {
                const hour = new Date(metric.startTime).getHours()
                hourlyDistribution[hour]++
            }

            if (metric.context.method) {
                const method = metric.context.method
                methodDistribution.set(method, (methodDistribution.get(method) || 0) + 1)
            }
        })

        return {
            hourlyDistribution,
            methodDistribution: Object.fromEntries(methodDistribution),
            totalOperations: metrics.length
        }
    },

    /**
     * Recomienda optimizaciones
     */
    getOptimizationRecommendations() {
        const stats = this.getOperationStats()
        const slowEndpoints = this.getSlowestEndpoints(5)
        const recommendations = []

        // Analizar operaciones lentas
        Object.entries(stats).forEach(([operation, stat]) => {
            if (stat.avg > 3000) {
                recommendations.push({
                    type: 'slow_operation',
                    operation,
                    issue: `Average response time is ${stat.avg.toFixed(2)}ms`,
                    recommendation: 'Consider caching or backend optimization'
                })
            }

            if (stat.p90 > 5000) {
                recommendations.push({
                    type: 'high_p90',
                    operation,
                    issue: `90th percentile is ${stat.p90.toFixed(2)}ms`,
                    recommendation: 'Investigate backend bottlenecks'
                })
            }
        })

        // Analizar endpoints lentos
        slowEndpoints.forEach(endpoint => {
            if (endpoint.avgDuration > 4000) {
                recommendations.push({
                    type: 'slow_endpoint',
                    endpoint: endpoint.endpoint,
                    issue: `Average response time is ${endpoint.avgDuration.toFixed(2)}ms`,
                    recommendation: 'Consider implementing caching for this endpoint'
                })
            }
        })

        return recommendations
    },

    /**
     * Exporta datos de performance para análisis externo
     */
    exportData() {
        return {
            timestamp: new Date().toISOString(),
            metrics: performanceMonitor.getMetrics(),
            stats: this.getOperationStats(),
            slowEndpoints: this.getSlowestEndpoints(),
            usagePatterns: this.analyzeUsagePatterns(),
            recommendations: this.getOptimizationRecommendations()
        }
    },

    /**
     * Limpia métricas antiguas
     */
    cleanup(maxAge = 5 * 60 * 1000) {
        performanceMonitor.cleanup(maxAge)
    }
}

// Hacer disponible globalmente para debugging
if (typeof window !== 'undefined') {
    window.performanceDebug = performanceDebug

    // Comando de consola para generar reporte rápido
    console.log('🚀 Performance debugging available! Try:')
    console.log('  window.performanceDebug.generateReport()')
    console.log('  window.performanceDebug.getSlowestEndpoints()')
    console.log('  window.performanceDebug.getOptimizationRecommendations()')
}

export default performanceDebug