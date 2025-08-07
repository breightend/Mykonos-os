import { Replace, Search, X, Check, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import exchangeService from '../../services/exchange/exchangeService'
import { getCurrentBranchId } from '../../utils/posUtils'

export default function CambioProductoModal({ selectedProduct, onExchangeComplete }) {
  const [step, setStep] = useState(1) // 1: Return product, 2: New product (optional), 3: Confirmation
  const [returnBarcode, setReturnBarcode] = useState('')
  const [returnQuantity, setReturnQuantity] = useState(1)
  const [returnProduct, setReturnProduct] = useState(null)
  const [newBarcode, setNewBarcode] = useState('')
  const [newQuantity, setNewQuantity] = useState(1)
  const [newProduct, setNewProduct] = useState(null)
  const [reason, setReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [validatingReturn, setValidatingReturn] = useState(false)
  const [validatingNew, setValidatingNew] = useState(false)

  // Reset state when modal opens
  const resetModal = () => {
    setStep(1)
    setReturnBarcode('')
    setReturnQuantity(1)
    setReturnProduct(null)
    setNewBarcode('')
    setNewQuantity(1)
    setNewProduct(null)
    setReason('')
    setIsProcessing(false)
    setValidatingReturn(false)
    setValidatingNew(false)
  }

  const validateReturnProduct = async () => {
    if (!returnBarcode.trim()) {
      toast.error('Ingrese el código de barras del producto a devolver')
      return
    }

    if (returnQuantity <= 0) {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }

    setValidatingReturn(true)
    try {
      const result = await exchangeService.validateReturn({
        variant_barcode: returnBarcode,
        quantity: returnQuantity,
        branch_id: getCurrentBranchId()
      })

      if (result.success) {
        setReturnProduct(result.product)
        toast.success(`Producto validado: ${result.product.product_name}`)
        setStep(2)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error validating return product:', error)
      toast.error(error.message || 'Error validando producto')
    } finally {
      setValidatingReturn(false)
    }
  }

  const validateNewProduct = async () => {
    if (!newBarcode.trim()) {
      // Skip to confirmation if no new product
      setStep(3)
      return
    }

    if (newQuantity <= 0) {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }

    setValidatingNew(true)
    try {
      const result = await exchangeService.validateNewProduct({
        variant_barcode: newBarcode,
        quantity: newQuantity,
        branch_id: getCurrentBranchId()
      })

      if (result.success) {
        setNewProduct(result.product)
        toast.success(`Producto nuevo validado: ${result.product.product_name}`)
        setStep(3)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error validating new product:', error)
      toast.error(error.message || 'Error validando producto nuevo')
    } finally {
      setValidatingNew(false)
    }
  }

  const processExchange = async () => {
    setIsProcessing(true)
    try {
      const exchangeData = {
        return_variant_barcode: returnBarcode,
        return_quantity: returnQuantity,
        branch_id: getCurrentBranchId(),
        reason: reason.trim() || 'Cambio de producto desde POS'
      }

      // Add new product data if specified
      if (newBarcode.trim() && newProduct) {
        exchangeData.new_variant_barcode = newBarcode
        exchangeData.new_quantity = newQuantity
      }

      const result = await exchangeService.createExchange(exchangeData)

      if (result.success) {
        toast.success(
          `Intercambio procesado exitosamente${
            result.price_difference !== 0
              ? `\nDiferencia de precio: $${Math.abs(result.price_difference).toFixed(2)} ${
                  result.price_difference > 0 ? '(cliente debe)' : '(a favor del cliente)'
                }`
              : ''
          }`,
          { duration: 4000 }
        )

        // Close modal and reset
        document.getElementById('cambioProductoModal').close()
        resetModal()

        // Call the callback to refresh products if provided
        if (onExchangeComplete) {
          onExchangeComplete()
        }
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error processing exchange:', error)
      toast.error(error.message || 'Error procesando intercambio')
    } finally {
      setIsProcessing(false)
    }
  }

  const calculatePriceDifference = () => {
    if (!returnProduct) return 0
    const returnTotal = returnProduct.sale_price * returnQuantity
    const newTotal = newProduct ? newProduct.sale_price * newQuantity : 0
    return newTotal - returnTotal
  }

  return (
    <div>
      <button
        className="btn btn-secondary tooltip"
        title="Cambio de producto"
        onClick={() => {
          resetModal()
          document.getElementById('cambioProductoModal').showModal()
        }}
      >
        <Replace className="h-5 w-5" />
      </button>

      <dialog className="modal modal-bottom sm:modal-middle" id="cambioProductoModal">
        <div className="modal-box max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Cambio de Producto</h2>
            <div className="flex items-center space-x-2">
              <div className="badge badge-primary">{step}/3</div>
              <button
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => document.getElementById('cambioProductoModal').close()}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="steps w-full mb-8">
            <div className={`step ${step >= 1 ? 'step-primary' : ''}`}>Producto a Devolver</div>
            <div className={`step ${step >= 2 ? 'step-primary' : ''}`}>Producto Nuevo</div>
            <div className={`step ${step >= 3 ? 'step-primary' : ''}`}>Confirmación</div>
          </div>

          {/* Step 1: Return Product */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="card bg-base-200 p-4">
                <h3 className="font-semibold mb-4 text-error">Producto a Devolver</h3>
                <div className="space-y-4">
                  <div>
                    <label className="label">
                      <span className="label-text">Código de Barras</span>
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Escanee o ingrese código de barras..."
                        className="input input-bordered flex-1"
                        value={returnBarcode}
                        onChange={(e) => setReturnBarcode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && validateReturnProduct()}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text">Cantidad a Devolver</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="input input-bordered w-32"
                      value={returnQuantity}
                      onChange={(e) => setReturnQuantity(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <button
                    className={`btn btn-primary ${validatingReturn ? 'loading' : ''}`}
                    onClick={validateReturnProduct}
                    disabled={validatingReturn}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {validatingReturn ? 'Validando...' : 'Validar Producto'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: New Product */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Show return product info */}
              <div className="card bg-base-200 p-4">
                <h3 className="font-semibold mb-2 text-error">Producto a Devolver</h3>
                <div className="flex items-center space-x-4">
                  <Check className="h-5 w-5 text-success" />
                  <div>
                    <p className="font-medium">{returnProduct?.product_name}</p>
                    <p className="text-sm opacity-70">
                      {returnProduct?.size_name} - {returnProduct?.color_name} | $
                      {returnProduct?.sale_price} x {returnQuantity} = $
                      {(returnProduct?.sale_price * returnQuantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* New product selection */}
              <div className="card bg-base-200 p-4">
                <h3 className="font-semibold mb-4 text-success">
                  Producto Nuevo (Opcional - Dejar vacío solo para devolución)
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="label">
                      <span className="label-text">Código de Barras del Producto Nuevo</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Escanee o ingrese código de barras..."
                      className="input input-bordered w-full"
                      value={newBarcode}
                      onChange={(e) => setNewBarcode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && validateNewProduct()}
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text">Cantidad Nueva</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="input input-bordered w-32"
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className={`btn btn-success ${validatingNew ? 'loading' : ''}`}
                      onClick={validateNewProduct}
                      disabled={validatingNew}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      {validatingNew ? 'Validando...' : 'Validar y Continuar'}
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        setNewBarcode('')
                        setNewProduct(null)
                        setStep(3)
                      }}
                    >
                      Solo Devolución
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="font-semibold text-lg">Confirmar Intercambio</h3>

              {/* Return Product Summary */}
              <div className="card bg-red-50 border border-red-200 p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="badge badge-error">DEVOLVER</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">{returnProduct?.product_name}</p>
                    <p className="text-sm">
                      {returnProduct?.size_name} - {returnProduct?.color_name}
                    </p>
                    <p className="text-sm">{returnProduct?.brand_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono">Cantidad: {returnQuantity}</p>
                    <p className="font-mono">Precio: ${returnProduct?.sale_price}</p>
                    <p className="font-mono font-bold">
                      Total: ${(returnProduct?.sale_price * returnQuantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* New Product Summary */}
              {newProduct && (
                <div className="card bg-green-50 border border-green-200 p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="badge badge-success">NUEVO</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">{newProduct.product_name}</p>
                      <p className="text-sm">
                        {newProduct.size_name} - {newProduct.color_name}
                      </p>
                      <p className="text-sm">{newProduct.brand_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono">Cantidad: {newQuantity}</p>
                      <p className="font-mono">Precio: ${newProduct.sale_price}</p>
                      <p className="font-mono font-bold">
                        Total: ${(newProduct.sale_price * newQuantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Price Difference */}
              {(() => {
                const difference = calculatePriceDifference()
                if (difference !== 0) {
                  return (
                    <div className={`card p-4 ${difference > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-5 w-5 text-warning" />
                        <div>
                          <p className="font-semibold">
                            {difference > 0
                              ? `Cliente debe pagar: $${difference.toFixed(2)}`
                              : `A favor del cliente: $${Math.abs(difference).toFixed(2)}`}
                          </p>
                          <p className="text-sm opacity-70">
                            {difference > 0
                              ? 'El producto nuevo es más caro'
                              : 'El producto devuelto es más caro'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              })()}

              {/* Reason */}
              <div>
                <label className="label">
                  <span className="label-text">Motivo del Cambio (Opcional)</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  placeholder="Ej: Talla incorrecta, producto defectuoso, etc."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  className={`btn btn-primary flex-1 ${isProcessing ? 'loading' : ''}`}
                  onClick={processExchange}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Procesando...' : 'Confirmar Intercambio'}
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => setStep(step - 1)}
                  disabled={isProcessing}
                >
                  Volver
                </button>
              </div>
            </div>
          )}

          {/* Navigation Buttons for Steps 1 & 2 */}
          {step < 3 && (
            <div className="modal-action">
              <button
                className="btn btn-outline"
                onClick={() => document.getElementById('cambioProductoModal').close()}
              >
                Cancelar
              </button>
              {step > 1 && (
                <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>
                  Atrás
                </button>
              )}
            </div>
          )}
        </div>
      </dialog>
    </div>
  )
}
