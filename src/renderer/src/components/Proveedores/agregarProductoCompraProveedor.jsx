import { useLocation, useSearchParams } from 'wouter'
import { useState, useEffect } from 'react'
import { useProductContext } from '../../contexts/ProductContext'
import {
  ArrowLeft,
  LoaderCircle,
  Save,
  Trash2,
  Menu,
  Lock,
  Unlock,
  ChevronsDown,
  ChevronsUp,
  CloudUpload,
  Plus
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { useSession } from '../../contexts/SessionContext'
import { useSettings } from '../../contexts/settingsContext'
import ModalSize from '../../modals/modalsProduct/modalSize'
import ModalColor from '../../modals/modalsProduct/modalColor'
import BarcodeService from '../../services/barcodeService'
import { fetchSize } from '../../services/products/sizeService'
import { fetchColor } from '../../services/products/colorService'
import { fetchProviderById } from '../../services/proveedores/proveedorService'
import { fetchBrandByProviders } from '../../services/proveedores/brandService'
import postData from '../../services/products/productService'
import { fetchFamilyProductsTree } from '../../services/products/familyService'
import GroupTreeSelector from '../../components/GroupTreeSelector'
import GroupTreePreviewModal from '../../components/GroupTreePreviewModal'
import ColorSelect from '../../components/ColorSelect'
import { pinwheel } from 'ldrs'
import ProductImageUploader from '../../componentes especificos/dropZone'

//BUG: El color ahora tiene bug.
export default function NuevoProductoDeProveedor() {
  pinwheel.register()
  // Contexto de sesión para obtener el storage actual
  const { getCurrentStorage, getCurrentUser } = useSession()
  const { calculateSalePrice, settings } = useSettings()
  const currentStorage = getCurrentStorage()
  const currentUser = getCurrentUser()
  const [searchParams] = useSearchParams()
  const providerId = searchParams.get('id')

  useEffect(() => {
    if (providerId) {
      const loadDataProvider = async () => {
        try {
          const providerData = await fetchProviderById(providerId)
          setProvider(providerData)
        } catch (error) {
          console.error('Error al cargar los datos del proveedor:', error)
        }
      }
      loadDataProvider()
    }
  }, [providerId])

  const getInitialProductState = () => ({
    id: Date.now(), // Unique key for React's map function
    provider_code: '',
    product_name: '',
    group_id: '',
    provider_id: providerId,
    description: '',
    cost: 0,
    sale_price: 0,
    original_price: 0,
    tax: 0,
    discount: 0,
    comments: '',
    user_id: currentUser?.id || 1,
    images_ids: null,
    brand_id: '',
    creation_date: new Date().toISOString(),
    last_modified_date: new Date().toISOString(),
    state: 'pendiente',
    talles: [{ talle: '', colores: [{ color: '', cantidad: '' }] }],
    product_image: '',
    initial_quantity: 0,
    errors: {}
  })

  const [productos, setProductos] = useState([getInitialProductState()])


  // Estados para el formulario
  const [useAutoCalculation, setUseAutoCalculation] = useState(settings.autoCalculatePrice)
  const [, setLocation] = useLocation()
  const [cantidadTotal, setCantidadTotal] = useState(0)

  // Estados para datos de la BD
  const [colors, setColors] = useState([])
  const [provider, setProvider] = useState([])
  const [brandByProvider, setBrandByProvider] = useState([])
  const [tallesBD, setTallesBD] = useState([])
  const [grupoTree, setGrupoTree] = useState([])

  // Estados de control
  const [loadingData, setLoadingData] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [coloresDisponiblesPorTalle, setColoresDisponiblesPorTalle] = useState({})
  const [productImage, setProductImage] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [errors, setErrors] = useState({})
  const [showGroupTreeModal, setShowGroupTreeModal] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1)
  }
  //trae los datos iniciales y un par de cosas más.
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sizesResponse, colorsResponse, grupoTreeData] = await Promise.allSettled([
          fetchSize(),
          fetchColor(),
          fetchFamilyProductsTree()
        ])

        if (sizesResponse.status === 'fulfilled' && sizesResponse.value) {
          setTallesBD(sizesResponse.value)
          console.log('✅ Talles cargados exitosamente:', sizesResponse.value.length)
        } else {
          console.warn('⚠️ Error al cargar talles:', sizesResponse.reason)
          setTallesBD([])
        }

        // Procesar colors
        if (colorsResponse.status === 'fulfilled' && colorsResponse.value) {
          setColors(colorsResponse.value)
          console.log('🎨 Colores cargados desde la API:', colorsResponse.value)
        } else {
          console.warn('⚠️ Error al cargar colores:', colorsResponse.reason)
          setColors([])
        }

        if (grupoTreeData.status === 'fulfilled' && grupoTreeData.value) {
          setGrupoTree(grupoTreeData.value)
          console.log('✅ Grupos de productos cargados exitosamente:', grupoTreeData.value.length)
        } else {
          console.warn('⚠️ Error al cargar grupos de productos:', grupoTreeData.reason)
          setGrupoTree([])
        }

        if (
          sizesResponse.status === 'fulfilled' &&
          sizesResponse.value &&
          colorsResponse.status === 'fulfilled' &&
          colorsResponse.value
        ) {
          const coloresDisponibles = {}
          sizesResponse.value.forEach((talle) => {
            coloresDisponibles[talle.size_name] = colorsResponse.value.map(
              (color) => color.color_name
            )
          })
          setColoresDisponiblesPorTalle(coloresDisponibles)
          console.log('🎨 Colores disponibles por talle:', coloresDisponibles)
        } else {
          console.warn(
            '⚠️ No se pudieron configurar colores por talle (falta información de talles o colores)'
          )
          setColoresDisponiblesPorTalle({})
        }
      } catch (error) {
        console.error('❌ Error general al cargar datos:', error)
      } finally {
        setLoadingData(false)
      }
    }
    fetchData()
  }, [refreshTrigger])

  // Sincronizar el estado local con la configuración global
  useEffect(() => {
    setUseAutoCalculation(settings.autoCalculatePrice)
  }, [settings.autoCalculatePrice])

  useEffect(() => {
    const fetchBrandsForProvider = async () => {
      if (providerId) {
        try {
          const brandsByProviderResponse = await fetchBrandByProviders(providerId)
          setBrandByProvider(brandsByProviderResponse)
          if (brandsByProviderResponse.length === 1) {
            setProductos((prev) =>
              prev.map((p) => ({ ...p, brand_id: brandsByProviderResponse[0].id }))
            )
          }
        } catch (error) {
          console.error('Error fetching brands for provider: ', error)
        }
      }
    }
    fetchBrandsForProvider()
  }, [providerId])

  const handleProductChange = (index, field, value) => {
    const newProductos = [...productos]
    const product = newProductos[index]
    product[field] = value

    if (field === 'cost' && product.useAutoCalculation) {
      const numericCost = parseFloat(value)
      if (numericCost > 0) {
        product.sale_price = calculateSalePrice(numericCost)
      } else {
        product.sale_price = ''
      }
    }

    setProductos(newProductos)
  }

  const handleGroupSelect = (productIndex, group) => {
    const newProductos = [...productos]
    newProductos[productIndex].group_id = group.id.toString()
    setProductos(newProductos)
  }

  const handleCantidadTotal = () => {
    let total = 0
    productos.forEach((product) => {
      product.talles.forEach((talle) => {
        talle.colores.forEach((color) => {
          total += parseInt(color.cantidad || 0, 10)
        })
      })
    })
    setCantidadTotal(total)
  }

  const handleDeleteColor = (productIndex, talleIndex, colorIndex) => {
    const newProductos = [...productos]
    const product = newProductos[productIndex]
    product.talles[talleIndex].colores.splice(colorIndex, 1)
    setProductos(newProductos)
  }

  const handleDeleteTalle = (productIndex, talleIndex) => {
    const newProductos = [...productos]
    const product = newProductos[productIndex]
    product.talles.splice(talleIndex, 1)
    setProductos(newProductos)
    handleCantidadTotal()
  }
  const agregarTalle = (productIndex) => {
    const newProductos = [...productos]
    const product = newProductos[productIndex]
    product.talles.push({ talle: '', colores: [{ color: '', cantidad: '' }] })
    setProductos(newProductos)
  }

  const handleTalleChange = (productIndex, talleIndex, value) => {
    const newProductos = [...productos]
    const product = newProductos[productIndex]
    product.talles[talleIndex].talle = value
    setProductos(newProductos)
  }

  const agregarColor = (productIndex, talleIndex) => {
    const newProductos = [...productos]
    const product = newProductos[productIndex]
    product.talles[talleIndex].colores.push({ color: '', cantidad: '' })
    setProductos(newProductos)
  }

  const agregarProducto = () => {
    const newProduct = getInitialProductState()
    if (lockGroup && productos.length > 0) {
      const lastProduct = productos[productos.length - 1]
      newProduct.group_id = lastProduct.group_id
    }
    setProductos([...productos, newProduct])
  }

  const eliminarProducto = (index) => {
    // Prevent deleting the last product form
    if (productos.length === 1) {
      alert('No puedes eliminar el único formulario de productos.')
      return
    }
    setProductos(productos.filter((_, i) => i !== index))
  }

  const handleColorChange = (productIndex, talleIndex, colorIndex, field, value) => {
    const newProductos = [...productos]
    const product = newProductos[productIndex]
    const nuevosTalles = [...product.talles]
    const talleActual = nuevosTalles[talleIndex].talle
    const colorAnterior = nuevosTalles[talleIndex].colores[colorIndex].color

    if (field === 'color') {
      const nuevoColor = value

      if (nuevoColor !== colorAnterior) {
        nuevosTalles[talleIndex].colores[colorIndex].color = nuevoColor

        setColoresDisponiblesPorTalle((prev) => {
          const nuevosDisponibles = { ...prev }
          if (colorAnterior && talleActual) {
            if (!nuevosDisponibles[talleActual]) {
              nuevosDisponibles[talleActual] = []
            }
            if (!nuevosDisponibles[talleActual].includes(colorAnterior)) {
              nuevosDisponibles[talleActual].push(colorAnterior)
            }
          }
          if (nuevoColor && talleActual && nuevosDisponibles[talleActual]) {
            nuevosDisponibles[talleActual] = nuevosDisponibles[talleActual].filter(
              (c) => c !== nuevoColor
            )
          }
          return nuevosDisponibles
        })
      }
    }

    nuevosTalles[talleIndex].colores[colorIndex][field] =
      field === 'cantidad' ? parseInt(value, 10) || 0 : value

    product.talles = nuevosTalles
    setProductos(newProductos)
    handleCantidadTotal()
  }

  // Función para obtener talles disponibles (no repetidos)
  const getTallesDisponibles = (productIndex, currentTalleIndex) => {
    const product = productos[productIndex]
    const tallesSeleccionados = product.talles
      .map((t, index) => (index !== currentTalleIndex ? t.talle : null))
      .filter(Boolean)

    return tallesBD.filter((talle) => !tallesSeleccionados.includes(talle.size_name))
  }

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }
  const handleDropzone = (index, acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      const reader = new FileReader()
      reader.onload = () => {
        handleProductChange(index, 'product_image', reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const base64ToObjectUrl = (base64Data) => {
    if (!base64Data) return ''
    try {
      const byteCharacters = atob(base64Data.split(',')[1])
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/jpeg' }) // You can adjust MIME type
      return URL.createObjectURL(blob)
    } catch (error) {
      console.error('Error converting base64 to object URL:', error)
      return ''
    }
  }

  // --- Dropzone logic is now handled per-product inside the render map ---
  // See the render section: for each product, useDropzone is called with handlers that update only that product's image and uploading state.

  // This function should be in your NuevoProducto component.
  // It now correctly processes one product at a time.

  const prepareProductData = (product) => {
    // Calculate total quantity for this specific product
    const cantidadTotal = product.talles.reduce(
      (total, talle) =>
        total +
        talle.colores.reduce(
          (subtotal, color) => subtotal + (parseInt(color.cantidad, 10) || 0),
          0
        ),
      0
    )

    // Extract just the base64 string if an image exists
    let imageToSend = null
    if (product.product_image && product.product_image.startsWith('data:')) {
      imageToSend = product.product_image.split(',')[1]
    }

    return {
      provider_code: product.provider_code,
      product_name: product.product_name,
      group_id: parseInt(product.group_id),
      provider_id: providerId,
      description: '', // You can add this to your state if needed
      cost: parseFloat(product.cost) || 0,
      sale_price: parseFloat(product.sale_price) || 0,
      comments: product.comments || null,
      user_id: currentUser?.id || 1,
      brand_id: product.brand_id,
      product_image: imageToSend, // Send only the base64 part
      storage_id: currentStorage?.id || null,
      state: 'enTienda',
      initial_quantity: cantidadTotal,
      stock_variants: product.talles.flatMap((talle) => {
        const sizeData = tallesBD.find((s) => s.size_name === talle.talle)
        if (!sizeData) return []
        return talle.colores
          .filter((color) => color.color && color.cantidad > 0)
          .map((color) => {
            const colorData = colors.find((c) => c.color_name === color.color)
            return {
              size_id: sizeData.id,
              color_id: colorData ? colorData.id : null,
              quantity: parseInt(color.cantidad) || 0
            }
          })
          .filter((variant) => variant.color_id !== null)
      })
    }
  }
  const validateForm = () => {
    const newErrors = {}

    if (!productos.product_name.trim()) newErrors.product_name = 'El nombre es requerido'
    if (!productos.group_id) newErrors.group_id = 'El grupo es requerido'
    if (!productos.brand_id) newErrors.brand_id = 'La marca es requerida'
    if (!productos.cost || isNaN(parseFloat(productos.cost)) || parseFloat(productos.cost) <= 0)
      newErrors.cost = 'El costo debe ser mayor a 0'
    if (
      !productos.sale_price ||
      isNaN(parseFloat(productos.sale_price)) ||
      parseFloat(productos.sale_price) <= 0
    )
      newErrors.sale_price = 'El precio de venta debe ser mayor a 0'

    const cantidadTotal = productos.talles.reduce(
      (total, talle) =>
        total +
        talle.colores.reduce(
          (subtotal, color) => subtotal + (parseInt(color.cantidad, 10) || 0),
          0
        ),
      0
    )

    if (cantidadTotal <= 0) {
      newErrors.cantidad = 'Debe agregar al menos una unidad'
      return newErrors
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmitGuardar = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const productData = prepareProductData()
      console.log('🔍 DATOS DE PRODUCTOS PREPARADOS:', productData)
      console.log('🔍 STOCK VARIANTS A ENVIAR:', productData.stock_variants)
      console.log('🔍 CANTIDAD DE VARIANTES:', productData.stock_variants?.length || 0)

      const response = await postData(productData)

      console.log('Productos guardado exitosamente:', response)

      if (response.product_id && productData.stock_variants.length > 0) {
        try {
          const barcodeService = new BarcodeService()
          console.log('🏷️ Generando códigos de barras para variantes...')

          const variants = productData.stock_variants.map((variant) => ({
            size_id: variant.size_id,
            color_id: variant.color_id,
            quantity: variant.quantity
          }))

          const barcodeResult = await barcodeService.generateVariantBarcodes(
            response.product_id,
            variants
          )
          console.log('✅ Códigos de barras generados:', barcodeResult)
        } catch (barcodeError) {
          console.error('⚠️ Error generando códigos de barras:', barcodeError)
        }
      }

      if (productImage && response.image_id) {
        console.log('✅ Imagen subida exitosamente con ID:', response.image_id)
      }

      setLocation('/inventario')
    } catch (error) {
      console.error('Error al guardar el productos:', error)
      setErrors({ submit: 'Error al guardar el productos. Intente nuevamente.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleToggleDropdown = () => {
    setDropdownOpen(!dropdownOpen)
  }
  const [lockGroup, setLockGroup] = useState(false)
  const handleLockGroup = () => {
    setLockGroup(!lockGroup)
  }

  const handleAutoCalcToggle = (index, isChecked) => {
    const newProductos = [...productos]
    const product = newProductos[index]
    product.useAutoCalculation = isChecked

    if (isChecked) {
      // If toggled ON, calculate the price immediately if there's a valid cost
      const numericCost = parseFloat(product.cost)
      if (numericCost > 0) {
        product.sale_price = calculateSalePrice(numericCost)
      }
    }
    // If toggled OFF, the user can now manually edit the sale_price, so we do nothing here.

    setProductos(newProductos)
  }

  if (loadingData) {
    return (
      <>
        <div className="flex min-h-screen items-center justify-center bg-base-100 p-6">
          <div className="flex items-center space-x-4 p-4">
            <div className="">
              <l-pinwheel size="35" stroke="3.5" speed="0.9" color="black"></l-pinwheel>
            </div>
            <h1 className="text-4xl font-bold">Cargando...</h1>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200">
      {/* Header con gradiente y sombra */}
      <div className="bg-base-100/95 top-0 z-10 border-b border-base-300 shadow-lg backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="tooltip tooltip-bottom" data-tip="Volver al inventario">
                <button
                  className="btn btn-outline hover:scale-110"
                  onClick={() => setLocation('/inventario')}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-3xl font-bold text-transparent">
                  Agregar Artículo del proveedor: {provider?.entity_name}
                </h1>
                <p className="text-base-content/70 text-sm">
                  Complete los datos del nuevo productos. Los códigos de barras se generarán
                  automáticamente para cada variante.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Container principal con máximo ancho */}
      <div className="container mx-auto px-6 py-8">
        {/* Información de la sesión actual */}
        {currentStorage && (
          <div className="alert mb-6 bg-accent">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold">📍 Sucursal:</span>
                <span>{currentStorage.name}</span>
              </div>
              <div className="divider divider-horizontal"></div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">👤 Usuario:</span>
                <span>{currentUser?.fullname || currentUser?.username}</span>
              </div>
              <div className="divider divider-horizontal"></div>
            </div>
            <div className="text-sm opacity-75">El stock inicial se asignará a esta sucursal</div>
          </div>
        )}

        <form className="mx-auto max-w-6xl space-y-8">
          {/* Sección: Información Básica */}

          <section className="space-y-4 rounded-lg bg-base-300 p-4 shadow-md">
            <div className="flex justify-between">
              <label>Productos </label>
              {dropdownOpen ? (
                <button
                  className="hover:scale-110 hover:cursor-pointer"
                  onClick={handleToggleDropdown}
                  title="Resumen productos"
                  type="button"
                >
                  <ChevronsDown />
                </button>
              ) : (
                <button
                  className="hover:scale-110 hover:cursor-pointer"
                  onClick={handleToggleDropdown}
                  title="Informacion completa productos"
                  type="button"
                >
                  <ChevronsUp />
                </button>
              )}
            </div>
            {/* Sección: para mostrar la información resumida */}
            {dropdownOpen ? (
              <div>
                <div className="card border border-base-300 bg-base-100 shadow-xl">
                  <div className="card-body">
                    {productos &&
                      productos.map((prod, idx) => (
                        <>
                          <div key={prod.id}>
                            <h2 className="card-title mb-6 flex items-center gap-3 text-2xl">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                <span className="font-bold text-primary">{idx + 1}</span>
                              </div>
                              Información
                            </h2>
                          </div>
                          <div className="space-y-6">
                            {/* Nombre del productos */}
                            <div>
                              <label className="label">
                                <span className="label-text font-semibold">
                                  Nombre del productos: {prod.product_name || ' No especificado'}
                                </span>
                              </label>
                            </div>

                            {/* Imagen del productos */}
                            <div>
                              {prod.product_image && (
                                <div className="mb-4 flex justify-center">
                                  <div className="avatar">
                                    <div className="h-32 w-32 rounded-xl ring ring-primary ring-offset-2 ring-offset-base-100">
                                      <img
                                        src={base64ToObjectUrl(prod.product_image)}
                                        alt="Vista previa del producto"
                                        className="h-32 w-32 rounded-xl object-cover"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {productos &&
                  productos.map(
                    (prod, idx) =>
                      prod && (
                        <>
                          <div
                            key={prod.id}
                            className="relative space-y-8 rounded-md border bg-blue-100 p-4 shadow-xl"
                          >
                            <div className="mb-4 flex items-center justify-between">
                              <h2 className="card-title text-2xl">Artículo {idx + 1}</h2>
                              {productos.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => eliminarProducto(idx)}
                                  className="btn btn-error btn-outline btn-sm btn-circle"
                                  title="Eliminar este productos"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                            <div className="card border border-base-300 bg-base-100 shadow-xl">
                              <div className="card-body">
                                <h2 className="card-title mb-6 flex items-center gap-3 text-2xl">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                    <span className="font-bold text-primary">1</span>
                                  </div>
                                  Información Básica
                                </h2>

                                <div className="space-y-6">
                                  {/* Informacion básica del productos */}
                                  <div key={idx} className="mb-4 rounded-lg border bg-base-200 p-4">
                                    <label className="label">
                                      <span className="label-text font-semibold">
                                        Nombre del productos
                                      </span>
                                      <span className="label-text-alt text-error">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="Ej: Remera básica algodón"
                                      className={`input-bordered input w-full focus:border-primary ${errors[`productName_${idx}`] ? 'input-error' : ''}`}
                                      value={prod.product_name}
                                      onChange={(e) =>
                                        handleProductChange(idx, 'product_name', e.target.value)
                                      }
                                      required
                                    />
                                    {errors[`productName_${idx}`] && (
                                      <div className="label">
                                        <span className="label-text-alt text-error">
                                          {errors[`productName_${idx}`]}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Imagen del productos */}
                                  <div>
                                    <label className="label">
                                      <span className="label-text font-semibold">
                                        Imagen del productos
                                      </span>
                                      <span className="label-text-alt text-base-content/60">
                                        (Opcional)
                                      </span>
                                    </label>

                                    {prod.product_image && (
                                      <div className="mb-4 flex justify-center">
                                        <div className="avatar">
                                          <div className="mask-squircle h-32 w-32 rounded-xl ring-offset-2 ring-offset-base-100">
                                            <img
                                              src={base64ToObjectUrl(prod.product_image)}
                                              alt="Preview del productos"
                                              className="object-cover"
                                            />
                                            <button
                                              type="button"
                                              className="btn btn-error btn-xs mt-2"
                                              onClick={() =>
                                                handleProductChange(idx, 'product_image', '')
                                              }
                                            >
                                              Eliminar
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    <div key={productos.id} className="card ...">
                                      <div className="card-body">
                                        <h2 className="card-title">Producto {idx + 1}</h2>

                                        <div className="mt-6">
                                          <label className="label">
                                            <span className="label-text font-semibold">
                                              Imagen del producto
                                            </span>
                                          </label>
                                          <ProductImageUploader
                                            productImage={prod.product_image}
                                            onImageDrop={(base64Image) =>
                                              handleProductChange(idx, 'product_image', base64Image)
                                            }
                                            onImageRemove={() =>
                                              handleProductChange(idx, 'product_image', '')
                                            }
                                            error={prod.errors.product_image}
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    {prod.errors?.product_image && (
                                      <div className="label">
                                        <span className="label-text-alt text-error">
                                          {prod.errors.product_image}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            {/* Sección: Categorización */}
                            <div className="card border border-base-300 bg-base-100 shadow-xl">
                              <div className="card-body">
                                <h2 className="card-title mb-6 flex items-center gap-3 text-2xl">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
                                    <span className="font-bold text-secondary">2</span>
                                  </div>
                                  Categorización y Origen
                                </h2>

                                {/* Grupo/Tipo de Prenda */}
                                <div>
                                  <label className="label">
                                    <span className="label-text font-semibold">
                                      Grupo de Productos
                                    </span>
                                    <span className="label-text-alt text-error">*</span>
                                    <span>
                                      {lockGroup ? (
                                        <Lock
                                          onClick={handleLockGroup}
                                          className="tooltip ml-2 inline-block h-4 w-4 text-error hover:scale-150 hover:cursor-pointer"
                                          data-tip="Seguir con el grupo"
                                        />
                                      ) : (
                                        <Unlock
                                          onClick={handleLockGroup}
                                          className="tooltip ml-2 inline-block h-4 w-4 text-success hover:scale-150 hover:cursor-pointer"
                                          data-tip="No guardar grupo"
                                        />
                                      )}
                                    </span>
                                  </label>
                                  <div className="flex gap-2">
                                    <GroupTreeSelector
                                      groups={grupoTree}
                                      onSelectGroup={handleGroupSelect}
                                      onGroupSelect={(group) =>
                                        handleProductChange(idx, 'group_id', group.id.toString())
                                      }
                                      disabled={lockGroup && idx > 0}
                                      selectedValue={prod.group_id} // <-- CORRECT
                                      className={`flex-1 ${prod.errors?.group_id ? 'border-error' : ''}`} // <-- CORRECT
                                      placeholder="Seleccione un grupo de productos..."
                                      emptyMessage="No hay grupos disponibles - Crear grupos desde Inventario"
                                    />
                                    {prod.errors?.group_id && (
                                      <span className="text-xs text-error">
                                        {prod.errors.group_id}
                                      </span>
                                    )}
                                    <div className="tooltip" data-tip="Ver estructura de grupos">
                                      <button
                                        type="button"
                                        className="btn btn-secondary btn-outline"
                                        onClick={() => setShowGroupTreeModal(true)}
                                      >
                                        <Menu className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                  {/* Marca */}
                                  <div>
                                    <label className="label">
                                      <span className="label-text font-semibold">Marca</span>
                                      <span className="label-text-alt text-error">*</span>
                                    </label>
                                    <select
                                      value={prod.brand_id}
                                      onChange={(e) =>
                                        handleProductChange(idx, 'brand_id', e.target.value)
                                      }
                                      className={`select-bordered select w-full focus:border-secondary ${
                                        prod.errors?.brand_id ? 'select-error' : ''
                                      }`}
                                      required
                                    >
                                      <option value="" disabled>
                                        Seleccione una marca
                                      </option>
                                      {brandByProvider.map((brand) => (
                                        <option key={brand.id} value={brand.id}>
                                          {brand.brand_name}
                                        </option>
                                      ))}
                                    </select>
                                    {prod.errors?.brand_id && (
                                      <div className="label">
                                        <span className="label-text-alt text-error">
                                          {prod.errors.brand_id}
                                        </span>
                                      </div>
                                    )}
                                    {brandByProvider.length === 1 && (
                                      <div className="label">
                                        <span className="label-text-alt text-success">
                                          ✓ Marca seleccionada automáticamente
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Código del proveedor */}
                                  <div>
                                    <label className="label">
                                      <span className="label-text font-semibold">
                                        Código del proveedor
                                      </span>
                                      <span className="label-text-alt text-base-content/60">
                                        (Opcional)
                                      </span>
                                    </label>
                                    <input
                                      type="text"
                                      id="provider_code"
                                      placeholder="Código interno del proveedor"
                                      value={prod.provider_code}
                                      onChange={(e) =>
                                        handleProductChange(idx, 'provider_code', e.target.value)
                                      }
                                      className="input-bordered input w-full focus:border-secondary"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Sección: Precios */}
                            <div className="card border border-base-300 bg-base-100 shadow-xl">
                              <div className="card-body">
                                <h2 className="card-title mb-6 flex items-center gap-3 text-2xl">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                                    <span className="font-bold text-accent">3</span>
                                  </div>
                                  Precios y Costos
                                </h2>

                                {/* Control de cálculo automático */}
                                {settings.autoCalculatePrice && (
                                  <div className="alert mb-6 bg-accent">
                                    <div className="flex w-full items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <span className="text-2xl text-info">🧮</span>
                                        <div>
                                          <div className="font-semibold">
                                            Cálculo Automático de Precios
                                          </div>
                                          <div className="text-sm opacity-75">
                                            Configuración actual:{' '}
                                            {settings.markupType === 'percentage'
                                              ? `${settings.priceMarkupPercentage}% de ganancia`
                                              : `$${settings.priceMarkupPercentage} de ganancia fija`}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="form-control">
                                        <label className="label cursor-pointer gap-3">
                                          <span className="label-text font-medium">
                                            {useAutoCalculation ? 'Automático' : 'Manual'}
                                          </span>
                                          <input
                                            type="checkbox"
                                            className="toggle toggle-secondary"
                                            checked={productos.useAutoCalculation}
                                            onChange={(e) =>
                                              handleAutoCalcToggle(idx, e.target.checked)
                                            }
                                          />
                                        </label>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                  {/* Costo */}
                                  <div>
                                    <label className="label">
                                      <span className="label-text font-semibold">
                                        Costo del productos
                                      </span>
                                      <span className="label-text-alt text-error">*</span>
                                    </label>
                                    <div>
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="0.00"
                                        value={prod.cost}
                                        onChange={(e) => {
                                          const newCost = e.target.value
                                          const regex = /^[0-9]*(\.[0-9]{0,2})?$/
                                          if (regex.test(newCost)) {
                                            handleProductChange(idx, 'cost', newCost)
                                          }
                                        }}
                                        className={`input-bordered input w-full ${prod.errors?.cost ? 'input-error' : ''}`}
                                      />
                                      {prod.errors?.cost && (
                                        <span className="label-text-alt text-error">
                                          {prod.errors.cost}
                                        </span>
                                      )}
                                    </div>
                                    {errors.cost && (
                                      <div className="label">
                                        <span className="label-text-alt text-error">
                                          {errors.cost}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Precio de Venta */}
                                  <div>
                                    <label className="label">
                                      <span className="label-text font-semibold">
                                        Precio de venta
                                      </span>
                                      <span className="label-text-alt text-error">*</span>
                                      {settings.autoCalculatePrice && useAutoCalculation && (
                                        <span className="label-text-alt text-xs text-success">
                                          📊 Cálculo automático activo
                                        </span>
                                      )}
                                      {settings.autoCalculatePrice && !useAutoCalculation && (
                                        <span className="label-text-alt text-xs text-warning">
                                          ✏️ Modo manual activo
                                        </span>
                                      )}
                                    </label>
                                    <div className="w-full join">
                                      <span className="btn btn-disabled btn-outline join-item">
                                        $
                                      </span>
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder={
                                          settings.autoCalculatePrice && useAutoCalculation
                                            ? 'Se calculará automáticamente'
                                            : '0.00'
                                        }
                                        value={prod.sale_price}
                                        onChange={(e) => {
                                          const newSalePrice = e.target.value
                                          const regex = /^[0-9]*(\.[0-9]{0,2})?$/
                                          if (regex.test(newSalePrice)) {
                                            handleProductChange(idx, 'sale_price', newSalePrice)
                                          }
                                        }}
                                        className={`input-bordered input flex-1 join-item focus:border-accent ${
                                          prod.errors?.salePrice ? 'input-error' : ''
                                        } ${
                                          settings.autoCalculatePrice &&
                                          useAutoCalculation &&
                                          prod.cost
                                            ? 'bg-success/10 border-success/30'
                                            : ''
                                        }`}
                                        disabled={
                                          settings.autoCalculatePrice &&
                                          prod.useAutoCalculation &&
                                          prod.cost &&
                                          parseFloat(prod.cost) > 0
                                        }
                                        required
                                      />
                                    </div>
                                    {prod.errors?.salePrice && (
                                      <div className="label">
                                        <span className="label-text-alt text-error">
                                          {prod.errors.salePrice}
                                        </span>
                                      </div>
                                    )}
                                    {settings.autoCalculatePrice && prod.useAutoCalculation && (
                                      <div className="label">
                                        <span className="label-text-alt text-xs text-info">
                                          💡{' '}
                                          {settings.markupType === 'percentage'
                                            ? `Ganancia: ${settings.priceMarkupPercentage}%`
                                            : `Ganancia fija: $${settings.priceMarkupPercentage}`}
                                        </span>
                                      </div>
                                    )}

                                    {prod.cost && prod.sale_price && (
                                      <div className="label">
                                        <span className="label-text-alt text-info">
                                          Margen:{' '}
                                          {(
                                            ((parseFloat(prod.sale_price) - parseFloat(prod.cost)) /
                                              parseFloat(prod.cost)) *
                                            100
                                          ).toFixed(1)}
                                          %
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Información adicional */}
                                <div className="mt-4 rounded-lg bg-base-200 p-4">
                                  <div className="flex items-center justify-between text-sm">
                                    <span>Impuestos aplicables:</span>
                                    <span className="font-semibold">$0.00</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Sección: Talles, Colores y Cantidades */}
                            <div className="card border border-base-300 bg-base-100 shadow-xl">
                              <div className="card-body">
                                <h2 className="card-title mb-6 flex items-center gap-3 text-2xl">
                                  <div className="bg-success/10 flex h-8 w-8 items-center justify-center rounded-lg">
                                    <span className="font-bold text-success">4</span>
                                  </div>
                                  Talles, Colores y Cantidades
                                </h2>

                                {/* Mensajes de error */}
                                {errors.talles && (
                                  <div className="alert alert-error mb-4">
                                    <svg
                                      className="h-6 w-6"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
                                      />
                                    </svg>
                                    <span>{errors.talles}</span>
                                  </div>
                                )}

                                {errors.cantidad && (
                                  <div className="alert alert-error mb-4">
                                    <svg
                                      className="h-6 w-6"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
                                      />
                                    </svg>
                                    <span>{errors.cantidad}</span>
                                  </div>
                                )}

                                <div className="space-y-6">
                                  {prod.talles.map((talle, talleIndex) => (
                                    <div
                                      key={talleIndex}
                                      className="card border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 shadow-md"
                                    >
                                      <div className="card-body">
                                        {/* Header del talle */}
                                        <div className="mb-4 flex items-center justify-between">
                                          <h3 className="flex items-center gap-2 text-lg font-semibold">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                                              <span className="text-xs font-bold text-primary">
                                                {talleIndex + 1}
                                              </span>
                                            </div>
                                            Talle {talleIndex + 1}
                                          </h3>
                                          {prod.talles.length > 1 && (
                                            <div className="tooltip" data-tip="Eliminar este talle">
                                              <button
                                                type="button"
                                                className="btn btn-error"
                                                onClick={() => handleDeleteTalle(idx, talleIndex)}
                                              >
                                                <Trash2 className="h-5 w-5" />
                                              </button>
                                            </div>
                                          )}
                                        </div>

                                        {/* Selección de talle */}
                                        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                                          <div>
                                            <label className="label">
                                              <span className="label-text font-semibold">
                                                Seleccionar talle
                                              </span>
                                              <span className="label-text-alt text-error">*</span>
                                            </label>
                                            <div className="flex gap-2">
                                              <select
                                                value={talle.talle}
                                                onChange={(e) =>
                                                  handleTalleChange(idx, talleIndex, e.target.value)
                                                }
                                                className="select-bordered select flex-1 focus:border-primary"
                                                required
                                              >
                                                <option value="" disabled>
                                                  Seleccione un talle
                                                </option>
                                                {getTallesDisponibles(idx, talleIndex).map(
                                                  (talleBDItem) => (
                                                    <option
                                                      key={talleBDItem.id}
                                                      value={talleBDItem.size_name}
                                                    >
                                                      {talleBDItem.size_name}
                                                    </option>
                                                  )
                                                )}
                                              </select>
                                              <ModalSize onRefresh={refreshData} />
                                            </div>
                                          </div>
                                        </div>

                                        {/* Sección de colores */}
                                        <div>
                                          <div className="mb-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <span className="font-semibold">
                                                Colores y cantidades
                                              </span>
                                              <ModalColor onRefresh={refreshData} />
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => agregarColor(idx, talleIndex)}
                                              className="btn btn-secondary"
                                              disabled={!talle.talle}
                                            >
                                              + Agregar color
                                            </button>
                                          </div>

                                          <div className="space-y-3">
                                            {talle.colores.map((color, colorIndex) => (
                                              <div
                                                key={colorIndex}
                                                className="flex items-center gap-3 rounded-lg border border-base-300 bg-base-100 p-3"
                                              >
                                                <div className="flex-1">
                                                  <ColorSelect
                                                    colors={
                                                      coloresDisponiblesPorTalle[talle.talle] !==
                                                      undefined
                                                        ? colors.filter((colorItem) =>
                                                            coloresDisponiblesPorTalle[
                                                              talle.talle
                                                            ]?.includes(colorItem.color_name)
                                                          )
                                                        : []
                                                    }
                                                    value={color.color || ''}
                                                    onChange={(selectedColorName) => {
                                                      console.log(
                                                        '🎨 Color seleccionado:',
                                                        selectedColorName
                                                      )
                                                      console.log(
                                                        '🎨 Color actual en state:',
                                                        color.color
                                                      )
                                                      handleColorChange(
                                                        idx,
                                                        talleIndex,
                                                        colorIndex,
                                                        'color',
                                                        selectedColorName
                                                      )
                                                    }}
                                                    className="w-full"
                                                    placeholder={
                                                      coloresDisponiblesPorTalle[talle.talle] !==
                                                      undefined
                                                        ? 'Seleccione un color'
                                                        : 'Seleccione un talle primero'
                                                    }
                                                    disabled={
                                                      coloresDisponiblesPorTalle[talle.talle] ===
                                                      undefined
                                                    }
                                                    required
                                                  />
                                                </div>
                                                <div className="w-24">
                                                  <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    placeholder="Cant"
                                                    value={color.cantidad}
                                                    onChange={(e) => {
                                                      const newQuantity = e.target.value
                                                      const regex = /^[0-9]*$/
                                                      if (regex.test(newQuantity)) {
                                                        handleColorChange(
                                                          idx,
                                                          talleIndex,
                                                          colorIndex,
                                                          'cantidad',
                                                          parseInt(newQuantity, 10) || 0
                                                        )
                                                      }
                                                    }}
                                                    className="input-bordered input input-sm w-full text-center"
                                                    required
                                                  />
                                                </div>
                                                {talle.colores.length > 1 && (
                                                  <div
                                                    className="tooltip"
                                                    data-tip="Eliminar color"
                                                  >
                                                    <button
                                                      type="button"
                                                      className="btn btn-error"
                                                      onClick={() =>
                                                        handleDeleteColor(
                                                          idx,
                                                          talleIndex,
                                                          colorIndex
                                                        )
                                                      }
                                                    >
                                                      <Trash2 className="h-4 w-4" />
                                                    </button>
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Botón para agregar talle */}
                                <div className="mt-6 flex justify-center">
                                  <button
                                    type="button"
                                    onClick={agregarTalle}
                                    className="btn btn-primary btn-outline gap-2"
                                    disabled={loadingData || tallesBD.length === 0}
                                  >
                                    <Plus className="h-4 w-4" />
                                    Agregar Nuevo Talle
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Sección: Observaciones */}
                            <div className="card border border-base-300 bg-base-100 shadow-xl">
                              <div className="card-body">
                                <h2 className="card-title mb-6 flex items-center gap-3 text-2xl">
                                  <div className="bg-info/10 flex h-8 w-8 items-center justify-center rounded-lg">
                                    <span className="font-bold text-info">5</span>
                                  </div>
                                  Observaciones Adicionales
                                </h2>

                                <div>
                                  <label className="label">
                                    <span className="label-text font-semibold">
                                      Comentarios o notas
                                    </span>
                                    <span className="label-text-alt text-base-content/60">
                                      (Opcional)
                                    </span>
                                  </label>
                                  <textarea
                                    name="comments"
                                    placeholder="Ingrese observaciones, notas especiales, o cualquier información adicional sobre el productos..."
                                    value={prod.comments}
                                    onChange={(e) =>
                                      handleProductChange(idx, 'comments', e.target.value)
                                    }
                                    className="textarea-bordered textarea h-24 w-full resize-none focus:border-info"
                                    rows="3"
                                  ></textarea>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )
                  )}
              </>
            )}
            <button className="btn btn-primary mt-4" type="button" onClick={agregarProducto}>
              Agregar productos
            </button>
          </section>
          {/* Sección: Resumen y Acciones */}
          <div className="card border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 shadow-xl">
            <div className="card-body">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-primary">Resumen del Productos</h3>
                  <div className="stats shadow">
                    <div className="stat">
                      <div className="stat-title">Cantidad Total</div>
                      <div className="stat-value text-primary">{cantidadTotal}</div>
                      <div className="stat-desc">unidades</div>
                    </div>
                    <div className="stat">
                      <div className="stat-title">Variedades</div>
                      <div className="stat-value text-secondary">
                        {productos.reduce(
                          (acc, prod) => acc + prod.talles.filter((t) => t.talle).length,
                          0
                        )}
                      </div>
                      <div className="stat-desc">diferentes</div>
                    </div>
                    <div className="stat">
                      <div className="stat-title">Total</div>
                      <div className="stat-value text-accent">
                        {(() => {
                          const allColors = productos.flatMap((prod) =>
                            prod.talles.flatMap((t) =>
                              t.colores.map((c) => c.color).filter(Boolean)
                            )
                          )
                          return new Set(allColors).size
                        })()}
                      </div>
                      <div className="stat-desc">únicos</div>
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col gap-3">
                  {/* Mensajes de estado */}
                  {errors.submit && (
                    <div className="alert alert-error">
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                      <span>{errors.submit}</span>
                    </div>
                  )}

                  {errors.success && (
                    <div className="alert alert-success">
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>{errors.success}</span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleSubmitGuardar}
                      className="btn btn-success flex-1 gap-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <LoaderCircle className="h-5 w-5 animate-spin" />
                      ) : (
                        <Save className="h-5 w-5" />
                      )}
                      {isSubmitting ? 'Guardando...' : 'Guardar y Finalizar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Modal de vista del árbol de grupos */}
      <GroupTreePreviewModal
        groups={grupoTree}
        isOpen={showGroupTreeModal}
        onClose={() => setShowGroupTreeModal(false)}
      />
    </div>
  )
}
