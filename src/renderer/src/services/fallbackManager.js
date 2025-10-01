/**
 * Sistema de fallback para manejar errores de API y conectividad
 * Proporciona estrategias cuando las APIs fallan o están lentas
 */

import { cacheService } from '../services/cacheService.js'
import { performanceMonitor } from '../services/performanceMonitor.js'

export class FallbackManager {
    constructor() {
        this.isOfflineMode = false
        this.lastKnownNetworkStatus = navigator.onLine
        this.fallbackData = new Map()

        // Monitorear conectividad
        this.setupNetworkMonitoring()
    }

    /**
     * Configura monitoreo de red
     */
    setupNetworkMonitoring() {
        if (typeof window === 'undefined') return

        window.addEventListener('online', () => {
            console.log('🌐 Network: ONLINE')
            this.lastKnownNetworkStatus = true
            this.isOfflineMode = false
        })

        window.addEventListener('offline', () => {
            console.warn('📵 Network: OFFLINE - Activating fallback mode')
            this.lastKnownNetworkStatus = false
            this.isOfflineMode = true
        })
    }

    /**
     * Registra datos de fallback para un endpoint
     */
    registerFallback(endpoint, fallbackData) {
        this.fallbackData.set(endpoint, {
            data: fallbackData,
            timestamp: Date.now()
        })
    }

    /**
     * Estrategia principal: Intenta API, luego caché, luego fallback
     */
    async withFallback(apiCall, cacheKey, fallbackOptions = {}) {
        const {
            endpoint = 'unknown',
            fallbackData = null,
            maxCacheAge = 30 * 60 * 1000, // 30 minutos
            enableOfflineMode = true
        } = fallbackOptions

        try {
            // 1. Intentar llamada normal a la API
            const result = await apiCall()

            // Guardar resultado exitoso en caché extendido para futuras emergencias
            if (cacheKey) {
                cacheService.set(cacheKey, result, maxCacheAge)
                cacheService.set(`${cacheKey}_emergency`, result, 24 * 60 * 60 * 1000) // 24h
            }

            return result

        } catch (error) {
            console.warn(`⚠️ API call failed for ${endpoint}:`, error.message)

            // 2. Intentar obtener de caché reciente
            if (cacheKey) {
                const cachedData = cacheService.get(cacheKey)
                if (cachedData) {
                    console.log(`📦 Using cached data for ${endpoint}`)
                    return cachedData
                }

                // 3. Intentar caché de emergencia (más antiguo)
                const emergencyCache = cacheService.get(`${cacheKey}_emergency`)
                if (emergencyCache) {
                    console.log(`🚨 Using emergency cache for ${endpoint}`)
                    return emergencyCache
                }
            }

            // 4. Usar datos de fallback estáticos si están disponibles
            const fallback = this.fallbackData.get(endpoint)
            if (fallback) {
                console.log(`🔄 Using fallback data for ${endpoint}`)
                return fallback.data
            }

            // 5. Usar fallback por defecto si se proporciona
            if (fallbackData !== null) {
                console.log(`📋 Using default fallback for ${endpoint}`)
                return fallbackData
            }

            // 6. Si estamos offline, mostrar mensaje apropiado
            if (!navigator.onLine && enableOfflineMode) {
                throw new OfflineError(`No se pudo conectar a ${endpoint}. Verifica tu conexión a internet.`)
            }

            // Si nada funciona, re-lanzar el error original
            throw error
        }
    }

    /**
     * Fallback específico para autenticación
     */
    async authFallback(authCall, username) {
        try {
            return await authCall()
        } catch (error) {
            // Para auth, no podemos usar caché por seguridad
            // Pero podemos dar feedback específico
            if (error.code === 'ECONNABORTED' || !navigator.onLine) {
                throw new AuthenticationError(
                    'No se pudo conectar al servidor de autenticación. ' +
                    'Verifica tu conexión a internet e intenta nuevamente.'
                )
            }
            throw error
        }
    }

    /**
     * Fallback para listas críticas (empleados, productos, etc.)
     */
    async listFallback(listCall, listType, fallbackItems = []) {
        return this.withFallback(
            listCall,
            `${listType}_list`,
            {
                endpoint: listType,
                fallbackData: { status: 'success', data: fallbackItems },
                maxCacheAge: 60 * 60 * 1000 // 1 hora para listas
            }
        )
    }

    /**
     * Prepara datos de fallback para casos comunes
     */
    prepareCommonFallbacks() {
        // Datos básicos para cuando todo falle
        this.registerFallback('employees', {
            status: 'success',
            data: [],
            message: 'Lista de empleados no disponible sin conexión'
        })

        this.registerFallback('storages', {
            status: 'success',
            data: [
                { id: 1, name: 'Sucursal Principal', description: 'Sucursal principal' }
            ],
            message: 'Datos básicos de sucursales'
        })

        this.registerFallback('products', {
            status: 'success',
            data: [],
            message: 'Productos no disponibles sin conexión'
        })
    }

    /**
     * Verifica la salud de la conexión con un ping rápido
     */
    async checkConnectivity() {
        try {
            const response = await fetch(`${window.API_BASE_URL}/api/health`, {
                method: 'GET',
                timeout: 3000,
                cache: 'no-cache'
            })
            return response.ok
        } catch {
            return false
        }
    }

    /**
     * Modo de degradación progresiva
     */
    async degradedOperation(normalOperation, degradedOperation) {
        try {
            return await normalOperation()
        } catch (error) {
            console.warn('🔻 Switching to degraded operation mode')
            return await degradedOperation()
        }
    }
}

// Errores específicos para fallbacks
export class OfflineError extends Error {
    constructor(message) {
        super(message)
        this.name = 'OfflineError'
        this.isOffline = true
    }
}

export class AuthenticationError extends Error {
    constructor(message) {
        super(message)
        this.name = 'AuthenticationError'
        this.isAuthError = true
    }
}

// Instancia global del manager de fallback
export const fallbackManager = new FallbackManager()

// Preparar fallbacks comunes al inicializar
fallbackManager.prepareCommonFallbacks()

export default fallbackManager