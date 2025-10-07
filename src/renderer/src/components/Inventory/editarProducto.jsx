import { useState, useEffect, useRef } from 'react'
import { Save, Calculator, Package, Upload, Camera, ArrowLeft, Plus, X } from 'lucide-react'
import { useSearchParams } from 'wouter'
import { inventoryService } from '../../services/Inventory/inventoryService'
import { useSession } from '../../contexts/SessionContext'
import MenuVertical from '../../componentes especificos/menuVertical'
import Navbar from '../../componentes especificos/navbar'
import toast, { Toaster } from 'react-hot-toast'
import { API_ENDPOINTS } from '../../config/apiConfig.js'
import { useHashLocation } from 'wouter/use-hash-location'
//TODO: Colocar que se redondee para arriba asi no maneja precios raros.

const EditarProducto = () => {
  const [, setLocation] = useHashLocation()
  const [searchParams] = useSearchParams()
  const productId = searchParams.get('id')
  const [productData, setProductData] = useState(null)

  // Obtener información de la sesión actual
  const { session } = useSession()
  const currentSucursalId = session?.storage_id

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      // Si no hay historial, ir al inventario por defecto
      setLocation('/inventario')
    }
  }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [imageProcessing, setImageProcessing] = useState(false)
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
    discount: '', // General discount field from database
    tax: '',
    stock_variants: [],
    product_image: null,
    new_image: null
  })

  // Estado separado para la URL de la imagen actual
  const [currentImageUrl, setCurrentImageUrl] = useState(null)

  // Estados para agregar nuevas variantes
  const [showAddVariantForm, setShowAddVariantForm] = useState(false)
  const [availableSizes, setAvailableSizes] = useState([])
  const [availableColors, setAvailableColors] = useState([])
  const [newVariant, setNewVariant] = useState({
    size_id: '',
    color_id: '',
    quantity: 1
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

          // Cargar formData con los datos del producto (sin incluir la imagen base64)
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
            discount: data.discount || '', // General discount field
            tax: data.tax || '',
            stock_variants: data.stock_variants || [],
            product_image: null, // No cargar la imagen base64 aquí
            new_image: null
          })

          // Log de las variantes cargadas
          if (data.stock_variants && data.stock_variants.length > 0) {
            // Process variants
          }

          // Si el producto tiene imagen, configurar la URL para mostrarla
          if (data.has_image) {
            setCurrentImageUrl(`${API_ENDPOINTS.PRODUCT}/${productId}/image`)
          }
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

  // Cargar datos para agregar variantes (sizes, colors)
  useEffect(() => {
    const loadVariantData = async () => {
      try {
        // Cargar tamaños
        const sizesResponse = await fetch(`${API_ENDPOINTS.PRODUCT}/sizes`)
        if (sizesResponse.ok) {
          const sizesData = await sizesResponse.json()
          setAvailableSizes(sizesData || [])
        }

        // Cargar colores
        const colorsResponse = await fetch(`${API_ENDPOINTS.PRODUCT}/colors`)
        if (colorsResponse.ok) {
          const colorsData = await colorsResponse.json()
          setAvailableColors(colorsData || [])
        }
      } catch (error) {
        console.error('Error cargando datos para variantes:', error)
      }
    }

    loadVariantData()
  }, [])

  // Función para manejar cambios en el stock de variantes
  const updateVariantStock = (index, newQuantity) => {
    setFormData((prev) => ({
      ...prev,
      stock_variants: prev.stock_variants.map((variant, i) =>
        i === index ? { ...variant, quantity: parseInt(newQuantity) || 0 } : variant
      )
    }))
  }

  // Función para agregar nueva variante de stock
  const addNewVariant = () => {
    // Verificar que tengamos la sucursal del usuario logueado
    if (!currentSucursalId) {
      toast.error(
        'No se pudo obtener la información de la sucursal del usuario. Verifica que estés logueado correctamente.'
      )
      return
    }

    if (!newVariant.size_id || !newVariant.color_id) {
      toast.error('Tamaño y color son requeridos para agregar una variante')
      return
    }

    if (!newVariant.quantity || parseInt(newVariant.quantity) <= 0) {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }

    // Verificar si la variante ya existe
    const existingVariant = formData.stock_variants.find(
      (variant) =>
        variant.size_id === parseInt(newVariant.size_id) &&
        variant.color_id === parseInt(newVariant.color_id) &&
        variant.sucursal_id === parseInt(currentSucursalId)
    )

    if (existingVariant) {
      toast.error('Esta combinación de talla y color ya existe en tu sucursal')
      return
    }

    // Encontrar nombres para mostrar
    const selectedSize = availableSizes.find((s) => s.id === parseInt(newVariant.size_id))
    const selectedColor = availableColors.find((c) => c.id === parseInt(newVariant.color_id))

    if (!selectedSize || !selectedColor) {
      toast.error('Error: no se pudieron encontrar los datos de talla o color seleccionados')
      return
    }

    // Obtener nombre de la sucursal del contexto de sesión
    const sucursalNombre = session?.storage_name || 'Sucursal Actual'

    // Generar código de barras único para la variante
    const generateVariantBarcode = () => {
      const timestamp = Date.now().toString().slice(-6)
      const productPrefix = productId.toString().padStart(4, '0')
      const sizeCode = newVariant.size_id.toString().padStart(2, '0')
      const colorCode = newVariant.color_id.toString().padStart(2, '0')
      return `${productPrefix}${sizeCode}${colorCode}${timestamp}`
    }

    const newVariantObject = {
      product_id: parseInt(productId),
      size_id: parseInt(newVariant.size_id),
      color_id: parseInt(newVariant.color_id),
      sucursal_id: parseInt(currentSucursalId),
      quantity: parseInt(newVariant.quantity),
      size_name: selectedSize.size_name,
      color_name: selectedColor.color_name,
      color_hex: selectedColor.color_hex || '#ccc',
      sucursal_nombre: sucursalNombre,
      barcode: generateVariantBarcode(),
      is_new: true
    }

    // Actualizar el estado del formulario
    setFormData((prev) => ({
      ...prev,
      stock_variants: [...prev.stock_variants, newVariantObject]
    }))

    // Limpiar formulario
    setNewVariant({
      size_id: '',
      color_id: '',
      quantity: 1
    })

    toast.success(
      `Nueva variante agregada: ${selectedSize.size_name} - ${selectedColor.color_name}. ¡Ahora haz clic en GUARDAR para confirmar!`,
      { duration: 4000 }
    )
    setShowAddVariantForm(false)
  }

  // Función para remover una variante
  const removeVariant = (index) => {
    setFormData((prev) => ({
      ...prev,
      stock_variants: prev.stock_variants.filter((_, i) => i !== index)
    }))
    toast.success('Variante eliminada')
  }

  // Función para calcular descuentos
  const calculateDiscount = (type, value) => {
    const originalPrice = parseFloat(formData.original_price) || 0
    let newFormData = { ...formData }

    // Si no hay precio original, no se pueden calcular descuentos
    if (originalPrice <= 0) {
      toast.error('Debe establecer un precio original antes de aplicar descuentos')
      return
    }

    if (type === 'percentage') {
      const percentage = parseFloat(value) || 0
      const discountAmount = (originalPrice * percentage) / 100
      const salePrice = originalPrice - discountAmount

      newFormData = {
        ...newFormData,
        discount_percentage: value,
        discount_amount: discountAmount.toFixed(2),
        sale_price: Math.max(0, salePrice).toFixed(2) // Evitar precios negativos
      }
    } else if (type === 'amount') {
      const amount = parseFloat(value) || 0
      const percentage = originalPrice > 0 ? (amount / originalPrice) * 100 : 0
      const salePrice = originalPrice - amount

      newFormData = {
        ...newFormData,
        discount_amount: value,
        discount_percentage: percentage.toFixed(2),
        sale_price: Math.max(0, salePrice).toFixed(2) // Evitar precios negativos
      }
    } else if (type === 'sale_price') {
      const salePrice = parseFloat(value) || 0
      const discountAmount = originalPrice - salePrice
      const percentage = originalPrice > 0 ? (discountAmount / originalPrice) * 100 : 0

      newFormData = {
        ...newFormData,
        sale_price: value,
        discount_amount: Math.max(0, discountAmount).toFixed(2), // Evitar descuentos negativos
        discount_percentage: Math.max(0, percentage).toFixed(2)
      }
    }

    setFormData(newFormData)
  }

  // Función para comprimir imagen antes de subirla
  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo aspect ratio
        let { width, height } = img
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height
            height = maxWidth
          }
        }

        canvas.width = width
        canvas.height = height

        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height)

        // Convertir a base64 con compresión
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      }

      img.src = URL.createObjectURL(file)
    })
  }

  // Función para manejar cambio de imagen
  const handleImageChange = async (event) => {
    const file = event.target.files[0]
    if (file) {
      setImageProcessing(true)
      try {
        // Verificar tamaño del archivo
        const fileSizeMB = file.size / (1024 * 1024)

        if (fileSizeMB > 10) {
          toast.error('La imagen es demasiado grande. Máximo 10MB.')
          return
        }

        // Comprimir imagen
        const compressedImage = await compressImage(file, 800, 0.85)

        setFormData((prev) => ({
          ...prev,
          new_image: compressedImage
        }))

        toast.success('Imagen cargada y optimizada correctamente')
      } catch (error) {
        console.error('Error comprimiendo imagen:', error)
        toast.error('Error al procesar la imagen')
      } finally {
        setImageProcessing(false)
      }
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
    if (!productId) {
      toast.error('ID de producto no válido')
      return
    }

    setSaving(true)
    setError(null)

    try {
      // 🔍 Paso 1: Validación de datos
      toast.loading('Validando datos...', { id: 'save-progress' })

      const validation = validateFormData()
      if (!validation.isValid) {
        toast.error(validation.message, { id: 'save-progress' })
        return
      }

      // 🔄 Paso 2: Preparar datos básicos del producto (sin imagen ni stock)
      toast.loading('Preparando datos del producto...', { id: 'save-progress' })

      const basicProductData = {
        product_name: formData.product_name.trim(),
        description: formData.description.trim(),
        comments: formData.comments.trim(),
        cost: parseFloat(formData.cost) || 0,
        sale_price: parseFloat(formData.sale_price) || 0,
        original_price: parseFloat(formData.original_price) || 0,
        discount_percentage: parseFloat(formData.discount_percentage) || 0,
        discount_amount: parseFloat(formData.discount_amount) || 0,
        has_discount: Boolean(formData.has_discount),
        discount: parseFloat(formData.discount) || 0,
        tax: parseFloat(formData.tax) || 0
      }

      // 🔄 Paso 3: Actualizar información básica del producto
      toast.loading('Guardando información del producto...', { id: 'save-progress' })

      const basicUpdateResponse = await inventoryService.updateProduct(productId, basicProductData)

      if (basicUpdateResponse.status !== 'success') {
        throw new Error(`Error al actualizar producto: ${basicUpdateResponse.message}`)
      }

      // 🖼️ Paso 4: Procesar imagen si hay una nueva
      if (formData.new_image) {
        toast.loading('Procesando y guardando imagen...', { id: 'save-progress' })

        try {
          // Verificar tamaño de la imagen antes de enviar
          const imageSizeMB = (formData.new_image.length * 0.75) / (1024 * 1024) // Aproximación del tamaño en MB

          if (imageSizeMB > 5) {
            throw new Error('La imagen es demasiado grande. Máximo 5MB permitido.')
          }

          const imageData = {
            product_image: formData.new_image
          }

          const imageUpdateResponse = await inventoryService.updateProduct(productId, imageData)

          if (imageUpdateResponse.status === 'success') {
            // Actualizar la URL de la imagen actual
            setCurrentImageUrl(`${API_ENDPOINTS.PRODUCT}/${productId}/image?t=${Date.now()}`)
            // Limpiar la nueva imagen del formulario
            setFormData((prev) => ({ ...prev, new_image: null }))
            if (fileInputRef.current) {
              fileInputRef.current.value = ''
            }
          } else {
            console.warn('⚠️ Imagen no se pudo actualizar:', imageUpdateResponse.message)
          }
        } catch (imageError) {
          console.error('❌ Error procesando imagen:', imageError)
          toast.error(`Error con la imagen: ${imageError.message}`, { id: 'save-progress' })
          // No fallar todo el guardado por un error de imagen
        }
      }

      // 📦 Paso 5: Actualizar stock de variantes si existe
      if (formData.stock_variants && formData.stock_variants.length > 0) {
        toast.loading('Actualizando inventario por variantes...', { id: 'save-progress' })

        try {
          const stockData = {
            stock_variants: formData.stock_variants
          }

          const stockUpdateResponse = await inventoryService.updateProduct(productId, stockData)

          if (stockUpdateResponse.status === 'success') {
            // Stock updated successfully
          } else {
            console.warn(
              '⚠️ Stock de variantes no se pudo actualizar:',
              stockUpdateResponse.message
            )
          }
        } catch (stockError) {
          console.error('❌ Error actualizando stock:', stockError)
          toast.error(`Error actualizando inventario: ${stockError.message}`, {
            id: 'save-progress'
          })
        }
      } else {
        // No variants to update
      }

      // ✅ Paso 6: Finalización exitosa
      toast.success('¡Producto actualizado exitosamente!', { id: 'save-progress' })

      // Pequeña pausa para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        setLocation('/inventario')
      }, 1000)
    } catch (err) {
      console.error('❌ Error general guardando producto:', err)

      // Manejo específico de errores
      let errorMessage = 'Error desconocido al guardar el producto'

      if (err.response) {
        const status = err.response.status
        const responseData = err.response.data

        switch (status) {
          case 431:
            errorMessage = 'Los datos son demasiado grandes. Intenta con una imagen más pequeña.'
            break
          case 400:
            errorMessage = `Datos inválidos: ${responseData?.message || 'Verifica la información ingresada'}`
            break
          case 404:
            errorMessage = 'Producto no encontrado'
            break
          case 500:
            errorMessage = `Error del servidor: ${responseData?.message || 'Error interno'}`
            break
          default:
            errorMessage = `Error ${status}: ${responseData?.message || err.message}`
        }
      } else if (err.message) {
        errorMessage = err.message
      }

      toast.error(errorMessage, { id: 'save-progress' })
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  // 🔍 Función auxiliar para validar datos del formulario
  const validateFormData = () => {
    // Validar campos requeridos
    if (!formData.product_name || formData.product_name.trim() === '') {
      return { isValid: false, message: 'El nombre del producto es requerido' }
    }

    if (formData.product_name.trim().length < 2) {
      return { isValid: false, message: 'El nombre del producto debe tener al menos 2 caracteres' }
    }

    // Validar precios
    const cost = parseFloat(formData.cost) || 0
    const salePrice = parseFloat(formData.sale_price) || 0
    const originalPrice = parseFloat(formData.original_price) || 0

    if (cost < 0) {
      return { isValid: false, message: 'El costo no puede ser negativo' }
    }

    if (salePrice < 0) {
      return { isValid: false, message: 'El precio de venta no puede ser negativo' }
    }

    if (originalPrice < 0) {
      return { isValid: false, message: 'El precio original no puede ser negativo' }
    }

    // Validar descuentos si están activos
    if (formData.has_discount) {
      const discountPercentage = parseFloat(formData.discount_percentage) || 0
      const discountAmount = parseFloat(formData.discount_amount) || 0

      if (discountPercentage < 0 || discountPercentage > 100) {
        return { isValid: false, message: 'El porcentaje de descuento debe estar entre 0 y 100' }
      }

      if (discountAmount < 0) {
        return { isValid: false, message: 'El monto de descuento no puede ser negativo' }
      }

      if (discountAmount > originalPrice) {
        return { isValid: false, message: 'El descuento no puede ser mayor al precio original' }
      }
    }

    // Validar stock de variantes
    if (formData.stock_variants && formData.stock_variants.length > 0) {
      for (const variant of formData.stock_variants) {
        if (variant.quantity < 0) {
          return { isValid: false, message: 'Las cantidades de stock no pueden ser negativas' }
        }
      }
    }

    return { isValid: true, message: 'Datos válidos' }
  }

  if (!productId) {
    return (
      <div>
        <div className="ml-20 p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-error">Error</h2>
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
          <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-accent to-secondary p-6 text-black">
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
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 ring-2 focus:border-blue-500 focus:outline-none focus:ring-blue-200"
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
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 ring-2 focus:border-blue-500 focus:outline-none focus:ring-blue-200"
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
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 ring-2 focus:border-blue-500 focus:outline-none focus:ring-blue-200"
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
                        type="text"
                        value={formData.cost}
                        onChange={(e) => setFormData((prev) => ({ ...prev, cost: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 ring-2 focus:border-blue-500 focus:outline-none focus:ring-blue-200"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Precio Original
                      </label>
                      <input
                        type="text"
                        value={formData.original_price}
                        onChange={(e) => {
                          // Solo actualizar el precio original, NO recalcular descuentos automáticamente
                          setFormData((prev) => ({ ...prev, original_price: e.target.value }))
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 ring-2 focus:border-blue-500 focus:outline-none focus:ring-blue-200"
                        placeholder="Precio base sin descuentos"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Este es el precio original antes de aplicar descuentos
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Precio de Venta
                      </label>
                      <input
                        type="text"
                        value={formData.sale_price}
                        onChange={(e) => calculateDiscount('sale_price', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 ring-2 focus:border-blue-500 focus:outline-none focus:ring-blue-200"
                        placeholder="0.00"
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
                        <div className="mb-4 flex items-center justify-between">
                          <h4 className="text-md font-semibold text-orange-800">
                            🏷️ Configuración de Descuentos
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              if (formData.discount_percentage > 0) {
                                calculateDiscount('percentage', formData.discount_percentage)
                              } else if (formData.discount_amount > 0) {
                                calculateDiscount('amount', formData.discount_amount)
                              }
                            }}
                            className="rounded bg-orange-600 px-3 py-1 text-xs text-white hover:bg-orange-700"
                            title="Recalcular descuentos basado en el precio original actual"
                          >
                            🔄 Recalcular
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-orange-700">
                              Descuento (%)
                            </label>
                            <input
                              type="text"
                              value={formData.discount_percentage}
                              onChange={(e) => calculateDiscount('percentage', e.target.value)}
                              className="w-full rounded-lg border border-orange-300 px-3 py-2 ring-2 focus:border-orange-500 focus:outline-none focus:ring-orange-200"
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-orange-700">
                              Descuento ($)
                            </label>
                            <input
                              type="text"
                              value={formData.discount_amount}
                              onChange={(e) => calculateDiscount('amount', e.target.value)}
                              className="w-full rounded-lg border border-orange-300 px-3 py-2 ring-2 focus:border-orange-500 focus:outline-none focus:ring-orange-200"
                              placeholder="0.00"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-orange-700">
                              Descuento General
                            </label>
                            <input
                              type="text"
                              value={formData.discount || ''}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, discount: e.target.value }))
                              }
                              className="w-full rounded-lg border border-orange-300 px-3 py-2 ring-2 focus:border-orange-500 focus:outline-none focus:ring-orange-200"
                              placeholder="Descuento adicional"
                            />
                            <p className="mt-1 text-xs text-orange-600">
                              Descuento extra (no afecta cálculos automáticos)
                            </p>
                          </div>
                        </div>

                        {/* Resumen de Precios con Descuentos */}
                        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                          <h5 className="mb-3 text-sm font-semibold text-blue-800">
                            💰 Resumen de Precios
                          </h5>
                          <div className="text-sm text-blue-700">
                            <div className="flex items-center justify-between py-1">
                              <span className="font-medium">Precio Original:</span>
                              <span className="text-lg font-bold">
                                ${parseFloat(formData.original_price || 0).toFixed(2)}
                              </span>
                            </div>

                            {parseFloat(formData.discount_percentage || 0) > 0 && (
                              <div className="flex items-center justify-between py-1 text-orange-600">
                                <span>- Descuento ({formData.discount_percentage}%):</span>
                                <span className="font-medium">
                                  -${parseFloat(formData.discount_amount || 0).toFixed(2)}
                                </span>
                              </div>
                            )}

                            {parseFloat(formData.discount || 0) > 0 && (
                              <div className="flex items-center justify-between py-1 text-orange-600">
                                <span>- Descuento General:</span>
                                <span className="font-medium">
                                  -${parseFloat(formData.discount || 0).toFixed(2)}
                                </span>
                              </div>
                            )}

                            <div className="mt-2 flex items-center justify-between border-t border-blue-300 pt-2">
                              <span className="text-base font-bold">Precio Final de Venta:</span>
                              <span className="text-xl font-bold text-green-600">
                                ${parseFloat(formData.sale_price || 0).toFixed(2)}
                              </span>
                            </div>

                            {/* Mostrar ahorro total */}
                            {(parseFloat(formData.discount_amount || 0) > 0 ||
                              parseFloat(formData.discount || 0) > 0) && (
                              <div className="mt-2 text-center">
                                <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                                  💵 Ahorro total: $
                                  {(
                                    parseFloat(formData.discount_amount || 0) +
                                    parseFloat(formData.discount || 0)
                                  ).toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stock por Variantes */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">Stock por Variantes</h3>
                    <button
                      type="button"
                      onClick={() => setShowAddVariantForm(!showAddVariantForm)}
                      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-white ${
                        !currentSucursalId
                          ? 'cursor-not-allowed bg-gray-400'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                      disabled={!currentSucursalId}
                    >
                      <Plus size={16} />
                      {showAddVariantForm ? 'Cancelar' : 'Agregar Variante'}
                    </button>
                  </div>

                  {/* Mensaje de advertencia si no hay sucursal */}
                  {!currentSucursalId && (
                    <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
                      <div className="flex items-center gap-2 text-orange-700">
                        <span className="text-sm font-medium">⚠️ Advertencia:</span>
                      </div>
                      <p className="mt-1 text-sm text-orange-600">
                        No se puede agregar variantes sin una sucursal asignada.
                        {session?.role === 'administrator'
                          ? ' Como administrador, necesitas seleccionar una sucursal específica.'
                          : ' Contacta al administrador para que te asigne una sucursal.'}
                      </p>
                    </div>
                  )}

                  {/* Formulario para agregar nueva variante */}
                  {showAddVariantForm && (
                    <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
                      <h4 className="text-md mb-3 font-medium text-gray-700">
                        Nueva Variante de Stock
                      </h4>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Tamaño
                          </label>
                          <select
                            value={newVariant.size_id}
                            onChange={(e) =>
                              setNewVariant((prev) => ({ ...prev, size_id: e.target.value }))
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                          >
                            <option value="">Seleccionar tamaño</option>
                            {availableSizes.map((size) => (
                              <option key={size.id} value={size.id}>
                                {size.size_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Color
                          </label>
                          <select
                            value={newVariant.color_id}
                            onChange={(e) =>
                              setNewVariant((prev) => ({ ...prev, color_id: e.target.value }))
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                          >
                            <option value="">Seleccionar color</option>
                            {availableColors.map((color) => (
                              <option key={color.id} value={color.id}>
                                {color.color_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Mostrar información de la sucursal actual (no editable) */}
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Sucursal
                          </label>
                          <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                            {session?.storage_name || 'Sucursal Actual'}
                            <span className="ml-2 text-xs text-gray-500">(automático)</span>
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Cantidad
                          </label>
                          <input
                            type="text"
                            value={newVariant.quantity}
                            onChange={(e) =>
                              setNewVariant((prev) => ({ ...prev, quantity: e.target.value }))
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowAddVariantForm(false)}
                          className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={addNewVariant}
                          className="rounded bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
                        >
                          Agregar Variante
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Lista de variantes existentes */}
                  {formData.stock_variants && formData.stock_variants.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {formData.stock_variants.map((variant, index) => (
                        <div
                          key={`${variant.size_id}-${variant.color_id}-${variant.sucursal_id}`}
                          className="relative rounded-lg border border-gray-200 bg-white p-4"
                        >
                          {/* Botón de eliminar */}
                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700"
                            title="Eliminar variante"
                          >
                            <X size={14} />
                          </button>

                          <div className="mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              {variant.size_name} - {variant.color_name}
                            </span>
                            <br />
                            <span className="text-xs text-gray-500">{variant.sucursal_nombre}</span>
                            {variant.is_new && (
                              <span className="ml-2 rounded bg-green-100 px-2 py-1 text-xs text-green-700">
                                Nuevo
                              </span>
                            )}
                            {variant.barcode && (
                              <div className="mt-1">
                                <span className="text-xs text-gray-400">
                                  Código: {variant.barcode}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            <div
                              className="h-4 w-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: variant.color_hex || '#ccc' }}
                            ></div>
                            <input
                              type="text"
                              value={variant.quantity || 0}
                              onChange={(e) => updateVariantStock(index, e.target.value)}
                              className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                              placeholder="0"
                            />
                            <span className="text-xs text-gray-500">unid.</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-gray-500">No hay variantes de stock registradas</p>
                      <p className="mt-1 text-sm text-gray-400">
                        Usa el botón &quot;Agregar Variante&quot; para crear una nueva
                      </p>
                    </div>
                  )}
                </div>

                {/* Sección de Imagen */}
                <div className="mb-6">
                  <h3 className="mb-3 font-medium text-gray-700">Imagen del Producto</h3>
                  <div className="space-y-4">
                    {/* Imagen actual */}
                    {currentImageUrl && !formData.new_image && (
                      <div className="flex items-center space-x-4">
                        <img
                          src={currentImageUrl}
                          alt="Producto"
                          className="h-20 w-20 rounded-lg border border-gray-200 object-cover"
                          onError={(e) => {
                            console.log('Error cargando imagen:', e)
                            // Si hay error cargando la imagen, ocultarla
                            setCurrentImageUrl(null)
                          }}
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
                        disabled={imageProcessing}
                        className="flex items-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Upload size={16} />
                        <span>{imageProcessing ? 'Procesando...' : 'Cargar imagen'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={imageProcessing}
                        className="flex items-center space-x-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Camera size={16} />
                        <span>{imageProcessing ? 'Procesando...' : 'Tomar foto'}</span>
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
      <Toaster position="bottom-center" />
    </div>
  )
}

export default EditarProducto
