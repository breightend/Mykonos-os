import { ArrowLeft } from 'lucide-react'
import { useLocation } from 'wouter'

export default function ResumenProveedores() {
  const [, setLocation] = useLocation()

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <button
        onClick={() => setLocation('/proveedores')}
        type="button"
        className="btn btn-neutral btn-circle"
      >
        <ArrowLeft />
      </button>
      <h1 className="mb-4 text-2xl font-bold">Resumen de Proveedores</h1>
      <p className="text-gray-500">Esta sección está en desarrollo.</p>
      <p className="text-gray-500">Pronto podrás ver estadísticas y resúmenes de proveedores.</p>
    </div>
  )
}
