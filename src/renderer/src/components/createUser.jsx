import { useEffect } from 'react'
import { prueba } from '../services/pruebita'
import { ArrowLeft } from 'lucide-react'
import { useLocation } from 'wouter'


function CreateUser() {
    const [location, setLocation] = useLocation()
    useEffect(() => {
        prueba().then(() => {
            console.log("Me ejecute una vez")
        }).catch((error) => {
            console.error('Error fetching data:', error)
        })
        // Aquí puedes hacer algo con la respuesta, como actualizar el estado o mostrarla en la interfaz de usuario
    }, [])
    return (
<div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
    <ArrowLeft className="w-6 h-6 text-gray-500 cursor-pointer" onClick={() => setLocation("/")} />
  <h2 className="text-2xl font-bold text-gray-800 mb-6">Registro de Usuario</h2>
  
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
        <input 
          type="text" 
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ingrese su nombre"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
        <input 
          type="text" 
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ingrese su apellido"
        />
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
      <input 
        type="email" 
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="ejemplo@correo.com"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
      <input 
        type="tel" 
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="+1234567890"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
      <select 
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="" disabled selected>Seleccione un rol</option>
        <option value="admin">Admin</option>
        <option value="user">User</option>
        <option value="guest">Guest</option>
      </select>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
        <input 
          type="password" 
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="••••••••"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Repetir contraseña</label>
        <input 
          type="password" 
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="••••••••"
        />
      </div>
    </div>
  </div>

  <button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-300">
    Registrar Usuario
  </button>
</div>
    )
}

export default CreateUser
