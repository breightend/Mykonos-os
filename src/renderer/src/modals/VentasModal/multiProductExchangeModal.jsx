import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { X, Plus, Trash2, ShoppingCart, Package, ArrowRightLeft } from 'lucide-react'
import { exchangeService } from '../../services/exchange/exchangeService'

const MultiProductExchangeModal = ({
  isOpen,
  onClose,
  onExchangeComplete,
  getCurrentBranchId = () => 1
}) => {
  // State for return products (multiple)
  const [returnProducts, setReturnProducts] = useState([
    { barcode: '', quantity: 1, product: null, reason: '' }
  ])

  // State for new products (multiple)
  const [newProducts, setNewProducts] = useState([{ barcode: '', quantity: 1, product: null }])

  // UI State
  const [step, setStep] = useState(1) // 1: Return Products, 2: New Products, 3: Confirmation
  const [isProcessing, setIsProcessing] = useState(false)
  const [validatingProducts, setValidatingProducts] = useState(false)
  const [generalReason, setGeneralReason] = useState('')

  // Reset modal state
  const resetModal = () => {
    setReturnProducts([{ barcode: '', quantity: 1, product: null, reason: '' }])
    setNewProducts([{ barcode: '', quantity: 1, product: null }])
    setStep(1)
    setIsProcessing(false)
    setValidatingProducts(false)
    setGeneralReason('')
  }

  // Add new return product row
  const addReturnProduct = () => {
    setReturnProducts([...returnProducts, { barcode: '', quantity: 1, product: null, reason: '' }])
  }

  // Remove return product row
  const removeReturnProduct = (index) => {
    if (returnProducts.length > 1) {
      setReturnProducts(returnProducts.filter((_, i) => i !== index))
    }
  }

  // Add new product row
  const addNewProduct = () => {
    setNewProducts([...newProducts, { barcode: '', quantity: 1, product: null }])
  }

  // Remove new product row
  const removeNewProduct = (index) => {
    if (newProducts.length > 1) {
      setNewProducts(newProducts.filter((_, i) => i !== index))
    }
  }

  // Update return product field
  const updateReturnProduct = (index, field, value) => {
    const updated = [...returnProducts]
    updated[index][field] = value
    setReturnProducts(updated)
  }

  // Update new product field
  const updateNewProduct = (index, field, value) => {
    const updated = [...newProducts]
    updated[index][field] = value
    setNewProducts(updated)
  }

  // Validate return product by barcode
  const validateReturnProduct = async (index) => {
    const returnItem = returnProducts[index]
    if (!returnItem.barcode.trim()) {
      toast.error('Ingrese código de barras del producto')
      return
    }

    try {
      setValidatingProducts(true)
      const result = await exchangeService.validateReturn({
        variant_barcode: returnItem.barcode,
        quantity: returnItem.quantity,
        branch_id: getCurrentBranchId()
      })

      if (result.success) {
        updateReturnProduct(index, 'product', result.product)
        toast.success(`Producto validado: ${result.product.product_name}`)
      } else {
        toast.error(result.message)
        updateReturnProduct(index, 'product', null)
      }
    } catch (error) {
      console.error('Error validating return product:', error)
      toast.error('Error validando producto')
      updateReturnProduct(index, 'product', null)
    } finally {
      setValidatingProducts(false)
    }
  }

  // Validate new product by barcode
  const validateNewProduct = async (index) => {
    const newItem = newProducts[index]
    if (!newItem.barcode.trim()) {
      toast.error('Ingrese código de barras del producto nuevo')
      return
    }

    try {
      setValidatingProducts(true)
      const result = await exchangeService.validateNewProduct({
        variant_barcode: newItem.barcode,
        quantity: newItem.quantity,
        branch_id: getCurrentBranchId()
      })

      if (result.success) {
        updateNewProduct(index, 'product', result.product)
        toast.success(`Producto validado: ${result.product.product_name}`)
      } else {
        toast.error(result.message)
        updateNewProduct(index, 'product', null)
      }
    } catch (error) {
      console.error('Error validating new product:', error)
      toast.error('Error validando producto nuevo')
      updateNewProduct(index, 'product', null)
    } finally {
      setValidatingProducts(false)
    }
  }

  // Calculate totals
  const calculateTotals = () => {
    const returnTotal = returnProducts.reduce((sum, item) => {
      if (item.product) {
        return sum + parseFloat(item.product.sale_price) * item.quantity
      }
      return sum
    }, 0)

    const newTotal = newProducts.reduce((sum, item) => {
      if (item.product) {
        return sum + parseFloat(item.product.sale_price) * item.quantity
      }
      return sum
    }, 0)

    const difference = newTotal - returnTotal
    return { returnTotal, newTotal, difference }
  }

  // Process the multi-product exchange
  const processExchange = async () => {
    setIsProcessing(true)

    try {
      // Validate we have valid return products
      const validReturnProducts = returnProducts.filter(
        (item) => item.product && item.barcode.trim()
      )
      if (validReturnProducts.length === 0) {
        toast.error('Debe validar al menos un producto para devolver')
        setIsProcessing(false)
        return
      }

      // Prepare exchange data
      const exchangeData = {
        return_products: validReturnProducts.map((item) => ({
          variant_barcode: item.barcode,
          quantity: item.quantity,
          reason: item.reason || ''
        })),
        branch_id: getCurrentBranchId(),
        reason: generalReason.trim() || 'Intercambio multi-producto desde POS',
        user_id: 1 // TODO: Get actual user ID
      }

      // Add new products if any are valid
      const validNewProducts = newProducts.filter((item) => item.product && item.barcode.trim())
      if (validNewProducts.length > 0) {
        exchangeData.new_products = validNewProducts.map((item) => ({
          variant_barcode: item.barcode,
          quantity: item.quantity
        }))
      }

      console.log('🔄 Processing multi-product exchange:', exchangeData)

      const result = await exchangeService.createExchange(exchangeData)

      if (result.success) {
        const { difference } = calculateTotals()

        toast.success(
          `¡Intercambio multi-producto realizado exitosamente!\n` +
            `Productos devueltos: ${validReturnProducts.length}\n` +
            `Productos nuevos: ${validNewProducts.length}\n` +
            `Diferencia: $${Math.abs(difference).toFixed(2)} ${difference >= 0 ? 'a pagar' : 'a favor del cliente'}`,
          { duration: 6000 }
        )

        console.log('✅ Multi-product exchange completed:', result)

        // Close and reset
        onClose()
        resetModal()

        // Callback for parent component
        if (onExchangeComplete) {
          onExchangeComplete(result)
        }
      } else {
        toast.error(result.message || 'Error procesando intercambio')
        console.error('❌ Exchange failed:', result)
      }
    } catch (error) {
      console.error('❌ Error in processExchange:', error)
      toast.error(error.message || 'Error inesperado al procesar intercambio')
    } finally {
      setIsProcessing(false)
    }
  }

  // Step navigation
  const canGoToStep2 = () => {
    return returnProducts.some((item) => item.product)
  }

  const canGoToStep3 = () => {
    return returnProducts.some((item) => item.product)
  }

  const { returnTotal, newTotal, difference } = calculateTotals()

  if (!isOpen) return null

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-6">
          <div className="flex items-center space-x-3">
            <ArrowRightLeft className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Intercambio Multi-Producto</h2>
              <p className="text-sm text-gray-500">
                Paso {step} de 3 -{' '}
                {step === 1
                  ? 'Productos a Devolver'
                  : step === 2
                    ? 'Productos Nuevos'
                    : 'Confirmación'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="bg-gray-50 px-6 py-4">
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center space-x-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                1
              </div>
              <span className="font-medium">Productos a Devolver</span>
            </div>
            <div className="h-px flex-1 bg-gray-300"></div>
            <div
              className={`flex items-center space-x-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                2
              </div>
              <span className="font-medium">Productos Nuevos</span>
            </div>
            <div className="h-px flex-1 bg-gray-300"></div>
            <div
              className={`flex items-center space-x-2 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                3
              </div>
              <span className="font-medium">Confirmación</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center text-lg font-semibold text-red-600">
                  <Package className="mr-2 h-5 w-5" />
                  Productos a Devolver
                </h3>
                <button
                  onClick={addReturnProduct}
                  className="btn btn-sm btn-outline btn-primary flex items-center"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Agregar Producto
                </button>
              </div>

              <div className="space-y-4">
                {returnProducts.map((returnItem, index) => (
                  <div key={index} className="rounded-lg border bg-gray-50 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-medium text-gray-700">Producto {index + 1}</span>
                      {returnProducts.length > 1 && (
                        <button
                          onClick={() => removeReturnProduct(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Código de Barras
                        </label>
                        <div className="flex">
                          <input
                            type="text"
                            placeholder="Escanear o escribir código..."
                            className="input input-bordered flex-1"
                            value={returnItem.barcode}
                            onChange={(e) => updateReturnProduct(index, 'barcode', e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && validateReturnProduct(index)}
                          />
                          <button
                            onClick={() => validateReturnProduct(index)}
                            disabled={validatingProducts}
                            className="btn btn-primary ml-2"
                          >
                            {validatingProducts ? 'Validando...' : 'Validar'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="input input-bordered w-full"
                          value={returnItem.quantity}
                          onChange={(e) =>
                            updateReturnProduct(index, 'quantity', parseInt(e.target.value) || 1)
                          }
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Motivo
                        </label>
                        <input
                          type="text"
                          placeholder="Opcional..."
                          className="input input-bordered w-full"
                          value={returnItem.reason}
                          onChange={(e) => updateReturnProduct(index, 'reason', e.target.value)}
                        />
                      </div>
                    </div>

                    {returnItem.product && (
                      <div className="mt-4 rounded border border-green-200 bg-green-50 p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-green-800">
                              {returnItem.product.product_name}
                            </h4>
                            <p className="text-sm text-green-600">
                              {returnItem.product.brand_name} |{' '}
                              {returnItem.product.size_name &&
                                ` Talla: ${returnItem.product.size_name} |`}
                              {returnItem.product.color_name &&
                                ` Color: ${returnItem.product.color_name} |`}
                              Precio: ${parseFloat(returnItem.product.sale_price).toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-green-800">
                              Subtotal: $
                              {(
                                parseFloat(returnItem.product.sale_price) * returnItem.quantity
                              ).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {returnTotal > 0 && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <h4 className="mb-2 font-semibold text-blue-800">Resumen de Devolución</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700">Total a Devolver:</span>
                    <span className="text-xl font-bold text-blue-800">
                      ${returnTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center text-lg font-semibold text-green-600">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Productos Nuevos (Opcional)
                </h3>
                <button
                  onClick={addNewProduct}
                  className="btn btn-sm btn-outline btn-success flex items-center"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Agregar Producto
                </button>
              </div>

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <p className="text-sm text-yellow-800">
                  💡 <strong>Consejo:</strong> Si solo está realizando devoluciones sin intercambio,
                  puede omitir este paso y continuar directamente a la confirmación.
                </p>
              </div>

              <div className="space-y-4">
                {newProducts.map((newItem, index) => (
                  <div key={index} className="rounded-lg border bg-gray-50 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="font-medium text-gray-700">Producto Nuevo {index + 1}</span>
                      {newProducts.length > 1 && (
                        <button
                          onClick={() => removeNewProduct(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Código de Barras
                        </label>
                        <div className="flex">
                          <input
                            type="text"
                            placeholder="Escanear o escribir código..."
                            className="input input-bordered flex-1"
                            value={newItem.barcode}
                            onChange={(e) => updateNewProduct(index, 'barcode', e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && validateNewProduct(index)}
                          />
                          <button
                            onClick={() => validateNewProduct(index)}
                            disabled={validatingProducts}
                            className="btn btn-primary ml-2"
                          >
                            {validatingProducts ? 'Validando...' : 'Validar'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="input input-bordered w-full"
                          value={newItem.quantity}
                          onChange={(e) =>
                            updateNewProduct(index, 'quantity', parseInt(e.target.value) || 1)
                          }
                        />
                      </div>
                    </div>

                    {newItem.product && (
                      <div className="mt-4 rounded border border-green-200 bg-green-50 p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-green-800">
                              {newItem.product.product_name}
                            </h4>
                            <p className="text-sm text-green-600">
                              {newItem.product.brand_name} |{' '}
                              {newItem.product.size_name &&
                                ` Talla: ${newItem.product.size_name} |`}
                              {newItem.product.color_name &&
                                ` Color: ${newItem.product.color_name} |`}
                              Precio: ${parseFloat(newItem.product.sale_price).toFixed(2)} | Stock:{' '}
                              {newItem.product.available_stock}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-green-800">
                              Subtotal: $
                              {(parseFloat(newItem.product.sale_price) * newItem.quantity).toFixed(
                                2
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {newTotal > 0 && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <h4 className="mb-2 font-semibold text-green-800">Resumen de Productos Nuevos</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-green-700">Total de Productos Nuevos:</span>
                    <span className="text-xl font-bold text-green-800">${newTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="flex items-center text-lg font-semibold text-purple-600">
                <ArrowRightLeft className="mr-2 h-5 w-5" />
                Confirmación de Intercambio
              </h3>

              {/* Return Products Summary */}
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <h4 className="mb-3 font-semibold text-red-800">📤 Productos a Devolver</h4>
                {returnProducts
                  .filter((item) => item.product)
                  .map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border-b border-red-100 py-2 last:border-b-0"
                    >
                      <div>
                        <span className="font-medium">{item.product.product_name}</span>
                        <span className="ml-2 text-sm text-red-600">x{item.quantity}</span>
                        {item.reason && (
                          <span className="block text-xs text-red-500">Motivo: {item.reason}</span>
                        )}
                      </div>
                      <span className="font-semibold text-red-800">
                        ${(parseFloat(item.product.sale_price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                <div className="mt-3 flex items-center justify-between border-t border-red-200 pt-3">
                  <span className="font-bold text-red-800">Total Devolución:</span>
                  <span className="text-xl font-bold text-red-800">${returnTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* New Products Summary */}
              {newTotal > 0 && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <h4 className="mb-3 font-semibold text-green-800">📥 Productos Nuevos</h4>
                  {newProducts
                    .filter((item) => item.product)
                    .map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between border-b border-green-100 py-2 last:border-b-0"
                      >
                        <div>
                          <span className="font-medium">{item.product.product_name}</span>
                          <span className="ml-2 text-sm text-green-600">x{item.quantity}</span>
                        </div>
                        <span className="font-semibold text-green-800">
                          ${(parseFloat(item.product.sale_price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  <div className="mt-3 flex items-center justify-between border-t border-green-200 pt-3">
                    <span className="font-bold text-green-800">Total Productos Nuevos:</span>
                    <span className="text-xl font-bold text-green-800">${newTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Price Difference */}
              <div
                className={`rounded-lg border p-4 ${
                  difference > 0
                    ? 'border-orange-200 bg-orange-50'
                    : difference < 0
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                }`}
              >
                <h4
                  className={`mb-2 font-semibold ${
                    difference > 0
                      ? 'text-orange-800'
                      : difference < 0
                        ? 'text-blue-800'
                        : 'text-gray-800'
                  }`}
                >
                  💰 Diferencia de Precio
                </h4>
                <div className="flex items-center justify-between">
                  <span
                    className={
                      difference > 0
                        ? 'text-orange-700'
                        : difference < 0
                          ? 'text-blue-700'
                          : 'text-gray-700'
                    }
                  >
                    {difference > 0
                      ? 'Cliente debe pagar:'
                      : difference < 0
                        ? 'A favor del cliente:'
                        : 'Sin diferencia de precio'}
                  </span>
                  <span
                    className={`text-2xl font-bold ${
                      difference > 0
                        ? 'text-orange-800'
                        : difference < 0
                          ? 'text-blue-800'
                          : 'text-gray-800'
                    }`}
                  >
                    ${Math.abs(difference).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* General Reason */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Motivo General (Opcional)
                </label>
                <textarea
                  className="textarea textarea-bordered h-20 w-full"
                  placeholder="Razón del intercambio..."
                  value={generalReason}
                  onChange={(e) => setGeneralReason(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer with Navigation */}
        <div className="flex items-center justify-between border-t bg-gray-50 p-6">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="btn btn-outline"
                disabled={isProcessing}
              >
                Anterior
              </button>
            )}
          </div>

          <div className="flex space-x-2">
            {step < 3 && (
              <button
                onClick={() => setStep(step + 1)}
                className="btn btn-primary"
                disabled={(step === 1 && !canGoToStep2()) || (step === 2 && !canGoToStep3())}
              >
                {step === 1 ? 'Continuar a Productos Nuevos' : 'Continuar a Confirmación'}
              </button>
            )}

            {step === 3 && (
              <button
                onClick={processExchange}
                disabled={isProcessing}
                className={`btn flex items-center ${isProcessing ? 'btn-disabled' : 'btn-success'}`}
              >
                {isProcessing ? (
                  <>
                    <span className="loading loading-spinner loading-sm mr-2"></span>
                    Procesando...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    Procesar Intercambio
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MultiProductExchangeModal
