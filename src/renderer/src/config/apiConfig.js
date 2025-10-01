/**
 * Configuración central de API para la aplicación Electron
 * Aquí se define la URL base del servidor backend
 */

import axios from 'axios'
import { performanceMonitor } from '../services/performanceMonitor.js'
import { configureRetries, RETRY_CONFIG } from '../utils/retryLogic.js'

// Determinar la URL base según el entorno
const isProduction = process.env.NODE_ENV === 'production'
const isDevelopment = !isProduction

// URL del servidor backend
export const API_BASE_URL = isDevelopment
    ? 'http://190.3.63.58:8000'  // Puerto 8000 donde está corriendo el backend
    : 'http://190.3.63.58:8000'  // Puerto 8000 para producción también

// Timeouts específicos por tipo de operación
export const TIMEOUT_CONFIG = {
    FAST: 3000,      // 3s - Para operaciones que deben ser rápidas (health checks)
    NORMAL: 8000,    // 8s - Para la mayoría de operaciones
    SLOW: 15000,     // 15s - Para operaciones que pueden ser lentas (auth, reports)
    UPLOAD: 30000    // 30s - Para uploads/downloads
}

// Configuración optimizada de axios para mejor performance
export const axiosConfig = {
    timeout: TIMEOUT_CONFIG.NORMAL, // Default timeout
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
        // Note: 'Connection' header is removed as it's unsafe in browsers
    },
    // Configuraciones para mejor performance
    maxRedirects: 3,
    maxContentLength: 50 * 1024 * 1024, // 50MB max
    validateStatus: function (status) {
        return status >= 200 && status < 300
    }
}

// Crear instancia de axios optimizada
export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    ...axiosConfig
})

// Configurar reintentos automáticos
configureRetries(apiClient, RETRY_CONFIG.NORMAL)

// Crear clientes especializados con diferentes timeouts
export const authClient = axios.create({
    baseURL: API_BASE_URL,
    ...axiosConfig,
    timeout: TIMEOUT_CONFIG.SLOW // Auth puede ser lento
})
configureRetries(authClient, RETRY_CONFIG.CRITICAL)

export const fastClient = axios.create({
    baseURL: API_BASE_URL,
    ...axiosConfig,
    timeout: TIMEOUT_CONFIG.FAST // Para health checks
})
configureRetries(fastClient, RETRY_CONFIG.LOW_PRIORITY)

// Interceptor para logging y monitoreo de performance
apiClient.interceptors.request.use(
    (config) => {
        // Iniciar medición de performance
        const measureId = performanceMonitor.startMeasure('api_request', {
            method: config.method?.toUpperCase(),
            url: config.url,
            baseURL: config.baseURL
        })

        // Guardar el ID en la config para usarlo en la respuesta
        config.metadata = { measureId, startTime: Date.now() }

        console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`)
        return config
    },
    (error) => {
        console.error('🚫 Request Error:', error)
        return Promise.reject(error)
    }
)

apiClient.interceptors.response.use(
    (response) => {
        const { measureId, startTime } = response.config.metadata || {}
        const duration = Date.now() - startTime

        // Finalizar medición de performance
        if (measureId) {
            performanceMonitor.endMeasure(measureId)
        }

        // Log de respuesta con duración
        const statusColor = response.status < 300 ? '✅' : '⚠️'
        console.log(`${statusColor} API Response [${duration}ms]: ${response.status} ${response.config.url}`)

        // Warning para respuestas lentas
        if (duration > 5000) {
            console.warn(`🐌 SLOW API RESPONSE: ${response.config.url} took ${duration}ms`)
        }

        return response
    },
    (error) => {
        const { measureId, startTime } = error.config?.metadata || {}
        const duration = Date.now() - startTime

        // Finalizar medición incluso en error
        if (measureId) {
            const metric = performanceMonitor.metrics.get(measureId)
            if (metric) {
                metric.error = error.message
                metric.endTime = performance.now()
                metric.duration = metric.endTime - metric.startTime
            }
            performanceMonitor.endMeasure(measureId)
        }

        console.error(`❌ API Error [${duration}ms]: ${error.response?.status} ${error.config?.url}`, error.response?.data)
        return Promise.reject(error)
    }
)

// URLs específicas por servicio
export const API_ENDPOINTS = {
    AUTH: `${API_BASE_URL}/api/auth`,
    USER: `${API_BASE_URL}/api/user`,
    PROVIDER: `${API_BASE_URL}/api/provider`,
    CLIENT: `${API_BASE_URL}/api/client`,
    PRODUCT: `${API_BASE_URL}/api/product`,
    STORAGE: `${API_BASE_URL}/api/storage`,
    INVENTORY: `${API_BASE_URL}/api/inventory`,
    PURCHASES: `${API_BASE_URL}/api/purchases`,
    BARCODE: `${API_BASE_URL}/api/barcode`,
    DEBUG: `${API_BASE_URL}/api/debug`,
    SALES: `${API_BASE_URL}/api/sales`,
    ACCOUNT: `${API_BASE_URL}/api/account`,
    CLIENT_SALES: `${API_BASE_URL}/api/client-sales`,
    EXCHANGE: `${API_BASE_URL}/api/exchange`,
    PAYMENT_METHODS: `${API_BASE_URL}/api/payment-methods`,
    BANKS: `${API_BASE_URL}/api/banks`,
    STATISTICS: `${API_BASE_URL}/api/statistics`,
    FILES: `${API_BASE_URL}/api/files`,
    HEALTH: `${API_BASE_URL}/api/health`
}

export default API_BASE_URL