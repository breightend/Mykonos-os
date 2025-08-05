import { useState } from 'react'
import { DollarSign, CreditCard, HandCoins, Landmark, CheckCircle, AlertCircle } from 'lucide-react'
import { accountMovementsService } from '../../services/accountMovements/accountMovementsService'
import toast from 'react-hot-toast'

export default function AgregarPagoModal({ cliente, onPaymentAdded }) {
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('efectivo')
  const [description, setDescription] = useState('')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const paymentMethods = [
    { id: 'efectivo', label: 'Efectivo', icon: <HandCoins className="h-5 w-5" /> },
    { id: 'transferencia', label: 'Transferencia', icon: <Landmark className="h-5 w-5" /> },
    { id: 'tarjeta_debito', label: 'Tarjeta de Débito', icon: <CreditCard className="h-5 w-5" /> },
    {
      id: 'tarjeta_credito',
      label: 'Tarjeta de Crédito',
      icon: <CreditCard className="h-5 w-5" />
    },
    { id: 'cheque', label: 'Cheque', icon: <CheckCircle className="h-5 w-5" /> }
  ]

  const getPaymentMethodName = (method) => {
    const methodObj = paymentMethods.find((m) => m.id === method)
    return methodObj ? methodObj.label : method
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount || 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!cliente?.id) {
      toast.error('Cliente no válido')
      return
    }

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('El monto del pago debe ser mayor a cero')
      return
    }

    try {
      setIsProcessing(true)

      const amount = parseFloat(paymentAmount)
      const paymentDescription =
        description || `Pago recibido (${getPaymentMethodName(paymentMethod)})`

      // Create credit movement (payment)
      const result = await accountMovementsService.createCreditMovement({
        entity_id: cliente.id,
        amount: amount,
        description: paymentDescription,
        medio_pago: paymentMethod,
        numero_de_comprobante: receiptNumber || undefined
      })

      if (result.success) {
        toast.success(
          `¡Pago registrado exitosamente!\n• Monto: ${formatCurrency(amount)}\n• Método: ${getPaymentMethodName(paymentMethod)}\n• Nuevo saldo: ${formatCurrency(result.new_balance)}`,
          { duration: 4000 }
        )

        // Reset form
        setPaymentAmount('')
        setDescription('')
        setReceiptNumber('')
        setPaymentMethod('efectivo')

        // Call the callback to refresh the movements list
        if (onPaymentAdded) {
          onPaymentAdded()
        }

        // Close modal
        document.getElementById('agregandoPago').close()
      } else {
        toast.error(`Error al registrar el pago: ${result.message}`)
      }
    } catch (error) {
      console.error('Error al procesar el pago:', error)
      toast.error('Error al procesar el pago. Intente nuevamente.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    // Reset form when canceling
    setPaymentAmount('')
    setDescription('')
    setReceiptNumber('')
    setPaymentMethod('efectivo')
    document.getElementById('agregandoPago').close()
  }

  return (
    <div>
      <dialog id="agregandoPago" className="modal">
        <div className="modal-box w-11/12 max-w-4xl">
          {/* Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
              <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Registrar Pago</h3>
              <p className="text-gray-600 dark:text-gray-400">Cliente: {cliente?.entity_name}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Payment Amount */}
            <div className="rounded-lg bg-blue-50 p-6 dark:bg-blue-900/20">
              <label className="mb-3 block text-lg font-semibold text-blue-800 dark:text-blue-300">
                💰 Monto del Pago
              </label>
              <div className="flex items-center space-x-3">
                <span className="text-2xl font-bold text-blue-800 dark:text-blue-300">$</span>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="flex-1 rounded-lg border-2 border-blue-300 p-4 text-center text-2xl font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                Ingrese el monto que el cliente está pagando
              </div>
            </div>

            {/* Payment Method */}
            <div className="rounded-lg bg-purple-50 p-6 dark:bg-purple-900/20">
              <label className="mb-4 block text-lg font-semibold text-purple-800 dark:text-purple-300">
                💳 Método de Pago
              </label>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex cursor-pointer items-center space-x-3 rounded-lg border-2 p-4 transition-all ${
                      paymentMethod === method.id
                        ? 'border-purple-500 bg-purple-100 dark:bg-purple-800'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/10'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="sr-only"
                    />
                    <div
                      className={`${paymentMethod === method.id ? 'text-purple-600' : 'text-gray-500'}`}
                    >
                      {method.icon}
                    </div>
                    <span
                      className={`font-medium ${paymentMethod === method.id ? 'text-purple-800 dark:text-purple-200' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      {method.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Description */}
              <div className="rounded-lg bg-yellow-50 p-6 dark:bg-yellow-900/20">
                <label className="mb-3 block text-lg font-semibold text-yellow-800 dark:text-yellow-300">
                  📝 Descripción (Opcional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full resize-none rounded-lg border-2 border-yellow-300 p-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                  rows="3"
                  placeholder="Concepto del pago, observaciones, etc."
                />
              </div>

              {/* Receipt Number */}
              <div className="rounded-lg bg-orange-50 p-6 dark:bg-orange-900/20">
                <label className="mb-3 block text-lg font-semibold text-orange-800 dark:text-orange-300">
                  🧾 Número de Comprobante (Opcional)
                </label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  className="w-full rounded-lg border-2 border-orange-300 p-3 font-mono focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  placeholder="REC-001, CHQ-123, etc."
                />
                <div className="mt-2 text-sm text-orange-700 dark:text-orange-300">
                  Número de recibo, cheque, transferencia, etc.
                </div>
              </div>
            </div>

            {/* Summary */}
            {paymentAmount && parseFloat(paymentAmount) > 0 && (
              <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6 dark:bg-green-900/20">
                <h4 className="mb-3 text-lg font-semibold text-green-800 dark:text-green-300">
                  📊 Resumen del Pago
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-300">Cliente:</span>
                    <span className="font-bold text-green-800 dark:text-green-200">
                      {cliente?.entity_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-300">Monto a pagar:</span>
                    <span className="text-lg font-bold text-green-800 dark:text-green-200">
                      {formatCurrency(parseFloat(paymentAmount))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-300">Método de pago:</span>
                    <span className="font-bold text-green-800 dark:text-green-200">
                      {getPaymentMethodName(paymentMethod)}
                    </span>
                  </div>
                  {receiptNumber && (
                    <div className="flex justify-between">
                      <span className="text-green-700 dark:text-green-300">Comprobante:</span>
                      <span className="font-mono text-green-800 dark:text-green-200">
                        {receiptNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-ghost"
                disabled={isProcessing}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`btn btn-success gap-2 ${isProcessing ? 'loading' : ''}`}
                disabled={isProcessing || !paymentAmount || parseFloat(paymentAmount) <= 0}
              >
                {isProcessing ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Registrar Pago
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Warning */}
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:bg-amber-900/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />
              <div className="text-sm text-amber-700 dark:text-amber-300">
                <strong>Importante:</strong> Este pago se aplicará como crédito a la cuenta del
                cliente, reduciendo su deuda pendiente. Verifique el monto antes de confirmar.
              </div>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  )
}
