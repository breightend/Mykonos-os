import { useLocation } from 'wouter'
import { useSellContext } from '../contexts/sellContext'
import toast, { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { Replace, RotateCcw } from 'lucide-react'

export default function ConfirmacionDatosDeCompra() {
  const { saleData } = useSellContext()
  const [, setLocation] = useLocation()

  const handleSubmit = () => {
    setLocation('/ventas')
    toast.success('Venta finalizada con éxito', {
      duration: 2000
    })
  }

  console.log('Productos')
  console.log(saleData.products)

  const totalAbonado = saleData.payments.reduce((sum, payment) => sum + payment.amount, 0)

  // Usar el total correcto dependiendo si hay intercambio o no
  const totalVenta = saleData.exchange?.hasExchange ? saleData.exchange.finalAmount : saleData.total

  const [discount, setDiscount] = useState(0)
  const [change, setChange] = useState(0)

  const handleChange = () => {
    if (totalAbonado > totalVenta) {
      setChange(totalAbonado - totalVenta)
    } else {
      setChange(0)
    }
  }

  const handleDiscount = () => {
    if (totalAbonado <= totalVenta) {
      setDiscount((totalAbonado - totalVenta).toFixed(2))
    }
  }

  useEffect(() => {
    handleChange()
    handleDiscount()
  }, [totalAbonado, totalVenta])

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <h1 className="mb-6 text-center text-3xl font-bold">Resumen de Venta</h1>

      <div className="bg-base-100 mb-6 rounded-lg p-6 shadow-lg">
        {/* Resumen General */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
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
            <h2 className="mb-2 text-xl font-semibold">Cliente</h2>
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <p>
                  <span className="font-bold">Nombre:</span> {saleData.customer.name}
                </p>
                <p>
                  <span className="font-bold">Identificación:</span> {saleData.customer.id}
                </p>
                <p>
                  <span className="font-bold">Contacto:</span> {saleData.customer.contact}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Productos */}
        <div className="mb-6">
          <h2 className="mb-2 text-xl font-semibold">Productos ({saleData.products.length})</h2>
          <div className="overflow-x-auto">
            <table className="table-zebra table">
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
                    <td>${parseFloat(product.price || 0).toFixed(2)}</td>
                    <td>
                      ${(parseFloat(product.price || 0) * (product.quantity || 0)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detalles del Intercambio - Solo mostrar si hubo intercambio */}
        {saleData.exchange?.hasExchange && (
          <div className="mb-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-blue-600">
              <Replace className="h-5 w-5" />
              Detalles del Intercambio
            </h2>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              {/* Resumen del intercambio */}
              <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="mb-1 text-sm text-gray-600">Productos que lleva</div>
                  <div className="text-lg font-bold text-green-600">
                    ${parseFloat(saleData.exchange.totalProductsValue || 0).toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="mb-1 text-sm text-gray-600">Productos devueltos</div>
                  <div className="text-lg font-bold text-red-600">
                    -${parseFloat(saleData.exchange.totalReturnedValue || 0).toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="mb-1 text-sm text-gray-600">Total a pagar</div>
                  <div className="text-xl font-bold text-blue-600">
                    ${parseFloat(saleData.exchange.finalAmount || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Productos devueltos */}
              <div className="mt-4">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-medium text-red-600">
                  <RotateCcw className="h-4 w-4" />
                  Productos Devueltos ({saleData.exchange.returnedProducts.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="table-compact table w-full">
                    <thead>
                      <tr className="bg-red-100">
                        <th>Producto</th>
                        <th>Marca</th>
                        <th>Talle</th>
                        <th>Color</th>
                        <th>Cantidad</th>
                        <th>Precio Unit.</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {saleData.exchange.returnedProducts.map((product, index) => (
                        <tr key={index}>
                          <td>{product.description}</td>
                          <td>{product.brand}</td>
                          <td>
                            <span className="badge badge-warning badge-sm">
                              {product.size_name}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full border"
                                style={{ backgroundColor: product.color_hex }}
                              ></div>
                              <span className="text-xs">{product.color_name}</span>
                            </div>
                          </td>
                          <td>{product.quantity}</td>
                          <td>${parseFloat(product.price || 0).toFixed(2)}</td>
                          <td className="font-semibold text-red-600">
                            -$
                            {(parseFloat(product.price || 0) * (product.quantity || 0)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Métodos de Pago */}
        <div className="mb-6">
          <h2 className="mb-2 text-xl font-semibold">Métodos de Pago</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              <span className="font-bold">
                {saleData.exchange?.hasExchange ? 'Total con intercambio:' : 'Subtotal:'}
              </span>
              <span>${parseFloat(totalVenta || 0).toFixed(2)}</span>
            </div>
            {saleData.exchange?.hasExchange && (
              <>
                <div className="flex justify-between border-b pb-1 text-sm text-gray-600">
                  <span>Productos que lleva:</span>
                  <span>${parseFloat(saleData.exchange.totalProductsValue || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b pb-2 text-sm text-gray-600">
                  <span>Productos devueltos:</span>
                  <span className="text-red-600">
                    -${parseFloat(saleData.exchange.totalReturnedValue || 0).toFixed(2)}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between border-b pb-2">
              <span className="font-bold">Total Pagado:</span>
              <span>${parseFloat(totalAbonado || 0).toFixed(2)}</span>
            </div>
            <div className="mt-2 flex justify-between text-lg font-bold">
              <span>Cambio:</span>
              <span>${parseFloat(change || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Botón de acción (puedes personalizar según necesidades) */}
      <div className="mb-6 flex justify-between">
        <button className="btn btn-neutral" onClick={() => setLocation('/ventas')}>
          Cancelar
        </button>
      </div>
      <div className="flex justify-center">
        <button className="btn btn-success" onClick={handleSubmit}>
          Finalizar Venta
        </button>
      </div>
      <Toaster />
    </div>
  )
}
