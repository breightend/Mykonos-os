import { createContext, useContext, useState, useEffect } from 'react'

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
  }, [])

  const checkExistingSession = async () => {
    try {
      setLoading(true)
      const sessionToken = localStorage.getItem('session_token')

      if (!sessionToken) {
        setLoading(false)
        return
      }

      const response = await fetch('http://localhost:5000/api/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ session_token: sessionToken })
      })

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
      setError('Error de conexión')
      localStorage.removeItem('session_token')
      setSession(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password, storageId) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('http://localhost:5000/api/auth/login', {
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
        await fetch('http://localhost:5000/api/auth/logout', {
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

  const getStorages = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/storages')
      const data = await response.json()

      if (data.success) {
        return data.storages
      } else {
        throw new Error(data.message)
      }
    } catch (err) {
      console.error('Error obteniendo sucursales:', err)
      return []
    }
  }

  const isAuthenticated = () => {
    return session !== null
  }

  const isAdmin = () => {
    return session?.role === 'administrator'
  }

  const getCurrentStorage = () => {
    return session
      ? {
          id: session.storage_id,
          name: session.storage_name
        }
      : null
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

  const value = {
    session,
    loading,
    error,
    login,
    logout,
    getStorages,
    isAuthenticated,
    isAdmin,
    getCurrentStorage,
    getCurrentUser,
    checkExistingSession
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
