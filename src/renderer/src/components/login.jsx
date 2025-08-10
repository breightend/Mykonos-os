import { useState, useEffect } from 'react'
import { KeyRound, UserRound, AlertCircle, Loader2, EyeOff, Eye, LogIn } from 'lucide-react'
import Settings from '../componentes especificos/settings'
import { useLocation } from 'wouter'
import { useSession } from '../contexts/SessionContext'
import { fetchSucursales } from '../services/sucursales/sucursalesService'
import '../assets/login-only.css'

export default function Login() {
  const [, setLocation] = useLocation()
  const { login, loading, error } = useSession()

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    storageId: ''
  })
  const [storages, setStorages] = useState([])
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const loadStorages = async () => {
      try {
        const storageList = await fetchSucursales()
        // Si storageList es directamente un array, usarlo; si no, usar storageList.data
        const storagesData = Array.isArray(storageList) ? storageList : storageList.data
        console.log('Datos de sucursales a usar:', storagesData)

        setStorages(storagesData || [])
      } catch (err) {
        console.error('Error cargando sucursales:', err)
      }
    }
    loadStorages()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
    if (formError) setFormError('')
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

    if (storages && storages.length > 0 && !formData.storageId) {
      setFormError('Debe seleccionar una sucursal')
      return
    }

    setIsSubmitting(true)
    setFormError('')

    try {
      const storageId = storages && storages.length > 0 ? parseInt(formData.storageId) : null
      console.log('🔐 Datos de login:', {
        username: formData.username,
        storageId,
        storagesAvailable: storages?.length || 0
      })

      const result = await login(formData.username, formData.password, storageId)
      console.log('🔐 Resultado de login:', result)

      if (result.success) {
        setLocation('/home')
      } else {
        setFormError(result.message)
      }
    } catch {
      setFormError('Error de conexión. Verifique que el servidor esté funcionando.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      {/* Background */}
      <div className="login-background">
        <img src="./src/images/sunset2.jpg" alt="Background" className="dark:hidden" />
        <img
          src="./src/images/night-wallpaper.jpg"
          alt="Background"
          className="hidden dark:block"
        />
      </div>

      {/* Settings */}
      <div className="login-settings">
        <Settings />
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
          {/* Errores */}
          {(error || formError) && (
            <div className="login-alert login-alert-error">
              <AlertCircle className="h-4 w-4" />
              {error || formError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Usuario */}
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

            {/* Contraseña */}
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
                ⚠️ No hay sucursales configuradas. Solo administradores pueden acceder.
              </div>
            )}

            {/* Botón */}
            <button type="submit" className="login-button" disabled={isSubmitting || loading}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Iniciando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Logo */}
      <div className="login-logo">Mykonos-OS</div>
    </div>
  )
}
