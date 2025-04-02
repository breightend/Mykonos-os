import { useLocation } from 'wouter'
import { useSellContext } from '../contexts/sellContext'

export default function ConfirmacionDatosDeCompra() {
  const { saleData } = useSellContext()
  const [, setLocation] = useLocation()

  const calcularTotales = () => {
    const subtotal = saleData.products.reduce((sum, product) =>
      sum + (product.price * product.quantity), 0);

    const totalPagado = saleData.paymentMethods.reduce((sum, method) =>
      sum + method.amount, 0);

    return {
      subtotal,
      descuento: saleData.discount,
      total: saleData.total,
      totalPagado,
      pendiente: saleData.total - totalPagado
    };
  };

  const { subtotal, descuento, total, totalPagado, pendiente } = calcularTotales()

  const handeSubmit = () => {
    setLocation('/ventas')
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Resumen de Venta</h2>

      {/* Sección de Productos */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 border-b pb-2">Productos</h3>
        {saleData.products.length > 0 ? (
          <div className="space-y-4">
            {saleData.products.map((product, index) => (
              <div key={index} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">{product.description}</p>
                  <p className="text-sm text-gray-600">
                    {product.quantity} x ${product.price.toFixed(2)} | {product.brand}
                  </p>
                </div>
                <p className="font-semibold">
                  ${(product.price * product.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No hay productos agregados</p>
        )}
      </div>

      {/* Sección de Totales */}
      <div className="mb-8 bg-gray-50 p-4 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Totales</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Descuento:</span>
            <span>${descuento.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Sección de Pagos */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 border-b pb-2">Formas de Pago</h3>
        {saleData.paymentMethods.length > 0 ? (
          <div className="space-y-3">
            {saleData.paymentMethods.map((payment, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium capitalize">{payment.type}</p>
                  {payment.details?.cliente && (
                    <p className="text-sm text-gray-600">
                      Cliente: {payment.details.cliente.name}
                    </p>
                  )}
                </div>
                <p className="font-semibold">${payment.amount.toFixed(2)}</p>
              </div>
            ))}
            <div className="pt-4 border-t mt-2">
              <div className="flex justify-between font-semibold">
                <span>Total pagado:</span>
                <span>${totalPagado.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Pendiente:</span>
                <span className={pendiente > 0 ? "text-red-600" : "text-green-600"}>
                  ${Math.abs(pendiente).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No se han registrado pagos</p>
        )}
      </div>

      {/* Información de Cliente */}
      {saleData.customer && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Cliente</h3>
          <p>Nombre: {saleData.customer.name}</p>
          <p>Documento: {saleData.customer.document}</p>
          {/* Agrega más campos según necesites */}
        </div>
      )}

      <div>
        <button className='btn btn-neutral '>Cancelar</button>
        <button className="btn btn-primary" onClick={handeSubmit}>Aceptar</button>
      </div>
    </div>


  )
}
