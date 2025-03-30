import { useState } from 'react'
import { enviarData } from '../services/pruebita'
import toast, { Toaster } from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'
import { useLocation } from 'wouter'
import { se } from 'react-day-picker/locale'



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
    confirmPassword: ''
  })
  const [previewImage, setPreviewImage] = useState(null);

  //Esto va al form data, y lo que ha cambiado le cambia el valor
  const onChange = (e) => {
    const { name, value, files } = e.target
    if (name === "foto") {
      const file = files[0]
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
        foto: file,
      }))
      setPreviewImage(URL.createObjectURL(file))
    }
    else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }))
    }
  }

  const isFormComplete = Object.values(formData).every(value => value.trim() !== "");

  const handleSubmit = () => {
    if (isFormComplete) {
      const data = new FormData();
      // Añadir cada propiedad del objeto formData al FormData de JavaScript
      for (const key in formData) {
        if (formData[key] !== null) {
          data.append(key, formData[key]);
        }
      }

      enviarData(data).then(() => {
        console.log("Se enviaron los datos con éxito");
        toast.success("Usuario creado con éxito", {
          position: "top-right",
          duration: 3000,
          style: {
            background: "#4caf50",
            color: "#fff",
          },
        });
        setLocation("/home");
      }).catch((error) => {
        console.error("Error al enviar los datos:", error);
        toast.error("Ocurrió un error al enviar los datos", {
          position: "top-right",
          duration: 3000,
          style: {
            background: "#f44336",
            color: "#fff",
          },
        });
      });

    } else {
      toast.error("Por favor complete todos los campos", {
        position: "top-right",
        duration: 3000,
        style: {
          background: "#f44336",
          color: "#fff",
        },
      });
    }
  }


  return (
    <div className="max-w-md mx-auto p-6  rounded-lg shadow-md mt-4 bg-base-100">
      <div className='flex items-center gap-4 '>
        <button onClick={() => setLocation("/home")} type='button' className='flex items-center justify-cente btn btn-icon btn-circle bg-base-300'>
          <ArrowLeft className="w-6 h-6 cursor-pointer" />
        </button>
        <h2 className="text-2xl font-bold">Registro de Usuario</h2>
      </div>

      <div className="space-y-4 mt-4">
        <div>
          <input type="text" />
        </div>
        {/* Foto de perfil */}
        <div className="form-control">
          <label className="block text-sm font-medium mb-1">Foto de Perfil</label>
          {previewImage && (
            <div className='flex justify-center'>

              <div className="avatar mb-4 justify-center">
                <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img src={previewImage} alt="Vista previa de la imagen" />
                </div>
              </div>
            </div>
          )}
          <input
            type="file"
            name="foto"
            accept="image/*"
            onChange={onChange}
            className="file-input file-input-bordered file-input-primary w-full"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium  mb-1">Nombre</label>
            <input
              name="nombre"
              onChange={onChange}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingrese su nombre"
            />
          </div>
          <div>
            <label className="block text-sm font-medium  mb-1">Apellido</label>
            <input
              name="apellido"
              onChange={onChange}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingrese su apellido"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium  mb-1">Username</label>
          <input
            name="username"
            onChange={onChange}
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ingrese su nombre"
          />
        </div>

        <div>
          <label className="block text-sm font-medium  mb-1">Email</label>
          <input
            name="email"
            onChange={onChange}
            type="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ejemplo@correo.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium  mb-1">Teléfono</label>
          <input
            name="telefono"
            onChange={onChange}
            type="tel"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+1234567890"
          />
        </div>

        <div>
          <label className="block text-sm font-medium  mb-1">Rol</label>
          <select
            name="rol"
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 "
          >
            <option value="" disabled selected>Seleccione un rol</option>
            <option value="admin">Administrador</option>
            <option value="user">Empleado</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium  mb-1">Sucursal</label>
          <select
            name="sucursal"
            onChange={onChange}
            className="multiple-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 "
          >
            <option value="" disabled selected>Seleccione sucursal</option>
            <option value="admin">Paraná</option>
            <option value="user">Concordia</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium  mb-1">Contraseña</label>
            <input
              name="password"
              onChange={onChange}
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium  mb-1">Repetir contraseña</label>
            <input
              name="confirmPassword"
              onChange={onChange}
              type="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
        </div>
      </div>

      <button type="button" onClick={handleSubmit} className="btn btn-primary w-full mt-6  bg-primary font-medium py-2 px-4 rounded-md transition duration-300">
        Registrar Usuario
      </button>
      <Toaster />
    </div>
  )
}

export default CreateUser
