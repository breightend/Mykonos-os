import { apiClient, API_ENDPOINTS } from '../config/apiConfig.js'
import { cacheService } from './cacheService.js'
import { performanceMonitor } from './performanceMonitor.js'

/**
 * Servicio de precarga para datos compartidos/globales
 * Carga datos esenciales al inicio para mejorar performance
 */
class PreloadService {
    constructor() {
        this.isPreloading = false
        this.preloadComplete = false
        this.preloadData = {}
        this.preloadErrors = {}
        
        // Datos que se precargan al inicio (comunes a todas las sucursales)
        this.globalDataQueries = [
            {
                key: 'colors',
                endpoint: `${API_ENDPOINTS.INVENTORY}/colors`,
                cacheTTL: 24 * 60 * 60 * 1000, // 24 horas
                fallback: [
                    { id: 1, name: 'Negro', hex: '#000000' },
                    { id: 2, name: 'Blanco', hex: '#FFFFFF' },
                    { id: 3, name: 'Azul', hex: '#0066CC' },
                    { id: 4, name: 'Rojo', hex: '#CC0000' },
                    { id: 5, name: 'Verde', hex: '#00CC66' },
                    { id: 6, name: 'Amarillo', hex: '#CCCC00' }
                ]
            },
            {
                key: 'sizes',
                endpoint: `${API_ENDPOINTS.INVENTORY}/sizes`,
                cacheTTL: 24 * 60 * 60 * 1000,
                fallback: [
                    { id: 1, name: 'XS', order: 1 },
                    { id: 2, name: 'S', order: 2 },
                    { id: 3, name: 'M', order: 3 },
                    { id: 4, name: 'L', order: 4 },
                    { id: 5, name: 'XL', order: 5 },
                    { id: 6, name: 'XXL', order: 6 }
                ]
            },
            {
                key: 'categories',
                endpoint: `${API_ENDPOINTS.INVENTORY}/categories`,
                cacheTTL: 12 * 60 * 60 * 1000, // 12 horas
                fallback: [
                    { id: 1, name: 'Ropa', description: 'Artículos de vestir' },
                    { id: 2, name: 'Calzado', description: 'Zapatos y zapatillas' },
                    { id: 3, name: 'Accesorios', description: 'Complementos y accesorios' },
                    { id: 4, name: 'Deportivo', description: 'Artículos deportivos' }
                ]
            },
            {
                key: 'brands',
                endpoint: `${API_ENDPOINTS.INVENTORY}/brands`,
                cacheTTL: 12 * 60 * 60 * 1000,
                fallback: [
                    { id: 1, name: 'Nike', description: 'Marca deportiva' },
                    { id: 2, name: 'Adidas', description: 'Marca deportiva' },
                    { id: 3, name: 'Puma', description: 'Marca deportiva' },
                    { id: 4, name: 'Genérica', description: 'Sin marca específica' }
                ]
            },
            {
                key: 'payment_methods',
                endpoint: `${API_ENDPOINTS.SALES || API_ENDPOINTS.USER}/payment-methods`,
                cacheTTL: 6 * 60 * 60 * 1000, // 6 horas
                fallback: [
                    { id: 1, name: 'Efectivo', type: 'cash', active: true },
                    { id: 2, name: 'Tarjeta de Débito', type: 'debit', active: true },
                    { id: 3, name: 'Tarjeta de Crédito', type: 'credit', active: true },
                    { id: 4, name: 'Transferencia', type: 'transfer', active: true },
                    { id: 5, name: 'QR/Billetera Digital', type: 'digital', active: true }
                ]
            }
        ]
    }

    /**
     * Inicia la precarga de todos los datos globales
     */
    async preloadGlobalData() {
        if (this.isPreloading || this.preloadComplete) {
            console.log('🔄 Precarga ya en progreso o completada')
            return this.preloadData
        }

        this.isPreloading = true
        console.log('🚀 Iniciando precarga de datos globales...')
        
        const startTime = performance.now()
        const promises = []

        // Cargar todos los datos en paralelo
        for (const query of this.globalDataQueries) {
            promises.push(this.loadGlobalQuery(query))
        }

        try {
            const results = await Promise.allSettled(promises)
            
            // Procesar resultados
            results.forEach((result, index) => {
                const query = this.globalDataQueries[index]
                
                if (result.status === 'fulfilled') {
                    this.preloadData[query.key] = result.value
                    console.log(`✅ Precargado: ${query.key} (${result.value?.length || 0} elementos)`)
                } else {
                    this.preloadErrors[query.key] = result.reason
                    this.preloadData[query.key] = query.fallback
                    console.warn(`⚠️ Fallback usado para ${query.key}:`, result.reason.message)
                }
            })

            const totalTime = performance.now() - startTime
            console.log(`🎯 Precarga completada en ${totalTime.toFixed(2)}ms`)
            
            this.preloadComplete = true
            this.isPreloading = false
            
            // Guardar timestamp de última precarga
            localStorage.setItem('last_preload', Date.now().toString())
            
            return this.preloadData
            
        } catch (error) {
            console.error('❌ Error en precarga global:', error)
            this.isPreloading = false
            throw error
        }
    }

    /**
     * Carga una consulta específica con manejo de cache y fallback
     */
    async loadGlobalQuery(query) {
        const cacheKey = `global_${query.key}`
        
        try {
            // Intentar obtener de cache primero
            const cached = cacheService.get(cacheKey)
            if (cached) {
                console.log(`📦 Cache hit para ${query.key}`)
                return cached
            }

            // Si no hay cache, hacer petición
            console.log(`🌐 Cargando ${query.key} desde API...`)
            const response = await apiClient.get(query.endpoint, {
                timeout: 5000 // Timeout más corto para precarga
            })

            const data = response.data?.data || response.data || []
            
            // Cachear con TTL específico
            cacheService.set(cacheKey, data, query.cacheTTL)
            
            return data
            
        } catch (error) {
            console.warn(`⚠️ Error cargando ${query.key}, usando fallback:`, error.message)
            
            // Usar datos de fallback
            const fallbackData = query.fallback || []
            
            // Cachear fallback por tiempo menor
            cacheService.set(cacheKey, fallbackData, 60 * 60 * 1000) // 1 hora
            
            return fallbackData
        }
    }

    /**
     * Obtiene datos precargados específicos
     */
    getPreloadedData(key) {
        if (!this.preloadComplete) {
            console.warn(`⚠️ Datos de ${key} solicitados antes de completar precarga`)
            
            // Intentar obtener de cache como fallback
            const cached = cacheService.get(`global_${key}`)
            if (cached) return cached
            
            // Usar fallback de configuración
            const query = this.globalDataQueries.find(q => q.key === key)
            return query?.fallback || []
        }
        
        return this.preloadData[key] || []
    }

    /**
     * Verifica si los datos están precargados
     */
    isDataReady(key = null) {
        if (key) {
            return this.preloadComplete && this.preloadData[key] !== undefined
        }
        return this.preloadComplete
    }

    /**
     * Fuerza recarga de datos específicos
     */
    async reloadData(key) {
        const query = this.globalDataQueries.find(q => q.key === key)
        if (!query) {
            throw new Error(`Query no encontrada para key: ${key}`)
        }

        console.log(`🔄 Recargando datos de ${key}...`)
        
        // Limpiar cache
        cacheService.delete(`global_${key}`)
        
        // Recargar
        const data = await this.loadGlobalQuery(query)
        this.preloadData[key] = data
        
        return data
    }

    /**
     * Verifica si es necesaria una nueva precarga
     */
    shouldRefreshPreload() {
        const lastPreload = localStorage.getItem('last_preload')
        if (!lastPreload) return true
        
        const lastPreloadTime = parseInt(lastPreload)
        const now = Date.now()
        const hoursSincePreload = (now - lastPreloadTime) / (1000 * 60 * 60)
        
        // Refrescar si han pasado más de 4 horas
        return hoursSincePreload > 4
    }

    /**
     * Limpia todos los datos precargados
     */
    clearPreloadData() {
        this.preloadData = {}
        this.preloadErrors = {}
        this.preloadComplete = false
        
        // Limpiar caches
        for (const query of this.globalDataQueries) {
            cacheService.delete(`global_${query.key}`)
        }
        
        localStorage.removeItem('last_preload')
        console.log('🧹 Datos de precarga limpiados')
    }

    /**
     * Obtiene estadísticas de la precarga
     */
    getPreloadStats() {
        return {
            isComplete: this.preloadComplete,
            isLoading: this.isPreloading,
            dataKeys: Object.keys(this.preloadData),
            errorKeys: Object.keys(this.preloadErrors),
            totalQueries: this.globalDataQueries.length,
            successfulQueries: Object.keys(this.preloadData).length,
            lastPreload: localStorage.getItem('last_preload')
        }
    }
}

// Instancia singleton
export const preloadService = new PreloadService()
export default preloadService