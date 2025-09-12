import { useState, useEffect } from 'react'
import {
  Plus,
  Package,
  ShoppingCart,
  FileUp,
  FileCheck2,
  X,
  FilterX,
  Calendar,
  Check,
  Trash2,
  CreditCard
} from 'lucide-react'
import { fetchProductos } from '../../services/products/productService'
import { createPurchase } from '../../services/proveedores/purchaseService'
import toast from 'react-hot-toast'
import { useLocation, useSearchParams } from 'wouter'
import { useProductContext } from '../../contexts/ProductContext'
import { DayPicker } from 'react-day-picker'
import { es } from 'react-day-picker/locale'
import AgregarPagoModal from '../../modals/modalsProveedor/agregarPagoModal'

export default function AgregarCompraProveedor({ provider }) {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [, setLocation] = useLocation()
  const [searchParams] = useSearchParams()
  const providerId = searchParams.get('id')

  const [purchaseData, setPurchaseData] = useState({
    subtotal: 0,
    discount: 0,
    total: 0,
    notes: '',
    delivery_date: ''
  })

  const [invoiceFile, setInvoiceFile] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [delivery_date, setDeliveryDate] = useState('')

  const {
    productData,
    removeProduct,
    updateProductQuantity,
    clearProducts,
    purchaseInfo,
    updatePurchaseInfo,
    clearPurchaseInfo
  } = useProductContext()

  useEffect(() => {
    if (purchaseInfo.notes) {
      setPurchaseData((prev) => ({
        ...prev,
        notes: purchaseInfo.notes,
        delivery_date: purchaseInfo.delivery_date
      }))
    }
  }, [purchaseInfo])

  useEffect(() => {
    const loadData = async () => {
      try {
        const productsData = await fetchProductos()
        setProducts(Array.isArray(productsData) ? productsData : [])
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Error al cargar datos')
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    const subtotal = productData.products.reduce(
      (acc, item) => acc + item.cost_price * item.quantity,
      0
    )
    const total = subtotal - (parseFloat(purchaseData.discount) || 0)

    setPurchaseData((prev) => ({
      ...prev,
      subtotal: subtotal.toFixed(2),
      total: total.toFixed(2)
    }))
  }, [productData.products, purchaseData.discount])

  const handlePurchaseInputChange = (e) => {
    const { name, value } = e.target
    setPurchaseData((prev) => ({ ...prev, [name]: value }))
    updatePurchaseInfo({ [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (productData.products.length === 0) {
      toast.error('Debe agregar al menos un producto antes de continuar')
      return
    }
    // Open payment modal instead of directly submitting
    setShowPaymentModal(true)
  }

  const handlePaymentComplete = async (paymentData) => {
    if (!provider?.id) {
      toast.error('No se ha seleccionado un proveedor')
      return
    }

    try {
      setLoading(true)

      let fileBase64 = null
      if (invoiceFile) {
        const reader = new FileReader()
        fileBase64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result.split(',')[1])
          reader.onerror = reject
          reader.readAsDataURL(invoiceFile)
        })
      }

      const purchasePayload = {
        entity_id: provider.id,
        subtotal: parseFloat(purchaseData.subtotal),
        discount: parseFloat(purchaseData.discount) || 0,
        total: parseFloat(purchaseData.total),
        payment_method: paymentData.payment_method_id,
        echeq_time: paymentData.echeq_time || null,
        delivery_date: delivery_date ? delivery_date.toISOString().split('T')[0] : null,
        transaction_number: paymentData.transaction_number,
        invoice_number: paymentData.invoice_number,
        notes: purchaseData.notes,
        status: 'Pendiente de entrega',
        products: productData.products.map((product) => ({
          product_id: product.product_id,
          cost_price: product.cost_price,
          quantity: product.quantity,
          discount: product.discount || 0,
          subtotal: product.subtotal,
          stock_variants: product.stock_variants
        })),
        invoice_file: fileBase64
      }

      const result = await createPurchase(purchasePayload)

      if (result.status === 'éxito') {
        toast.success('Compra creada exitosamente')
        setLocation(`/infoProvider?id=${providerId}`)
        resetForm()
        setShowPaymentModal(false)
      } else {
        toast.error('Error al crear la compra')
      }
    } catch (error) {
      console.error('Error creating purchase:', error)
      toast.error('Error al crear la compra')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setPurchaseData({
      subtotal: 0,
      discount: 0,
      total: 0,
      notes: '',
      delivery_date: ''
    })
    clearProducts()
    clearPurchaseInfo()
    setInvoiceFile(null)
    setDeliveryDate(null)
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

  const handleRemoveFile = () => {
    setInvoiceFile(null)
  }

  const handleCerrar = () => {
    setLocation(`/infoProvider?id=${providerId}`)
  }

  const toggleCalendar = () => {
    setShowCalendar(!showCalendar)
  }

  const getLabel = () => {
    if (!delivery_date) return 'Selecciona día de arribo de mercadería'
    else return delivery_date.toLocaleDateString('es-ES', { dateStyle: 'medium' })
  }

  return (
    <div className="container mx-auto max-w-7xl p-4">
      <div className="mb-8 rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center gap-4 border-b pb-4">
          <ShoppingCart className="h-10 w-10 text-primary" />
          <h2 className="text-3xl font-extrabold text-gray-800">
            Nueva Compra - {provider?.entity_name || 'Proveedor'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Purchase Information Section */}
          <section className="rounded-lg bg-gray-50 p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-700">
              <Calendar className="h-5 w-5 text-secondary" />
              Información de la Compra
            </h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <button
                type="button"
                className={`btn btn-warning btn-outline min-w-[200px] ${showCalendar ? 'btn-active' : ''}`}
                onClick={toggleCalendar}
              >
                <Calendar className="h-4 w-4" />
                {getLabel()}
              </button>

              <div className="md:col-span-2">
                <label className="label">
                  <span className="label-text font-medium text-gray-600">Notas</span>
                </label>
                <textarea
                  name="notes"
                  value={purchaseData.notes}
                  onChange={handlePurchaseInputChange}
                  className="textarea-bordered textarea w-full"
                  placeholder="Notas adicionales sobre la compra"
                  rows="3"
                />
              </div>
            </div>
          </section>

          {/* Invoice Upload Section */}
          <section className="rounded-lg bg-gray-50 p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-semibold text-gray-700">
              <FileUp className="h-5 w-5 text-secondary" />
              Factura de Compra
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              Sube el archivo PDF de la factura para mantener un registro digital.
            </p>
            <div className="flex items-center space-x-4">
              <label
                htmlFor="invoice-upload"
                className="btn btn-primary btn-outline cursor-pointer transition-colors duration-200 hover:bg-primary hover:text-white"
              >
                {invoiceFile ? (
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="h-5 w-5" />
                    <span>Cambiar Archivo</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <FileUp className="h-5 w-5" />
                    <span>Seleccionar Archivo</span>
                  </div>
                )}
                <input
                  id="invoice-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {invoiceFile && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="truncate font-medium">{invoiceFile.name}</span>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-error hover:text-red-700"
                    aria-label="Eliminar archivo"
                  >
                    &times;
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Products Section */}
          <section className="rounded-lg bg-gray-50 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-700">
                <Package className="h-5 w-5 text-secondary" />
                Productos de la Compra
              </h3>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setLocation(`/agregarProductoCompraProveedor?id=${providerId}`)}
              >
                <Plus className="h-4 w-4" />
                Agregar Producto
              </button>
            </div>

            {productData.products.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border">
                <table className="table w-full">
                  <thead className="bg-gray-200 text-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-4 py-3 text-left">Nombre</th>
                      <th className="px-4 py-3 text-left">Código Proveedor</th>
                      <th className="px-4 py-3 text-left">Precio Costo</th>
                      <th className="px-4 py-3 text-left">Cantidad</th>
                      <th className="px-4 py-3 text-left">Subtotal</th>
                      <th className="px-4 py-3 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productData.products.map((product, index) => (
                      <tr key={product.id} className="border-b transition-colors hover:bg-gray-100">
                        <td className="px-4 py-3 font-medium">{index + 1}</td>
                        <td className="px-4 py-3 font-medium">{product.product_name}</td>
                        <td className="px-4 py-3">{product.provider_code}</td>
                        <td className="px-4 py-3 text-gray-600">
                          ${product.cost_price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={product.quantity}
                            onChange={(e) =>
                              updateProductQuantity(product.id, parseInt(e.target.value) || 0)
                            }
                            className="input-bordered input input-sm w-20 text-center"
                            min="0"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium">${product.subtotal.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="btn btn-error btn-sm"
                              onClick={() => removeProduct(product.id)}
                              title="Eliminar producto"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400">
                <p>No hay productos agregados a la compra.</p>
                <p className="text-sm">Usa el botón Agregar Producto para empezar.</p>
              </div>
            )}
          </section>

          {/* Totals Section */}
          <section className="flex flex-col gap-4 rounded-lg bg-gray-50 p-6 shadow-sm md:flex-row md:justify-end">
            <div className="flex flex-col items-center md:w-1/3 md:items-end">
              <label className="label">
                <span className="label-text font-medium text-gray-600">Subtotal</span>
              </label>
              <input
                type="text"
                value={`$${purchaseData.subtotal}`}
                className="input-bordered input w-full text-right font-mono text-lg"
                readOnly
              />
            </div>

            <div className="flex flex-col items-center md:w-1/3 md:items-end">
              <label className="label">
                <span className="label-text font-medium text-gray-600">Descuento Global</span>
              </label>
              <input
                type="number"
                name="discount"
                value={purchaseData.discount}
                onChange={handlePurchaseInputChange}
                className="input-bordered input w-full text-right font-mono text-lg"
                min="0"
                step="0.01"
              />
            </div>

            <div className="flex flex-col items-center md:w-1/3 md:items-end">
              <label className="label">
                <span className="label-text font-bold text-gray-800">TOTAL</span>
              </label>
              <input
                type="text"
                value={`$${purchaseData.total}`}
                className="input-bordered input w-full bg-primary text-right text-xl font-extrabold text-white"
                readOnly
              />
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              className="btn btn-ghost text-gray-600 hover:bg-gray-200"
              onClick={handleCerrar}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary flex items-center gap-2"
              disabled={loading || productData.products.length === 0}
            >
              <CreditCard className="h-4 w-4" />
              {loading ? 'Procesando...' : 'Continuar a Pago'}
            </button>
          </div>
        </form>
      </div>

      {/* Calendar Modal */}
      {showCalendar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCalendar(false)
            }
          }}
        >
          <div className="animate-in fade-in-0 zoom-in-95 relative mx-4 w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl duration-200">
            {/* Modal Header */}
            <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-bold text-gray-800">Seleccionar Fecha de Entrega</h3>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-circle text-gray-500 hover:bg-red-50 hover:text-red-500"
                onClick={() => setShowCalendar(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Calendar */}
            <div className="flex justify-center">
              <DayPicker
                classNames={{
                  day: 'h-9 w-9 p-4 font-medium hover:bg-primary/10 hover:text-primary rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  selected:
                    'bg-primary text-white hover:bg-primary hover:text-white focus:bg-primary focus:text-white rounded-md font-bold shadow-sm',
                  today: 'bg-secondary text-white font-bold rounded-md',
                  outside: 'text-gray-300 opacity-50',
                  disabled: 'text-gray-300 opacity-30 cursor-not-allowed',
                  hidden: 'invisible',
                  months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                  month: 'space-y-4',
                  caption_label: 'text-lg font-bold text-gray-800',
                  caption:
                    'flex justify-center items-center text-lg font-bold text-gray-800 mb-4 relative',
                  nav: 'flex items-center absolute left-0 right-0 justify-between px-2',
                  nav_button:
                    'h-8 w-8 bg-transparent p-0 rounded-full transition-colors border border-base-300 text-base-content hover:bg-primary hover:text-white',
                  nav_button_previous: '',
                  nav_button_next: ''
                }}
                mode="single"
                selected={delivery_date}
                onSelect={setDeliveryDate}
                locale={es}
                disabled={{ before: new Date() }}
                showOutsideDays={false}
                fixedWeeks={false}
                numberOfMonths={1}
              />
            </div>

            {/* Selected date info */}
            {delivery_date && (
              <div className="mt-6 rounded-xl border border-primary/10 bg-gradient-to-r from-primary/5 to-secondary/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-primary">Fecha seleccionada:</p>
                </div>
                <p className="text-lg font-bold text-gray-800">
                  {delivery_date.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-6 flex justify-between gap-3">
              <button
                type="button"
                className="btn btn-error btn-outline flex-1"
                onClick={() => {
                  setDeliveryDate(null)
                  setShowCalendar(false)
                }}
              >
                <FilterX className="mr-2 h-4 w-4" />
                Limpiar
              </button>
              <button
                type="button"
                className="btn btn-primary flex-1"
                onClick={() => setShowCalendar(false)}
                disabled={!delivery_date}
              >
                <Check className="mr-2 h-4 w-4" />
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <AgregarPagoModal
          provider={provider}
          purchaseData={{
            subtotal: parseFloat(purchaseData.subtotal),
            total: parseFloat(purchaseData.total),
            products: productData.products
          }}
          onPaymentComplete={handlePaymentComplete}
          onCancel={() => setShowPaymentModal(false)}
          isForPurchase={true}
        />
      )}
    </div>
  )
}
