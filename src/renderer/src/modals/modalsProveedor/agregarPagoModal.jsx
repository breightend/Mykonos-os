import { useState, useEffect } from 'react'
import { DollarSign, Upload, X, Check, AlertTriangle } from 'lucide-react'
import { providerPaymentService } from '../../services/proveedores/providerPaymentService'
import toast from 'react-hot-toast'

function AgregarPagoModal({ provider, onPaymentAdded }) {
  const [formData, setFormData] = useState({
    monto: '',
    forma_pago: '',
    descripcion: '',
    numero_comprobante: '',
    comprobante: null
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState([])
  const [loadingMethods, setLoadingMethods] = useState(false)

  // Load payment methods when component mounts
  useEffect(() => {
    loadPaymentMethods()
  }, [])

  const loadPaymentMethods = async () => {
    try {
      setLoadingMethods(true)
      const methods = await providerPaymentService.getAvailablePaymentMethods()
      setPaymentMethods(methods)
    } catch (error) {
      console.error('Error loading payment methods:', error)
      // Use fallback methods if there's an error
      setPaymentMethods(providerPaymentService.getFallbackPaymentMethods())
    } finally {
      setLoadingMethods(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle numeric input with validation and formatting
  const handleNumericInputChange = (e) => {
    const { name, value } = e.target

    // Remove all non-numeric characters except comma (for decimal separator)
    let numericValue = value.replace(/[^0-9,]/g, '')

    // Handle comma as decimal separator (convert to dot for processing)
    const parts = numericValue.split(',')
    let integerPart = parts[0] || ''
    let decimalPart = parts.length > 1 ? parts[1].slice(0, 2) : '' // Limit to 2 decimal places

    // Remove leading zeros but keep at least one digit
    integerPart = integerPart.replace(/^0+/, '') || '0'

    // Format integer part with dots for thousands
    if (integerPart.length > 3) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    }

    // Build the final formatted value
    let formattedValue = integerPart
    if (decimalPart !== '') {
      formattedValue += ',' + decimalPart
    } else if (numericValue.includes(',')) {
      formattedValue += ','
    }

    // Store the raw numeric value (without formatting) for calculations
    const rawValue = (parts[0] || '0') + (parts.length > 1 ? '.' + decimalPart : '')

    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
      [`${name}_raw`]: rawValue // Store raw value for calculations
    }))
  }

  const handleFileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      comprobante: e.target.files[0]
    }))
  }

  const resetForm = () => {
    setFormData({
      monto: '',
      forma_pago: '',
      descripcion: '',
      numero_comprobante: '',
      comprobante: null
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!provider?.id) {
      toast.error('Proveedor no válido')
      return
    }

    if (
      !formData.monto ||
      parseFloat(formData.monto_raw || formData.monto.replace(/\./g, '').replace(',', '.')) <= 0
    ) {
      toast.error('El monto del pago debe ser mayor a cero')
      return
    }

    if (!formData.forma_pago) {
      toast.error('Debe seleccionar un método de pago')
      return
    }

    try {
      setIsProcessing(true)

      const amount = parseFloat(
        formData.monto_raw || formData.monto.replace(/\./g, '').replace(',', '.')
      )
      const paymentDescription =
        formData.descripcion ||
        `Pago a proveedor (${providerPaymentService.getPaymentMethodNameSync(formData.forma_pago)})`

      // Create credit movement (payment to provider)
      const result = await providerPaymentService.createProviderPayment({
        entity_id: provider.id,
        amount: amount,
        description: paymentDescription,
        medio_pago: formData.forma_pago,
        numero_de_comprobante: formData.numero_comprobante || undefined
      })

      if (result.success) {
        toast.success(
          `¡Pago registrado exitosamente!\n• Monto: ${providerPaymentService.formatCurrency(amount)}\n• Método: ${providerPaymentService.getPaymentMethodNameSync(formData.forma_pago)}\n• Nuevo saldo: ${providerPaymentService.formatCurrency(result.new_balance)}`,
          { duration: 4000 }
        )

        // Reset form
        resetForm()

        // Call the callback to refresh data
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
    resetForm()
    document.getElementById('agregandoPago').close()
  }

  return (
    <div>
      <dialog id="agregandoPago" className="modal">
        <div className="modal-box w-7/12 border border-base-300 bg-base-100 shadow-2xl backdrop:blur-sm">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between border-b border-base-300 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-base-content">Registrar Pago a Proveedor</h3>
                <p className="text-base-content/70 text-sm">
                  Proveedor:{' '}
                  <span className="font-medium text-primary">{provider?.entity_name || 'N/A'}</span>
                </p>
              </div>
            </div>
            <form method="dialog">
              <button
                type="button"
                onClick={handleCancel}
                className="hover:bg-error/10 btn btn-ghost btn-sm px-3 py-2 hover:text-error"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Monto */}
            <div className="form-control">
              <label htmlFor="monto" className="label">
                <span className="label-text font-medium text-base-content">Monto a Pagar *</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-base-content/50">$</span>
                </div>
                <input
                  type="text"
                  id="monto"
                  name="monto"
                  value={formData.monto}
                  onChange={handleNumericInputChange}
                  className="input-bordered input w-full border-base-300 bg-white pl-8 focus:border-primary focus:outline-none"
                  placeholder="1.000,00"
                  required
                  inputMode="decimal"
                />
              </div>
            </div>

            {/* Forma de pago */}
            <div className="form-control">
              <label htmlFor="forma_pago" className="label">
                <span className="label-text font-medium text-base-content">Método de Pago *</span>
              </label>
              <select
                id="forma_pago"
                name="forma_pago"
                value={formData.forma_pago}
                onChange={handleInputChange}
                className="select-bordered select w-full border-base-300 bg-base-100 focus:border-primary focus:outline-none"
                required
                disabled={loadingMethods}
              >
                <option value="">
                  {loadingMethods ? 'Cargando métodos...' : 'Seleccionar método'}
                </option>
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Descripción */}
            <div className="form-control">
              <label htmlFor="descripcion" className="label">
                <span className="label-text font-medium text-base-content">Descripción</span>
                <span className="label-text-alt text-base-content/50">Opcional</span>
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                className="textarea-bordered textarea w-full border-base-300 bg-base-100 focus:border-primary focus:outline-none"
                placeholder="Concepto del pago, observaciones, etc."
                rows="3"
                disabled={isProcessing}
              />
            </div>

            {/* Número de comprobante */}
            <div className="form-control">
              <label htmlFor="numero_comprobante" className="label">
                <span className="label-text font-medium text-base-content">
                  Número de Comprobante
                </span>
                <span className="label-text-alt text-base-content/50">Opcional</span>
              </label>
              <input
                type="text"
                id="numero_comprobante"
                name="numero_comprobante"
                value={formData.numero_comprobante}
                onChange={handleInputChange}
                className="input-bordered input w-full border-base-300 bg-base-100 focus:border-primary focus:outline-none"
                placeholder="REC-001, CHQ-123, TRF-456, etc."
                disabled={isProcessing}
              />
            </div>

            {/* Comprobante */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-base-content">
                  Comprobante de Pago
                </span>
                <span className="label-text-alt text-base-content/50">Opcional</span>
              </label>
              <div className="flex w-full items-center justify-center">
                <label
                  htmlFor="comprobante"
                  className="bg-base-200/50 flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-base-300 transition-colors hover:bg-base-200"
                >
                  <div className="flex flex-col items-center justify-center pb-6 pt-5">
                    <Upload className="text-base-content/50 mb-4 h-8 w-8" />
                    <p className="text-base-content/70 mb-2 text-sm">
                      <span className="font-semibold">Clic para subir</span> o arrastra y suelta
                    </p>
                    <p className="text-base-content/50 text-xs">PDF, PNG, JPG (MAX. 10MB)</p>
                    {formData.comprobante && (
                      <p className="mt-2 text-xs font-medium text-primary">
                        Archivo: {formData.comprobante.name}
                      </p>
                    )}
                  </div>
                  <input
                    id="comprobante"
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>

            {/* Resumen */}
            {formData.monto &&
              parseFloat(
                formData.monto_raw || formData.monto.replace(/\./g, '').replace(',', '.')
              ) > 0 &&
              formData.forma_pago && (
                <div className="border-success/30 bg-success/10 rounded-lg border p-4">
                  <h4 className="mb-3 text-lg font-semibold text-success">📊 Resumen del Pago</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Proveedor:</span>
                      <span className="font-medium text-base-content">{provider?.entity_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Monto a pagar:</span>
                      <span className="text-lg font-bold text-success">
                        {providerPaymentService.formatCurrency(
                          parseFloat(
                            formData.monto_raw ||
                              formData.monto.replace(/\./g, '').replace(',', '.')
                          )
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Método de pago:</span>
                      <span className="font-medium text-base-content">
                        {providerPaymentService.getPaymentMethodNameSync(formData.forma_pago)}
                      </span>
                    </div>
                    {formData.numero_comprobante && (
                      <div className="flex justify-between">
                        <span className="text-base-content/70">Comprobante:</span>
                        <span className="font-mono text-base-content">
                          {formData.numero_comprobante}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </form>

          {/* Actions */}
          <div className="modal-action border-t border-base-300 pt-6">
            <div className="flex w-full gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-ghost flex-1 border border-base-300 hover:bg-base-200"
                disabled={isProcessing}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="btn btn-primary flex-1 shadow-lg transition-shadow hover:shadow-xl"
                disabled={
                  isProcessing ||
                  !formData.monto ||
                  !formData.forma_pago ||
                  parseFloat(
                    formData.monto_raw || formData.monto.replace(/\./g, '').replace(',', '.')
                  ) <= 0
                }
              >
                {isProcessing ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Procesando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Registrar Pago
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Warning */}
          <div className="border-warning/30 bg-warning/10 mt-4 rounded-lg border p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-warning" />
              <div className="text-sm text-warning">
                <strong>Importante:</strong> Este pago se aplicará como crédito a la cuenta del
                proveedor, reduciendo nuestra deuda pendiente. Verifique el monto antes de
                confirmar.
              </div>
            </div>
          </div>
        </div>

        {/* Modal backdrop */}
        <form method="dialog" className="modal-backdrop bg-black/50">
          <button type="button" onClick={handleCancel}>
            close
          </button>
        </form>
      </dialog>
    </div>
  )
}

export default AgregarPagoModal