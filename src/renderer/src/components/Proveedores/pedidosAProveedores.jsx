import { ArrowLeft } from 'lucide-react'
import { useLocation } from 'wouter'
import { fetchPurchases } from '../../services/proveedores/purchaseService'
import { useEffect, useState } from 'react'

export default function PedidosAProveedores() {
  const [purchase, setPurchase] = useState('')
  const [location, setLocation] = useLocation()
  const [generalProducts, setGeneralProducts] = useState('')
  const [productGroups, setProductGroups] = useState('')
  const [infoProvider, setInfoProvider] = useState()

  const handleVolver = () => {
    setLocation('/proveedores')
  }

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchPurchases()
      setPurchase(data)
    }

    fetchData()
  }, [])

  console.log('compras:', purchase)

  return (
    <div>
      <h1 className="justify-center text-3xl font-bold">
        <span className="mr-2">
          <button className="btn" onClick={handleVolver}>
            <ArrowLeft />
          </button>
        </span>
        Pedidos a Proveedores
      </h1>
      <div className="mt-4 space-y-4">
        <div className="body-card card bg-primary/20 p-10">
          <h2>Selecciona el periodo: </h2>
          <p>Aca va lo de m1 mes 2 meses bla bla bla</p>
        </div>
        <div className="">
          <h2 className="text-xl font-semibold">Informacion general de las compras:</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>Cantidad</th>
                <th>Total compra</th>
                <th>Estado</th>
                <th>Cambio estado</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
