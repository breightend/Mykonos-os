import { useState, useEffect } from 'react'
import { Plus, Trash2, Package, ShoppingCart, X } from 'lucide-react'
import { fetchProductos } from '../../services/products/productService'
import { createPurchase, addProductToPurchase } from '../../services/proveedores/purchaseService'
import toast from 'react-hot-toast'
import { getBancos } from '../../services/paymentsServices/banksService'
import paymentMethodsService from '../../services/paymentsServices/paymentMethodsService'
import { useLocation, useSearchParams  } from 'wouter'


export default function AgregarCompraProveedor({ provider }) {
  const [isOpen, setIsOpen] = useState(false)
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

  useEffect(() => {
    const modal = document.getElementById('agregandoCompra')
    if (modal) {
      const handleShow = () => setIsOpen(true)
      const handleHide = () => {
        setIsOpen(false)
        resetForm()
      }

      modal.addEventListener('show', handleShow)
      modal.addEventListener('close', handleHide)

      return () => {
        modal.removeEventListener('show', handleShow)
        modal.removeEventListener('close', handleHide)
      }
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadProducts()
    }
  }, [isOpen])

  useEffect(() => {
    calculateTotals()
  }, [purchaseProducts])

  useEffect(() => {
    if (isOpen) {
      console.log('Modal de agregar compra abierto')
    }
  }, [isOpen])

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
        document.getElementById('agregandoCompra').close()
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

  return (
    <div>
      <div className="">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-xl font-bold">
            <ShoppingCart className="h-6 w-6" />
            Nueva Compra - {provider?.entity_name}
          </h3>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => document.getElementById('agregandoCompra').close()}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información de la compra */}
          <div className="rounded-lg bg-base-200 p-4">
            <h4 className="mb-4 font-semibold">Información de la Compra</h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="label">
                  <span className="label-text">Método de Pago</span>
                </label>
                <select
                  name="payment_method"
                  value={purchaseData.payment_method}
                  onChange={handlePurchaseInputChange}
                  className="select-bordered select w-full"
                >
                  <option value="">Seleccionar...</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                  <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                  <option value="Cuenta Corriente">Cuenta Corriente</option>
                </select>
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Número de Transacción</span>
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
                  <span className="label-text">Número de Factura</span>
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
                  <span className="label-text">Notas</span>
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
          </div>

          {/* Productos */}
          <div className="rounded-lg bg-base-200 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="flex items-center gap-2 font-semibold">
                <Package className="h-5 w-5" />
                Productos de la Compra
              </h4>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowProductModal(true)}
              >
                <Plus className="h-4 w-4" />
                Agregar Producto
              </button>
            </div>

            {purchaseProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Código</th>
                      <th>Precio Costo</th>
                      <th>Cantidad</th>
                      <th>Descuento</th>
                      <th>Subtotal</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseProducts.map((product) => (
                      <tr key={product.id}>
                        <td className="font-medium">{product.product_name}</td>
                        <td>{product.barcode}</td>
                        <td>${product.cost_price.toFixed(2)}</td>
                        <td>{product.quantity}</td>
                        <td>${product.discount.toFixed(2)}</td>
                        <td className="font-semibold">${product.subtotal.toFixed(2)}</td>
                        <td>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditProduct(product)}
                              className="btn btn-ghost btn-xs text-blue-600"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(product.id)}
                              className="btn btn-ghost btn-xs text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-500">
                No hay productos agregados a la compra
              </div>
            )}
          </div>

          {/* Totales */}
          <div className="rounded-lg bg-base-200 p-4">
            <h4 className="mb-4 font-semibold">Totales</h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="label">
                  <span className="label-text">Subtotal</span>
                </label>
                <input
                  type="number"
                  value={purchaseData.subtotal}
                  className="input-bordered input w-full"
                  readOnly
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Descuento Global</span>
                </label>
                <input
                  type="number"
                  name="discount"
                  value={purchaseData.discount}
                  onChange={handlePurchaseInputChange}
                  className="input-bordered input w-full"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Total</span>
                </label>
                <input
                  type="number"
                  value={purchaseData.total}
                  className="input-bordered input w-full font-semibold"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="modal-action">
            <button
              type="button"
              className="btn"
              onClick={() => document.getElementById('agregandoCompra').close()}
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

      {/* Modal para agregar/editar producto */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[80vh] w-96 overflow-y-auto rounded-lg bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-gray-800">
              {editingProduct ? 'Editar Producto' : 'Agregar Producto'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Buscar Producto</span>
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">
                    <span className="label-text">Precio Costo *</span>
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
                    <span className="label-text">Cantidad *</span>
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
                  <span className="label-text">Descuento</span>
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

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="btn"
              >
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={handleAddProduct}>
                {editingProduct ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
