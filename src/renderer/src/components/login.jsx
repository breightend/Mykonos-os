import { useState } from 'react'
import { useEffect } from 'react'
import {
  KeyRound,
  UserRound,
  AlertCircle,
  Loader2,
  EyeOff,
  Eye,
  Info,
  TriangleAlert
} from 'lucide-react'
import { useSession } from '../contexts/SessionContext'
import { useEmployeeApi } from '../hooks/useRobustApi'
import SmartLoadingOverlay from './SmartLoadingOverlay'
import NetworkHealthMonitor from './NetworkHealthMonitor'
import { useHashLocation } from 'wouter/use-hash-location'

import userIcon from '../assets/images/user_icon.webp'
import sunset2 from '../assets/images/sunset2.jpg'

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

        if (data_user && data_user.data && data_user.data.id) {
          setUserId(data_user.data.id)

          setProgressMessage('Obteniendo sucursales...')
          const data = await fetchEmployeeStorages(data_user.data.id)
          console.log('data storages', data)

          let storageList = []
          if (Array.isArray(data) && data.length > 0) {
            storageList = data.filter((item) => item && typeof item === 'object' && item.id)
          } else if (data && data.data && Array.isArray(data.data)) {
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
  }, [flag, formData.username, formData.password])

  return (
    <div className="hero relative min-h-screen overflow-hidden">
      {/* Network Health Monitor - Posición absoluta */}
      <div className="absolute right-4 top-4 z-50">
        <NetworkHealthMonitor />
      </div>

      {/* Background con overlay y gradiente */}
      <div className="absolute inset-0 -z-10">
        <img src={sunset2} alt="Background" className="h-full w-full object-cover brightness-75" />
        <div className="from-primary/30 to-secondary/30 absolute inset-0 bg-gradient-to-br via-transparent"></div>
      </div>

      {/* Logo/Branding Superior */}
      <div className="absolute left-4 top-0 w-full text-left">
        <div className="mb-2 flex items-center gap-3">
          <h1 className="text-5xl font-black text-white drop-shadow-2xl">Mykonos</h1>
        </div>
        <p className="justify-start text-sm font-medium tracking-wider text-white/80">
          Sistema de Gestión
        </p>
      </div>

      {/* Contenido Principal */}
      <div className="hero-content relative z-10 flex-col gap-8 py-12">
        {/* Card de Login */}
        <div className="card w-[500px] border border-[#231e18] bg-[#232125]/60 shadow-2xl backdrop-blur-xl">
          <div className="card-body">
            {/* Avatar y Título */}
            <div className="mb-4 flex flex-col items-center gap-3">
              <div className="online placeholder avatar">
                <div className="bg-primary/10 w-20 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-base-100">
                  <img src={userIcon} alt="User" className="object-cover" />
                </div>
              </div>
              <div className="text-center">
                <h2 className="bg-clip-text text-2xl font-bold tracking-wider text-white">
                  Bienvenido
                </h2>
                <p className="text-base-content/60 mt-1 text-sm text-white">
                  Ingresa tus credenciales
                </p>
              </div>
            </div>

            {/* Alertas de Error */}
            {(error || formError) && (
              <div role="alert" className="bg-error/10 border-error/20 alert border text-error">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error || formError}</span>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Campo Usuario */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="font-semibold text-white/80">Usuario</span>
                </label>
                <label className="input-bordered input flex w-full items-center gap-3 transition-all focus-within:input-primary">
                  <UserRound className="h-5 w-5 text-primary" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Ingrese su usuario"
                    className="grow"
                    required
                    minLength="3"
                    maxLength="30"
                    pattern="[A-Za-z][A-Za-z0-9\-]*"
                    disabled={isSubmitting || loading}
                  />
                </label>
              </div>

              {/* Campo Contraseña */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold text-white/80">Contraseña</span>
                </label>
                <label className="input-bordered input flex w-full items-center gap-3 transition-all focus-within:input-primary">
                  <KeyRound className="h-5 w-5 text-primary" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Ingrese su contraseña"
                    className="grow"
                    required
                    minLength="8"
                    disabled={isSubmitting || loading}
                  />
                  <button
                    type="button"
                    className="hover:bg-primary/10 btn btn-ghost btn-sm btn-circle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? (
                      <EyeOff className="text-base-content/60 h-5 w-5" />
                    ) : (
                      <Eye className="text-base-content/60 h-5 w-5" />
                    )}
                  </button>
                </label>
              </div>

              {/* Campo Sucursal */}
              {storages && storages.length > 0 ? (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-base-content/80 font-semibold">Sucursal</span>
                  </label>
                  <select
                    name="storageId"
                    value={formData.storageId}
                    onChange={handleInputChange}
                    className="select-bordered select w-full transition-all focus:select-primary"
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
                <div
                  role="alert"
                  className="bg-warning/10 border-warning/20 flex items-center gap-2 rounded-md border p-3 text-warning"
                >
                  <TriangleAlert className="h-5 w-5" />
                  <span className="text-sm">
                    Ingrese sus credenciales para seleccionar la sucursal.
                  </span>
                </div>
              )}

              {/* Info de Fallback */}
              {apiError?.fallbackUsed && (
                <div role="alert" className="bg-info/10 border-info/20 alert border text-info">
                  <Info className="h-4 w-4" />
                  <span className="text-sm">Conexión lenta - usando datos guardados</span>
                </div>
              )}

              {/* Botón de Submit */}
              <div className="form-control mt-8">
                <button
                  type="submit"
                  className="group btn btn-info btn-lg btn-block shadow-lg transition-all duration-300 hover:shadow-xl"
                  disabled={isSubmitting || loading || apiLoading}
                >
                  {isSubmitting || apiLoading ? (
                    <>
                      <span className="loading loading-spinner loading-md"></span>
                      <span className="font-semibold">{progressMessage || 'Iniciando...'}</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-5 w-5 transition-transform group-hover:rotate-12" />
                      <span className="font-semibold">Iniciar Sesión</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Divider decorativo */}
            <div className="divider mt-6 text-xs text-white/80">Sistema Seguro</div>

            {/* Footer info */}
            <div className="text-center text-xs text-white/50">
              <p>Versión 1.3 • © 2025 Mykonos</p>
            </div>
          </div>
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
    </div>
  )
}
