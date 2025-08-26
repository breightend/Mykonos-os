import { ArrowLeft } from 'lucide-react'
import { useLocation, useSearchParams } from 'wouter'


export default function AgregarProductoCompraProveedor() {
  const [, setLocation] = useLocation()
  const [searchParams] = useSearchParams()
  
  const providerId = searchParams.get('id')

  const handleButtonVolver = () => {
    setLocation(`/agregandoCompraProveedor?id=${providerId}`)
  }

  return (
    <div>
      <button onClick={handleButtonVolver}>
        <ArrowLeft className="btn-icon btn" />
      </button>
      <h1 className="text-xl font-bold">Agregar Producto Compra Proveedor</h1>
      <div></div>
    </div>
  )
}
