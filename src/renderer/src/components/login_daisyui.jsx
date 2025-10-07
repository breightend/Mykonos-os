import { useState, useEffect } from 'react'
import { KeyRound, UserRound, AlertCircle, Loader2, EyeOff, Eye } from 'lucide-react'
import { useSession } from '../contexts/SessionContext'
import { fetchSucursales } from '../services/sucursales/sucursalesService'
import { useHashLocation } from 'wouter/use-hash-location'

export default function LoginDaisyUI() {
  const [, setLocation] = useHashLocation()
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
        const storagesData = Array.isArray(storageList) ? storageList : storageList.data
        setStorages(storagesData || [])
      } catch (err) {
        console.error('Error loading storages:', err)
        setStorages([])
      }
    }

    loadStorages()
  }, [])

  const handleShowPassword = () => {
    setShowPassword(!showPassword)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.username || !formData.password) {
      setFormError('Por favor completa todos los campos')
      return
    }

    if (storages && storages.length > 0 && !formData.storageId) {
      setFormError('Por favor selecciona una sucursal')
      return
    }

    setFormError('')
    setIsSubmitting(true)

    try {
      await login(formData.username, formData.password, formData.storageId)

      if (!error) {
        setLocation('/dashboard')
      }
    } catch (err) {
      console.error('Login error:', err)
      setFormError(err.message || 'Error al iniciar sesión')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-base-200 p-4">
      {/* Indicador visual DaisyUI */}
      <div className="fixed right-4 top-4 rounded bg-primary px-3 py-1 text-xs text-primary-content">
        DaisyUI Restaurado ✓
      </div>

      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-3xl font-bold">Mykonos OS</h1>
            <p className="text-base-content/60">Inicia sesión para continuar</p>
          </div>

          {(error || formError) && (
            <div className="alert alert-error mb-4">
              <AlertCircle size={16} />
              <span>{error || formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Usuario */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Usuario</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="input-bordered input w-full pl-10"
                  placeholder="Ingresa tu usuario"
                  disabled={isSubmitting || loading}
                  required
                />
                <UserRound className="text-base-content/40 absolute left-3 top-3 h-4 w-4" />
              </div>
            </div>

            {/* Contraseña */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Contraseña</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input-bordered input w-full pl-10 pr-10"
                  placeholder="Ingresa tu contraseña"
                  disabled={isSubmitting || loading}
                  required
                />
                <KeyRound className="text-base-content/40 absolute left-3 top-3 h-4 w-4" />
                <button
                  type="button"
                  onClick={handleShowPassword}
                  className="text-base-content/40 absolute right-3 top-3 hover:text-base-content"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Sucursal */}
            {storages && storages.length > 0 && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Sucursal</span>
                </label>
                <select
                  name="storageId"
                  value={formData.storageId}
                  onChange={handleInputChange}
                  className="select-bordered select w-full"
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
            )}

            {storages && storages.length === 0 && (
              <div className="alert alert-warning">
                <AlertCircle size={16} />
                <span>⚠️ No hay sucursales configuradas. Solo administradores pueden acceder.</span>
              </div>
            )}

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className={`btn w-full ${isSubmitting ? 'loading btn-disabled' : 'btn-primary'}`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Iniciando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Botón Settings */}
      <div className="fixed bottom-4 left-4">
        <button
          onClick={() => console.log('Settings clicked')}
          className="btn btn-sm btn-circle border-none bg-black/50 text-white hover:bg-black/70"
        >
          ⚙️
        </button>
      </div>
    </div>
  )
}
