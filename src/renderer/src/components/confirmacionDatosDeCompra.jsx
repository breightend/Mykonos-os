import { useLocation } from 'wouter'
import { useSellContext } from '../contexts/sellContext'

export default function ConfirmacionDatosDeCompra() {
  const { saleData } = useSellContext()
  const [, setLocation] = useLocation()


  const handleSubmit = () => {
    setLocation('/ventas')
  }

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
              <div className="stat-value">${saleData.discount.toFixed(2)}</div>
            </div>
          </div>
          
          <div className="stats bg-accent text-accent-content">
            <div className="stat">
              <div className="stat-title">Total a Pagar</div>
              <div className="stat-value">${(saleData.total - saleData.discount).toFixed(2)}</div>
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
                  <th>Cantidad</th>
                  <th>Precio Unit.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {saleData.products.map((product, index) => (
                  <tr key={index}>
                    <td>{product.name}</td>
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
            {saleData.paymentMethods.map((method, index) => (
              <div key={index} className="card bg-base-200">
                <div className="card-body p-4">
                  <h3 className="card-title capitalize">{method.type}</h3>
                  <p className="text-lg font-bold">${method.amount.toFixed(2)}</p>
                  {method.details && (
                    <p className="text-sm opacity-75">{method.details}</p>
                  )}
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
              <span>${(saleData.total - saleData.discount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold mt-2">
              <span>Cambio:</span>
              <span>${(saleData.discount < 0 ? Math.abs(saleData.discount).toFixed(2) : '0.00')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Botón de acción (puedes personalizar según necesidades) */}
      <div className="flex justify-center">
        <button className="btn btn-primary" onClick={handleSubmit}>Finalizar Venta</button>
      </div>
    </div>


  )
}
