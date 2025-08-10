import { useLocation } from 'wouter'
import { useSellContext } from '../contexts/sellContext'
import toast, { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { Replace, RotateCcw } from 'lucide-react'
import { salesService } from '../services/salesService'

export default function ConfirmacionDatosDeCompra() {
  const { saleData } = useSellContext()
  const [, setLocation] = useLocation()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async () => {
    if (isProcessing) return

    setIsProcessing(true)

    try {
      // Preparar datos para el backend
      const saleDataForBackend = {
        customer: saleData.customer || null,
        products: saleData.products.map((product) => ({
          product_id: product.product_id,
          variant_id: product.variant_id,
          product_name:
            product.description || product.descripcion || product.product_name || 'Producto',
          description: product.description || product.descripcion || '',
          brand: product.brand || product.marca || '',
          size_name: product.size_name || product.talle || '',
          color_name: product.color_name || product.color || '',
          price: parseFloat(product.price || product.precio || 0),
          quantity: parseInt(product.quantity || product.cantidad || 1),
          variant_barcode: product.variant_barcode || ''
        })),
        exchange: saleData.exchange?.hasExchange
          ? {
              hasExchange: true,
              returnedProducts: saleData.exchange.returnedProducts.map((product) => ({
                product_id: product.product_id,
                variant_id: product.variant_id,
                product_name:
                  product.description || product.descripcion || product.product_name || 'Producto',
                description: product.description || product.descripcion || '',
                brand: product.brand || product.marca || '',
                size_name: product.size_name || product.talle || '',
                color_name: product.color_name || product.color || '',
                price: parseFloat(product.price || product.precio || 0),
                quantity: parseInt(product.quantity || product.cantidad || 1),
                variant_barcode: product.variant_barcode || ''
              })),
              totalProductsValue: parseFloat(saleData.exchange.totalProductsValue),
              totalReturnedValue: parseFloat(saleData.exchange.totalReturnedValue),
              finalAmount: parseFloat(saleData.exchange.finalAmount)
            }
          : null,
        payments: saleData.payments.map((payment) => ({
          method: payment.method,
          amount: parseFloat(payment.amount),
          reference: payment.reference || ''
        })),
        total: saleData.exchange?.hasExchange
          ? parseFloat(saleData.exchange.finalAmount)
          : parseFloat(saleData.total),
        storage_id: 1, // TODO: Obtener de la configuración del usuario
        employee_id: 1, // TODO: Obtener del usuario logueado
        cashier_user_id: 1 // TODO: Obtener del usuario logueado
      }

      console.log('📋 Enviando venta al backend:', saleDataForBackend)

      // Enviar venta al backend
      const result = await salesService.createSale(saleDataForBackend)

      if (result.status === 'success') {
        toast.success(
          `Venta finalizada con éxito${saleData.exchange?.hasExchange ? ' con intercambio' : ''}`,
          { duration: 3000 }
        )

        // Esperar un poco para que el usuario vea el mensaje
        setTimeout(() => {
          setLocation('/ventas')
        }, 2000)
      } else {
        throw new Error(result.message || 'Error desconocido al procesar la venta')
      }
    } catch (error) {
      console.error('❌ Error al finalizar venta:', error)
      toast.error(`Error al finalizar la venta: ${error.message}`, { duration: 4000 })
    } finally {
      setIsProcessing(false)
    }
  }

  console.log('Productos')
  console.log(saleData.products)
  console.log('🔍 Debug - saleData completo:')
  console.log(saleData)
  console.log('🔍 Debug - Cliente:')
  console.log(saleData.customer)
  console.log('🔍 Debug - Pagos:')
  console.log(saleData.payments)

  // Calcular total abonado excluyendo cuenta corriente (solo pagos reales)
  const totalAbonado = saleData.payments.reduce((sum, payment) => {
    // Solo sumar pagos que NO sean cuenta corriente
    if (payment.method !== 'cuenta_corriente') {
      return sum + payment.amount
    }
    return sum
  }, 0)

  // Calcular total en cuenta corriente
  const totalCuentaCorriente = saleData.payments.reduce((sum, payment) => {
    if (payment.method === 'cuenta_corriente') {
      return sum + payment.amount
    }
    return sum
  }, 0)

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

      <div className="mb-6 rounded-lg bg-base-100 p-6 shadow-lg">
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
                  <span className="font-bold">Identificación:</span>{' '}
                  {saleData.customer.id || saleData.customer.dni}
                </p>
                {saleData.customer.contact && (
                  <p>
                    <span className="font-bold">Contacto:</span> {saleData.customer.contact}
                  </p>
                )}
                {saleData.customer.type && (
                  <p>
                    <span className="font-bold">Tipo:</span> {saleData.customer.type}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cliente de cuenta corriente desde payments (si no hay customer en saleData) */}
        {!saleData.customer &&
          saleData.payments.find((p) => p.method === 'cuenta_corriente' && p.costumer?.cliente) && (
            <div className="mb-6">
              <h2 className="mb-2 text-xl font-semibold">Cliente (Cuenta Corriente)</h2>
              <div className="card bg-base-200">
                <div className="card-body p-4">
                  {(() => {
                    const cuentaCorrientePago = saleData.payments.find(
                      (p) => p.method === 'cuenta_corriente' && p.costumer?.cliente
                    )
                    const cliente = cuentaCorrientePago?.costumer?.cliente
                    return (
                      <>
                        <p>
                          <span className="font-bold">Nombre:</span>{' '}
                          {cliente?.name || cliente?.entity_name}
                        </p>
                        <p>
                          <span className="font-bold">Identificación:</span>{' '}
                          {cliente?.dni || cliente?.id || cliente?.cuit}
                        </p>
                        {cliente?.contact && (
                          <p>
                            <span className="font-bold">Contacto:</span> {cliente.contact}
                          </p>
                        )}
                        <p>
                          <span className="font-bold">Tipo:</span> Cuenta Corriente
                        </p>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          )}

        {/* Productos */}
        <div className="mb-6">
          <h2 className="mb-2 text-xl font-semibold">Productos ({saleData.products.length})</h2>
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
                    <td>{product.descripcion || product.description}</td>
                    <td>{product.marca || product.brand}</td>
                    <td>{product.cantidad || product.quantity}</td>
                    <td>${parseFloat(product.precio || product.price || 0).toFixed(2)}</td>
                    <td>
                      $
                      {(
                        parseFloat(product.precio || product.price || 0) *
                        (product.cantidad || product.quantity || 0)
                      ).toFixed(2)}
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
                          <td>{product.descripcion || product.description}</td>
                          <td>{product.marca || product.brand}</td>
                          <td>
                            <span className="badge badge-warning badge-sm">
                              {product.talle || product.size_name}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full border"
                                style={{ backgroundColor: product.color_hex }}
                              ></div>
                              <span className="text-xs">{product.color || product.color_name}</span>
                            </div>
                          </td>
                          <td>{product.cantidad || product.quantity}</td>
                          <td>${parseFloat(product.precio || product.price || 0).toFixed(2)}</td>
                          <td className="font-semibold text-red-600">
                            -$
                            {(
                              parseFloat(product.precio || product.price || 0) *
                              (product.cantidad || product.quantity || 0)
                            ).toFixed(2)}
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
              <span className="font-bold">Total Pagado (Efectivo):</span>
              <span>${parseFloat(totalAbonado || 0).toFixed(2)}</span>
            </div>
            {totalCuentaCorriente > 0 && (
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-orange-600">Pendiente (Cuenta Corriente):</span>
                <span className="text-orange-600">
                  ${parseFloat(totalCuentaCorriente || 0).toFixed(2)}
                </span>
              </div>
            )}
            <div className="mt-2 flex justify-between text-lg font-bold">
              <span>Cambio:</span>
              <span>${parseFloat(change || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="mb-6 flex justify-between">
        <button
          className="btn btn-neutral"
          onClick={() => setLocation('/ventas')}
          disabled={isProcessing}
        >
          Cancelar
        </button>
      </div>
      <div className="flex justify-center">
        <button
          className={`btn btn-success ${isProcessing ? 'loading' : ''}`}
          onClick={handleSubmit}
          disabled={isProcessing}
        >
          {isProcessing ? 'Procesando...' : 'Finalizar Venta'}
        </button>
      </div>
      <Toaster />
    </div>
  )
}
