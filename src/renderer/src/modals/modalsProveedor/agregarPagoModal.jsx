import { useState, useEffect } from 'react'
import { DollarSign, Upload, X, Check, AlertTriangle, FileX, FileCheck } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { providerPaymentService } from '../../services/proveedores/providerPaymentService'
import { createPurchasePayment } from '../../services/proveedores/paymentService'
import toast from 'react-hot-toast'
import paymentMethodsService from '../../services/paymentsServices/paymentMethodsService'
import { getBancos } from '../../services/paymentsServices/banksService'

function AgregarPagoModal({
  provider,
  onPaymentAdded,
  purchaseData,
  onPaymentComplete,
  onPurchasePaymentComplete,
  onCancel,
  isForPurchase = false
}) {
  const [formData, setFormData] = useState({
    monto: '',
    forma_pago: '',
    descripcion: '',
    numero_comprobante: '',
    comprobante_image: null,
    transaction_number: '',
    invoice_number: '',
    bank_id: '',
    echeq_time: ''
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState([])
  const [loadingMethods, setLoadingMethods] = useState(false)
  const [banks, setBanks] = useState([])
  const [invoiceFile, setInvoiceFile] = useState(null)

  useEffect(() => {
    loadPaymentMethods()

    if (isForPurchase && purchaseData?.total) {
      const amount = purchaseData.total.toString()
      const formattedAmount = formatCurrency(amount)
      setFormData((prev) => ({
        ...prev,
        monto: formattedAmount,
        monto_raw: amount
      }))
    }
  }, [isForPurchase, purchaseData])

  const formatCurrency = (value) => {
    const numericValue = parseFloat(value) || 0
    return numericValue.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const loadPaymentMethods = async () => {
    try {
      setLoadingMethods(true)
      const methods = await paymentMethodsService.getProviderPaymentMethods()
      setPaymentMethods(methods.payment_methods)

      const banksData = await getBancos()
      setBanks(banksData.banks)
    } catch (error) {
      console.error('Error loading payment methods:', error)
      toast.error('Error al cargar los métodos de pago')
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

  const handleNumericInputChange = (e) => {
    const { name, value } = e.target

    let numericValue = value.replace(/[^0-9,]/g, '')

    const parts = numericValue.split(',')
    let integerPart = parts[0] || ''
    let decimalPart = parts.length > 1 ? parts[1].slice(0, 2) : '' // Limit to 2 decimal places

    integerPart = integerPart.replace(/^0+/, '') || '0'

    if (integerPart.length > 3) {
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    }

    let formattedValue = integerPart
    if (decimalPart !== '') {
      formattedValue += ',' + decimalPart
    } else if (numericValue.includes(',')) {
      formattedValue += ','
    }
    const rawValue = (parts[0] || '0') + (parts.length > 1 ? '.' + decimalPart : '')

    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
      [`${name}_raw`]: rawValue
    }))
  }

  const resetForm = () => {
    setFormData({
      monto: '',
      forma_pago: '',
      descripcion: '',
      numero_comprobante: '',
      comprobante_image: null,
      transaction_number: '',
      invoice_number: '',
      bank_id: '',
      echeq_time: ''
    })
  }

  const isBankFieldVisible = () => {
    const selectedMethodId = parseInt(formData.forma_pago)
    return [7, 6, 2].includes(selectedMethodId)
  }

  const isEcheqTimeVisible = () => {
    const selectedMethodId = parseInt(formData.forma_pago)
    return selectedMethodId === 6
  }

  const getPaymentMethodId = () => {
    const basicMethod = formData.forma_pago
    const bankId = formData.bank_id

    if (basicMethod && bankId) {
      return basicMethod
    } else if (basicMethod) {
      return basicMethod
    }
    return null
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

    // Validate echeq_time if payment method is echeq (method id 6)
    if (parseInt(formData.forma_pago) === 6 && !formData.echeq_time) {
      toast.error('Debe seleccionar el plazo del cheque electrónico')
      return
    }

    try {
      setIsProcessing(true)

      const amount = parseFloat(
        formData.monto_raw || formData.monto.replace(/\./g, '').replace(',', '.')
      )

      let result

      // Check if this is a purchase-specific payment
      if (isForPurchase && purchaseData?.id) {
        // Use the new purchase payment system
        const purchasePaymentData = {
          payment_method: formData.forma_pago,
          amount: amount,
          payment_date: new Date().toISOString().split('T')[0], // Current date
          notes: formData.descripcion || `Pago para compra #${purchaseData.id}`
        }

        try {
          result = await createPurchasePayment(purchaseData.id, purchasePaymentData)

          if (result.status === 'success') {
            toast.success(
              `¡Pago de compra registrado exitosamente!\n• Monto: ${providerPaymentService.formatCurrency(amount)}\n• Compra: #${purchaseData.id}\n• Método: ${providerPaymentService.getPaymentMethodNameSync(formData.forma_pago)}`,
              { duration: 4000 }
            )

            resetForm()

            if (onPurchasePaymentComplete) {
              onPurchasePaymentComplete({
                ...purchasePaymentData,
                payment_id: result.payment_id,
                purchase_id: purchaseData.id
              })
            }

            document.getElementById('agregandoPago').close()
            return
          } else {
            throw new Error(result.message || 'Error creating purchase payment')
          }
        } catch (error) {
          console.error('Error creating purchase payment:', error)
          // Fall back to general provider payment if purchase payment fails
          toast.error('Error en pago específico de compra, intentando pago general...')
        }
      }

      // General provider payment (original logic)
      const paymentDescription =
        formData.descripcion ||
        `Pago a proveedor (${providerPaymentService.getPaymentMethodNameSync(formData.forma_pago)})`

      // Convert file to base64 if present
      let invoiceFileBase64 = null
      if (invoiceFile) {
        try {
          invoiceFileBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              // Remove the data URL prefix to get just the base64 data
              const base64 = reader.result.split(',')[1]
              resolve(base64)
            }
            reader.onerror = reject
            reader.readAsDataURL(invoiceFile)
          })
          console.log('📁 File converted to base64, length:', invoiceFileBase64.length)
        } catch (error) {
          console.error('Error converting file to base64:', error)
          toast.error('Error al procesar el archivo adjunto')
        }
      }

      // Prepare payment data with additional fields
      const paymentData = {
        entity_id: provider.id,
        amount: amount,
        description: paymentDescription,
        medio_pago: formData.forma_pago,
        numero_de_comprobante: formData.numero_comprobante || undefined,
        comprobante_image: formData.comprobante_image || undefined,
        banks: banks || [],
        invoice_file: invoiceFileBase64, // Send base64 data instead of file object
        invoice_number: formData.invoice_number || null,
        purchase_id: purchaseData?.id || null // Link to purchase if available
      }

      // Add additional fields if they exist
      if (formData.transaction_number) {
        paymentData.transaction_number = formData.transaction_number
      }

      if (formData.bank_id) {
        paymentData.bank_id = formData.bank_id
      }

      if (formData.echeq_time) {
        paymentData.echeq_time = formData.echeq_time
      }

      result = await providerPaymentService.createProviderPayment(paymentData)

      if (result.success) {
        const paymentTypeMsg = isForPurchase ? 'compra' : 'proveedor'
        toast.success(
          `¡Pago de ${paymentTypeMsg} registrado exitosamente!\n• Monto: ${providerPaymentService.formatCurrency(amount)}\n• Método: ${providerPaymentService.getPaymentMethodNameSync(formData.forma_pago)}\n• Nuevo saldo: ${providerPaymentService.formatCurrency(result.new_balance)}`,
          { duration: 4000 }
        )

        resetForm()

        // If this is a purchase payment, call the completion handler
        if (purchaseData && onPurchasePaymentComplete) {
          onPurchasePaymentComplete({
            ...paymentData,
            payment_id: result.payment_id
          })
        } else if (onPaymentAdded) {
          onPaymentAdded()
        }

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

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0]
    if (uploadedFile && uploadedFile.type === 'application/pdf') {
      setInvoiceFile(uploadedFile)
    } else {
      setInvoiceFile(null)
      alert('Por favor, sube un archivo PDF.')
    }
  }

  // React Dropzone configuration
  const onDrop = (acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const reasons = rejectedFiles[0].errors
        .map((error) => {
          switch (error.code) {
            case 'file-too-large':
              return 'El archivo es muy grande (máximo 10MB)'
            case 'file-invalid-type':
              return 'Tipo de archivo no válido (solo PDF, PNG, JPG)'
            default:
              return 'Error desconocido'
          }
        })
        .join(', ')
      toast.error(`Error al subir archivo: ${reasons}`)
      return
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setInvoiceFile(file)
      setFormData((prev) => ({
        ...prev,
        comprobante_image: file
      }))
      toast.success('Archivo cargado correctamente')
    }
  }

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  })

  const handleRemoveFile = () => {
    setInvoiceFile(null)
    setFormData((prev) => ({
      ...prev,
      comprobante_image: null
    }))
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
              <div>
                <label className="label">
                  <span className="label-text font-medium text-gray-600">Método de Pago *</span>
                </label>
                <select
                  name="forma_pago"
                  value={formData.forma_pago}
                  onChange={handleInputChange}
                  className="select-bordered select w-full"
                  required
                >
                  <option value="">Seleccionar método...</option>
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.display_name}
                    </option>
                  ))}
                </select>
              </div>

              {isBankFieldVisible() && (
                <div>
                  <label htmlFor="" className="label">
                    <span className="label-text font-medium text-gray-600">Banco *</span>
                  </label>
                  <select
                    name="bank_id"
                    value={formData.bank_id}
                    onChange={handleInputChange}
                    className="select-bordered select w-full"
                    required
                  >
                    <option value="">Seleccionar banco...</option>
                    {banks.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isEcheqTimeVisible() && (
                <div>
                  <label htmlFor="echeq_time" className="label">
                    <span className="label-text font-medium text-gray-600">Plazo del Cheque *</span>
                  </label>
                  <select
                    id="echeq_time"
                    name="echeq_time"
                    value={formData.echeq_time}
                    onChange={handleInputChange}
                    className="select-bordered select w-full"
                    required
                  >
                    <option value="">Seleccionar plazo...</option>
                    <option value={30}>30 días</option>
                    <option value={60}>60 días</option>
                    <option value={90}>90 días</option>
                  </select>
                </div>
              )}
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

            <div>
              <label className="label">
                <span className="label-text font-medium text-gray-600">Número de Transacción</span>
              </label>
              <input
                type="text"
                name="transaction_number"
                value={formData.transaction_number}
                onChange={handleInputChange}
                className="input-bordered input w-full"
                placeholder="Número de comprobante"
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text font-medium text-gray-600">Número de Factura</span>
              </label>
              <input
                type="text"
                name="invoice_number"
                value={formData.invoice_number}
                onChange={handleInputChange}
                className="input-bordered input w-full"
                placeholder="Número de factura"
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

              {/* React Dropzone Area */}
              <div
                {...getRootProps()}
                className={`flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all duration-200 ${
                  isDragActive && !isDragReject
                    ? 'border-primary bg-primary/10 text-primary'
                    : isDragReject
                      ? 'bg-error/10 border-error text-error'
                      : invoiceFile || formData.comprobante_image
                        ? 'bg-success/10 border-success text-success'
                        : 'bg-base-200/50 text-base-content/70 border-base-300 hover:bg-base-200'
                } `}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center pb-6 pt-5">
                  {isDragActive ? (
                    isDragReject ? (
                      <>
                        <FileX className="mb-4 h-8 w-8 text-error" />
                        <p className="text-sm font-semibold text-error">Archivo no válido</p>
                        <p className="text-error/70 text-xs">Solo PDF, PNG, JPG (MAX. 10MB)</p>
                      </>
                    ) : (
                      <>
                        <Upload className="mb-4 h-8 w-8 text-primary" />
                        <p className="text-sm font-semibold text-primary">
                          ¡Suelta el archivo aquí!
                        </p>
                      </>
                    )
                  ) : invoiceFile || formData.comprobante_image ? (
                    <>
                      <FileCheck className="mb-4 h-8 w-8 text-success" />
                      <p className="text-sm font-semibold text-success">
                        Archivo cargado: {(invoiceFile || formData.comprobante_image)?.name}
                      </p>
                      <p className="text-success/70 text-xs">
                        Tamaño:{' '}
                        {((invoiceFile || formData.comprobante_image)?.size / 1024 / 1024).toFixed(
                          2
                        )}{' '}
                        MB
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveFile()
                        }}
                        className="btn btn-error btn-xs mt-2"
                      >
                        <X className="h-3 w-3" />
                        Eliminar
                      </button>
                    </>
                  ) : (
                    <>
                      <Upload className="text-base-content/50 mb-4 h-8 w-8" />
                      <p className="text-base-content/70 mb-2 text-sm">
                        <span className="font-semibold">Clic para subir</span> o arrastra y suelta
                      </p>
                      <p className="text-base-content/50 text-xs">PDF, PNG, JPG (MAX. 10MB)</p>
                    </>
                  )}
                </div>
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
                    {formData.echeq_time && parseInt(formData.forma_pago) === 6 && (
                      <div className="flex justify-between">
                        <span className="text-base-content/70">Plazo del cheque:</span>
                        <span className="font-medium text-base-content">
                          {formData.echeq_time} días
                        </span>
                      </div>
                    )}
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
                  ) <= 0 ||
                  (parseInt(formData.forma_pago) === 6 && !formData.echeq_time)
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
