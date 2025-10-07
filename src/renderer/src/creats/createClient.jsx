import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { postData } from '../services/clientes/clientsService'
import { useHashLocation } from 'wouter/use-hash-location'
//Cambiar validaciones, adaptarlas mas al cliente
function CreateClient() {
  const [, setLocation] = useHashLocation()
  const [formData, setFormData] = useState({
    entity_name: '',
    entity_type: 'client',
    razon_social: '',
    responsabilidad_iva: '',
    domicilio_comercial: '',
    cuit: '',
    inicio_actividades: '',
    ingresos_brutos: '0',
    contact_name: '',
    phone_number: '',
    email: '',
    observations: ''
  })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const newErrors = {}

    if (!formData.entity_name || formData.entity_name.trim() === '') {
      newErrors.entity_name = 'El nombre del cliente es obligatorio.'
    }

    if (!formData.cuit || !/^\d{7,11}$/.test(formData.cuit)) {
      newErrors.cuit = 'El número ingresado debe contener entre 7 y 10 dígitos.'
    }

    if (!formData.phone_number || !/^\d{10,15}$/.test(formData.phone_number)) {
      newErrors.phone_number = 'El número de celular debe contener entre 10 y 15 dígitos.'
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El formato del email es inválido.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    formData.inicio_actividades = new Date().toISOString().split('T')[0]

    if (validate()) {
      try {
        console.log('Form data is valid.')
        const response = await postData(formData)
        console.log(response)
        setLocation('/clientes')

        if (response.success || response.status === 200) {
          setLocation('/clientes')
        } else {
          console.error('Error en la respuesta del servidor:', response)
        }
      } catch (error) {
        console.error('Error al enviar los datos:', error)
      }
    }
  }

  const onChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }
  return (
    <div className="flex flex-col items-center p-10">
      <div className="w-full max-w-4xl rounded-2xl bg-base-100 p-8 shadow-xl">
        <div className="mb-6 flex items-center">
          <button
            onClick={() => setLocation('/clientes')}
            className="tooltip tooltip-bottom btn btn-ghost btn-circle mr-4"
            data-tip="Volver"
          >
            <ArrowLeft />
          </button>
          <h2 className="text-3xl font-bold text-warning">Crear cliente</h2>
        </div>
        <div className="space-y-6">
          {[
            {
              label: 'Nombre y apellido*',
              name: 'entity_name',
              type: 'text',
              placeholder: 'Ingrese el nombre del comercio'
            },
            {
              label: 'Razón social',
              name: 'razon_social',
              type: 'text',
              placeholder: 'Ingrese razón social'
            },
            {
              label: 'Responsabilidad IVA',
              name: 'responsabilidad_iva',
              type: 'number',
              placeholder: '#####'
            },
            {
              label: 'Domicilio',
              name: 'domicilio_comercial',
              type: 'text',
              placeholder: 'Avenida Siempreviva 742.'
            },
            { label: 'Cuit o DNI *', name: 'cuit', type: 'text', placeholder: '#####' },

            {
              label: 'Número de celular*',
              name: 'phone_number',
              type: 'text',
              placeholder: 'Ingrese número de celular'
            },
            { label: 'Email', name: 'email', type: 'email', placeholder: 'ejemplo@correo.com' },
            {
              label: 'Observaciones',
              name: 'observations',
              type: 'text',
              placeholder: 'Ingrese observaciones (opcional)'
            }
          ].map((field, index) => (
            <div key={index}>
              <label className="mb-1 block text-sm font-medium">{field.label}</label>
              <input
                name={field.name}
                onChange={onChange}
                type={field.type}
                className={`w-full border px-4 py-2 ${errors[field.name] ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                placeholder={field.placeholder}
                value={formData[field.name] || ''}
              />
              {errors[field.name] && (
                <p className="mt-1 text-xs text-red-500">{errors[field.name]}</p>
              )}
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-end gap-6">
          <button
            className="hover:bg-neutral-focus btn btn-neutral rounded-xl px-6 py-2 transition"
            onClick={() => setLocation('/clientes')}
          >
            Cancelar
          </button>
          <button
            className="hover:bg-success-focus btn btn-success rounded-xl px-6 py-2 transition"
            onClick={handleSubmit}
          >
            Agregar cliente
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateClient
