import { useState, useCallback, useRef } from 'react'
import { fallbackManager } from '../services/fallbackManager.js'

/**
 * Hook personalizado para manejo robusto de llamadas API con reintentos y fallbacks
 */
export const useRobustApi = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [data, setData] = useState(null)
    const abortControllerRef = useRef(null)

    /**
     * Ejecuta una operación API con manejo robusto de errores
     */
    const execute = useCallback(async (apiCall, options = {}) => {
        const {
            cacheKey = null,
            fallbackData = null,
            maxRetries = 2,
            retryDelay = 1000,
            timeout = 10000,
            onProgress = null
        } = options

        // Cancelar operación anterior si existe
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        // Crear nuevo AbortController
        abortControllerRef.current = new AbortController()
        const { signal } = abortControllerRef.current

        setIsLoading(true)
        setError(null)

        let attempt = 0
        let lastError = null

        while (attempt <= maxRetries) {
            try {
                if (signal.aborted) {
                    throw new Error('Operation cancelled')
                }

                if (onProgress) {
                    onProgress(`Intento ${attempt + 1}${attempt > 0 ? ` de ${maxRetries + 1}` : ''}`)
                }

                const result = await apiCall({ signal })

                setData(result)
                setIsLoading(false)
                return result

            } catch (err) {
                lastError = err

                if (signal.aborted) {
                    setError(new Error('Operación cancelada'))
                    setIsLoading(false)
                    return null
                }

                // Si es el último intento, no esperar más
                if (attempt === maxRetries) {
                    break
                }

                // Esperar antes del siguiente intento
                const delay = retryDelay * Math.pow(2, attempt) // Backoff exponencial
                console.warn(`🔄 Retry ${attempt + 1}/${maxRetries} after ${delay}ms for error:`, err.message)

                await new Promise(resolve => setTimeout(resolve, delay))
                attempt++
            }
        }

        // Si llegamos aquí, todos los intentos fallaron
        console.error('❌ All retry attempts failed:', lastError)

        // Intentar usar fallback si está disponible
        if (cacheKey || fallbackData) {
            try {
                console.log('🔄 Attempting fallback strategy...')

                if (cacheKey && window.cacheService) {
                    const cachedData = window.cacheService.getStale(cacheKey, 24 * 60 * 60 * 1000)
                    if (cachedData) {
                        console.log('📦 Using stale cache as fallback')
                        setData(cachedData)
                        setError({
                            ...lastError,
                            fallbackUsed: true,
                            fallbackType: 'stale_cache'
                        })
                        setIsLoading(false)
                        return cachedData
                    }
                }

                if (fallbackData) {
                    console.log('📋 Using default fallback data')
                    setData(fallbackData)
                    setError({
                        ...lastError,
                        fallbackUsed: true,
                        fallbackType: 'default_data'
                    })
                    setIsLoading(false)
                    return fallbackData
                }

            } catch (fallbackError) {
                console.error('❌ Fallback strategy also failed:', fallbackError)
            }
        }

        // Si no hay fallback disponible, fallar completamente
        setError(lastError)
        setIsLoading(false)
        throw lastError

    }, [])

    /**
     * Cancela la operación en curso
     */
    const cancel = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
        setIsLoading(false)
        setError(null)
    }, [])

    /**
     * Reinicia el estado
     */
    const reset = useCallback(() => {
        setIsLoading(false)
        setError(null)
        setData(null)
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
    }, [])

    return {
        isLoading,
        error,
        data,
        execute,
        cancel,
        reset
    }
}

/**
 * Hook específico para operaciones de empleados con configuración optimizada
 */
export const useEmployeeApi = () => {
    const { isLoading, error, data, execute, cancel, reset } = useRobustApi()

    const fetchEmployeeByUsername = useCallback(async (username) => {
        try {
            const result = await execute(
                async ({ signal }) => {
                    const response = await fetch(`${window.API_BASE_URL || 'https://api.mykonosboutique.com.ar'}/api/user/employee/username/${username}`, {
                        signal,
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    })

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                    }

                    const data = await response.json()
                    console.log('✅ fetchEmployeeByUsername response:', data)
                    return data
                },
                {
                    cacheKey: `employee_username_${username}`,
                    maxRetries: 3,
                    retryDelay: 2000,
                    fallbackData: {
                        status: 'error',
                        data: null,
                        message: 'Usuario no encontrado o error de conexión'
                    }
                }
            )

            // Validar que el resultado tenga la estructura esperada
            if (result && typeof result === 'object') {
                return result
            }

            // Si el resultado no es válido, devolver estructura por defecto
            console.warn('⚠️ Invalid response structure, using fallback')
            return {
                status: 'error',
                data: null,
                message: 'Respuesta inválida del servidor'
            }

        } catch (error) {
            console.error('❌ fetchEmployeeByUsername failed:', error)
            return {
                status: 'error',
                data: null,
                message: error.message || 'Error de conexión'
            }
        }
    }, [execute])

    const fetchEmployeeStorages = useCallback(async (employeeId) => {
        try {
            const result = await execute(
                async ({ signal }) => {
                    const response = await fetch(`${window.API_BASE_URL || 'https://api.mykonosboutique.com.ar'}/api/user/employee/${employeeId}/storages`, {
                        signal,
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        }
                    })

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                    }

                    const data = await response.json()
                    console.log('✅ fetchEmployeeStorages response:', data)
                    return data
                },
                {
                    cacheKey: `employee_storages_${employeeId}`,
                    maxRetries: 2,
                    retryDelay: 1500,
                    fallbackData: {
                        status: 'success',
                        data: [
                            { id: 1, name: 'Sucursal Principal', description: 'Sucursal por defecto' }
                        ],
                        message: 'Usando datos de fallback para sucursales'
                    }
                }
            )

            // Validar que el resultado tenga la estructura esperada
            if (result && typeof result === 'object') {
                // Asegurar que data sea un array
                if (!result.data || !Array.isArray(result.data)) {
                    console.warn('⚠️ Invalid storages data structure, fixing...')
                    result.data = [
                        { id: 1, name: 'Sucursal Principal', description: 'Sucursal por defecto' }
                    ]
                }
                return result
            }

            // Si el resultado no es válido, devolver estructura por defecto
            console.warn('⚠️ Invalid storages response, using fallback')
            return {
                status: 'success',
                data: [
                    { id: 1, name: 'Sucursal Principal', description: 'Sucursal por defecto' }
                ],
                message: 'Usando datos de emergencia para sucursales'
            }

        } catch (error) {
            console.error('❌ fetchEmployeeStorages failed:', error)
            return {
                status: 'success',
                data: [
                    { id: 1, name: 'Sucursal Principal', description: 'Sucursal por defecto' }
                ],
                message: 'Error de conexión - usando datos de emergencia'
            }
        }
    }, [execute])

    return {
        isLoading,
        error,
        data,
        fetchEmployeeByUsername,
        fetchEmployeeStorages,
        cancel,
        reset
    }
}

export default useRobustApi