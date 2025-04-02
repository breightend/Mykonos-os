import { ArrowLeft } from 'lucide-react'
import { useLocation } from 'wouter'
import { useState } from 'react'
import { postData } from '../services/proveedores/proveedorService'

function CreateProvider() {
    const [location, setLocation] = useLocation()
    const [formData, setFormData] = useState({
        entity_name: '',
        entity_type: '', //No me tengo que olvidar de poner proveedor
        razon_social: '',
        responsabilidad_iva: '',
        domicilio_comercial: '',
        cuit: '',
        inicio_actividad: '', //Colocar la fecha que es creada
        ingreso_brutos: '',//se setea en 0 
        contact_name: '',
        phone_number: '',
        email: '',
        observation: '',
    })
    const [errors, setErrors] = useState({})
    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const response = await postData(formData)
            console.log(response)

        } catch (error) {
            console.error('Error al enviar los datos:', error)
        }
    }
    const onChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }))
        }
    }
    return (
        <div className="flex flex-col items-center p-10">
            <div className="w-full max-w-4xl bg-base-100 shadow-xl rounded-2xl p-8">
                <div className="flex items-center mb-6">
                    <button onClick={() => setLocation('/proveedores')} className="btn btn-ghost btn-circle tooltip tooltip-bottom mr-4" data-tip="Volver">
                        <ArrowLeft />
                    </button>
                    <h2 className="text-3xl font-bold text-warning">Crear Proveedor</h2>
                </div>
                <div className="space-y-6">
                    {[
                        { label: 'Nombre comercial', name: 'entity_name', type: 'text', placeholder: 'Ingrese el nombre del comercio' },
                        { label: 'Razón social', name: 'razon_social', type: 'text', placeholder: 'Ingrese razón social' },
                        { label: 'Responsabilidad IVA', name: 'responsabilidad_iva', type: 'number', placeholder: '#####' },
                        { label: 'Domicilio comercial', name: 'domicilio_comercial', type: 'text', placeholder: 'Avenida Siempreviva 742.' },
                        { label: 'Cuit', name: 'cuit', type: 'text', placeholder: '#####' },
                        { label: 'Nombres de contacto', name: 'contact_name', type: 'text', placeholder: 'Ingrese el nombre de contacto' },
                        { label: 'Número de celular', name: 'phone_number', type: 'text', placeholder: 'Ingrese número de celular' },
                        { label: 'Email', name: 'email', type: 'email', placeholder: 'ejemplo@correo.com' },
                        { label: 'Observaciones', name: 'observaciones', type: 'text', placeholder: 'Ingrese observaciones (opcional)' }
                    ].map((field, index) => (
                        <div key={index}>
                            <label className="block text-sm font-medium mb-1">{field.label}</label>
                            <input
                                name={field.name}
                                onChange={onChange}
                                type={field.type}
                                className={`w-full px-4 py-2 border ${errors[field.name] ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                                placeholder={field.placeholder}
                                value={formData[field.name] || ''}
                            />
                            {errors[field.name] && <p className="text-red-500 text-xs mt-1">{errors[field.name]}</p>}
                        </div>
                    ))}
                </div>
                <div className="flex justify-end mt-8 gap-6">
                    <button className="btn btn-neutral px-6 py-2 rounded-xl transition hover:bg-neutral-focus" onClick={() => setLocation('/proveedores')}>Cancelar</button>
                    <button className="btn btn-success px-6 py-2 rounded-xl transition hover:bg-success-focus" onClick={handleSubmit}>Agregar proveedor</button>
                </div>
            </div>
        </div>
    )
}

export default CreateProvider
