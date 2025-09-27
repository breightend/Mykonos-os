/**
 * Configuración central de API para la aplicación Electron
 * Aquí se define la URL base del servidor backend
 */

// Determinar la URL base según el entorno
const isProduction = process.env.NODE_ENV === 'production'
const isDevelopment = !isProduction

// URL del servidor backend
export const API_BASE_URL = isDevelopment
    ? 'http://190.3.63.10:5000'  // IP fija para desarrollo
    : 'http://190.3.63.10:8080'  // IP fija para producción

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