import { useLocation } from 'wouter'
import { useSellContext } from '../contexts/sellContext'
import toast, { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'

export default function ConfirmacionDatosDeCompra() {
  const { saleData } = useSellContext()
  const [, setLocation] = useLocation()


  const handleSubmit = () => {
    setLocation('/ventas')
    toast.success('Venta finalizada con éxito', {
      duration: 2000
    })
  }


  console.log("Productos")
  console.log(saleData.products)

  const totalAbonado = saleData.payments.reduce((sum, payment) => sum + payment.amount, 0);

  const [discount, setDiscount] = useState(0)
  const [change, setChange] = useState(0)

  const handleChange = () => {
    if (totalAbonado > saleData.total) {
      setChange(totalAbonado - saleData.total)
    } else {
      setChange(0)
    }
  }

  const handleDiscount = () => {
    if(totalAbonado <= saleData.total){
      setDiscount((totalAbonado - saleData.total).toFixed(2))
  }
}

  useEffect(() => {
    handleChange()
    handleDiscount()
  }, [totalAbonado, saleData.total])


  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-6">Resumen de Venta</h1>

      <div className="bg-base-100 rounded-lg shadow-lg p-6 mb-6">
        {/* Resumen General */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="stats bg-primary text-primary-content">
            <div className="stat">
              <div className="stat-title">Total Venta</div>
              <div className="stat-value">${saleData.total.toFixed(2)}</div>
            </div>
          </div>

          <div className="stats bg-secondary text-secondary-content">
            <div className="stat">
              <div className="stat-title">Descuento</div>
              <div className="stat-value">${Math.abs(discount)}</div>
            </div>
          </div>

          <div className="stats bg-accent text-accent-content">
            <div className="stat">
              <div className="stat-title">Total abonado</div>
              <div className="stat-value">${totalAbonado.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Cliente */}
        {saleData.customer && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Cliente</h2>
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <p><span className="font-bold">Nombre:</span> {saleData.customer.name}</p>
                <p><span className="font-bold">Identificación:</span> {saleData.customer.id}</p>
                <p><span className="font-bold">Contacto:</span> {saleData.customer.contact}</p>
              </div>
            </div>
          </div>
        )}

        {/* Productos */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Productos ({saleData.products.length})</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Marca</th>
                  <th>Cantidad</th>
                  <th>Precio Unit.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {saleData.products.map((product, index) => (
                  <tr key={index}>
                    <td>{product.description}</td>
                    <td>{product.brand}</td>
                    <td>{product.quantity}</td>
                    <td>${product.price.toFixed(2)}</td>
                    <td>${(product.price * product.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Métodos de Pago */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Métodos de Pago</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {saleData.payments.map((method, index) => (
              <div key={index} className="card bg-base-200">
                <div className="card-body p-4">
                  <h3 className="card-title capitalize">{method.method}</h3>
                  <p className="text-lg font-bold">${method.amount.toFixed(2)}</p>

                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen Final */}
        <div className="card bg-base-200">
          <div className="card-body">
            <div className="flex justify-between border-b pb-2">
              <span className="font-bold">Subtotal:</span>
              <span>${saleData.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-bold">Total Pagado:</span>
              <span>${totalAbonado.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold mt-2">
              <span>Cambio:</span>
              <span>${change.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Botón de acción (puedes personalizar según necesidades) */}
      <div className="flex justify-between mb-6">
        <button className='btn btn-neutral' onClick={() => setLocation('/ventas')}>
          Cancelar
        </button>
      </div>
      <div className="flex justify-center">
        <button className="btn btn-success" onClick={handleSubmit}>Finalizar Venta</button>
      </div>
      <Toaster />
    </div>


  )
}
