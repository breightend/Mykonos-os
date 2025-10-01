import { useState, useEffect, useRef } from 'react'
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
  DollarSign,
  Percent,
  FileX,
  FileCheck,
  Scan,
  Search
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { fetchProductos } from '../../services/products/productService'
import { API_ENDPOINTS } from '../../config/apiConfig.js'
import postData from '../../services/products/productService'
import { createPurchase } from '../../services/proveedores/purchaseService'
import { fetchProviderById } from '../../services/proveedores/proveedorService'
import { fetchSize } from '../../services/products/sizeService'
import { fetchColor } from '../../services/products/colorService'
import toast from 'react-hot-toast'
import { useLocation, useSearchParams } from 'wouter'
import { useProductContext } from '../../contexts/ProductContext'
import { DayPicker } from 'react-day-picker'
import { es } from 'react-day-picker/locale'

export default function AgregarCompraProveedor() {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [provider, setProvider] = useState(null)
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
  const [showCalendar, setShowCalendar] = useState(false)
  const [delivery_date, setDeliveryDate] = useState('')

  // Estados para búsqueda por código de barras
  const [barcodeSearch, setBarcodeSearch] = useState('')
  const [searchingBarcode, setSearchingBarcode] = useState(false)
  const [foundProductForPurchase, setFoundProductForPurchase] = useState(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [updateProductCost, setUpdateProductCost] = useState(false)

  // Estados para el modal de producto encontrado
  const [purchaseQuantity, setPurchaseQuantity] = useState(1)
  const [purchasePrice, setPurchasePrice] = useState(0)
  const [providerCode, setProviderCode] = useState('')

  // Estados para sistema de variantes
  const [selectedVariants, setSelectedVariants] = useState([
    { talle: '', colores: [{ color: '', cantidad: 1 }] }
  ])
  const [availableSizes, setAvailableSizes] = useState([])
  const [availableColors, setAvailableColors] = useState([])
  const [loadingVariants, setLoadingVariants] = useState(false)
  const [existingVariants, setExistingVariants] = useState([]) // Variantes actuales del producto

  // Refs para funcionalidad de barcode
  const barcodeInputRef = useRef(null)
  const autoSearchTimeoutRef = useRef(null)

  // Reset modal values when a new product is found
  useEffect(() => {
    if (foundProductForPurchase) {
      setPurchaseQuantity(1)
      setPurchasePrice(foundProductForPurchase.product?.cost || 0)
      setProviderCode(foundProductForPurchase.product?.provider_code || '')
      // Initialize with the scanned variant
      setSelectedVariants([
        {
          talle: foundProductForPurchase.scanned_variant?.size_name || '',
          colores: [
            {
              color: foundProductForPurchase.scanned_variant?.color_name || '',
              cantidad: 1
            }
          ]
        }
      ])
      // Load available sizes and colors
      loadVariantData()
    }
  }, [foundProductForPurchase])

  // Load available sizes and colors for variants
  const loadVariantData = async () => {
    try {
      setLoadingVariants(true)
      console.log('🔄 Cargando datos de variantes...')

      // Use the same services as the reference file
      const [sizesResponse, colorsResponse] = await Promise.allSettled([fetchSize(), fetchColor()])

      if (sizesResponse.status === 'fulfilled' && sizesResponse.value) {
        const sizesData = sizesResponse.value.map((size) => ({
          id: size.id || size.size_id,
          name: size.size_name || size.name
        }))
        setAvailableSizes(sizesData)
        console.log('✅ Talles cargados exitosamente:', sizesData.length)
      } else {
        console.warn('⚠️ Error al cargar talles:', sizesResponse.reason)
        setAvailableSizes([])
      }

      if (colorsResponse.status === 'fulfilled' && colorsResponse.value) {
        const colorsData = colorsResponse.value.map((color) => ({
          id: color.id || color.color_id,
          name: color.color_name || color.name
        }))
        setAvailableColors(colorsData)
        console.log('🎨 Colores cargados exitosamente:', colorsData.length)
      } else {
        console.warn('⚠️ Error al cargar colores:', colorsResponse.reason)
        setAvailableColors([])
      }
    } catch (error) {
      console.error('❌ Error loading variant data:', error)
      toast.error('Error al cargar datos de variantes')
    } finally {
      setLoadingVariants(false)
    }
  }

  // Función para cargar las variantes existentes del producto
  const loadExistingVariants = async (productId) => {
    try {
      console.log('🔍 Cargando variantes existentes del producto:', productId)

      const response = await fetch(`${API_ENDPOINTS.INVENTORY}/product-variants/${productId}`)
      const data = await response.json()

      if (data.status === 'success' && data.data) {
        setExistingVariants(data.data)
        console.log('✅ Variantes existentes cargadas:', data.data.length)
      } else {
        console.warn('⚠️ No se encontraron variantes existentes')
        setExistingVariants([])
      }
    } catch (error) {
      console.error('❌ Error cargando variantes existentes:', error)
      setExistingVariants([])
    }
  }

  // Función para limpiar el modal
  const clearProductModal = () => {
    setFoundProductForPurchase(null)
    setShowProductModal(false)
    setUpdateProductCost(false)
    setPurchaseQuantity(1)
    setPurchasePrice(0)
    setProviderCode('')
    setSelectedVariants([{ talle: '', colores: [{ color: '', cantidad: 1 }] }])
    setExistingVariants([])
    setAvailableSizes([])
    setAvailableColors([])
    setLoadingVariants(false)
  }

  // Functions to handle variants
  const agregarTalle = () => {
    setSelectedVariants([...selectedVariants, { talle: '', colores: [{ color: '', cantidad: 1 }] }])
  }

  const eliminarTalle = (talleIndex) => {
    const newVariants = selectedVariants.filter((_, index) => index !== talleIndex)
    setSelectedVariants(
      newVariants.length > 0 ? newVariants : [{ talle: '', colores: [{ color: '', cantidad: 1 }] }]
    )
  }

  const handleTalleChange = (talleIndex, value) => {
    const newVariants = [...selectedVariants]
    newVariants[talleIndex].talle = value
    setSelectedVariants(newVariants)
  }

  const agregarColor = (talleIndex) => {
    const newVariants = [...selectedVariants]
    newVariants[talleIndex].colores.push({ color: '', cantidad: 1 })
    setSelectedVariants(newVariants)
  }

  const eliminarColor = (talleIndex, colorIndex) => {
    const newVariants = [...selectedVariants]
    if (newVariants[talleIndex].colores.length > 1) {
      newVariants[talleIndex].colores.splice(colorIndex, 1)
    }
    setSelectedVariants(newVariants)
  }

  const handleColorChange = (talleIndex, colorIndex, field, value) => {
    const newVariants = [...selectedVariants]
    newVariants[talleIndex].colores[colorIndex][field] = value
    setSelectedVariants(newVariants)
  }

  const getTallesDisponibles = (currentTalleIndex) => {
    const usedTalles = selectedVariants
      .map((variant, index) => (index !== currentTalleIndex ? variant.talle : null))
      .filter(Boolean)
    return availableSizes.filter((size) => !usedTalles.includes(size.name))
  }

  const getColoresDisponibles = (talleIndex, currentColorIndex) => {
    const usedColors = selectedVariants[talleIndex].colores
      .map((color, index) => (index !== currentColorIndex ? color.color : null))
      .filter(Boolean)
    return availableColors.filter((color) => !usedColors.includes(color.name))
  }

  const calculateTotalQuantity = () => {
    return selectedVariants.reduce((total, variant) => {
      return (
        total +
        variant.colores.reduce((colorTotal, color) => {
          return colorTotal + (parseInt(color.cantidad) || 0)
        }, 0)
      )
    }, 0)
  }

  const {
    productData,
    removeProduct,
    updateProductQuantity,
    clearProducts,
    addProduct, // Agregar esta función que se necesita
    purchaseInfo,
    updatePurchaseInfo,
    clearPurchaseInfo
  } = useProductContext()

  // Debug logging para el contexto
  useEffect(() => {
    console.log('🔍 ProductData cambió:', productData)
    console.log('  - Productos:', productData?.products || [])
    console.log('  - Cantidad de productos:', productData?.products?.length || 0)
  }, [productData])

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
        setLoading(true)

        // Load products and provider data
        const [productsData, providerData] = await Promise.all([
          fetchProductos(),
          fetchProviderById(providerId)
        ])

        setProducts(Array.isArray(productsData) ? productsData : [])
        setProvider(providerData)
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Error al cargar datos')
      } finally {
        setLoading(false)
      }
    }

    if (providerId) {
      loadData()
    } else {
      toast.error('ID de proveedor no válido')
      setLocation('/proveedores')
    }
  }, [providerId, setLocation])

  // Add this state for discount type
  const [discountType, setDiscountType] = useState('money') // 'money' or 'percentage'

  // Cleanup timeout cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (autoSearchTimeoutRef.current) {
        clearTimeout(autoSearchTimeoutRef.current)
      }
    }
  }, [])

  // Función para buscar productos por código de barras
  const searchByBarcode = async (barcode) => {
    // Asegurar que barcode es una string
    const barcodeStr = String(barcode || '').trim()
    if (!barcodeStr) return

    try {
      setSearchingBarcode(true)
      setBarcodeSearch('') // Limpiar inmediatamente para próximo escaneo
      console.log('🔍 Buscando producto por código de barras para recompra:', barcodeStr)

      const response = await fetch(
        `${API_ENDPOINTS.INVENTORY}/search-by-barcode?barcode=${encodeURIComponent(barcodeStr)}`
      )
      const data = await response.json()

      if (data.status === 'success' && data.data) {
        console.log('✅ Producto encontrado para recompra:', data.data)

        // Estructurar los datos para el modal
        const productData = {
          product: {
            id: data.data.product_id,
            product_name: data.data.product_name,
            provider_code: data.data.provider_code,
            sale_price: data.data.sale_price,
            cost: data.data.cost
          },
          scanned_variant: {
            size_id: data.data.size_id,
            size_name: data.data.size_name,
            color_id: data.data.color_id,
            color_name: data.data.color_name,
            current_quantity: data.data.quantity || 0,
            variant_barcode: data.data.variant_barcode
          },
          available_sizes: [], // Se llenará cuando sea necesario
          available_colors: [] // Se llenará cuando sea necesario
        }

        setFoundProductForPurchase(productData)

        // Cargar variantes existentes del producto
        await loadExistingVariants(data.data.product_id)

        // Inicializar con la variante escaneada
        setSelectedVariants([
          {
            talle: data.data.size_name,
            colores: [
              {
                color: data.data.color_name,
                cantidad: '1' // Cantidad inicial por defecto
              }
            ]
          }
        ])

        setShowProductModal(true)

        toast.success(
          `Producto encontrado: ${data.data.product_name}\nVariante escaneada: ${data.data.size_name}-${data.data.color_name} (Stock: ${data.data.quantity || 0})`,
          {
            duration: 4000,
            position: 'top-center'
          }
        )
      } else {
        toast.error('Producto no encontrado con ese código de barras', {
          duration: 2500,
          position: 'top-center'
        })
      }
    } catch (error) {
      console.error('❌ Error buscando por código de barras:', error)
      toast.error('Error al buscar el producto: ' + error.message, {
        duration: 3000,
        position: 'top-center'
      })
    } finally {
      setSearchingBarcode(false)

      // Refocus el input para próximo escaneo
      setTimeout(() => {
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus()
        }
      }, 100)
    }
  }

  // Manejar input de código de barras
  const handleBarcodeInput = (e) => {
    const value = e.target.value
    setBarcodeSearch(value)

    // Limpiar timeout anterior si existe
    if (autoSearchTimeoutRef.current) {
      clearTimeout(autoSearchTimeoutRef.current)
    }

    // Si se presiona Enter, buscar inmediatamente
    if (e.key === 'Enter' && value.trim()) {
      searchByBarcode(value.trim())
      return
    }

    // Auto-búsqueda después de que el scanner termine de escribir
    if (value.trim() && value.length >= 8) {
      autoSearchTimeoutRef.current = setTimeout(() => {
        if (value.trim() === barcodeSearch.trim()) {
          searchByBarcode(value.trim())
        }
      }, 150)
    }
  }

  // Función para agregar el producto encontrado a la compra
  const addFoundProductToPurchase = async (
    productToAdd,
    selectedVariants,
    costPrice,
    totalQuantity
  ) => {
    console.log('📦 Agregando producto escaneado a la compra:', {
      product: productToAdd,
      variants: selectedVariants,
      costPrice,
      totalQuantity,
      updateCost: updateProductCost
    })

    try {
      // Si el usuario quiere actualizar el costo del producto
      if (updateProductCost && costPrice !== productToAdd.cost) {
        console.log('🔄 Actualizando costo del producto en la base de datos...')

        const updateResponse = await fetch(`${API_ENDPOINTS.INVENTORY}/update-product-cost`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            product_id: productToAdd.id,
            new_cost: costPrice
          })
        })

        if (updateResponse.ok) {
          console.log('✅ Costo del producto actualizado exitosamente')
          toast.success('Costo del producto actualizado', {
            duration: 2000
          })
        } else {
          console.warn('⚠️ No se pudo actualizar el costo del producto')
          toast.warning('No se pudo actualizar el costo del producto')
        }
      }

      // Crear el producto para agregar al contexto en el formato que espera addProduct
      const productForContext = {
        id: productToAdd.id, // Usar el ID real del producto
        product_name: productToAdd.product_name,
        provider_code: providerCode || productToAdd.provider_code || '',
        cost: costPrice, // addProduct espera 'cost', no 'cost_price'
        initial_quantity: totalQuantity,
        provider_id: providerId,
        stock_variants: selectedVariants,
        is_existing_product: true // Marca que es un producto existente
      }

      console.log('🔍 Estado antes de agregar:')
      console.log('  - Productos actuales:', productData?.products || [])
      console.log('  - Producto a agregar (formato addProduct):', productForContext)

      // Usar addProduct en lugar de updatePurchaseInfo
      addProduct(productForContext)

      console.log('✅ Producto agregado usando addProduct')

      // Limpiar el modal
      clearProductModal()

      toast.success(`Producto agregado: ${productToAdd.product_name} (${totalQuantity} unidades)`)
    } catch (error) {
      console.error('❌ Error al agregar producto:', error)
      toast.error('Error al agregar el producto: ' + error.message)
    }
  }

  // Update the useEffect for calculations
  useEffect(() => {
    const currentProducts = productData?.products || []
    const subtotal = currentProducts.reduce(
      (acc, item) => acc + (item.cost_price || 0) * (item.quantity || 0),
      0
    )

    let discountAmount = 0
    const discountValue = parseFloat(purchaseData.discount) || 0

    if (discountType === 'percentage') {
      discountAmount = subtotal * (discountValue / 100)
    } else {
      discountAmount = discountValue
    }

    const total = Math.max(0, subtotal - discountAmount)

    setPurchaseData((prev) => ({
      ...prev,
      subtotal: subtotal.toFixed(2),
      total: total.toFixed(2)
    }))
  }, [productData?.products, purchaseData.discount, discountType])

  const handleSubmit = async (e) => {
    e.preventDefault()

    console.log('🎯 handleSubmit called - Starting purchase creation process...')
    console.log('Starting purchase creation...')
    console.log('Provider:', provider)
    console.log('Products:', productData.products)
    console.log('Purchase data:', purchaseData)
    console.log('Delivery date:', delivery_date)

    if (productData?.products?.length === 0) {
      toast.error('Debe agregar al menos un producto antes de continuar')
      return
    }

    if (!provider?.id) {
      toast.error('No se ha seleccionado un proveedor')
      return
    }

    try {
      setLoading(true)

      let fileBase64 = null
      if (invoiceFile) {
        console.log('Processing invoice file...')
        const reader = new FileReader()
        fileBase64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result.split(',')[1])
          reader.onerror = reject
          reader.readAsDataURL(invoiceFile)
        })
      }

      // Format the delivery date properly
      let formattedDeliveryDate = null
      if (delivery_date) {
        formattedDeliveryDate = delivery_date.toISOString().split('T')[0]
        console.log('Formatted delivery date:', formattedDeliveryDate)
      }
      const processedProducts = []
      const createdProductIds = []

      console.log(`🔄 Processing ${productData?.products?.length || 0} products...`)

      for (const product of productData?.products || []) {
        console.log(`📦 Processing product: ${product.product_name || 'Unknown'}`)

        if (product.is_new_product) {
          console.log('Creating new product in database:', product.original_product_data)
          try {
            const productDataWithState = {
              ...product.original_product_data,
              state: 'esperandoArribo'
            }

            const newProductData = await postData(productDataWithState)
            console.log('🔍 Product creation response:', newProductData)

            if (newProductData.product_id) {
              console.log('New product created with ID:', newProductData.product_id)
              createdProductIds.push(newProductData.product_id)
              processedProducts.push({
                product_id: newProductData.product_id,
                cost_price: product.cost_price,
                quantity: product.quantity,
                discount: product.discount || 0,
                discount_percentage: 0, // Product-level discounts are in money amounts
                subtotal: product.subtotal,
                stock_variants: product.stock_variants
              })
            } else {
              throw new Error(
                'Failed to create new product: ' + (newProductData.message || 'Unknown error')
              )
            }
          } catch (error) {
            console.error('Error creating new product:', error)
            toast.error('Error al crear el producto: ' + product.product_name)

            throw error // Re-throw to be caught by the outer try-catch
          }
        } else {
          processedProducts.push({
            product_id: product.product_id,
            cost_price: product.cost_price,
            quantity: product.quantity,
            discount: product.discount || 0,
            discount_percentage: 0, // Product-level discounts are in money amounts
            subtotal: product.subtotal,
            stock_variants: product.stock_variants
          })
        }
      }

      console.log(
        `✅ Finished processing products. Created ${createdProductIds.length} new products.`
      )
      console.log(`📋 ProcessedProducts:`, processedProducts)

      const purchasePayload = {
        entity_id: provider.id,
        subtotal: parseFloat(purchaseData.subtotal),
        discount: parseFloat(purchaseData.discount) || 0,
        discount_percentage:
          discountType === 'percentage' ? parseFloat(purchaseData.discount) || 0 : 0,
        total: parseFloat(purchaseData.total),
        delivery_date: formattedDeliveryDate,
        notes: purchaseData.notes || '',
        status: 'Pendiente de entrega',
        products: processedProducts,
        invoice_file: fileBase64
      }

      console.log('Purchase payload:', purchasePayload)
      console.log('🚀 About to call createPurchase API...')

      try {
        const result = await createPurchase(purchasePayload)
        console.log('Purchase creation result:', result)

        if (result.status === 'éxito') {
          toast.success(
            '¡Compra creada exitosamente!\nLos productos están marcados como "esperando arribo".\nAhora puedes gestionar los pagos por separado en la página del proveedor.',
            { duration: 6000 }
          )
          setLocation(`/infoProvider?id=${providerId}`)
          resetForm()
        } else {
          console.error('Purchase creation failed:', result)
          toast.error('Error al crear la compra: ' + (result.message || 'Error desconocido'))
        }
      } catch (purchaseError) {
        console.error('💥 Exception during purchase creation:', purchaseError)
        toast.error('Error al crear la compra: ' + purchaseError.message)
        throw purchaseError
      }
    } catch (error) {
      console.error('Error creating purchase:', error)
      toast.error('Error al crear la compra: ' + error.message)
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

  // React Dropzone configuration for invoice upload
  const onDrop = (acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const reasons = rejectedFiles[0].errors
        .map((error) => {
          switch (error.code) {
            case 'file-too-large':
              return 'El archivo es muy grande (máximo 10MB)'
            case 'file-invalid-type':
              return 'Solo se permiten archivos PDF'
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
      toast.success('Factura cargada correctamente')
    }
  }

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  })

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

  const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount) || 0
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericAmount)
  }

  const handlePurchaseInputChange = (e) => {
    const { name, value } = e.target
    setPurchaseData((prev) => ({
      ...prev,
      [name]: value
    }))
    updatePurchaseInfo(name, value)
  }

  console.log('total', purchaseData.total)

  return (
    <div className="container mx-auto max-w-7xl p-4">
      <div className="mb-8 rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center gap-4 border-b pb-4">
          <ShoppingCart className="h-10 w-10 text-primary" />
          <h2 className="text-3xl font-extrabold text-gray-800">
            Nueva Compra -{' '}
            {provider?.entity_name ||
              (loading ? 'Cargando proveedor...' : 'Proveedor no encontrado')}
          </h2>
        </div>

        {loading && !provider ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="loading loading-spinner loading-lg text-primary"></div>
              <span className="text-lg text-gray-600">Cargando información del proveedor...</span>
            </div>
          </div>
        ) : !provider ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="mb-4 text-lg text-red-600">
                No se pudo cargar la información del proveedor
              </p>
              <button className="btn btn-primary" onClick={() => setLocation('/proveedores')}>
                Volver a Proveedores
              </button>
            </div>
          </div>
        ) : (
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

              {/* React Dropzone Area */}
              <div
                {...getRootProps()}
                className={`flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all duration-200 ${
                  isDragActive && !isDragReject
                    ? 'border-primary bg-primary/10 text-primary'
                    : isDragReject
                      ? 'bg-error/10 border-error text-error'
                      : invoiceFile
                        ? 'bg-success/10 border-success text-success'
                        : 'border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200'
                } `}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center pb-6 pt-5">
                  {isDragActive ? (
                    isDragReject ? (
                      <>
                        <FileX className="mb-4 h-8 w-8 text-error" />
                        <p className="text-sm font-semibold text-error">Archivo no válido</p>
                        <p className="text-error/70 text-xs">Solo archivos PDF (MAX. 10MB)</p>
                      </>
                    ) : (
                      <>
                        <FileUp className="mb-4 h-8 w-8 text-primary" />
                        <p className="text-sm font-semibold text-primary">
                          ¡Suelta la factura aquí!
                        </p>
                      </>
                    )
                  ) : invoiceFile ? (
                    <>
                      <FileCheck className="mb-4 h-8 w-8 text-success" />
                      <p className="text-sm font-semibold text-success">
                        Factura cargada: {invoiceFile.name}
                      </p>
                      <p className="text-success/70 text-xs">
                        Tamaño: {(invoiceFile.size / 1024 / 1024).toFixed(2)} MB
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
                        Eliminar Factura
                      </button>
                    </>
                  ) : (
                    <>
                      <FileUp className="mb-4 h-8 w-8 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-600">
                        <span className="font-semibold">Clic para subir</span> o arrastra y suelta
                      </p>
                      <p className="text-xs text-gray-500">Solo archivos PDF (MAX. 10MB)</p>
                    </>
                  )}
                </div>
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

              {/* Barcode Search Section */}
              <div className="mb-6 rounded-lg border-2 border-dashed border-gray-300 bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Scan className="h-5 w-5 text-primary" />
                  <h4 className="text-lg font-medium text-gray-700">
                    Buscar Producto Existente por Código de Barras
                  </h4>
                </div>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      value={barcodeSearch}
                      onChange={handleBarcodeInput}
                      placeholder="Escanea o escribe el código de barras del producto..."
                      className="input-bordered input w-full pr-10"
                    />
                    <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => searchByBarcode(barcodeSearch)}
                    disabled={!barcodeSearch.trim() || searchingBarcode}
                    className="btn btn-primary"
                  >
                    {searchingBarcode ? (
                      <>
                        <div className="loading loading-spinner loading-sm"></div>
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        Buscar
                      </>
                    )}
                  </button>
                </div>
              </div>

              {productData?.products?.length > 0 ? (
                (() => {
                  console.log('🔍 Renderizando tabla con productos:', productData.products)
                  return (
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
                            <tr
                              key={product.id}
                              className="border-b transition-colors hover:bg-gray-100"
                            >
                              <td className="px-4 py-3 font-medium">{index + 1}</td>
                              <td className="px-4 py-3 font-medium">
                                {product.product_name || 'N/A'}
                              </td>
                              <td className="px-4 py-3">{product.provider_code || 'N/A'}</td>
                              <td className="px-4 py-3 text-gray-600">
                                ${(product.cost_price || 0).toFixed(2)}
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  value={product.quantity || 0}
                                  onChange={(e) =>
                                    updateProductQuantity(product.id, parseInt(e.target.value) || 0)
                                  }
                                  className="input-bordered input input-sm w-20 text-center"
                                  min="0"
                                />
                              </td>
                              <td className="px-4 py-3 font-medium">
                                ${((product.cost_price || 0) * (product.quantity || 0)).toFixed(2)}
                              </td>
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
                  )
                })()
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
                  value={formatCurrency(purchaseData.subtotal)}
                  className="input-bordered input w-full text-right font-mono text-lg"
                  readOnly
                />
              </div>
              <div className="flex flex-col items-center md:w-1/3 md:items-end">
                <label className="label">
                  <span className="label-text font-medium text-gray-600">Descuento Global</span>
                </label>

                <div className="mb-2 flex items-center gap-2">
                  <button
                    type="button"
                    className={`btn ${discountType === 'money' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setDiscountType('money')}
                  >
                    <DollarSign
                      className={`h-4 w-4 ${discountType === 'money' ? 'text-outlined' : 'text-gray-400'}`}
                    />
                  </button>
                  <button
                    type="button"
                    className={`btn ${discountType === 'percentage' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setDiscountType('percentage')}
                  >
                    <Percent
                      className={`h-4 w-4 ${discountType === 'percentage' ? 'text-outline' : 'text-gray-400'}`}
                    />
                  </button>

                  {/* Discount Input */}
                  <div className="relative w-full">
                    <input
                      type="text"
                      name="discount"
                      value={purchaseData.discount}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          if (discountType === 'percentage') {
                            const numValue = parseFloat(value)
                            if (value === '' || (numValue >= 0 && numValue <= 100)) {
                              handlePurchaseInputChange(e)
                            }
                          } else {
                            handlePurchaseInputChange(e)
                          }
                        }
                      }}
                      className="input-bordered input w-full pr-8 text-right font-mono text-lg"
                      placeholder={discountType === 'percentage' ? '0%' : '$0.00'}
                      inputMode="decimal"
                      pattern="[0-9]*\.?[0-9]*"
                      autoComplete="off"
                    />
                  </div>
                </div>

                {discountType === 'percentage' && purchaseData.discount > 0 && (
                  <div className="mt-1 text-xs text-gray-500">
                    Descuento:{' '}
                    {formatCurrency(
                      (parseFloat(purchaseData.subtotal || 0) *
                        (parseFloat(purchaseData.discount) || 0)) /
                        100
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center md:w-1/3 md:items-end">
                <label className="label">
                  <span className="label-text font-bold text-gray-800">TOTAL</span>
                </label>
                <div className="relative w-full">
                  <input
                    type="text"
                    value={formatCurrency(purchaseData.total)}
                    className="input-bordered input w-full border-2 border-primary text-right font-mono text-xl text-black shadow-sm"
                    readOnly
                  />
                </div>
              </div>
            </section>

            {/* Action Buttons */}
            <div className="mb-6 rounded-lg bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
                  💡
                </div>
                <div className="text-sm text-blue-800">
                  <p className="mb-1 font-semibold">Proceso de Compra</p>
                  <p>
                    Esta compra se creará con estado "Pendiente de pago". Podrás agregar uno o
                    múltiples pagos desde la página del proveedor después de crear la compra.
                  </p>
                </div>
              </div>
            </div>

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
                disabled={loading || !productData?.products?.length || !provider}
              >
                <Check className="h-4 w-4" />
                {loading ? 'Creando Compra...' : !provider ? 'Cargando...' : 'Crear Compra'}
              </button>
            </div>
          </form>
        )}

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
                  className="btn btn-ghost text-gray-500 hover:bg-red-50 hover:text-red-500"
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
      </div>

      {/* Barcode Search Product Modal */}
      {foundProductForPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative h-full max-h-[95vh] w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-xl">
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-800">
                  <Package className="h-6 w-6 text-primary" />
                  Recomprar Producto Existente
                </h3>
                <button type="button" onClick={clearProductModal} className="btn btn-ghost btn-sm">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(95vh - 140px)' }}>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Información del Producto */}
                <div className="space-y-6">
                  <div className="rounded-lg bg-gray-50 p-4">
                    <h4 className="mb-3 text-lg font-medium text-gray-700">
                      {foundProductForPurchase.product.product_name}
                    </h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Código de Barras:</span>
                        <p className="font-mono text-sm">
                          {foundProductForPurchase.scanned_variant.variant_barcode}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Código Proveedor:</span>
                        <p className="text-sm">
                          {foundProductForPurchase.product.provider_code || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Talla Escaneada:</span>
                        <p className="text-sm">
                          {foundProductForPurchase.scanned_variant.size_name}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Color Escaneado:</span>
                        <p className="text-sm">
                          {foundProductForPurchase.scanned_variant.color_name}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">
                          Stock Actual (Escaneado):
                        </span>
                        <p className="text-sm font-medium">
                          {foundProductForPurchase.scanned_variant.current_quantity} unidades
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Precio Sugerido:</span>
                        <p className="text-sm font-medium">
                          ${foundProductForPurchase.product.cost}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stock Actual de Todas las Variantes */}
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <h5 className="mb-3 text-lg font-medium text-gray-700">
                      Stock Actual de Todas las Variantes
                    </h5>
                    {existingVariants.length > 0 ? (
                      <div className="max-h-48 overflow-y-auto">
                        <div className="space-y-2">
                          {existingVariants.map((variant, index) => (
                            <div
                              key={index}
                              className={`rounded border p-2 text-sm ${
                                variant.quantity > 0
                                  ? variant.quantity < 5
                                    ? 'border-yellow-200 bg-yellow-50'
                                    : 'border-green-200 bg-green-50'
                                  : 'border-red-200 bg-red-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium">
                                    {variant.size_name} - {variant.color_name}
                                  </span>
                                  <div className="text-xs text-gray-500">
                                    {variant.variant_barcode}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold">{variant.quantity} unidades</div>
                                  {variant.quantity === 0 && (
                                    <div className="text-xs text-red-600">Sin stock</div>
                                  )}
                                  {variant.quantity > 0 && variant.quantity < 5 && (
                                    <div className="text-xs text-yellow-600">Stock bajo</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500">
                        No se encontraron variantes existentes
                      </div>
                    )}
                  </div>

                  {/* Configuración de Compra */}
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Precio de Costo
                      </label>
                      <input
                        type="number"
                        value={purchasePrice || foundProductForPurchase.product.cost || 0}
                        onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                        className="input-bordered input w-full"
                        min="0"
                        step="0.01"
                        placeholder="Ingresa el precio de costo"
                      />
                      <div className="mt-2">
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                          <input
                            type="checkbox"
                            checked={updateProductCost}
                            onChange={(e) => setUpdateProductCost(e.target.checked)}
                            className="checkbox checkbox-xs"
                          />
                          Actualizar el costo del producto para futuras compras
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Código del Proveedor (opcional)
                      </label>
                      <input
                        type="text"
                        value={providerCode || foundProductForPurchase.product.provider_code || ''}
                        onChange={(e) => setProviderCode(e.target.value)}
                        className="input-bordered input w-full"
                        placeholder="Código del proveedor para este producto"
                      />
                    </div>
                  </div>
                </div>

                {/* Gestión de Variantes */}
                <div className="space-y-4">
                  {/* Sección de gestión de variantes */}
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-lg font-medium text-gray-700">
                        Gestión de Variantes (Talles y Colores)
                      </h4>
                      <button
                        type="button"
                        onClick={() => loadVariantData()}
                        disabled={loadingVariants}
                        className="btn btn-outline btn-sm"
                      >
                        {loadingVariants ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                            Cargando...
                          </>
                        ) : (
                          'Cargar Talles/Colores'
                        )}
                      </button>
                    </div>

                    {/* Tabla de variantes seleccionadas */}
                    <div className="mb-4">
                      <div className="mb-2 flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                          Variantes Seleccionadas:
                        </label>
                        <button
                          type="button"
                          onClick={agregarTalle}
                          className="btn btn-primary btn-sm"
                        >
                          <Plus className="h-4 w-4" />
                          Agregar Talle
                        </button>
                      </div>

                      {selectedVariants.length === 0 ? (
                        <div className="rounded-md border border-dashed border-gray-300 p-4 text-center text-gray-500">
                          No hay variantes seleccionadas. Haz clic en "Agregar Talle" para comenzar.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedVariants.map((variant, variantIndex) => (
                            <div
                              key={variantIndex}
                              className="rounded-md border border-gray-300 bg-white p-3"
                            >
                              <div className="mb-3 flex items-center justify-between">
                                <h5 className="font-medium text-gray-700">
                                  Talle {variantIndex + 1}
                                </h5>
                                <button
                                  type="button"
                                  onClick={() => eliminarTalle(variantIndex)}
                                  className="btn btn-error btn-sm"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                <div>
                                  <label className="mb-1 block text-sm font-medium text-gray-600">
                                    Talle:
                                  </label>
                                  <select
                                    value={variant.talle}
                                    onChange={(e) =>
                                      handleTalleChange(variantIndex, e.target.value)
                                    }
                                    className="select-bordered select w-full"
                                    required
                                  >
                                    <option value="">Seleccionar talle</option>
                                    {getTallesDisponibles(variantIndex).map((size) => (
                                      <option key={size.id} value={size.name}>
                                        {size.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {/* Colores para este talle */}
                              <div>
                                <div className="mb-2 flex items-center justify-between">
                                  <label className="text-sm font-medium text-gray-600">
                                    Colores:
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => agregarColor(variantIndex)}
                                    className="btn btn-secondary btn-sm"
                                  >
                                    <Plus className="h-4 w-4" />
                                    Agregar Color
                                  </button>
                                </div>

                                {variant.colores.length === 0 ? (
                                  <div className="rounded border border-dashed border-gray-200 p-2 text-center text-sm text-gray-400">
                                    No hay colores agregados
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {variant.colores.map((colorData, colorIndex) => (
                                      <div
                                        key={colorIndex}
                                        className="grid grid-cols-1 gap-2 rounded border border-gray-200 bg-gray-50 p-2 md:grid-cols-3"
                                      >
                                        <div>
                                          <select
                                            value={colorData.color}
                                            onChange={(e) =>
                                              handleColorChange(
                                                variantIndex,
                                                colorIndex,
                                                'color',
                                                e.target.value
                                              )
                                            }
                                            className="select-bordered select select-sm w-full"
                                            required
                                          >
                                            <option value="">Seleccionar color</option>
                                            {getColoresDisponibles(variantIndex, colorIndex).map(
                                              (color) => (
                                                <option key={color.id} value={color.name}>
                                                  {color.name}
                                                </option>
                                              )
                                            )}
                                          </select>
                                        </div>
                                        <div>
                                          <input
                                            type="number"
                                            value={colorData.cantidad}
                                            onChange={(e) =>
                                              handleColorChange(
                                                variantIndex,
                                                colorIndex,
                                                'cantidad',
                                                e.target.value
                                              )
                                            }
                                            className="input-bordered input input-sm w-full"
                                            placeholder="Cantidad"
                                            min="1"
                                            required
                                          />
                                        </div>
                                        <div className="flex justify-end">
                                          <button
                                            type="button"
                                            onClick={() => eliminarColor(variantIndex, colorIndex)}
                                            className="btn btn-error btn-sm"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Resumen de cantidad total */}
                      {selectedVariants.length > 0 && (
                        <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-700">
                              Cantidad Total de Unidades:
                            </span>
                            <span className="text-lg font-bold text-blue-800">
                              {calculateTotalQuantity()} unidades
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer con botones */}
              <div className="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4">
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={clearProductModal} className="btn btn-ghost">
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Validar que hay variantes seleccionadas
                      if (selectedVariants.length === 0) {
                        toast.error('Debe agregar al menos una variante (talle y color)', {
                          duration: 3000,
                          position: 'top-center'
                        })
                        return
                      }

                      // Validar que todas las variantes tienen talle y al menos un color con cantidad
                      const invalidVariants = selectedVariants.some(
                        (variant) =>
                          !variant.talle ||
                          variant.colores.length === 0 ||
                          variant.colores.some(
                            (color) => !color.color || !color.cantidad || color.cantidad <= 0
                          )
                      )

                      if (invalidVariants) {
                        toast.error(
                          'Todas las variantes deben tener talle, color y cantidad válida',
                          {
                            duration: 3000,
                            position: 'top-center'
                          }
                        )
                        return
                      }

                      // Preparar variantes para la función - convertir estructura de talles/colores a lista plana
                      const variantsForPurchase = []

                      selectedVariants.forEach((variant) => {
                        variant.colores.forEach((colorData) => {
                          // Buscar IDs desde los datos disponibles
                          const sizeObj = availableSizes.find((s) => s.name === variant.talle)
                          const colorObj = availableColors.find((c) => c.name === colorData.color)

                          if (sizeObj && colorObj) {
                            variantsForPurchase.push({
                              size_id: sizeObj.id,
                              size_name: variant.talle,
                              color_id: colorObj.id,
                              color_name: colorData.color,
                              quantity: parseInt(colorData.cantidad)
                            })
                          }
                        })
                      })

                      const totalQuantity = calculateTotalQuantity()
                      const costPrice = purchasePrice || foundProductForPurchase.product.cost

                      addFoundProductToPurchase(
                        foundProductForPurchase.product,
                        variantsForPurchase,
                        costPrice,
                        totalQuantity
                      )
                    }}
                    disabled={
                      selectedVariants.length === 0 ||
                      !purchasePrice ||
                      calculateTotalQuantity() === 0
                    }
                    className="btn btn-primary"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar a la Compra
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
