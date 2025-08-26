import { useState, useEffect } from 'react'
import { Plus, Trash2, Package, ShoppingCart, X } from 'lucide-react'
import { fetchProductos } from '../../services/products/productService'
import { createPurchase, addProductToPurchase } from '../../services/proveedores/purchaseService'
import toast from 'react-hot-toast'
import { getBancos } from '../../services/paymentsServices/banksService'
import paymentMethodsService from '../../services/paymentsServices/paymentMethodsService'
import { useLocation, useSearchParams } from 'wouter'

export default function AgregarCompraProveedor({ provider }) {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [, setLocation] = useLocation()
  const [searchParams] = useSearchParams()
  const providerId = searchParams.get('id')
  const [purchaseData, setPurchaseData] = useState({
    subtotal: 0,
    discount: 0,
    total: 0,
    payment_method: '',
    transaction_number: '',
    invoice_number: '',
    notes: ''
  })
  const [paymentData, setPaymentData] = useState({
    payment_method_id: '',
    bank_id: '',
    amount: 0
  })

  const handleCerrar = () => {
    setLocation(`/infoProvider?id=${providerId}`)
  }

  const [purchaseProducts, setPurchaseProducts] = useState([])

  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [productFormData, setProductFormData] = useState({
    product_id: '',
    cost_price: '',
    quantity: 1,
    discount: 0
  })
  const [banks, setBanks] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])

  // Cargar productos al montar el componente
  useEffect(() => {
    const loadPaymentMethods = async () => {
      const methods = await paymentMethodsService.getAllPaymentMethods()
      setPaymentMethods(methods.payment_methods)
      const bancosData = await getBancos()
      setBanks(bancosData.banks)
    }
    loadPaymentMethods()
    loadProducts()
  }, [])

  useEffect(() => {
    calculateTotals()
  }, [purchaseProducts])

  const loadProducts = async () => {
    try {
      const data = await fetchProductos()
      setProducts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Error al cargar productos')
    }
  }

  const resetForm = () => {
    setPurchaseData({
      subtotal: 0,
      discount: 0,
      total: 0,
      payment_method: '',
      transaction_number: '',
      invoice_number: '',
      notes: ''
    })
    setPurchaseProducts([])
    setProductFormData({
      product_id: '',
      cost_price: '',
      quantity: 1,
      discount: 0
    })
    setEditingProduct(null)
    setSearchTerm('')
  }

  const calculateTotals = () => {
    const subtotal = purchaseProducts.reduce((acc, item) => {
      const itemSubtotal = item.cost_price * item.quantity - item.discount
      return acc + itemSubtotal
    }, 0)

    const total = subtotal - purchaseData.discount

    setPurchaseData((prev) => ({
      ...prev,
      subtotal: subtotal.toFixed(2),
      total: total.toFixed(2)
    }))
  }

  const handlePurchaseInputChange = (e) => {
    const { name, value } = e.target
    setPurchaseData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleProductInputChange = (e) => {
    const { name, value } = e.target
    setProductFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const getFilteredProducts = () => {
    if (!searchTerm.trim()) return products
    return products.filter(
      (product) =>
        product.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.provider_code?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const handleAddProduct = () => {
    if (!productFormData.product_id || !productFormData.cost_price || !productFormData.quantity) {
      toast.error('Por favor complete todos los campos requeridos')
      return
    }

    const selectedProduct = products.find((p) => p.id === parseInt(productFormData.product_id))
    if (!selectedProduct) {
      toast.error('Producto no encontrado')
      return
    }

    const productToAdd = {
      id: editingProduct ? editingProduct.id : Date.now(),
      product_id: parseInt(productFormData.product_id),
      product_name: selectedProduct.product_name,
      barcode: selectedProduct.barcode,
      cost_price: parseFloat(productFormData.cost_price),
      quantity: parseInt(productFormData.quantity),
      discount: parseFloat(productFormData.discount) || 0,
      subtotal:
        parseFloat(productFormData.cost_price) * parseInt(productFormData.quantity) -
        (parseFloat(productFormData.discount) || 0)
    }

    if (editingProduct) {
      setPurchaseProducts((prev) =>
        prev.map((item) => (item.id === editingProduct.id ? productToAdd : item))
      )
    } else {
      // Verificar si el producto ya está agregado
      const existingProduct = purchaseProducts.find(
        (item) => item.product_id === productToAdd.product_id
      )
      if (existingProduct) {
        toast.error('Este producto ya está agregado a la compra')
        return
      }
      setPurchaseProducts((prev) => [...prev, productToAdd])
    }

    setShowProductModal(false)
    setEditingProduct(null)
    setProductFormData({
      product_id: '',
      cost_price: '',
      quantity: 1,
      discount: 0
    })
    toast.success(editingProduct ? 'Producto actualizado' : 'Producto agregado')
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setProductFormData({
      product_id: product.product_id.toString(),
      cost_price: product.cost_price.toString(),
      quantity: product.quantity.toString(),
      discount: product.discount.toString()
    })
    setShowProductModal(true)
  }

  const handleRemoveProduct = (productId) => {
    setPurchaseProducts((prev) => prev.filter((item) => item.id !== productId))
    toast.success('Producto eliminado de la compra')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!provider?.id) {
      toast.error('No se ha seleccionado un proveedor')
      return
    }

    if (purchaseProducts.length === 0) {
      toast.error('Debe agregar al menos un producto')
      return
    }

    try {
      setLoading(true)

      // Crear la compra principal
      const purchasePayload = {
        entity_id: provider.id,
        subtotal: parseFloat(purchaseData.subtotal),
        discount: parseFloat(purchaseData.discount) || 0,
        total: parseFloat(purchaseData.total),
        payment_method: purchaseData.payment_method,
        transaction_number: purchaseData.transaction_number,
        invoice_number: purchaseData.invoice_number,
        notes: purchaseData.notes,
        status: 'Pendiente de entrega',
        products: purchaseProducts.map((product) => ({
          product_id: product.product_id,
          cost_price: product.cost_price,
          quantity: product.quantity,
          discount: product.discount,
          subtotal: product.subtotal
        }))
      }

      const result = await createPurchase(purchasePayload)

      if (result.status === 'éxito') {
        toast.success('Compra creada exitosamente')
        // Eliminado: cerrar modal, ahora es una pestaña
        resetForm()
        // Aquí podrías refrescar la lista de compras del proveedor
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

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target
    setPaymentData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddProductWindow = () => {
    setLocation(`/agregarProductoCompraProveedor?id=${providerId}`)
  }



  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="mb-8 rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-center gap-4 border-b pb-4">
          <ShoppingCart className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-extrabold text-gray-800">
            Nueva Compra - {provider?.entity_name || 'Proveedor'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Purchase Information Section */}
          <section className="rounded-lg bg-gray-50 p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-semibold text-gray-700">Información de la Compra</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="label">
                  <span className="label-text font-medium text-gray-600">Método de Pago</span>
                </label>
                <select
                  name="payment_method"
                  value={paymentData.payment_method_id}
                  onChange={handlePurchaseInputChange}
                  className="select-bordered select w-full"
                  required
                >
                  <option value="">Seleccionar método...</option>
                  {paymentMethods &&
                    paymentMethods.map((method) => (
                      <option key={method.id} value={method.id}>
                        {method.display_name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label htmlFor="" className='label'>
                  <span className='label-text font-medium text-gray-600'>Banco</span>
                </label>
                <select
                  name="bank_id"
                  value={paymentData.bank_id}
                  onChange={handlePaymentInputChange}
                  className="select-bordered select w-full"
                  required
                >
                  <option value="">Seleccionar banco...</option>
                  {banks &&
                    banks.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-medium text-gray-600">
                    Número de Transacción
                  </span>
                </label>
                <input
                  type="text"
                  name="transaction_number"
                  value={purchaseData.transaction_number}
                  onChange={handlePurchaseInputChange}
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
                  value={purchaseData.invoice_number}
                  onChange={handlePurchaseInputChange}
                  className="input-bordered input w-full"
                  placeholder="Número de factura"
                />
              </div>

              <div className="lg:col-span-3">
                <label className="label">
                  <span className="label-text font-medium text-gray-600">Notas</span>
                </label>
                <textarea
                  name="notes"
                  value={purchaseData.notes}
                  onChange={handlePurchaseInputChange}
                  className="textarea-bordered textarea w-full"
                  placeholder="Notas adicionales sobre la compra"
                  rows="2"
                />
              </div>
            </div>
          </section>

          {/* Products Section */}
          <section className="rounded-lg bg-gray-50 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-700">
                <Package className="h-6 w-6 text-primary" />
                Productos de la Compra
              </h3>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleAddProductWindow}
              >
                <Plus className="h-4 w-4" />
                Agregar Producto
              </button>
            </div>

            {purchaseProducts.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border">
                <table className="table w-full">
                  <thead className="bg-gray-200 text-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left">Producto</th>
                      <th className="px-4 py-3 text-left">Código</th>
                      <th className="px-4 py-3 text-left">Precio Costo</th>
                      <th className="px-4 py-3 text-left">Cantidad</th>
                      <th className="px-4 py-3 text-left">Descuento</th>
                      <th className="px-4 py-3 text-left">Subtotal</th>
                      <th className="px-4 py-3 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseProducts.map((product) => (
                      <tr key={product.id} className="border-b transition-colors hover:bg-gray-100">
                        <td className="px-4 py-3 font-medium">{product.product_name}</td>
                        <td className="px-4 py-3">{product.barcode}</td>
                        <td className="px-4 py-3 text-gray-600">
                          ${product.cost_price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">{product.quantity}</td>
                        <td className="px-4 py-3 text-gray-600">${product.discount.toFixed(2)}</td>
                        <td className="px-4 py-3 font-bold text-success">
                          ${product.subtotal.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditProduct(product)}
                              className="btn btn-ghost btn-xs text-blue-600 hover:bg-blue-100"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(product.id)}
                              className="btn btn-ghost btn-xs text-red-600 hover:bg-red-100"
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
                <p className="text-sm">Usa el botón agregar producto para empezar.</p>
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
              onClick={() => window.history.back()}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || purchaseProducts.length === 0}
            >
              {loading ? 'Creando...' : 'Crear Compra'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal to add/edit product */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-2xl font-bold text-gray-800">
              {editingProduct ? 'Editar Producto' : 'Agregar Producto'}
            </h3>
            <p className="mb-6 text-sm text-gray-500">
              Selecciona o busca un producto y especifica los detalles de la compra.
            </p>

            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text font-medium text-gray-600">Buscar Producto</span>
                </label>
                <input
                  type="text"
                  placeholder="Buscar por nombre, código de barras o código de proveedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-bordered input mb-2 w-full"
                />
                <select
                  name="product_id"
                  value={productFormData.product_id}
                  onChange={handleProductInputChange}
                  className="select-bordered select w-full"
                  required
                >
                  <option value="">Seleccionar producto...</option>
                  {getFilteredProducts().map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.product_name} - {product.barcode}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">
                    <span className="label-text font-medium text-gray-600">Precio Costo *</span>
                  </label>
                  <input
                    type="number"
                    name="cost_price"
                    value={productFormData.cost_price}
                    onChange={handleProductInputChange}
                    className="input-bordered input w-full"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="label">
                    <span className="label-text font-medium text-gray-600">Cantidad *</span>
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={productFormData.quantity}
                    onChange={handleProductInputChange}
                    className="input-bordered input w-full"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-medium text-gray-600">Descuento</span>
                </label>
                <input
                  type="number"
                  name="discount"
                  value={productFormData.discount}
                  onChange={handleProductInputChange}
                  className="input-bordered input w-full"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <button
                type="button"
                className="btn btn-ghost text-gray-600 hover:bg-gray-200"
                onClick={handleCerrar}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddProduct}
                disabled={
                  !productFormData.product_id ||
                  productFormData.quantity <= 0 ||
                  productFormData.cost_price < 0
                }
              >
                {editingProduct ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
