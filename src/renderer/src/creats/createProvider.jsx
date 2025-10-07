import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { postData } from '../services/proveedores/proveedorService'
import { useHashLocation } from 'wouter/use-hash-location'

function CreateProvider() {
  const [, setLocation] = useHashLocation()
  const [formData, setFormData] = useState({
    entity_name: '',
    entity_type: 'provider',
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
      newErrors.entity_name = 'El nombre comercial es obligatorio.'
    }

    if (!formData.razon_social || formData.razon_social.trim() === '') {
      newErrors.razon_social = 'La razón social es obligatoria.'
    }

    if (!formData.responsabilidad_iva || formData.responsabilidad_iva.trim() === '') {
      newErrors.responsabilidad_iva = 'La responsabilidad IVA es obligatoria.'
    } else if (isNaN(formData.responsabilidad_iva) || parseInt(formData.responsabilidad_iva) < 0) {
      newErrors.responsabilidad_iva = 'La responsabilidad IVA debe ser un número válido.'
    }

    if (!formData.domicilio_comercial || formData.domicilio_comercial.trim() === '') {
      newErrors.domicilio_comercial = 'El domicilio comercial es obligatorio.'
    }

    if (!formData.cuit || !/^\d{11}$/.test(formData.cuit)) {
      newErrors.cuit = 'El número ingresado debe contener exactamente 11 dígitos.'
    }

    if (!formData.phone_number || !/^\d{10,15}$/.test(formData.phone_number)) {
      newErrors.phone_number = 'El número de celular debe contener entre 10 y 15 dígitos.'
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El formato del correo electrónico no es válido.'
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
        console.log('Sending data:', formData)
        const response = await postData(formData)
        console.log('Response:', response)

        if (response.status === 'éxito' || response.mensaje?.includes('éxito')) {
          setLocation('/proveedores')
        } else {
          console.error('Error en la respuesta del servidor:', response)
          alert(`Error: ${response.mensaje || 'Error desconocido'}`)
        }
      } catch (error) {
        console.error('Error al enviar los datos:', error)

        if (error.response?.data?.mensaje) {
          alert(`Error: ${error.response.data.mensaje}`)
        } else if (error.response?.data?.error) {
          alert(`Error: ${error.response.data.error}`)
        } else if (
          error.response?.status === 400 &&
          error.response?.data?.error === 'CUIT duplicado'
        ) {
          alert(
            'Error: El CUIT ingresado ya existe en el sistema. Por favor, verifique el número ingresado.'
          )
        } else {
          alert(`Error: ${error.message || 'Error desconocido al crear el proveedor'}`)
        }
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
            onClick={() => setLocation('/proveedores')}
            className="tooltip tooltip-bottom btn btn-ghost btn-circle mr-4"
            data-tip="Volver"
          >
            <ArrowLeft />
          </button>
          <h2 className="text-3xl font-bold text-warning">Crear Proveedor</h2>
        </div>
        <div className="space-y-6">
          {[
            {
              label: 'Nombre comercial *',
              name: 'entity_name',
              type: 'text',
              placeholder: 'Ingrese el nombre del comercio'
            },
            {
              label: 'Razón social *',
              name: 'razon_social',
              type: 'text',
              placeholder: 'Ingrese razón social'
            },
            {
              label: 'Responsabilidad IVA *',
              name: 'responsabilidad_iva',
              type: 'number',
              placeholder: '#####'
            },
            {
              label: 'Domicilio *',
              name: 'domicilio_comercial',
              type: 'text',
              placeholder: 'Avenida Siempreviva 742.'
            },
            { label: 'Cuit *', name: 'cuit', type: 'text', placeholder: '#####' },

            {
              label: 'Número de celular*',
              name: 'phone_number',
              type: 'text',
              placeholder: 'Ingrese número de celular'
            },
            {
              label: 'Nombre de contacto',
              name: 'contact_name',
              type: 'text',
              placeholder: 'Ingrese nombre de contacto'
            },
            { label: 'Email *', name: 'email', type: 'email', placeholder: 'ejemplo@correo.com' },
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
            onClick={() => setLocation('/proveedores')}
          >
            Cancelar
          </button>
          <button
            className="hover:bg-success-focus btn btn-success rounded-xl px-6 py-2 transition"
            onClick={handleSubmit}
          >
            Agregar proveedor
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateProvider
