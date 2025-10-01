/**
 * Servicio de monitoreo de performance para identificar cuellos de botella
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = new Map()
        this.observers = []
        this.isEnabled = true
    }

    /**
     * Inicia el monitoreo de una operación
     */
    startMeasure(name, context = {}) {
        if (!this.isEnabled) return null

        const measureId = `${name}_${Date.now()}_${Math.random()}`

        this.metrics.set(measureId, {
            name,
            startTime: performance.now(),
            context,
            endTime: null,
            duration: null
        })

        return measureId
    }

    /**
     * Finaliza el monitoreo de una operación
     */
    endMeasure(measureId) {
        if (!this.isEnabled || !measureId) return null

        const metric = this.metrics.get(measureId)
        if (!metric) return null

        metric.endTime = performance.now()
        metric.duration = metric.endTime - metric.startTime

        // Log automático para operaciones lentas
        if (metric.duration > 3000) { // Más de 3 segundos
            console.warn(`⚠️ SLOW OPERATION: ${metric.name} took ${metric.duration.toFixed(2)}ms`, metric.context)
        }

        // Notificar a observadores
        this.notifyObservers(metric)

        return metric
    }

    /**
     * Wrapper para medir funciones async automáticamente
     */
    async measureAsync(name, asyncFunction, context = {}) {
        const measureId = this.startMeasure(name, context)

        try {
            const result = await asyncFunction()
            this.endMeasure(measureId)
            return result
        } catch (error) {
            const metric = this.metrics.get(measureId)
            if (metric) {
                metric.error = error.message
                metric.endTime = performance.now()
                metric.duration = metric.endTime - metric.startTime
            }
            this.endMeasure(measureId)
            throw error
        }
    }

    /**
     * Obtiene métricas de performance
     */
    getMetrics(filterBy = {}) {
        const allMetrics = Array.from(this.metrics.values())
            .filter(m => m.endTime !== null) // Solo métricas completadas
            .sort((a, b) => b.startTime - a.startTime)

        if (Object.keys(filterBy).length === 0) {
            return allMetrics
        }

        return allMetrics.filter(metric => {
            return Object.entries(filterBy).every(([key, value]) => {
                if (key === 'name') return metric.name.includes(value)
                if (key === 'minDuration') return metric.duration >= value
                if (key === 'maxDuration') return metric.duration <= value
                return metric.context[key] === value
            })
        })
    }

    /**
     * Obtiene estadísticas de rendimiento por operación
     */
    getStats() {
        const metrics = this.getMetrics()
        const byOperation = new Map()

        metrics.forEach(metric => {
            if (!byOperation.has(metric.name)) {
                byOperation.set(metric.name, [])
            }
            byOperation.get(metric.name).push(metric.duration)
        })

        const stats = {}
        byOperation.forEach((durations, name) => {
            const sorted = durations.sort((a, b) => a - b)
            stats[name] = {
                count: durations.length,
                avg: durations.reduce((a, b) => a + b, 0) / durations.length,
                min: Math.min(...durations),
                max: Math.max(...durations),
                p50: sorted[Math.floor(sorted.length * 0.5)],
                p90: sorted[Math.floor(sorted.length * 0.9)],
                p99: sorted[Math.floor(sorted.length * 0.99)]
            }
        })

        return stats
    }

    /**
     * Genera reporte de performance
     */
    generateReport() {
        const stats = this.getStats()
        const slowOperations = this.getMetrics({ minDuration: 2000 })

        console.group('📊 PERFORMANCE REPORT')

        console.log('🔥 Top Slow Operations:')
        Object.entries(stats)
            .sort((a, b) => b[1].avg - a[1].avg)
            .slice(0, 10)
            .forEach(([name, stat]) => {
                console.log(`   ${name}: avg ${stat.avg.toFixed(2)}ms (p90: ${stat.p90?.toFixed(2)}ms, count: ${stat.count})`)
            })

        if (slowOperations.length > 0) {
            console.log('\n⚠️ Recent Slow Operations (>2s):')
            slowOperations.slice(0, 5).forEach(metric => {
                console.log(`   ${metric.name}: ${metric.duration.toFixed(2)}ms`, metric.context)
            })
        }

        console.groupEnd()

        return { stats, slowOperations }
    }

    /**
     * Agrega un observador para métricas
     */
    addObserver(callback) {
        this.observers.push(callback)
    }

    /**
     * Notifica a todos los observadores
     */
    notifyObservers(metric) {
        this.observers.forEach(callback => {
            try {
                callback(metric)
            } catch (error) {
                console.error('Error in performance observer:', error)
            }
        })
    }

    /**
     * Limpia métricas antiguas
     */
    cleanup(maxAge = 5 * 60 * 1000) { // 5 minutos
        const cutoff = Date.now() - maxAge

        for (const [id, metric] of this.metrics) {
            if (metric.startTime < cutoff) {
                this.metrics.delete(id)
            }
        }
    }

    /**
     * Habilita/deshabilita el monitoreo
     */
    setEnabled(enabled) {
        this.isEnabled = enabled
    }

    /**
     * Monitorea Core Web Vitals automáticamente
     */
    observeWebVitals() {
        if (typeof window === 'undefined') return

        // Largest Contentful Paint (LCP)
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries()
            const lastEntry = entries[entries.length - 1]

            console.log(`📏 LCP: ${lastEntry.renderTime || lastEntry.loadTime}ms`)

            if ((lastEntry.renderTime || lastEntry.loadTime) > 4000) {
                console.warn('⚠️ Poor LCP detected (>4s)')
            }
        }).observe({ entryTypes: ['largest-contentful-paint'] })

        // First Input Delay (FID)
        new PerformanceObserver((entryList) => {
            entryList.getEntries().forEach(entry => {
                console.log(`⚡ FID: ${entry.processingStart - entry.startTime}ms`)

                if (entry.processingStart - entry.startTime > 100) {
                    console.warn('⚠️ Poor FID detected (>100ms)')
                }
            })
        }).observe({ entryTypes: ['first-input'] })

        // Cumulative Layout Shift (CLS)
        new PerformanceObserver((entryList) => {
            let clsValue = 0
            entryList.getEntries().forEach(entry => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value
                }
            })

            if (clsValue > 0.1) {
                console.warn(`⚠️ Poor CLS detected: ${clsValue}`)
            }
        }).observe({ entryTypes: ['layout-shift'] })
    }
}

// Instancia global del monitor
export const performanceMonitor = new PerformanceMonitor()

// Auto-cleanup cada 5 minutos
setInterval(() => {
    performanceMonitor.cleanup()
}, 5 * 60 * 1000)

// Observar Web Vitals si estamos en el browser
if (typeof window !== 'undefined') {
    performanceMonitor.observeWebVitals()
}

export default performanceMonitor