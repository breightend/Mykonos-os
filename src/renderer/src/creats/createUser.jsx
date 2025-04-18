import { useState } from 'react'
import { enviarData } from '../services/usuario/usuarioService'
import toast, { Toaster } from 'react-hot-toast'
import { ArrowLeft, Eye } from 'lucide-react'
import { useLocation } from 'wouter'
import { useDropzone } from 'react-dropzone'

function CreateUser() {
  const [, setLocation] = useLocation()
  const [formData, setFormData] = useState({
    username: '',
    fullname: '',
    password: '',
    email: '',
    phone: '',
    domicilio: '',
    cuit: '',
    role: '',
    status: 'active',
    profile_image: '',
    created_at: ''
  })
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    // Check all fields are filled
    for (const key in formData) {
      if (!formData[key].trim()) {
        newErrors[key] = 'Este campo es requerido'
      }
    }

    // Email validation
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Ingrese un email válido'
    }

    // Password match validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    // Password strength validation (optional)
    if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const onChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Por favor corrija los errores en el formulario', {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#f44336',
          color: '#fff'
        }
      })
      return
    }

    try {
      const data = new FormData()
      for (const key in formData) {
        if (formData[key] !== null && formData[key] !== undefined) {
          data.append(key, formData[key])
        }
      }

      await enviarData(data)
      toast.success('Usuario creado con éxito', {
        position: 'top-right',
        duration: 3000,
        style: {
          background: '#4caf50',
          color: '#fff'
        }
      })
      setLocation('/home')
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

  const { getRootProps, getInputProps } = useDropzone({
    accept: 'image/*',
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0]
      const base64 = await convertToBase64(file)
      setFormData({ ...formData, avatar: base64 })
    }
  })

  console.log({ formData })

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

  const [seePassword, setSeePassword] = useState(false)
  const [seeValidatePassword, setSeeValidatePassword] = useState(false)
  /*   const handleWatchPassword = () => {
      setSeePassword(!seePassword)
    } */
  const handleWatchValidatePassword = () => {
    setSeeValidatePassword(!seeValidatePassword)
  }

  return (
    <div className="bg-base-100 mx-auto mt-4 max-w-md rounded-lg p-6 shadow-md">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setLocation('/home')}
          type="button"
          className="justify-cente btn btn-icon btn-circle bg-base-300 flex items-center"
        >
          <ArrowLeft className="h-6 w-6 cursor-pointer" />
        </button>
        <h2 className="text-2xl font-bold">Registro de Usuario</h2>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Foto de perfil</span>
          </label>

          {formData.avatar && (
            <div className="mt-2 flex flex-col items-center justify-center">
              <div className="avatar justify-center">
                <div className="ring-primary ring-offset-base-100 w-24 rounded-full ring ring-offset-2">
                  <img src={base64ToObjectUrl(formData.profile_image)} alt="Preview" />
                </div>
              </div>
              <span className="text-sm">{formData.profile_image.name}</span>
            </div>
          )}
        </div>
        <div {...getRootProps()} className="rounded-lg border-2 border-dashed p-4">
          <input {...getInputProps()} />
          <p>Arrastra tu imagen aquí o haz click</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre</label>
            <input
              name="nombre"
              onChange={onChange}
              type="text"
              className={`w-full border px-3 py-2 ${errors.nombre ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none`}
              placeholder="Ingrese su nombre"
              value={formData.nombre}
            />
            {errors.nombre && <p className="mt-1 text-xs text-red-500">{errors.nombre}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Apellido</label>
            <input
              name="apellido"
              onChange={onChange}
              type="text"
              className={`w-full border px-3 py-2 ${errors.apellido ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none`}
              placeholder="Ingrese su apellido"
              value={formData.apellido}
            />
            {errors.apellido && <p className="mt-1 text-xs text-red-500">{errors.apellido}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Username</label>
          <input
            name="username"
            onChange={onChange}
            type="text"
            className={`w-full border px-3 py-2 ${errors.username ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none`}
            placeholder="Ingrese su nombre de usuario"
            value={formData.username}
          />
          {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            name="email"
            onChange={onChange}
            type="email"
            className={`w-full border px-3 py-2 ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none`}
            placeholder="ejemplo@correo.com"
            value={formData.email}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Teléfono</label>
          <input
            name="phone"
            onChange={onChange}
            type="tel"
            className={`w-full border px-3 py-2 ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none`}
            placeholder="+1234567890"
            value={formData.phone}
          />
          {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Rol</label>
          <select
            name="rol"
            onChange={onChange}
            className={`w-full border px-3 py-2 ${errors.role ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none`}
            value={formData.role}
          >
            <option value="">Seleccione un rol</option>
            <option value="admin">Administrador</option>
            <option value="employee">Empleado</option>
          </select>
          {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Sucursal</label>
          <select
            name="sucursal"
            onChange={onChange}
            className={`w-full border px-3 py-2 ${errors.sucursal ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none`}
            value={formData.sucursal}
          >
            <option value="">Seleccione sucursal</option>
            <option value="parana">Paraná</option>
            <option value="concordia">Concordia</option>
          </select>
          {errors.sucursal && <p className="mt-1 text-xs text-red-500">{errors.sucursal}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Contraseña</label>
            <input
              name="password"
              onChange={onChange}
              type="password"
              className={`w-full border px-3 py-2 ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none`}
              placeholder="••••••••"
              value={formData.password}
            />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Repetir contraseña</label>
            <input
              name="confirmPassword"
              onChange={onChange}
              type={seeValidatePassword ? 'text' : 'password'}
              className={`w-full border px-3 py-2 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none`}
              placeholder="••••••••"
              value={formData.confirmPassword}
            />

            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
            )}
          </div>
        </div>
        <button
          type="btn"
          onClick={handleWatchValidatePassword}
          className="absolute top-10 right-3"
        >
          {seeValidatePassword ? (
            <Eye className="text-primary" />
          ) : (
            <Eye className="text-gray-400" />
          )}
          <Eye />
        </button>

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
