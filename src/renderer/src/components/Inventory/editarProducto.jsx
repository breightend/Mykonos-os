import { useState, useEffect, useRef } from 'react'
import { Save, Calculator, Package, Upload, Camera, ArrowLeft } from 'lucide-react'
import { useLocation, useSearchParams } from 'wouter'
import { inventoryService } from '../../services/inventory/inventoryService'
import MenuVertical from '../../componentes especificos/menuVertical'
import Navbar from '../../componentes especificos/navbar'
import toast, { Toaster } from 'react-hot-toast'
//TODO: Colocar que se redondee para arriba asi no maneja precios raros.

const EditarProducto = () => {
  const [, setLocation] = useLocation()
  const [searchParams] = useSearchParams()
  const productId = searchParams.get('id')
  const [productData, setProductData] = useState(null)

  // Función para manejar el botón volver
  const handleGoBack = () => {
    // Verificar si hay historial previo
    if (window.history.length > 1) {
      window.history.back()
    } else {
      // Si no hay historial, ir al inventario por defecto
      setLocation('/inventory')
    }
  }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef(null)

  // Estados para los campos editables
  const [formData, setFormData] = useState({
    product_name: '',
    description: '',
    comments: '',
    cost: '',
    sale_price: '',
    original_price: '',
    discount_percentage: '',
    discount_amount: '',
    has_discount: false,
    tax: '',
    stock_variants: [],
    product_image: null,
    new_image: null
  })

  // Cargar datos del producto
  useEffect(() => {
    const loadProductData = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await inventoryService.getProductDetails(productId)

        if (response.status === 'success') {
          const data = response.data
          setProductData(data)

          // Cargar formData con los datos del producto
          setFormData({
            product_name: data.product_name || '',
            description: data.description || '',
            comments: data.comments || '',
            cost: data.cost || '',
            sale_price: data.sale_price || '',
            original_price: data.original_price || data.sale_price || '',
            discount_percentage: data.discount_percentage || '',
            discount_amount: data.discount_amount || '',
            has_discount: data.has_discount || false,
            tax: data.tax || '',
            stock_variants: data.stock_variants || [],
            product_image: data.product_image || null,
            new_image: null
          })
        } else {
          setError('Error al cargar los datos del producto')
        }
      } catch (err) {
        console.error('Error loading product data:', err)
        setError('Error al cargar los datos del producto')
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      loadProductData()
    }
  }, [productId])

  // Función para manejar cambios en el stock de variantes
  const updateVariantStock = (index, newQuantity) => {
    setFormData((prev) => ({
      ...prev,
      stock_variants: prev.stock_variants.map((variant, i) =>
        i === index ? { ...variant, quantity: parseInt(newQuantity) || 0 } : variant
      )
    }))
  }

  // Función para calcular descuentos
  const calculateDiscount = (type, value) => {
    const originalPrice = parseFloat(formData.original_price) || 0
    let newFormData = { ...formData }

    if (type === 'percentage') {
      const percentage = parseFloat(value) || 0
      const discountAmount = (originalPrice * percentage) / 100
      const salePrice = originalPrice - discountAmount

      newFormData = {
        ...newFormData,
        discount_percentage: value,
        discount_amount: discountAmount.toFixed(2),
        sale_price: salePrice.toFixed(2)
      }
    } else if (type === 'amount') {
      const amount = parseFloat(value) || 0
      const percentage = originalPrice > 0 ? (amount / originalPrice) * 100 : 0
      const salePrice = originalPrice - amount

      newFormData = {
        ...newFormData,
        discount_amount: value,
        discount_percentage: percentage.toFixed(2),
        sale_price: salePrice.toFixed(2)
      }
    } else if (type === 'sale_price') {
      const salePrice = parseFloat(value) || 0
      const discountAmount = originalPrice - salePrice
      const percentage = originalPrice > 0 ? (discountAmount / originalPrice) * 100 : 0

      newFormData = {
        ...newFormData,
        sale_price: value,
        discount_amount: discountAmount.toFixed(2),
        discount_percentage: percentage.toFixed(2)
      }
    }

    setFormData(newFormData)
  }

  // Función para manejar cambio de imagen
  const handleImageChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFormData((prev) => ({
          ...prev,
          new_image: e.target.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  // Función para limpiar nueva imagen
  const clearNewImage = () => {
    setFormData((prev) => ({
      ...prev,
      new_image: null
    }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    if (!productId) return

    setSaving(true)
    setError(null)

    try {
      const updateData = {
        product_name: formData.product_name,
        description: formData.description,
        comments: formData.comments,
        cost: parseFloat(formData.cost) || 0,
        sale_price: parseFloat(formData.sale_price) || 0,
        original_price: parseFloat(formData.original_price) || 0,
        discount_percentage: parseFloat(formData.discount_percentage) || 0,
        discount_amount: parseFloat(formData.discount_amount) || 0,
        has_discount: formData.has_discount,
        tax: parseFloat(formData.tax) || 0,
        stock_variants: formData.stock_variants,
        product_image: formData.new_image || formData.product_image
      }

      await inventoryService.updateProduct(productId, updateData)

      toast.success('Producto actualizado exitosamente')
      setLocation('/inventory')
    } catch (err) {
      console.error('Error saving product:', err)
      toast.error('Error al guardar los cambios del producto')
    } finally {
      setSaving(false)
    }
  }

  if (!productId) {
    return (
      <div>
        <div className="ml-20 p-8">
          <div className="text-center">
            <h2 className="text-error text-2xl font-bold">Error</h2>
            <p className="mt-4">No se proporcionó un ID de producto válido</p>
            <button onClick={handleGoBack} className="btn btn-primary mt-4">
              Volver al producto
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="p-8">
        {/* Header con navegación */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={handleGoBack} className="btn btn-ghost btn-sm">
              <ArrowLeft className="h-4 w-4" />
              Volver al Producto
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow-2xl">
          {/* Header */}
          <div className="from-accent to-secondary flex items-center justify-between border-b border-gray-200 bg-gradient-to-r p-6 text-black">
            <div className="flex items-center space-x-3">
              <Package className="h-6 w-6" />
              <h3 className="text-xl font-bold">Información del Producto</h3>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-6">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Cargando datos del producto...</div>
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                {error}
              </div>
            )}

            {!loading && productData && (
              <div className="space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Nombre del Producto
                    </label>
                    <input
                      type="text"
                      value={formData.product_name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, product_name: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 ring-2 focus:border-blue-500 focus:ring-blue-200 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Descripción
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 ring-2 focus:border-blue-500 focus:ring-blue-200 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Comentarios
                    </label>
                    <textarea
                      value={formData.comments}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, comments: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 ring-2 focus:border-blue-500 focus:ring-blue-200 focus:outline-none"
                      rows="3"
                    />
                  </div>
                </div>

                {/* Precios y Descuentos */}
                <div className="rounded-lg border border-green-200 bg-green-50 p-6">
                  <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-800">
                    <Calculator className="mr-2 h-5 w-5 text-green-600" />
                    Precios y Descuentos
                  </h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Precio de Costo
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.cost}
                        onChange={(e) => setFormData((prev) => ({ ...prev, cost: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 ring-2 focus:border-blue-500 focus:ring-blue-200 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Precio Original
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.original_price}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, original_price: e.target.value }))
                          if (formData.has_discount) {
                            calculateDiscount('percentage', formData.discount_percentage)
                          }
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 ring-2 focus:border-blue-500 focus:ring-blue-200 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Precio de Venta
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.sale_price}
                        onChange={(e) => calculateDiscount('sale_price', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 ring-2 focus:border-blue-500 focus:ring-blue-200 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Configuración de Descuentos */}
                  <div className="mt-6">
                    <div className="mb-4">
                      <h4 className="text-md mb-3 font-medium text-gray-700">
                        Gestión de Descuentos
                      </h4>

                      {/* Toggle de descuento con diseño bonito */}
                      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`h-3 w-3 rounded-full ${formData.has_discount ? 'bg-green-500' : 'bg-gray-300'}`}
                          ></div>
                          <span className="text-sm font-medium text-gray-700">
                            {formData.has_discount ? 'Descuento Activo' : 'Sin Descuento'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, has_discount: !prev.has_discount }))
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            formData.has_discount ? 'bg-green-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              formData.has_discount ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {formData.has_discount && (
                      <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-orange-700">
                              Descuento (%)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.discount_percentage}
                              onChange={(e) => calculateDiscount('percentage', e.target.value)}
                              className="w-full rounded-lg border border-orange-300 px-3 py-2 ring-2 focus:border-orange-500 focus:ring-orange-200 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-orange-700">
                              Descuento ($)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.discount_amount}
                              onChange={(e) => calculateDiscount('amount', e.target.value)}
                              className="w-full rounded-lg border border-orange-300 px-3 py-2 ring-2 focus:border-orange-500 focus:ring-orange-200 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Información de precios */}
                        <div className="mt-4 rounded-lg border border-orange-200 bg-white p-3">
                          <div className="text-sm text-gray-600">
                            <div className="flex justify-between">
                              <span>Precio Original:</span>
                              <span className="font-medium">
                                ${formData.original_price || '0.00'}
                              </span>
                            </div>
                            <div className="flex justify-between text-orange-600">
                              <span>Descuento:</span>
                              <span className="font-medium">
                                -${formData.discount_amount || '0.00'}
                              </span>
                            </div>
                            <div className="flex justify-between border-t pt-2 font-semibold text-green-600">
                              <span>Precio Final:</span>
                              <span>${formData.sale_price || '0.00'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stock por Variantes */}
                {formData.stock_variants && formData.stock_variants.length > 0 && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                    <h3 className="mb-4 text-lg font-semibold text-gray-800">
                      Stock por Variantes
                    </h3>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {formData.stock_variants.map((variant, index) => (
                        <div
                          key={`${variant.size_id}-${variant.color_id}-${variant.sucursal_id}`}
                          className="rounded-lg border border-gray-200 bg-white p-4"
                        >
                          <div className="mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              {variant.size_name} - {variant.color_name}
                            </span>
                            <br />
                            <span className="text-xs text-gray-500">{variant.sucursal_nombre}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <div
                              className="h-4 w-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: variant.color_hex || '#ccc' }}
                            ></div>
                            <input
                              type="number"
                              min="0"
                              value={variant.quantity || 0}
                              onChange={(e) => updateVariantStock(index, e.target.value)}
                              className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                            />
                            <span className="text-xs text-gray-500">unid.</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sección de Imagen */}
                <div className="mb-6">
                  <h3 className="mb-3 font-medium text-gray-700">Imagen del Producto</h3>
                  <div className="space-y-4">
                    {/* Imagen actual */}
                    {formData.product_image && (
                      <div className="flex items-center space-x-4">
                        <img
                          src={formData.product_image}
                          alt="Producto"
                          className="h-20 w-20 rounded-lg border border-gray-200 object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Imagen actual</p>
                        </div>
                      </div>
                    )}

                    {/* Nueva imagen seleccionada */}
                    {formData.new_image && (
                      <div className="flex items-center space-x-4">
                        <img
                          src={formData.new_image}
                          alt="Nueva imagen"
                          className="h-20 w-20 rounded-lg border border-green-200 object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-green-600">Nueva imagen seleccionada</p>
                          <button
                            type="button"
                            onClick={clearNewImage}
                            className="text-sm text-red-500 hover:text-red-700"
                          >
                            Cancelar cambio
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Botones de carga */}
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Upload size={16} />
                        <span>Cargar imagen</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Camera size={16} />
                        <span>Tomar foto</span>
                      </button>
                    </div>

                    {/* Input oculto para archivos */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handleGoBack}
                type="button"
                className="btn btn-ghost rounded-lg border border-gray-300 bg-white px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50"
                disabled={saving}
              >
                Cancelar e ir al inventario
              </button>

              <button
                onClick={handleSave}
                type="button"
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                disabled={saving || loading}
              >
                <Save className="h-4 w-4" />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Toaster position="bottom-right" />
    </div>
  )
}

export default EditarProducto
