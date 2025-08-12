import { ArrowLeft, Landmark } from 'lucide-react'
import { useLocation } from 'wouter'
import { useEffect, useState } from 'react'
import { postNuevoBanco, getBancos } from '../services/paymentsServices/banksService'
import toast from 'react-hot-toast'

export default function GestionFormaDePago() {
  const [isLoading, setIsLoading] = useState(false)
  const [bancos, setBancos] = useState([])
  const [formData, setFormData] = useState({
    name: ''
  })
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const newBank = await postNuevoBanco(formData)
      toast.success(`El banco: ${newBank.name} fue creado exitosamente`)
    } catch (error) {
      toast.error('Error al crear nuevo banco')
      console.error('Error al crear nuevo banco:', error)
    }
  }
  useEffect(() => {
    const fetchBancos = async () => {
      setIsLoading(true)
      try {
        const data = await getBancos()
        setBancos(data)
      } catch (error) {
        toast.error('Error al obtener bancos')
        console.error('Error al obtener bancos:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchBancos()
  }, [])

  const [, setLocation] = useLocation()
  return (
    <div className="mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-lg">
      {/* Encabezado */}
      <div className="mb-6 flex items-center gap-3">
        <button
          className="rounded-full p-2 transition hover:bg-gray-100"
          onClick={() => setLocation('/formasDePagoGestion')}
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Formas de Pago</h1>
      </div>

      {/* Input para agregar banco */}
      <div className="mb-4">
        <label htmlFor="name" className="mb-2 flex items-center gap-3 text-gray-700">
          <Landmark className="h-5 w-5 text-gray-500" />
          <span className="font-medium">Ingresa el nombre del banco a agregar:</span>
        </label>
        <input
          type="text"
          name="name"
          id="name"
          placeholder="Nombre del Banco"
          className="w-full rounded-lg border px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      {/* Botón agregar */}
      <div className="flex justify-end">
        <button
          className="rounded-lg bg-green-500 px-5 py-2 font-medium text-white shadow-sm transition hover:bg-green-600"
          onClick={handleSubmit}
        >
          Agregar Banco
        </button>
      </div>

      {/* Lista de bancos */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-gray-800">Bancos Disponibles</h2>
        {isLoading ? (
          <p className="italic text-gray-500">Cargando bancos...</p>
        ) : bancos.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {bancos &&
              bancos.map((banco) => (
                <li key={banco.id} className="rounded-lg px-2 py-3 transition hover:bg-gray-50">
                  {banco.name}
                </li>
              ))}
          </ul>
        ) : (
          <p className="italic">No hay bancos disponibles</p>
        )}
      </div>
    </div>
  )
}
