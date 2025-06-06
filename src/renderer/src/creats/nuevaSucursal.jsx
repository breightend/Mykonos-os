import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useLocation } from 'wouter'
import MenuVertical from '../componentes especificos/menuVertical'
import Navbar from '../componentes especificos/navbar'
import { postData as createSucursal } from '../services/sucursales/sucursalesService'
import toast, { Toaster } from 'react-hot-toast'

function NuevaSucursal() {
  const [, setLocation] = useLocation()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    postal_code: '',
    phone_number: '',
    area: '',
    description: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('El nombre de la sucursal es requerido')
      return
    }

    setLoading(true)
    try {
      await createSucursal(formData)
      toast.success('Sucursal creada exitosamente')
      setTimeout(() => {
        setLocation('/sucursales')
      }, 1500)
    } catch (error) {
      console.error('Error creating sucursal:', error)
      toast.error('Error al crear la sucursal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <MenuVertical currentPath={'/sucursales'} />
      <Navbar />
      
      <div className="ml-20 p-6">
        <div className="flex items-center gap-4 mb-6">
          <button 
            className="btn btn-circle" 
            onClick={() => setLocation('/sucursales')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-warning text-2xl font-bold">Nueva Sucursal</h2>
        </div>

        <div className="max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Nombre de la Sucursal *</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input input-bordered input-warning w-full"
                  placeholder="Ej: Sucursal Centro"
                  required
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Área o Sección</span>
                </label>
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder="Ej: Ventas, Almacén, Oficina"
                />
              </div>
            </div>

            <div>
              <label className="label">
                <span className="label-text font-semibold">Dirección</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                placeholder="Dirección completa de la sucursal"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Código Postal</span>
                </label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder="1234"
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Teléfono</span>
                </label>
                <input
                  type="text"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder="+54 11 1234-5678"
                />
              </div>
            </div>

            <div>
              <label className="label">
                <span className="label-text font-semibold">Descripción</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="textarea textarea-bordered w-full h-24"
                placeholder="Descripción detallada de la sucursal..."
              />
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <button
                type="button"
                className="btn"
                onClick={() => setLocation('/sucursales')}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`btn btn-warning ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? 'Creando...' : 'Crear Sucursal'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <Toaster position="bottom-right" />
    </div>
  )
}

export default NuevaSucursal
