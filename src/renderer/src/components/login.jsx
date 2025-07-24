import { useState, useEffect } from 'react'
import { KeyRound, UserRound, AlertCircle, Loader2 } from 'lucide-react'
import Settings from '../componentes especificos/settings'
import { useLocation } from 'wouter'
import { useSession } from '../contexts/SessionContext'
import { fetchSucursales } from '../services/sucursales/sucursalesService'
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

  // Efecto para monitorear cambios en el estado storages
  useEffect(() => {
    console.log('Estado storages actualizado:', storages)
    console.log('Cantidad de sucursales:', storages?.length || 0)
  }, [storages])

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
      const result = await login(formData.username, formData.password, storageId)

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
    <div className="image-full relative z-0 w-full bg-cover bg-center">
      <figure className="absolute inset-0">
        <img
          src="./src/images/sunset2.jpg"
          alt="bgImage"
          className="h-full w-full rounded-none dark:hidden"
        />
        <img
          src="./src/images/night-wallpaper.jpg"
          alt="bgImage"
          className="hidden h-full w-full rounded-none dark:block"
        />
      </figure>

      <div className="relative z-20 flex min-h-screen items-center justify-center">
        <div className="card glass bg-opacity-50 w-[32rem] flex-row rounded-lg bg-gray-800 p-2 shadow-xl">
          <Settings />
          <figure className="flex items-center justify-center px-4">
            <div className="avatar">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-gray-500">
                <img src="./src/images/user_icon.webp" alt="User Icon" />
              </div>
            </div>
          </figure>

          <div className="card-body flex-1">
            <h2 className="mb-2 text-center text-2xl font-semibold text-white">Iniciar Sesión</h2>

            {/* Mostrar errores */}
            {(error || formError) && (
              <div className="alert alert-error mb-4">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error || formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campo Usuario */}
              <label className="input validator">
                <UserRound className="opacity-50" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="text-base-content w-full"
                  required
                  placeholder="Usuario"
                  pattern="[A-Za-z][A-Za-z0-9\-]*"
                  minLength="3"
                  maxLength="30"
                  disabled={isSubmitting || loading}
                />
              </label>

              {/* Campo Contraseña */}
              <label className="input validator">
                <KeyRound className="opacity-50" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Contraseña"
                  minLength="8"
                  className="text-base-content"
                  disabled={isSubmitting || loading}
                />
              </label>

              {/* Selector de Sucursal - Solo mostrar si hay sucursales disponibles */}
              {storages && storages.length > 0 ? (
                <select
                  name="storageId"
                  value={formData.storageId}
                  onChange={handleInputChange}
                  className="select w-full"
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
              ) : (
                <div className="alert alert-warning">
                  <span className="text-sm">
                    ⚠️ No hay sucursales configuradas. Solo administradores pueden acceder.
                  </span>
                </div>
              )}

              {/* Botón de envío */}
              <div className="card-actions flex justify-end">
                <button
                  type="submit"
                  className="btn btn-primary text-black"
                  disabled={isSubmitting || loading}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Iniciando...
                    </>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 p-4">
        <p className="text-6xl font-bold text-black dark:text-white">Mykonos-OS</p>
      </div>
    </div>
  )
}
