import { useState } from 'react'
import { enviarData } from '../services/usuarioService'
import toast, { Toaster } from 'react-hot-toast'
import { ArrowLeft, Eye } from 'lucide-react'
import { useLocation } from 'wouter'
import { useDropzone } from 'react-dropzone';

const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

function CreateUser() {
  const [, setLocation] = useLocation()
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    username: '',
    email: '',
    telefono: '',
    rol: '',
    sucursal: '',
    password: '',
    confirmPassword: '',
    avatar: null
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
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Por favor corrija los errores en el formulario", {
        position: "top-right",
        duration: 3000,
        style: {
          background: "#f44336",
          color: "#fff",
        },
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
      toast.success("Usuario creado con éxito", {
        position: "top-right",
        duration: 3000,
        style: {
          background: "#4caf50",
          color: "#fff",
        },
      })
      setLocation("/home")
    } catch (error) {
      console.error("Error al enviar los datos:", error)
      toast.error(error.message || "Ocurrió un error al enviar los datos", {
        position: "top-right",
        duration: 3000,
        style: {
          background: "#f44336",
          color: "#fff",
        },
      })
    }
  }

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: 'image/*',
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      const base64 = await convertToBase64(file);
      setFormData({ ...formData, avatar: base64 });
    }
  });


  console.log({ formData })

  /**
   * Converts a base64 image to a Blob and creates an object URL
   * @param base64Data The base64 encoded image data (with or without data URI prefix)
   * @returns The object URL that can be used as an image source
   */
  function base64ToObjectUrl(base64Data) {
    // Extract content type and base64 data
    let contentType = 'image/png'; // default
    let base64WithoutPrefix = base64Data;

    // Check if it's a data URI and extract content type
    if (base64Data.startsWith('data:')) {
      const matches = base64Data.match(/^data:(.+?);/);
      if (matches && matches[1]) {
        contentType = matches[1];
      }
      base64WithoutPrefix = base64Data.split(';base64,').pop();
    }

    // Convert base64 to raw binary data
    const byteCharacters = atob(base64WithoutPrefix);
    const byteArrays = [];

    // Convert each character to byte array
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    // Create blob from byte arrays
    const blob = new Blob(byteArrays, { type: contentType });

    // Create and return object URL
    return URL.createObjectURL(blob);
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
    <div className="max-w-md mx-auto p-6 rounded-lg shadow-md mt-4 bg-base-100">
      <div className='flex items-center gap-4 '>
        <button
          onClick={() => setLocation("/home")}
          type='button'
          className='flex items-center justify-cente btn btn-icon btn-circle bg-base-300'
        >
          <ArrowLeft className="w-6 h-6 cursor-pointer" />
        </button>
        <h2 className="text-2xl font-bold">Registro de Usuario</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Foto de perfil</span>
          </label>

          {formData.avatar && (
            <div className="mt-2 flex justify-center items-center flex-col">
              <div className="avatar justify-center">
                <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img src={base64ToObjectUrl(formData.avatar)} alt="Preview" />
                </div>
              </div>
              <span className="text-sm">{formData.avatar.name}</span>
            </div>
          )}
        </div>
        <div {...getRootProps()} className="border-2 border-dashed p-4 rounded-lg">
          <input {...getInputProps()} />
          <p>Arrastra tu imagen aquí o haz click</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              name="nombre"
              onChange={onChange}
              type="text"
              className={`w-full px-3 py-2 border ${errors.nombre ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Ingrese su nombre"
              value={formData.nombre}
            />
            {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Apellido</label>
            <input
              name="apellido"
              onChange={onChange}
              type="text"
              className={`w-full px-3 py-2 border ${errors.apellido ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Ingrese su apellido"
              value={formData.apellido}
            />
            {errors.apellido && <p className="text-red-500 text-xs mt-1">{errors.apellido}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            name="username"
            onChange={onChange}
            type="text"
            className={`w-full px-3 py-2 border ${errors.username ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="Ingrese su nombre de usuario"
            value={formData.username}
          />
          {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            name="email"
            onChange={onChange}
            type="email"
            className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="ejemplo@correo.com"
            value={formData.email}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Teléfono</label>
          <input
            name="telefono"
            onChange={onChange}
            type="tel"
            className={`w-full px-3 py-2 border ${errors.telefono ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            placeholder="+1234567890"
            value={formData.telefono}
          />
          {errors.telefono && <p className="text-red-500 text-xs mt-1">{errors.telefono}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Rol</label>
          <select
            name="rol"
            onChange={onChange}
            className={`w-full px-3 py-2 border ${errors.rol ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            value={formData.rol}
          >
            <option value="">Seleccione un rol</option>
            <option value="admin">Administrador</option>
            <option value="user">Empleado</option>
          </select>
          {errors.rol && <p className="text-red-500 text-xs mt-1">{errors.rol}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Sucursal</label>
          <select
            name="sucursal"
            onChange={onChange}
            className={`w-full px-3 py-2 border ${errors.sucursal ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            value={formData.sucursal}
          >
            <option value="">Seleccione sucursal</option>
            <option value="parana">Paraná</option>
            <option value="concordia">Concordia</option>
          </select>
          {errors.sucursal && <p className="text-red-500 text-xs mt-1">{errors.sucursal}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input
              name="password"
              onChange={onChange}
              type="password"
              className={`w-full px-3 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="••••••••"
              value={formData.password}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Repetir contraseña</label>
            <input
              name="confirmPassword"
              onChange={onChange}

              type={seeValidatePassword ? 'text' : 'password'}
              className={`w-full px-3 py-2 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="••••••••"
              value={formData.confirmPassword}
            />


            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>
        </div>
        <button type='btn' onClick={handleWatchValidatePassword} className='absolute right-3 top-10'>
          {seeValidatePassword ? <Eye className='text-primary' /> : <Eye className='text-gray-400' />}
          <Eye />
        </button>

        <button
          type="submit"
          className="btn btn-primary w-full mt-6 bg-primary font-medium py-2 px-4 rounded-md transition duration-300"
        >
          Registrar Usuario
        </button>
      </form>
      <Toaster />
    </div>
  )
}

export default CreateUser
