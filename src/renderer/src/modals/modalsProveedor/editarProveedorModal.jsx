import { useState, useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { putData } from '../../services/proveedores/proveedorService'

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
        <div className="modal-box w-11/12 max-w-5xl">
          <h3 className="text-lg font-bold">Editar la informacion de: {provider?.entity_name} </h3>
          <div className="flex flex-col gap-4">
            <label htmlFor="" className="">
              Nombre y apellido:{' '}
            </label>
            <input
              type="text"
              className="input"
              name="entity_name"
              placeholder={provider?.entity_name}
              defaultValue={provider?.entity_name}
              value={formData.entity_name}
              onChange={handleChange}
            />
            {errors.entity_name && <span className="text-red-500">{errors.entity_name}</span>}
            <label htmlFor="">Dirección: </label>
            <input
              type="text"
              className="input"
              name="domicilio_comercial"
              placeholder={provider?.domicilio_comercial}
              value={formData.domicilio_comercial}
              onChange={handleChange}
            />
            <label htmlFor="">Numero de teléfono: </label>
            <input
              type="text"
              className="input"
              name="phone_number"
              placeholder={provider?.phone_number}
              value={formData.phone_number}
              onChange={handleChange}
            />
            {errors.phone_number && <span className="text-red-500">{errors.phone_number}</span>}
            <label htmlFor="">Mail: </label>
            <input
              type="text"
              className="input"
              name="email"
              placeholder={provider?.email}
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <span className="text-red-500">{errors.email}</span>}
            <label htmlFor="">Obervaciones: </label>
            <input
              type="text"
              className="input"
              name="observations"
              placeholder={provider?.observations}
              value={formData.observations}
              onChange={handleChange}
            />
          </div>
          <div className="modal-action">
            <form method="dialog">
              <div className="space-x-4">
                <button className="btn btn-neutral">Cancelar</button>
                <button className="btn btn-success" onClick={handleEdit}>
                  Aceptar
                </button>
                <Toaster position="bottom-right" />
              </div>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  )
}

export default EditarProveedorModal
