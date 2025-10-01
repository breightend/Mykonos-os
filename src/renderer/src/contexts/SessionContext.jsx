import React, { createContext, useContext, useState, useEffect } from 'react'
import { API_ENDPOINTS } from '../config/apiConfig.js'

const SessionContext = createContext()

export const useSession = () => {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession debe usarse dentro de SessionProvider')
  }
  return context
}

export const SessionProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Verificar sesión al inicializar
  useEffect(() => {
    checkExistingSession()
  }, []) // Empty dependency array to run only once

  const checkExistingSession = async () => {
    try {
      setLoading(true)
      const sessionToken = localStorage.getItem('session_token')

      console.log('🔍 Checking session with server:', API_ENDPOINTS.AUTH)

      // First, test basic connectivity to the server
      try {
        const healthResponse = await fetch(`${API_ENDPOINTS.HEALTH}`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000) // 5 second timeout for health check
        })
        console.log('🏥 Health check status:', healthResponse.status)
        if (healthResponse.ok) {
          const healthData = await healthResponse.json()
          console.log('🏥 Health check data:', healthData)
        }
      } catch (healthError) {
        console.log('❌ Health check failed:', healthError.message)
      }

      if (!sessionToken) {
        console.log('❌ No session token found')
        setLoading(false)
        return
      }

      // Add timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      console.log('🌐 Attempting to connect to server:', `${API_ENDPOINTS.AUTH}/validate`)

      const response = await fetch(`${API_ENDPOINTS.AUTH}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ session_token: sessionToken }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log('✅ Server response status:', response.status)

      const data = await response.json()

      if (data.success) {
        setSession(data.session_data)
        setError(null)
      } else {
        // Token inválido, limpiar localStorage
        localStorage.removeItem('session_token')
        setSession(null)
      }
    } catch (err) {
      console.error('Error verificando sesión:', err)

      // Don't show error for aborted requests (timeout)
      if (err.name !== 'AbortError') {
        setError('Error de conexión')
      }

      // If there's a connection error, don't immediately clear the token
      // This prevents logout loops due to temporary network issues
      if (err.name === 'AbortError' || err.message.includes('fetch')) {
        console.warn('Session validation failed due to network issue, keeping session')
      } else {
        localStorage.removeItem('session_token')
        setSession(null)
      }
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password, storageId) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API_ENDPOINTS.AUTH}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password,
          storage_id: storageId
        })
      })

      const data = await response.json()

      if (data.success) {
        // Guardar token en localStorage
        localStorage.setItem('session_token', data.session_data.session_token)

        // Actualizar estado de sesión
        setSession(data.session_data)
        setError(null)

        return { success: true, message: data.message }
      } else {
        setError(data.message)
        return { success: false, message: data.message }
      }
    } catch (err) {
      console.error('Error en login:', err)
      setError('Error de conexión')
      return { success: false, message: 'Error de conexión' }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      const sessionToken = localStorage.getItem('session_token')

      if (sessionToken) {
        await fetch(`${API_ENDPOINTS.AUTH}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ session_token: sessionToken })
        })
      }
    } catch (err) {
      console.error('Error en logout:', err)
    } finally {
      // Siempre limpiar estado local
      localStorage.removeItem('session_token')
      setSession(null)
      setError(null)
    }
  }

  const isAuthenticated = () => {
    return session !== null
  }

  const isAdmin = () => {
    return session?.role === 'administrator'
  }

  const setCurrentStorage = (storage) => {
    if (session) {
      setSession((prevSession) => ({
        ...prevSession,
        storage_id: storage.id,
        storage_name: storage.name
      }))
    }
  }

  const getCurrentStorage = () => {
    // Si no hay sesión, devolver null
    if (!session) {
      return null
    }

    // Si no hay storage_id, significa que probablemente es un admin sin sucursal
    if (!session.storage_id) {
      return {
        id: null,
        name: 'Sin sucursal'
      }
    }

    const storageData = {
      id: session.storage_id,
      name: session.storage_name || 'Sucursal desconocida'
    }

    return storageData
  }

  const getCurrentUser = () => {
    return session
      ? {
          id: session.user_id,
          username: session.username,
          fullname: session.fullname,
          role: session.role
        }
      : null
  }

  const changeBranchStorage = async (newStorageId) => {
    try {
      setLoading(true)
      setError(null)

      const sessionToken = localStorage.getItem('session_token')
      if (!sessionToken) {
        throw new Error('No hay token de sesión')
      }

      const response = await fetch(`${API_ENDPOINTS.AUTH}/change-storage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_token: sessionToken,
          new_storage_id: newStorageId
        })
      })

      const data = await response.json()

      if (data.success) {
        setSession(data.session_data)
        setError(null)
        return { success: true, message: data.message }
      } else {
        setError(data.message)
        return { success: false, message: data.message }
      }
    } catch (err) {
      console.error('Error cambiando sucursal:', err)
      setError('Error de conexión')
      return { success: false, message: 'Error de conexión' }
    } finally {
      setLoading(false)
    }
  }

  const value = {
    session,
    loading,
    error,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    getCurrentStorage,
    getCurrentUser,
    checkExistingSession,
    changeBranchStorage,
    setCurrentStorage
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
