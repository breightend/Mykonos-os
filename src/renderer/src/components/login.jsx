import { useState } from 'react'
import { useEffect } from 'react'
import { KeyRound, UserRound, AlertCircle, Loader2, EyeOff, Eye } from 'lucide-react'
import { useLocation } from 'wouter'
import { useSession } from '../contexts/SessionContext'
import {
  fetchEmployeeByUsername,
  fetchEmployeeStorages
} from '../services/employee/employeeService'
import '../assets/login-only.css'

export default function Login() {
  const [, setLocation] = useLocation()
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

  const getStorage = async () => {
    if (flag && formData.username && formData.password) {
      try {
        const data_user = await fetchEmployeeByUsername(formData.username)
        console.log('data_user', data_user)
        setUserId(data_user.data.id)
        const data = await fetchEmployeeStorages(userId)
        console.log('data storages', data)
        setStorages(data)
      } catch (err) {
        setStorages([])
      }
    } else {
      setStorages([])
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

  useEffect(() => {
    getStorage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flag, formData.username, formData.password])

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
