import { useState, useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { putData } from '../../services/proveedores/proveedorService'
import { FileText, Mail, MapPin, Phone, Save, User, X } from 'lucide-react'

function EditarProveedorModal({ provider }) {
  const [formData, setFormData] = useState({
    entity_name: '',
    entity_type: 'provider',
    razon_social: '',
    responsabilidad_iva: '',
    domicilio_comercial: '',
    cuit: '',
    inicio_actividades: '', //Colocar la fecha que es creada
    ingresos_brutos: '', //se setea en 0
    contact_name: '',
    phone_number: '',
    email: '',
    observations: ''
  })

  useEffect(() => {
    if (provider) {
      setFormData({
        entity_name: provider.entity_name || '',
        entity_type: provider.entity_type || 'provider',
        razon_social: provider.razon_social || '',
        responsabilidad_iva: provider.responsabilidad_iva || '',
        domicilio_comercial: provider.domicilio_comercial || '',
        cuit: provider.cuit || '',
        inicio_actividades: provider.inicio_actividades || '',
        ingresos_brutos: provider.ingresos_brutos || '',
        contact_name: provider.contact_name || '',
        phone_number: provider.phone_number || '',
        email: provider.email || '',
        observations: provider.observations || ''
      })
    }
  }, [provider])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    const isValid = handleValidate()

    if (!isValid) {
      toast.error('Faltan campos obligatorios por completar o están mal formateados')
      return
    }

    try {
      const response = await putData(provider.id, formData)
      toast.success('Provider editado con éxito')
      console.log('Respuesta:', response)
    } catch (error) {
      console.error('Error al editar el provider:', error)
      toast.error('Error al editar el provider')
    }
  }
  const [errors, setErrors] = useState({})
  const handleValidate = () => {
    const newErrors = {}

    if (!formData.entity_name.trim()) {
      newErrors.entity_name = 'El nombre del provider es obligatorio.'
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'El número de celular es obligatorio.'
    } else if (!/^\d{10,15}$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Debe tener entre 10 y 15 dígitos numéricos.'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio.'
    } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
      newErrors.email = 'El email no tiene un formato válido.'
    }

    setErrors(newErrors)

    // Retorna true si no hay errores
    return Object.keys(newErrors).length === 0
  }

  return (
    <div>
      <dialog id="editandoProvider" className="modal">
        <div className="modal-box w-11/12 max-w-4xl bg-gradient-to-br from-white to-gray-50 shadow-2xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Editar Proveedor</h3>
                <p className="text-sm text-gray-600">{provider?.entity_name}</p>
              </div>
            </div>
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5 hover:text-gray-600" />
              </button>
            </form>
          </div>

          {/* Form Content */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2 font-medium text-gray-700">
                    <User className="h-4 w-4" />
                    Nombre del contacto
                  </span>
                </label>
                <input
                  type="text"
                  className={`input input-bordered w-full bg-white transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
                    errors.contact_name ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                  name="contact_name"
                  placeholder="Ingrese el nombre completo"
                  value={formData.contact_name}
                  onChange={handleChange}
                />
                {errors.contact_name && (
                  <label className="label">
                    <span className="label-text-alt flex items-center gap-1 text-red-500">
                      {errors.contact_name}
                    </span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2 font-medium text-gray-700">
                    <MapPin className="h-4 w-4" />
                    Dirección
                  </span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full bg-white transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  name="domicilio_comercial"
                  placeholder="Ingrese la dirección"
                  value={formData.domicilio_comercial}
                  onChange={handleChange}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2 font-medium text-gray-700">
                    <Phone className="h-4 w-4" />
                    Número de teléfono
                  </span>
                </label>
                <input
                  type="text"
                  className={`input input-bordered w-full bg-white transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
                    errors.phone_number ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                  name="phone_number"
                  placeholder="Ingrese el número de teléfono"
                  value={formData.phone_number}
                  onChange={handleChange}
                />
                {errors.phone_number && (
                  <label className="label">
                    <span className="label-text-alt flex items-center gap-1 text-red-500">
                      <Phone className="h-3 w-3" />
                      {errors.phone_number}
                    </span>
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2 font-medium text-gray-700">
                    <Mail className="h-4 w-4" />
                    Correo electrónico
                  </span>
                </label>
                <input
                  type="email"
                  className={`input input-bordered w-full bg-white transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                  name="email"
                  placeholder="ejemplo@correo.com"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <label className="label">
                    <span className="label-text-alt flex items-center gap-1 text-red-500">
                      <Mail className="h-4 w-4" />
                      {errors.email}
                    </span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text flex items-center gap-2 font-medium text-gray-700">
                    <FileText className="h-4 w-4" />
                    Observaciones
                  </span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24 w-full resize-none bg-white transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  name="observations"
                  placeholder="Ingrese observaciones adicionales..."
                  value={formData.observations}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 flex justify-end gap-3 border-t border-gray-200 pt-6">
            <form method="dialog">
              <button className="btn btn-outline btn-neutral transition-colors duration-200 hover:bg-gray-100">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Cancelar
              </button>
            </form>
            <button
              className="btn btn-success shadow-md transition-colors duration-200 hover:bg-green-600"
              onClick={handleEdit}
            >
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
            </button>
          </div>

          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff'
              },
              success: {
                style: {
                  background: '#10b981'
                }
              },
              error: {
                style: {
                  background: '#ef4444'
                }
              }
            }}
          />
        </div>
      </dialog>
    </div>
  )
}

export default EditarProveedorModal
