/**
 * Sistema de reintentos inteligente para llamadas API
 * Maneja timeouts, errores de red y problemas de conectividad
 */

// Configuración de reintentos por tipo de operación
export const RETRY_CONFIG = {
    // Operaciones críticas (autenticación, login)
    CRITICAL: {
        retries: 3,
        retryDelay: (retryCount) => Math.min(1000 * Math.pow(2, retryCount), 5000), // Exponential backoff: 1s, 2s, 4s
        retryCondition: (error) => {
            // Reintentar en timeouts, errores de red, y errores 5xx del servidor
            return (
                error.code === 'ECONNABORTED' || // Timeout
                error.code === 'ENOTFOUND' ||    // DNS issues
                error.code === 'ECONNREFUSED' || // Connection refused
                error.code === 'ENETUNREACH' ||  // Network unreachable
                (error.response && error.response.status >= 500) // Server errors
            )
        },
        shouldResetTimeout: true // Reset timeout for each retry
    },

    // Operaciones normales (datos, consultas)
    NORMAL: {
        retries: 2,
        retryDelay: (retryCount) => Math.min(500 * Math.pow(2, retryCount), 3000), // 500ms, 1s, 2s
        retryCondition: (error) => {
            return (
                error.code === 'ECONNABORTED' ||
                error.code === 'ENOTFOUND' ||
                error.code === 'ECONNREFUSED' ||
                (error.response && error.response.status >= 500)
            )
        },
        shouldResetTimeout: true
    },

    // Operaciones no críticas (métricas, logs)
    LOW_PRIORITY: {
        retries: 1,
        retryDelay: () => 1000,
        retryCondition: (error) => {
            return error.code === 'ECONNABORTED' || (error.response && error.response.status >= 500)
        },
        shouldResetTimeout: false
    }
}

/**
 * Aplica configuración de reintentos a una instancia de axios
 */
export function configureRetries(axiosInstance, retryConfig = RETRY_CONFIG.NORMAL) {
    // Implementación manual de reintentos (más control que axios-retry)
    axiosInstance.interceptors.response.use(
        (response) => response,
        async (error) => {
            const config = error.config

            // Si ya no quedan reintentos o no es retryable, fallar
            if (!config || config.__retryCount >= retryConfig.retries || !retryConfig.retryCondition(error)) {
                return Promise.reject(error)
            }

            // Incrementar contador de reintentos
            config.__retryCount = config.__retryCount || 0
            config.__retryCount += 1

            // Calcular delay para el siguiente intento
            const delay = retryConfig.retryDelay(config.__retryCount)

            console.warn(`🔄 Retry ${config.__retryCount}/${retryConfig.retries} for ${config.method?.toUpperCase()} ${config.url} in ${delay}ms (${error.code || error.message})`)

            // Esperar antes del siguiente intento
            await new Promise(resolve => setTimeout(resolve, delay))

            // Opcional: resetear timeout para el reintento
            if (retryConfig.shouldResetTimeout && error.code === 'ECONNABORTED') {
                config.timeout = config.timeout || 10000 // Mantener timeout original
            }

            // Reintentar la request
            return axiosInstance.request(config)
        }
    )
}

/**
 * Crea un wrapper que aplica diferentes configs de retry según el endpoint
 */
export function createRetryWrapper(axiosInstance) {
    return {
        // Para operaciones críticas como autenticación
        critical: (config) => {
            const criticalConfig = { ...config, __retryType: 'CRITICAL' }
            return axiosInstance.request(criticalConfig)
        },

        // Para operaciones normales
        normal: (config) => {
            const normalConfig = { ...config, __retryType: 'NORMAL' }
            return axiosInstance.request(normalConfig)
        },

        // Para operaciones de baja prioridad
        lowPriority: (config) => {
            const lowPriorityConfig = { ...config, __retryType: 'LOW_PRIORITY' }
            return axiosInstance.request(lowPriorityConfig)
        }
    }
}

/**
 * Detecta si un error es recuperable (temporal) o permanente
 */
export function isRecoverableError(error) {
    // Errores temporales (de red, timeouts, server issues)
    const recoverableCodes = [
        'ECONNABORTED',  // Timeout
        'ENOTFOUND',     // DNS temporarily unavailable
        'ECONNREFUSED',  // Connection refused (server might be restarting)
        'ENETUNREACH',   // Network temporarily unreachable
        'ETIMEDOUT'      // Connection timeout
    ]

    // Errores HTTP temporales
    const recoverableStatus = [500, 502, 503, 504, 429] // Server errors, rate limiting

    return (
        recoverableCodes.includes(error.code) ||
        (error.response && recoverableStatus.includes(error.response.status))
    )
}

/**
 * Calcula un delay con jitter para evitar thundering herd
 */
export function calculateDelayWithJitter(baseDelay, jitterPercent = 0.1) {
    const jitter = baseDelay * jitterPercent * Math.random()
    return Math.floor(baseDelay + jitter)
}

export default {
    RETRY_CONFIG,
    configureRetries,
    createRetryWrapper,
    isRecoverableError,
    calculateDelayWithJitter
}