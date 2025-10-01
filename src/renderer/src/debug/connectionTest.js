/**
 * Script de prueba de conectividad con el backend
 * Ejecuta este archivo en la consola del navegador para verificar la conexión
 */

import { API_ENDPOINTS, API_BASE_URL } from './config/apiConfig.js'

// Función para probar la conectividad
export const testBackendConnection = async () => {
    console.log('🔄 Probando conexión con el backend...')
    console.log('📡 URL del backend:', API_BASE_URL)

    try {
        // Probar endpoint de salud
        const healthResponse = await fetch(`${API_ENDPOINTS.HEALTH}`)
        console.log('✅ Health check status:', healthResponse.status)

        if (healthResponse.ok) {
            const healthData = await healthResponse.json()
            console.log('✅ Health check data:', healthData)
        }

        // Probar endpoint de autenticación (sin credenciales)
        const authResponse = await fetch(`${API_ENDPOINTS.AUTH}/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        console.log('📡 Auth endpoint status:', authResponse.status)

        return {
            backend_url: API_BASE_URL,
            health_status: healthResponse.status,
            auth_endpoint_available: authResponse.status !== 0,
            success: true
        }

    } catch (error) {
        console.error('❌ Error de conexión:', error)
        return {
            backend_url: API_BASE_URL,
            error: error.message,
            success: false
        }
    }
}

// Función para verificar configuración
export const checkConfig = () => {
    console.log('📋 Configuración actual:')
    console.log('- API_BASE_URL:', API_BASE_URL)
    console.log('- AUTH endpoint:', API_ENDPOINTS.AUTH)
    console.log('- Ambiente:', process.env.NODE_ENV || 'development')
}

// Ejecutar automáticamente si se importa
console.log('🚀 Herramientas de debug cargadas')
console.log('Ejecuta: testBackendConnection() para probar la conexión')
console.log('Ejecuta: checkConfig() para ver la configuración')