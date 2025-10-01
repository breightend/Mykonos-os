/**
 * Servicio de caché para optimizar performance
 * Reduce llamadas repetidas a la API almacenando resultados temporalmente
 */

class CacheService {
    constructor() {
        this.cache = new Map()
        this.timeouts = new Map()
    }

    /**
     * Obtiene un valor del caché
     * @param {string} key - Clave del caché
     * @returns {any|null} - Valor cached o null si no existe/expiró
     */
    get(key) {
        const item = this.cache.get(key)
        if (!item) return null

        // Verificar si no ha expirado
        if (Date.now() > item.expiry) {
            this.cache.delete(key)
            return null
        }

        console.log(`🚀 Cache HIT: ${key}`)
        return item.data
    }

    /**
     * Almacena un valor en el caché
     * @param {string} key - Clave del caché
     * @param {any} data - Datos a almacenar
     * @param {number} ttl - Tiempo de vida en milisegundos (default: 5 min)
     */
    set(key, data, ttl = 5 * 60 * 1000) {
        const expiry = Date.now() + ttl
        this.cache.set(key, { data, expiry })
        console.log(`💾 Cache SET: ${key} (TTL: ${ttl}ms)`)

        // Limpiar automáticamente cuando expire
        const timeout = setTimeout(() => {
            this.cache.delete(key)
            this.timeouts.delete(key)
            console.log(`🗑️ Cache EXPIRED: ${key}`)
        }, ttl)

        // Cancelar timeout anterior si existe
        if (this.timeouts.has(key)) {
            clearTimeout(this.timeouts.get(key))
        }
        this.timeouts.set(key, timeout)
    }

    /**
     * Elimina un valor específico del caché
     * @param {string} key - Clave a eliminar
     */
    delete(key) {
        this.cache.delete(key)
        if (this.timeouts.has(key)) {
            clearTimeout(this.timeouts.get(key))
            this.timeouts.delete(key)
        }
        console.log(`🗑️ Cache DELETE: ${key}`)
    }

    /**
     * Limpia todo el caché
     */
    clear() {
        this.cache.clear()
        this.timeouts.forEach(timeout => clearTimeout(timeout))
        this.timeouts.clear()
        console.log('🧹 Cache CLEARED')
    }

    /**
     * Wrapper para funciones async con caché automático
     * @param {string} key - Clave del caché
     * @param {Function} fn - Función async a ejecutar si no hay caché
     * @param {number} ttl - Tiempo de vida en milisegundos
     * @param {Object} options - Opciones adicionales
     * @returns {Promise<any>} - Resultado de la función o caché
     */
    async cached(key, fn, ttl = 5 * 60 * 1000, options = {}) {
        const {
            enableStaleWhileRevalidate = false,
            maxStaleAge = 24 * 60 * 60 * 1000, // 24 horas
            returnStaleOnError = true
        } = options;

        // Intentar obtener del caché primero
        const cached = this.get(key)
        if (cached !== null) {
            console.log(`📦 Cache HIT: ${key}`)

            // Si está habilitado SWR, actualizar en background
            if (enableStaleWhileRevalidate) {
                this.backgroundRefresh(key, fn, ttl).catch(console.error)
            }

            return cached
        }

        console.log(`🔄 Cache MISS: ${key} - Executing function`)

        // Si no está en caché, ejecutar función
        try {
            const result = await fn()
            this.set(key, result, ttl)
            return result
        } catch (error) {
            console.error(`❌ Cache ERROR for ${key}:`, error)

            // Si falló el fetch, intentar usar cache expirado si está habilitado
            if (returnStaleOnError) {
                const staleData = this.getStale(key, maxStaleAge)
                if (staleData) {
                    console.warn(`⚠️ Using STALE cache for ${key} due to error: ${error.message}`)
                    return staleData
                }
            }

            // Para timeouts específicos, intentar con datos de emergencia más antiguos
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                console.warn(`⏱️ TIMEOUT detected for ${key}, checking emergency cache...`)
                const emergencyData = this.getStale(key, 7 * 24 * 60 * 60 * 1000) // 7 días
                if (emergencyData) {
                    console.warn(`🚨 Using EMERGENCY cache for ${key} (7+ days old)`)
                    return emergencyData
                }
            }

            throw error
        }
    }

    /**
     * Obtiene datos del cache incluso si están expirados (pero dentro del maxStaleAge)
     */
    getStale(key, maxStaleAge = 24 * 60 * 60 * 1000) {
        const item = this.cache.get(key)
        if (!item) return null

        const age = Date.now() - item.timestamp
        if (age > maxStaleAge) {
            return null // Demasiado viejo incluso para stale
        }

        return item.value
    }

    /**
     * Actualiza cache en background para SWR
     */
    async backgroundRefresh(key, fetcher, ttl) {
        try {
            const data = await fetcher()
            this.set(key, data, ttl)
            console.log(`🔄 Background refresh completed for ${key}`)
        } catch (error) {
            console.warn(`❌ Background refresh failed for ${key}:`, error.message)
        }
    }

    /**
     * Obtiene estadísticas del caché
     */
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        }
    }
}

// Instancia singleton del servicio de caché
export const cacheService = new CacheService()

// Configuraciones de TTL por tipo de datos
export const CACHE_TTL = {
    PRODUCTS: 10 * 60 * 1000,      // 10 minutos - productos cambian poco
    EMPLOYEES: 15 * 60 * 1000,     // 15 minutos - empleados cambian raramente  
    STORAGES: 30 * 60 * 1000,      // 30 minutos - sucursales casi nunca cambian
    COLORS_SIZES: 60 * 60 * 1000,  // 1 hora - colores/tallas muy estables
    PROVIDERS: 20 * 60 * 1000,     // 20 minutos - proveedores cambian poco
    CLIENTS: 10 * 60 * 1000,       // 10 minutos - clientes pueden cambiar más
    INVENTORY: 2 * 60 * 1000,      // 2 minutos - inventario cambia frecuentemente
    SALES: 1 * 60 * 1000,          // 1 minuto - ventas cambian constantemente
}

export default cacheService