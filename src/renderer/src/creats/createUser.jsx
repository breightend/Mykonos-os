import { useState, useEffect } from 'react'
import { enviarData } from '../services/usuario/usuarioService'
import { fetchSucursales, assignEmployeeToSucursal } from '../services/sucursales/sucursalesService'
import toast, { Toaster } from 'react-hot-toast'
import { ArrowLeft, Eye, EyeClosed } from 'lucide-react'
import { useLocation } from 'wouter'
import { useDropzone } from 'react-dropzone'

function CreateUser() {
  const [, setLocation] = useLocation()
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    username: '',
    fullname: '',
    password: '',
    email: '',
    phone: '',
    domicilio: '',
    cuit: '',
    role: 'employee',
    status: 'active',
    profile_image: '',
    created_at: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [sucursales, setSucursales] = useState([])
  const [selectedSucursales, setSelectedSucursales] = useState([])
  const [loadingSucursales, setLoadingSucursales] = useState(false)

  useEffect(() => {
    const loadSucursales = async () => {
      setLoadingSucursales(true)
      try {
        const data = await fetchSucursales()
        setSucursales(data)
      } catch (error) {
        console.error('Error loading sucursales:', error)
        toast.error('Error al cargar las sucursales', error.message)
      } finally {
        setLoadingSucursales(false)
      }
    }
    loadSucursales()
  }, [])

  const validateForm = () => {
    const newErrors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    const requiredFields = [
      'nombre',
      'apellido',
      'email',
      'phone',
      'domicilio',
      'cuit',
      'password',
      'confirmPassword'
    ]

    for (const field of requiredFields) {
      if (!formData[field] || !formData[field].trim()) {
        newErrors[field] = 'Este campo es requerido'
      }
    }

    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Ingrese un email válido'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres'
    }

    if (formData.cuit && (formData.cuit.length < 10 || formData.cuit.length > 11)) {
      newErrors.cuit = 'El CUIT debe tener entre 10 y 11 dígitos'
    }

    if (!formData.username || !formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido'
    }

    if (!formData.fullname || !formData.fullname.trim()) {
      newErrors.fullname = 'El nombre completo es requerido'
    }

    if (!formData.profile_image || !formData.profile_image.trim()) {
      newErrors.profile_image = 'La foto de perfil es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const onChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => {
      const updated = { ...prev, [name]: value }
      updated.created_at = new Date().toISOString().split('T')[0]

      if (name === 'nombre' || name === 'apellido') {
        const nombre = name === 'nombre' ? value : updated.nombre
        const apellido = name === 'apellido' ? value : updated.apellido

        const capitalizar = (str) =>
          str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : ''

        const nombreCapitalizado = capitalizar(nombre)
        const apellidoCapitalizado = capitalizar(apellido)

        if (nombreCapitalizado && apellidoCapitalizado) {
          updated.username = nombreCapitalizado + apellidoCapitalizado
          updated.fullname = `${nombreCapitalizado} ${apellidoCapitalizado}`
        } else if (nombreCapitalizado) {
          updated.username = nombreCapitalizado
          updated.fullname = nombreCapitalizado
        } else if (apellidoCapitalizado) {
          updated.username = apellidoCapitalizado
          updated.fullname = apellidoCapitalizado
        } else {
          updated.username = ''
          updated.fullname = ''
        }
      }

      return updated
    })

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSucursalSelection = (sucursalId) => {
    setSelectedSucursales((prev) => {
      let newSelection
      if (prev.includes(sucursalId)) {
        newSelection = prev.filter((id) => id !== sucursalId)
        console.log(`Removed sucursal ${sucursalId}. New selection:`, newSelection)
      } else {
        newSelection = [...prev, sucursalId]
        console.log(`Added sucursal ${sucursalId}. New selection:`, newSelection)
      }
      return newSelection
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    console.log('Form submitted with data:', formData)

    if (!validateForm()) {
      console.log('Form validation failed:', errors)
      return
    }

    try {
      console.log('Creando usuario con datos:', formData)

      const userData = {
        username: formData.username,
        fullname: formData.fullname,
        password: formData.password,
        email: formData.email,
        phone: formData.phone,
        domicilio: formData.domicilio,
        cuit: formData.cuit,
        role: formData.role,
        status: formData.status,
        profile_image: formData.profile_image,
        session_token: '' 
      }

      console.log('Los datos fueron enviados al backend:', userData)

      const requiredBackendFields = [
        'username',
        'fullname',
        'password',
        'email',
        'phone',
        'domicilio',
        'cuit'
      ]
      const missingFields = requiredBackendFields.filter(
        (field) => !userData[field] || !userData[field].trim()
      )

      if (!userData.profile_image) {
        missingFields.push('profile_image')
      }

      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields)
        toast.error(`Faltan campos requeridos: ${missingFields.join(', ')}`)
        return
      }

      const createdUser = await enviarData(userData)
      console.log('Usuario creado:', createdUser)
      console.log('Selected sucursales:', selectedSucursales)
      console.log('User ID from response:', createdUser.user_id)

      if (selectedSucursales.length > 0) {
        if (!createdUser.user_id) {
          console.error('No user_id received from server:', createdUser)
          toast.error('Usuario creado, pero error obteniendo ID de usuario')
          return
        }

        try {
          console.log(
            `Asignando usuario ${createdUser.user_id} a ${selectedSucursales.length} sucursales`
          )
          for (const sucursalId of selectedSucursales) {
            console.log(`Asignando a sucursal: ${sucursalId}`)
            const assignResult = await assignEmployeeToSucursal(sucursalId, createdUser.user_id)
            console.log(`Resultado de asignación para sucursal ${sucursalId}:`, assignResult)
          }
          toast.success(`Usuario creado y asignado a ${selectedSucursales.length} sucursal(es)`, {
            position: 'top-right',
            duration: 2000,
            style: {
              background: '#4caf50',
              color: '#fff'
            }
          })
        } catch (sucursalError) {
          console.error('Error al asignar sucursales:', sucursalError)
          toast.error(
            `Usuario creado, pero error al asignar sucursales: ${sucursalError.message || sucursalError}`,
            {
              position: 'top-right',
              duration: 3000,
              style: {
                background: '#ff9800',
                color: '#fff'
              }
            }
          )
        }
      } else {
        console.log('No se seleccionaron sucursales para asignar')
        toast.success('Usuario creado con éxito', {
          position: 'top-right',
          duration: 2000,
          style: {
            background: '#4caf50',
            color: '#fff'
          }
        })
      }

      console.log('Attempting to navigate to /home')
      setTimeout(() => {
        try {
          setLocation('/home')
          console.log('Navigation command executed')
        } catch (navError) {
          console.error('Navigation error:', navError)
          window.location.hash = '#/home'
        }
      }, 100)
    } catch (error) {
      console.error('Error al enviar los datos:', error)
      toast.error(error.message || 'Ocurrió un error al enviar los datos', {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#f44336',
          color: '#fff'
        }
      })
    }
  }

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': []
    },
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0]
      const base64 = await convertToBase64(file)
      setFormData({ ...formData, profile_image: base64 })

      // Clear profile image error if it exists
      if (errors.profile_image) {
        setErrors((prev) => ({ ...prev, profile_image: '' }))
      }
    }
  })

  /**
   * Converts a base64 image to a Blob and creates an object URL
   * @param base64Data The base64 encoded image data (with or without data URI prefix)
   * @returns The object URL that can be used as an image source
   */
  function base64ToObjectUrl(base64Data) {
    // Extract content type and base64 data
    let contentType = 'image/png' // default
    let base64WithoutPrefix = base64Data

    // Check if it's a data URI and extract content type
    if (base64Data.startsWith('data:')) {
      const matches = base64Data.match(/^data:(.+?);/)
      if (matches && matches[1]) {
        contentType = matches[1]
      }
      base64WithoutPrefix = base64Data.split(';base64,').pop()
    }

    // Convert base64 to raw binary data
    const byteCharacters = atob(base64WithoutPrefix)
    const byteArrays = []

    // Convert each character to byte array
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512)
      const byteNumbers = new Array(slice.length)

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i)
      }

      const byteArray = new Uint8Array(byteNumbers)
      byteArrays.push(byteArray)
    }

    // Create blob from byte arrays
    const blob = new Blob(byteArrays, { type: contentType })

    // Create and return object URL
    return URL.createObjectURL(blob)
  }

  const [seeValidatePassword, setSeeValidatePassword] = useState(false)

  return (
    <div className="bg-base-100 mx-auto mt-4 max-w-md rounded-lg p-6 shadow-md">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setLocation('/home')}
          type="button"
          className="btn btn-circle btn-icon bg-base-300 flex items-center justify-center"
        >
          <ArrowLeft className="h-6 w-6 cursor-pointer" />
        </button>
        <h2 className="text-2xl font-bold">Registro de Usuario</h2>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Foto de perfil *</span>
          </label>

          {formData.profile_image && (
            <div className="mt-2 flex flex-col items-center justify-center">
              <div className="avatar justify-center">
                <div className="ring-primary ring-offset-base-100 w-24 rounded-full ring ring-offset-2">
                  <img src={base64ToObjectUrl(formData.profile_image)} alt="Preview" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors duration-200 ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : errors.profile_image
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300'
          }`}
        >
          <input {...getInputProps()} />
          <p>{isDragActive ? '¡Soltá la imagen aquí!' : 'Arrastrá tu imagen o hacé clic'}</p>
        </div>
        {errors.profile_image && (
          <p className="mt-1 text-xs text-red-500">{errors.profile_image}</p>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre *</label>
            <input
              name="nombre"
              onChange={onChange}
              type="text"
              className={`w-full border px-3 py-2 ${
                errors.nombre ? 'border-red-500' : 'border-gray-300'
              } rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none`}
              placeholder="Ingrese su nombre"
              value={formData.nombre}
            />
            {errors.nombre && <p className="mt-1 text-xs text-red-500">{errors.nombre}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Apellido *</label>
            <input
              name="apellido"
              onChange={onChange}
              type="text"
              className={`w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none`}
              placeholder="Ingrese su apellido"
              value={formData.apellido}
            />
            {errors.apellido && <p className="mt-1 text-xs text-red-500">{errors.apellido}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">CUIT *</label>
          <input
            name="cuit"
            onChange={onChange}
            type="text"
            className={`w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none`}
            placeholder="Ingrese su cuit"
            value={formData.cuit}
          />
          {errors.cuit && <p className="mt-1 text-xs text-red-500">{errors.cuit}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Celular *</label>
          <input
            name="phone"
            onChange={onChange}
            type="tel"
            className={`w-full border px-3 py-2 ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none`}
            placeholder="+1234567890"
            value={formData.phone}
          />
          {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Domicilio *</label>
          <input
            name="domicilio"
            onChange={onChange}
            type="text"
            className={`w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none`}
            placeholder="Ingrese su domicilio"
            value={formData.domicilio}
          />
          {errors.domicilio && <p className="mt-1 text-xs text-red-500">{errors.domicilio}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Email *</label>
          <input
            name="email"
            onChange={onChange}
            type="email"
            className={`w-full border px-3 py-2 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none`}
            placeholder="ejemplo@correo.com"
            value={formData.email}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Ciudad</label>
          <select
            name="sucursal"
            onChange={onChange}
            className={`w-full border px-3 py-2 ${
              errors.sucursal ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none`}
            value={formData.sucursal}
          >
            <option value="">Seleccione ciudad</option>
            <option value="parana">Paraná</option>
            <option value="concordia">Concordia</option>
          </select>
          {errors.sucursal && <p className="mt-1 text-xs text-red-500">{errors.sucursal}</p>}
        </div>

        {/* Selección de Sucursales */}
        <div>
          <label className="mb-1 block text-sm font-medium">Sucursales</label>
          <p className="mb-2 text-xs text-gray-600">
            Seleccione las sucursales a las que tendrá acceso el usuario
          </p>

          {loadingSucursales ? (
            <div className="flex items-center justify-center py-4">
              <div className="loading loading-spinner loading-sm"></div>
              <span className="ml-2 text-sm">Cargando sucursales...</span>
            </div>
          ) : (
            <div className="max-h-40 overflow-y-auto rounded-md border border-gray-300 p-2">
              {sucursales.length === 0 ? (
                <p className="py-2 text-center text-sm text-gray-500">
                  No hay sucursales disponibles
                </p>
              ) : (
                <div className="space-y-2">
                  {sucursales.map((sucursal) => (
                    <label
                      key={sucursal.id}
                      className="flex cursor-pointer items-center space-x-2 rounded p-2 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSucursales.includes(sucursal.id)}
                        onChange={() => handleSucursalSelection(sucursal.id)}
                        className="checkbox checkbox-sm checkbox-primary"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium">{sucursal.name}</span>
                        {sucursal.address && (
                          <p className="text-xs text-gray-500">{sucursal.address}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedSucursales.length > 0 && (
            <p className="mt-2 text-sm text-blue-600">
              {selectedSucursales.length} sucursal(es) seleccionada(s)
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Contraseña *</label>
            <input
              name="password"
              onChange={onChange}
              type="password"
              className={`w-full border px-3 py-2 ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              } rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none`}
              placeholder="••••••••"
              value={formData.password}
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Confirmar contraseña *</label>
            <div className="relative">
              <input
                name="confirmPassword"
                onChange={onChange}
                type={seeValidatePassword ? 'text' : 'password'}
                className={`w-full border px-3 py-2 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                } rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                placeholder="Repita su contraseña"
                value={formData.confirmPassword}
              />
              {seeValidatePassword ? (
                <EyeClosed
                  onClick={() => setSeeValidatePassword(!seeValidatePassword)}
                  className="absolute top-2.5 right-3 h-5 w-5 cursor-pointer text-gray-500"
                />
              ) : (
                <Eye
                  onClick={() => setSeeValidatePassword(!seeValidatePassword)}
                  className="absolute top-2.5 right-3 h-5 w-5 cursor-pointer text-gray-500"
                />
              )}
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary bg-primary mt-6 w-full rounded-md px-4 py-2 font-medium transition duration-300"
        >
          Registrar Usuario
        </button>
      </form>
      <Toaster />
    </div>
  )
}

export default CreateUser
