import { useState, useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { putData } from '../../services/clientes/clientsService'
import { CircleX, Save } from 'lucide-react'

function EditarClienteModal({ cliente }) {
  const [formData, setFormData] = useState({
    entity_name: '',
    entity_type: 'client',
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
    if (cliente) {
      setFormData({
        entity_name: cliente.entity_name || '',
        entity_type: cliente.entity_type || 'client',
        razon_social: cliente.razon_social || '',
        responsabilidad_iva: cliente.responsabilidad_iva || '',
        domicilio_comercial: cliente.domicilio_comercial || '',
        cuit: cliente.cuit || '',
        inicio_actividades: cliente.inicio_actividades || '',
        ingresos_brutos: cliente.ingresos_brutos || '',
        contact_name: cliente.contact_name || '',
        phone_number: cliente.phone_number || '',
        email: cliente.email || '',
        observations: cliente.observations || ''
      })
    }
  }, [cliente])

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
      const response = await putData(cliente.id, formData)
      toast.success('Cliente editado con éxito')
      console.log('Respuesta:', response)
    } catch (error) {
      console.error('Error al editar el cliente:', error)
      toast.error('Error al editar el cliente')
    }
  }
  const [errors, setErrors] = useState({})
  const handleValidate = () => {
    const newErrors = {}

    if (!formData.entity_name.trim()) {
      newErrors.entity_name = 'El nombre del cliente es obligatorio.'
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
      <dialog id="editandoCliente" className="modal">
        <div className="modal-box w-11/12 max-w-5xl">
          <h3 className="text-lg font-bold">Editar la informacion de: {cliente?.entity_name} </h3>
          <div className="flex flex-col gap-4">
            <label htmlFor="" className="">
              Nombre y apellido:{' '}
            </label>
            <input
              type="text"
              className="input"
              name="entity_name"
              placeholder={cliente?.entity_name}
              defaultValue={cliente?.entity_name}
              value={formData.entity_name}
              onChange={handleChange}
            />
            {errors.entity_name && <span className="text-red-500">{errors.entity_name}</span>}
            <label htmlFor="">Dirección: </label>
            <input
              type="text"
              className="input"
              name="domicilio_comercial"
              placeholder={cliente?.domicilio_comercial}
              value={formData.domicilio_comercial}
              onChange={handleChange}
            />
            <label htmlFor="">Numero de teléfono: </label>
            <input
              type="text"
              className="input"
              name="phone_number"
              placeholder={cliente?.phone_number}
              value={formData.phone_number}
              onChange={handleChange}
            />
            {errors.phone_number && <span className="text-red-500">{errors.phone_number}</span>}
            <label htmlFor="">Mail: </label>
            <input
              type="text"
              className="input"
              name="email"
              placeholder={cliente?.email}
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <span className="text-red-500">{errors.email}</span>}
            <label htmlFor="">Obervaciones: </label>
            <input
              type="text"
              className="input"
              name="observations"
              placeholder={cliente?.observations}
              value={formData.observations}
              onChange={handleChange}
            />
          </div>
          <div className="modal-action">
            <form method="dialog">
              <div className="space-x-4">
                <button className="btn btn-neutral">
                  <CircleX className="mr-2" />
                  Cancelar
                </button>
                <button className="btn btn-success" onClick={handleEdit}>
                  <Save /> Aceptar
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

export default EditarClienteModal
