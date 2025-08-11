import { ArrowLeft } from 'lucide-react'
import { useLocation } from 'wouter'
import { useState } from 'react'

export default function GestionFormaDePago() {
    const [formData, setFormData] = useState({
        name: '',
    })
    const handleSubmit = (e) => {
        e.preventDefault()

    }
  const [, setLocation] = useLocation()
  return (
    <div>
      <div className="flex gap-2">
        <button className="btn" onClick={() => setLocation('/formasDePagoGestion')}>
          <ArrowLeft />
        </button>
        <h1 className='text-2xl font-semibold'>Gestión de Formas de Pago</h1>
      </div>
      <div>
        <label htmlFor=""> Ingresa el nombre del banco a agregar: </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <button onClick={handleSubmit}>Agregar Banco</button>
    </div>
  )
}
