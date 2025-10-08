import { useState } from 'react'
import { useEffect } from 'react'
import { KeyRound, UserRound, AlertCircle, Loader2, EyeOff, Eye } from 'lucide-react'
import { useSession } from '../contexts/SessionContext'
import { useEmployeeApi } from '../hooks/useRobustApi'
import SmartLoadingOverlay from './SmartLoadingOverlay'
import NetworkHealthMonitor from './NetworkHealthMonitor'
import '../assets/login-only.css'
import { useHashLocation } from 'wouter/use-hash-location'

export default function Login() {
  const [, setLocation] = useHashLocation()
  const { login, loading, error } = useSession()
  const [flag, setFlag] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    storageId: ''
  })
  const [storages, setStorages] = useState([])
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [userId, setUserId] = useState(null)
  const [progressMessage, setProgressMessage] = useState('')

  // Hook robusto para manejo de API
  const {
    isLoading: apiLoading,
    error: apiError,
    fetchEmployeeByUsername,
    fetchEmployeeStorages,
    cancel: cancelApiCall
  } = useEmployeeApi()

  const getStorage = async () => {
    if (flag && formData.username && formData.password) {
      try {
        setProgressMessage('Verificando usuario...')
        const data_user = await fetchEmployeeByUsername(formData.username)
        console.log('data_user', data_user)

        // Validación segura de la respuesta del usuario
        if (data_user && data_user.data && data_user.data.id) {
          setUserId(data_user.data.id)

          setProgressMessage('Obteniendo sucursales...')
          const data = await fetchEmployeeStorages(data_user.data.id)
          console.log('data storages', data)

          // Validación segura de la respuesta de sucursales
          // Priorizar el array principal sobre la propiedad data
          let storageList = []
          if (Array.isArray(data) && data.length > 0) {
            // Si data es un array con elementos, usar ese array
            storageList = data.filter((item) => item && typeof item === 'object' && item.id)
          } else if (data && data.data && Array.isArray(data.data)) {
            // Fallback a la propiedad data si existe
            storageList = data.data
          }

          setStorages(storageList)
          console.log('Lista de sucursales:', storageList)
          // Auto-seleccionar la sucursal si solo hay una disponible
          if (storageList.length === 1) {
            console.log('🏪 Auto-seleccionando única sucursal disponible:', storageList[0])
            setFormData((prev) => ({
              ...prev,
              storageId: storageList[0].id.toString()
            }))
          }
        } else {
          console.warn('⚠️ Usuario no encontrado o respuesta inválida')
          setUserId(null)
          setStorages([])
        }
        setProgressMessage('')
      } catch (err) {
        console.log('Error obteniendo sucursales:', err)
        setStorages([])
        setProgressMessage('')

        // Si hay error con fallback, mostrar mensaje informativo
        if (apiError?.fallbackUsed) {
          setFormError(`Conexión lenta - usando datos guardados (${apiError.fallbackType})`)
        }
      }
    } else {
      setStorages([])
      setProgressMessage('')
    }
  }

  const handleAdminAndUser = (nextForm) => {
    if (nextForm.username !== '' && nextForm.password !== '') {
      setFlag(true)
    } else {
      setFlag(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    const nextForm = {
      ...formData,
      [name]: value
    }
    setFormData(nextForm)
    if (formError) setFormError('')
    if (name === 'username' || name === 'password') {
      handleAdminAndUser(nextForm)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.username.trim()) {
      setFormError('El usuario es requerido')
      return
    }

    if (!formData.password.trim()) {
      setFormError('La contraseña es requerida')
      return
    }

    setIsSubmitting(true)
    setFormError('')
    setProgressMessage('Iniciando sesión...')

    try {
      // Obtener las sucursales disponibles para el usuario directamente
      let availableStorages = []
      let storageId = null

      if (formData.username && formData.password) {
        try {
          setProgressMessage('Verificando credenciales...')
          const data_user = await fetchEmployeeByUsername(formData.username)
          console.log('🔍 Usuario encontrado:', data_user)

          // Validación segura del usuario
          if (data_user && data_user.data && data_user.data.id) {
            console.log('🔍 ID del usuario:', data_user.data.id)

            setProgressMessage('Cargando sucursales...')
            const storagesData = await fetchEmployeeStorages(data_user.data.id)
            console.log('🏪 Respuesta completa de sucursales:', storagesData)
            console.log('🏪 Tipo de respuesta:', typeof storagesData)
            console.log('🏪 Propiedades:', Object.keys(storagesData || {}))

            // Manejar diferentes estructuras de respuesta con validación segura
            // Priorizar el array principal sobre la propiedad data
            if (Array.isArray(storagesData) && storagesData.length > 0) {
              // Si storagesData es un array con elementos válidos, usar ese array
              availableStorages = storagesData.filter(
                (item) => item && typeof item === 'object' && item.id
              )
              console.log('🏪 Usando array principal de la respuesta')
            } else if (storagesData && storagesData.data && Array.isArray(storagesData.data)) {
              availableStorages = storagesData.data
              console.log('🏪 Usando storagesData.data')
            } else if (storagesData && typeof storagesData === 'object') {
              // Si es un objeto, intentar extraer el array
              availableStorages =
                Object.values(storagesData).find((val) => Array.isArray(val)) || []
              console.log('🏪 Buscando array en valores del objeto')
            } else {
              // Fallback por defecto
              availableStorages = [
                { id: 1, name: 'Sucursal Principal', description: 'Sucursal por defecto' }
              ]
              console.log('🏪 Usando fallback por defecto')
            }

            console.log('🏪 Sucursales disponibles:', availableStorages)
            console.log('🏪 Cantidad de sucursales:', availableStorages.length)
          } else {
            console.warn('⚠️ Usuario no válido o no encontrado')
            availableStorages = []
          }
        } catch (err) {
          console.log('Error obteniendo datos del usuario/sucursales:', err)
          console.error('Error details:', err.response?.data || err.message)

          // Si hay error con fallback, continuar con datos por defecto
          if (apiError?.fallbackUsed) {
            console.log('🔄 Usando datos de fallback para sucursales')
            availableStorages = [{ id: 1, name: 'Sucursal Principal' }]
          }
        }
      }

      // Determinar el storageId a enviar
      const hasStorages = availableStorages.length > 0

      if (hasStorages) {
        // Si hay sucursales disponibles, verificar si se seleccionó una
        if (!formData.storageId) {
          // Si no hay selección manual, auto-seleccionar la primera disponible
          storageId = availableStorages[0].id
          console.log('🏪 Auto-seleccionando primera sucursal disponible:', {
            id: storageId,
            name: availableStorages[0].name
          })
        } else {
          // Usar la selección manual del usuario
          storageId = parseInt(formData.storageId)
          console.log('🏪 Usando sucursal seleccionada por el usuario:', storageId)
        }
      } else {
        // Si no hay sucursales, usar ID por defecto
        storageId = 1
        console.log('🏪 No hay sucursales disponibles, usando ID por defecto:', storageId)
      }

      console.log('🔐 Datos de login:', {
        username: formData.username,
        storageId,
        storagesAvailable: availableStorages.length,
        hasStorages,
        selectedStorageId: formData.storageId
      })

      setProgressMessage('Autenticando...')
      const result = await login(formData.username, formData.password, storageId)
      console.log('🔐 Resultado de login:', result)

      if (result.success) {
        setProgressMessage('¡Éxito! Redirigiendo...')
        setLocation('/home')
      } else {
        setFormError(result.message)
      }
    } catch (error) {
      console.error('❌ Login error:', error)
      setFormError('Error de conexión. Verifique que el servidor esté funcionando.')
    } finally {
      setIsSubmitting(false)
      setProgressMessage('')
    }
  }

  useEffect(() => {
    getStorage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flag, formData.username, formData.password])

  return (
    <div className="login-page">
      {/* Network Health Monitor */}
      <div className="login-settings">
        <NetworkHealthMonitor />
      </div>

      {/* Background */}
      <div className="login-background">
        <img src="./src/images/sunset2.jpg" alt="Background" className="dark:hidden" />
        <img
          src="./src/images/night-wallpaper.jpg"
          alt="Background"
          className="hidden dark:block"
        />
      </div>

      {/* Login Card */}
      <div className="login-card">
        <div className="login-header">
          <div className="login-avatar">
            <img src="./src/images/user_icon.webp" alt="User" />
          </div>
          <h1 className="login-title">Iniciar Sesión</h1>
        </div>

        <div className="login-form">
          {(error || formError) && (
            <div className="login-alert login-alert-error">
              <AlertCircle className="h-4 w-4" />
              {error || formError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="login-input-group">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Usuario"
                className="login-input"
                required
                minLength="3"
                maxLength="30"
                pattern="[A-Za-z][A-Za-z0-9\-]*"
                disabled={isSubmitting || loading}
              />
              <UserRound className="login-input-icon" />
            </div>

            <div className="login-input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Contraseña"
                className="login-input"
                required
                minLength="8"
                disabled={isSubmitting || loading}
              />
              <KeyRound className="login-input-icon" />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Sucursal */}
            {storages && storages.length > 0 ? (
              <div className="login-input-group">
                <select
                  name="storageId"
                  value={formData.storageId}
                  onChange={handleInputChange}
                  className="login-select"
                  required
                  disabled={isSubmitting || loading}
                >
                  <option value="" disabled>
                    Seleccionar Sucursal
                  </option>
                  {storages.map((storage) => (
                    <option key={storage.id} value={storage.id}>
                      {storage.name} {storage.address && `- ${storage.address}`}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="login-alert login-alert-warning">
                ⚠️ Ingrese sus credenciales para seleccionar la sucursal.
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              className="login-button"
              disabled={isSubmitting || loading || apiLoading}
            >
              {isSubmitting || apiLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progressMessage || 'Iniciando...'}
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>

            {/* Mostrar fallback info si existe */}
            {apiError?.fallbackUsed && (
              <div className="login-alert login-alert-info">
                ℹ️ Conexión lenta - usando datos guardados
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Smart Loading Overlay */}
      {(isSubmitting || apiLoading) && (
        <SmartLoadingOverlay
          message={progressMessage || 'Cargando...'}
          onCancel={() => {
            cancelApiCall()
            setIsSubmitting(false)
            setProgressMessage('')
          }}
        />
      )}

      {/* Logo */}
      <div className="login-logo">Mykonos-OS</div>
    </div>
  )
}
