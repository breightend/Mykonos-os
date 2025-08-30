import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { ArrowLeft, LoaderCircle, Save, Trash2, PackagePlus, Menu } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { useSession } from '../contexts/SessionContext'
import { useSettings } from '../contexts/settingsContext'
import ModalSize from '../modals/modalsProduct/modalSize'
import ModalColor from '../modals/modalsProduct/modalColor'
import BarcodeService from '../services/barcodeService'
import { fetchSize } from '../services/products/sizeService'
import { fetchColor } from '../services/products/colorService'
import { fetchProvider } from '../services/proveedores/proveedorService'
import { fetchBrandByProviders } from '../services/proveedores/brandService'
import postData from '../services/products/productService'
import { fetchFamilyProductsTree } from '../services/products/familyService'
import GroupTreeSelector from '../components/GroupTreeSelector'
import GroupTreePreviewModal from '../components/GroupTreePreviewModal'
import ColorSelect from '../components/ColorSelect'
import { pinwheel } from 'ldrs'

//BUG: El color ahora tiene bug.
//TODO: agregar cargar por grupo y por marca
export default function NuevoProducto() {
  pinwheel.register()
  // Contexto de sesión para obtener el storage actual
  const { getCurrentStorage, getCurrentUser } = useSession()
  const { calculateSalePrice, settings } = useSettings()
  const currentStorage = getCurrentStorage()
  const currentUser = getCurrentUser()

  // Estados para el formulario
  const [productName, setProductName] = useState('')
  const [tipo, setTipo] = useState('')
  const [marca, setMarca] = useState('')
  const [selectedProvider, setSelectedProvider] = useState('')
  const [cost, setCost] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [comments, setComments] = useState('')
  const [providerCode, setProviderCode] = useState('')
  const [useAutoCalculation, setUseAutoCalculation] = useState(settings.autoCalculatePrice)
  const [talles, setTalles] = useState([{ talle: '', colores: [{ color: '', cantidad: '' }] }])
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

  // Función para refrescar los datos después de crear nuevos talles/colores
  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Hacer todas las llamadas en paralelo para mejor performance y robustez
        const [sizesResponse, colorsResponse, providerResponse, grupoTreeData] =
          await Promise.allSettled([
            fetchSize(),
            fetchColor(),
            fetchProvider(),
            fetchFamilyProductsTree()
          ])

        // Procesar sizes
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

        // Procesar providers
        if (providerResponse.status === 'fulfilled' && providerResponse.value) {
          setProvider(providerResponse.value)
          console.log('✅ Proveedores cargados exitosamente:', providerResponse.value.length)
        } else {
          console.warn('⚠️ Error al cargar proveedores:', providerResponse.reason)
          setProvider([])
        }

        // Procesar grupos (INDEPENDIENTE de talles y colores)
        if (grupoTreeData.status === 'fulfilled' && grupoTreeData.value) {
          setGrupoTree(grupoTreeData.value)
          console.log('✅ Grupos de productos cargados exitosamente:', grupoTreeData.value.length)
        } else {
          console.warn('⚠️ Error al cargar grupos de productos:', grupoTreeData.reason)
          setGrupoTree([])
        }

        // Configurar colores disponibles por talle SOLO si ambos están disponibles
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
      if (selectedProvider) {
        try {
          const brandsByProviderResponse = await fetchBrandByProviders(selectedProvider)
          setBrandByProvider(brandsByProviderResponse)

          if (brandsByProviderResponse.length === 1) {
            setMarca(brandsByProviderResponse[0].brand_name)
          } else {
            setMarca('')
          }
        } catch (error) {
          console.error('Error fetching brands for provider: ', error)
          setBrandByProvider([])
          setMarca('')
        }
      } else {
        setBrandByProvider([])
        setMarca('')
      }
    }
    fetchBrandsForProvider()
  }, [selectedProvider])

  const handleProviderChange = (e) => {
    setSelectedProvider(e.target.value)
  }

  const handleGroupSelect = (group) => {
    setTipo(group.id.toString())
  }

  const handleCantidadTotal = () => {
    let cantidadTotal = 0
    talles.forEach((talle) => {
      talle.colores.forEach((color) => {
        cantidadTotal += parseInt(color.cantidad || 0, 10)
      })
    })
    setCantidadTotal(cantidadTotal)
  }

  const handleDeleteColor = (talleIndex, colorIndex) => {
    const nuevosTalles = [...talles]
    const colorEliminado = nuevosTalles[talleIndex].colores[colorIndex].color
    const talleActual = nuevosTalles[talleIndex].talle

    if (colorEliminado && talleActual) {
      setColoresDisponiblesPorTalle((prev) => ({
        ...prev,
        [talleActual]: [...(prev[talleActual] || []), colorEliminado]
      }))
    }

    nuevosTalles[talleIndex].colores.splice(colorIndex, 1)
    setTalles(nuevosTalles)
    handleCantidadTotal()
  }

  const handleDeleteTalle = (talleIndex) => {
    const nuevosTalles = [...talles]
    const talleEliminado = nuevosTalles[talleIndex]

    if (talleEliminado.talle) {
      setColoresDisponiblesPorTalle((prev) => ({
        ...prev,
        [talleEliminado.talle]: colors.map((color) => color.color_name)
      }))
    }

    nuevosTalles.splice(talleIndex, 1)
    setTalles(nuevosTalles)
    handleCantidadTotal()
  }

  const agregarTalle = () => {
    const tallesUsados = talles.map((t) => t.talle).filter(Boolean)
    const tallesDisponibles = tallesBD.filter((t) => !tallesUsados.includes(t.size_name))

    if (tallesDisponibles.length === 0) {
      alert('No hay más talles disponibles para agregar')
      return
    }

    setTalles([...talles, { talle: '', colores: [{ color: '', cantidad: 0 }] }])
  }

  const handleTalleChange = (talleIndex, value) => {
    const nuevosTalles = [...talles]

    nuevosTalles[talleIndex].talle = value
    setTalles(nuevosTalles)

    if (value && colors.length > 0) {
      setColoresDisponiblesPorTalle((prev) => ({
        ...prev,
        [value]: colors.map((color) => color.color_name)
      }))
    }
  }

  const agregarColor = (talleIndex) => {
    const nuevosTalles = [...talles]
    nuevosTalles[talleIndex].colores.push({ color: '', cantidad: '' })
    setTalles(nuevosTalles)
  }

  const handleColorSelect = (talleIndex, colorIndex, field, value) => {
    handleColorChange(talleIndex, colorIndex, field, value)
  }

  const handleColorChange = (talleIndex, colorIndex, field, value) => {
    const nuevosTalles = [...talles]
    const talleActual = nuevosTalles[talleIndex].talle
    const colorAnterior = nuevosTalles[talleIndex].colores[colorIndex].color

    if (field === 'color') {
      const nuevoColor = value

      if (nuevoColor !== colorAnterior) {
        // Actualizar el color en el estado
        nuevosTalles[talleIndex].colores[colorIndex].color = nuevoColor

        setColoresDisponiblesPorTalle((prev) => {
          const nuevosDisponibles = { ...prev }

          // Si había un color anterior, devolverlo a la lista de disponibles
          if (colorAnterior && talleActual) {
            if (!nuevosDisponibles[talleActual]) {
              nuevosDisponibles[talleActual] = []
            }
            if (!nuevosDisponibles[talleActual].includes(colorAnterior)) {
              nuevosDisponibles[talleActual].push(colorAnterior)
            }
          }

          // Remover el nuevo color de la lista de disponibles
          if (nuevoColor && talleActual && nuevosDisponibles[talleActual]) {
            nuevosDisponibles[talleActual] = nuevosDisponibles[talleActual].filter(
              (c) => c !== nuevoColor
            )
          }

          return nuevosDisponibles
        })
      }
    }

    // Actualizar el campo correspondiente
    nuevosTalles[talleIndex].colores[colorIndex][field] =
      field === 'cantidad' ? parseInt(value, 10) || 0 : value

    setTalles(nuevosTalles)
    handleCantidadTotal()
  }

  // Función para obtener talles disponibles (no repetidos)
  const getTallesDisponibles = (talleIndex) => {
    const tallesSeleccionados = talles
      .map((t, index) => (index !== talleIndex ? t.talle : null))
      .filter(Boolean)

    return tallesBD.filter((talle) => !tallesSeleccionados.includes(talle.size_name))
  }

  // Función para convertir archivo a base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  // Configuración de react-dropzone para la imagen del producto
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': []
    },
    maxSize: 10485760, // 10MB en bytes
    onDrop: async (acceptedFiles, rejectedFiles) => {
      // Manejar archivos rechazados
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0]
        if (rejection.errors.some((e) => e.code === 'file-too-large')) {
          setErrors((prev) => ({
            ...prev,
            productImage: 'La imagen es demasiado grande. Máximo 10MB.'
          }))
          return
        }
        if (rejection.errors.some((e) => e.code === 'file-invalid-type')) {
          setErrors((prev) => ({
            ...prev,
            productImage: 'Formato de imagen no válido. Use PNG, JPG o WEBP.'
          }))
          return
        }
      }

      // Procesar archivo válido
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]
        try {
          setIsUploadingImage(true)
          const base64 = await convertToBase64(file)
          setProductImage(base64)

          const mimeType = file.type
          const dataUriPrefix = base64.split(',')[0]

          console.log(
            '✅ Imagen cargada exitosamente:',
            file.name,
            'Tipo MIME:',
            mimeType,
            'Data URI prefix:',
            dataUriPrefix,
            'Tamaño:',
            (file.size / 1024 / 1024).toFixed(2),
            'MB'
          )

          // Limpiar error de imagen si existe
          if (errors.productImage) {
            setErrors((prev) => ({ ...prev, productImage: '' }))
          }
        } catch (error) {
          console.error('❌ Error al convertir imagen:', error)
          setErrors((prev) => ({ ...prev, productImage: 'Error al procesar la imagen.' }))
        } finally {
          setIsUploadingImage(false)
        }
      }
    }
  })

  /**
   * Convierte una imagen base64 a Blob y crea una URL de objeto
   * @param base64Data Los datos de imagen codificados en base64 (con o sin prefijo data URI)
   * @returns La URL del objeto que se puede usar como fuente de imagen
   */
  function base64ToObjectUrl(base64Data) {
    // Extraer tipo de contenido y datos base64
    let contentType = 'image/png' // predeterminado
    let base64WithoutPrefix = base64Data

    // Verificar si es un data URI y extraer el tipo de contenido
    if (base64Data.startsWith('data:')) {
      const matches = base64Data.match(/^data:(.+?);/)
      if (matches && matches[1]) {
        contentType = matches[1]
      }
      base64WithoutPrefix = base64Data.split(';base64,').pop()
    }

    // Convertir base64 a datos binarios sin procesar
    const byteCharacters = atob(base64WithoutPrefix)
    const byteArrays = []

    // Convertir cada carácter a matriz de bytes
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512)
      const byteNumbers = new Array(slice.length)

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i)
      }

      const byteArray = new Uint8Array(byteNumbers)
      byteArrays.push(byteArray)
    }

    const blob = new Blob(byteArrays, { type: contentType })

    return URL.createObjectURL(blob)
  }

  const prepareProductData = () => {
    const uniqueSizes = [...new Set(talles.map((t) => t.talle).filter(Boolean))]
    const uniqueColors = [
      ...new Set(talles.flatMap((t) => t.colores.map((c) => c.color).filter(Boolean)))
    ]

    const sizeIds = uniqueSizes
      .map((sizeName) => {
        const size = tallesBD.find((s) => s.size_name === sizeName)
        return size ? size.id : null
      })
      .filter(Boolean)

    const colorIds = uniqueColors
      .map((colorName) => {
        const color = colors.find((c) => c.color_name === colorName)
        return color ? color.id : null
      })
      .filter(Boolean)

    const selectedBrand = brandByProvider.find((brand) => brand.brand_name === marca)
    const brandId = selectedBrand ? selectedBrand.id : null

    let imageToSend = null
    if (productImage) {
      if (productImage.startsWith('data:')) {
        imageToSend = productImage.split(',')[1] 
        console.log('🖼️ Preparando imagen para envío:')
        console.log('  - Imagen original:', productImage.substring(0, 100) + '...')
        console.log('  - Tipo MIME detectado:', productImage.split(',')[0])
        console.log(
          '  - Base64 enviado (primeros 100 chars):',
          imageToSend.substring(0, 100) + '...'
        )
      } else {
        imageToSend = productImage
        console.log('🖼️ Imagen ya está en formato base64 puro')
      }
    } else {
      console.log('🖼️ No hay imagen para enviar')
    }

    return {
      provider_code: providerCode,
      product_name: productName,
      group_id: parseInt(tipo),
      provider_id: parseInt(selectedProvider),
      description: '',
      cost: cost && !isNaN(parseFloat(cost)) ? parseFloat(cost) : null,
      sale_price: salePrice && !isNaN(parseFloat(salePrice)) ? parseFloat(salePrice) : null,
      original_price: salePrice && !isNaN(parseFloat(salePrice)) ? parseFloat(salePrice) : null,
      tax: 0,
      discount: 0,
      comments: comments || null,
      user_id: currentUser?.id || 1,
      images_ids: null,
      brand_id: brandId,
      creation_date: new Date().toISOString(),
      last_modified_date: new Date().toISOString(),
      size_ids: sizeIds,
      color_ids: colorIds,
      product_image: imageToSend,
      storage_id: currentStorage?.id || null,
      state: 'enTienda',
      initial_quantity: cantidadTotal,
      stock_variants: talles.flatMap((talle) => {
        const sizeData = tallesBD.find((s) => s.size_name === talle.talle)
        if (!sizeData) return []

        return talle.colores
          .filter((color) => color.color && color.cantidad > 0)
          .map((color) => {
            const colorData = colors.find((c) => c.color_name === color.color)
            return {
              size_id: sizeData.id,
              color_id: colorData ? colorData.id : null,
              quantity: parseInt(color.cantidad) || 0,
              size_name: talle.talle,
              color_name: color.color
            }
          })
          .filter((variant) => variant.color_id !== null)
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!productName.trim()) newErrors.productName = 'El nombre del producto es requerido'
    if (!tipo) newErrors.tipo = 'El grupo de producto es requerido'
    if (!selectedProvider) newErrors.provider = 'El proveedor es requerido'
    if (!marca) newErrors.marca = 'La marca es requerida'
    if (!cost || isNaN(parseFloat(cost)) || parseFloat(cost) <= 0)
      newErrors.cost = 'El costo debe ser mayor a 0'
    if (!salePrice || isNaN(parseFloat(salePrice)) || parseFloat(salePrice) <= 0)
      newErrors.salePrice = 'El precio de venta debe ser mayor a 0'
    if (cantidadTotal <= 0) newErrors.cantidad = 'Debe agregar al menos una unidad'

    if (currentStorage && cantidadTotal <= 0) {
      newErrors.cantidad = 'Debe especificar la cantidad para la sucursal seleccionada'
    }

    const hasInvalidTalles = talles.some((talle) => {
      if (!talle.talle) return true
      return talle.colores.some((color) => !color.color || !color.cantidad || color.cantidad <= 0)
    })

    if (hasInvalidTalles) {
      newErrors.talles = 'Todos los talles deben tener al menos un color con cantidad válida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const clearForm = () => {
    setProductName('')
    setTipo('')
    setCost('')
    setSalePrice('')
    setComments('')
    setProviderCode('')
    setProductImage('')
    setUseAutoCalculation(settings.autoCalculatePrice)
    setTalles([{ talle: '', colores: [{ color: '', cantidad: '' }] }])
    setCantidadTotal(0)
    setErrors({})

    if (colors.length > 0 && tallesBD.length > 0) {
      const coloresDisponibles = {}
      tallesBD.forEach((talle) => {
        coloresDisponibles[talle.size_name] = colors.map((color) => color.color_name)
      })
      setColoresDisponiblesPorTalle(coloresDisponibles)
    }
  }

  const handleSubmitGuardar = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const productData = prepareProductData()
      console.log('🔍 DATOS DE PRODUCTO PREPARADOS:', productData)
      console.log('🔍 STOCK VARIANTS A ENVIAR:', productData.stock_variants)
      console.log('🔍 CANTIDAD DE VARIANTES:', productData.stock_variants?.length || 0)

      const response = await postData(productData)

      console.log('Producto guardado exitosamente:', response)

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
      console.error('Error al guardar el producto:', error)
      setErrors({ submit: 'Error al guardar el producto. Intente nuevamente.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitAgregarPrenda = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const productData = prepareProductData()
      const response = await postData(productData)

      console.log('Producto agregado exitosamente:', response)

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

      clearForm()

      const successMessage = productImage
        ? 'Producto e imagen agregados exitosamente. Puede agregar otro.'
        : 'Producto agregado exitosamente. Puede agregar otro.'

      setErrors({ success: successMessage })
      setTimeout(() => setErrors({}), 3000)
    } catch (error) {
      console.error('Error al agregar el producto:', error)
      setErrors({ submit: 'Error al agregar el producto. Intente nuevamente.' })
    } finally {
      setIsSubmitting(false)
    }
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
                  Agregar Artículo
                </h1>
                <p className="text-base-content/70 text-sm">
                  Complete los datos del nuevo producto. Los códigos de barras se generarán
                  automáticamente para cada variante.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

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
          <div className="card border border-base-300 bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title mb-6 flex items-center gap-3 text-2xl">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <span className="font-bold text-primary">1</span>
                </div>
                Información Básica
              </h2>

              <div className="space-y-6">
                {/* Nombre del producto */}
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Nombre del producto</span>
                    <span className="label-text-alt text-error">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Remera básica algodón"
                    className={`input-bordered input w-full focus:border-primary ${
                      errors.productName ? 'input-error' : ''
                    }`}
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    required
                  />
                  {errors.productName && (
                    <div className="label">
                      <span className="label-text-alt text-error">{errors.productName}</span>
                    </div>
                  )}
                </div>

                {/* Imagen del producto */}
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Imagen del producto</span>
                    <span className="label-text-alt text-base-content/60">(Opcional)</span>
                  </label>

                  {productImage && (
                    <div className="mb-4 flex justify-center">
                      <div className="avatar">
                        <div className="h-32 w-32 rounded-xl ring ring-primary ring-offset-2 ring-offset-base-100">
                          <img
                            src={base64ToObjectUrl(productImage)}
                            alt="Preview del producto"
                            className="object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div
                    {...getRootProps()}
                    className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300 hover:border-primary/50 ${
                      isDragActive
                        ? 'border-primary bg-primary/5'
                        : errors.productImage
                          ? 'bg-error/5 border-error'
                          : 'hover:bg-base-200/50 border-base-300'
                    } ${isUploadingImage ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    <input {...getInputProps()} />
                    <div className="space-y-2">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        {isUploadingImage ? (
                          <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
                        ) : (
                          <svg
                            className="h-6 w-6 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm font-medium">
                        {isUploadingImage
                          ? 'Procesando imagen...'
                          : isDragActive
                            ? '¡Suelta la imagen aquí!'
                            : 'Arrastra la imagen o haz clic para seleccionar'}
                      </p>
                      <p className="text-base-content/60 text-xs">PNG, JPG, WEBP hasta 10MB</p>
                    </div>
                  </div>
                  {errors.productImage && (
                    <div className="label">
                      <span className="label-text-alt text-error">{errors.productImage}</span>
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
                  <span className="label-text font-semibold">Grupo de Producto</span>
                  <span className="label-text-alt text-error">*</span>
                </label>
                <div className="flex gap-2">
                  <GroupTreeSelector
                    groups={grupoTree}
                    selectedGroupId={tipo ? parseInt(tipo) : null}
                    onSelectGroup={handleGroupSelect}
                    className={`flex-1 ${errors.tipo ? 'border-error' : ''}`}
                    placeholder="Seleccione un grupo de producto..."
                    emptyMessage="No hay grupos disponibles - Crear grupos desde Inventario"
                  />
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
                {errors.tipo && (
                  <div className="label">
                    <span className="label-text-alt text-error">{errors.tipo}</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Proveedor */}
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Proveedor</span>
                    <span className="label-text-alt text-error">*</span>
                  </label>
                  <select
                    value={selectedProvider}
                    onChange={handleProviderChange}
                    className={`select-bordered select w-full focus:border-secondary ${
                      errors.provider ? 'select-error' : ''
                    }`}
                    required
                  >
                    <option value="" disabled>
                      Seleccione un proveedor
                    </option>
                    {provider.map((proveedorItem) => (
                      <option key={proveedorItem.id} value={proveedorItem.id}>
                        {proveedorItem.entity_name}
                      </option>
                    ))}
                  </select>
                  {errors.provider && (
                    <div className="label">
                      <span className="label-text-alt text-error">{errors.provider}</span>
                    </div>
                  )}
                </div>

                {/* Marca */}
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Marca</span>
                    <span className="label-text-alt text-error">*</span>
                  </label>
                  <select
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    className={`select-bordered select w-full focus:border-secondary ${
                      errors.marca ? 'select-error' : ''
                    } ${!selectedProvider ? 'select-disabled' : ''}`}
                    required
                    disabled={!selectedProvider}
                  >
                    <option value="" disabled>
                      {!selectedProvider
                        ? 'Seleccione un proveedor primero'
                        : 'Seleccione una marca'}
                    </option>
                    {brandByProvider.map((marcaItem) => (
                      <option key={marcaItem.id} value={marcaItem.brand_name}>
                        {marcaItem.brand_name}
                      </option>
                    ))}
                  </select>
                  {errors.marca && (
                    <div className="label">
                      <span className="label-text-alt text-error">{errors.marca}</span>
                    </div>
                  )}
                  {brandByProvider.length === 1 && selectedProvider && (
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
                    <span className="label-text font-semibold">Código del proveedor</span>
                    <span className="label-text-alt text-base-content/60">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    id="providerCode"
                    placeholder="Código interno del proveedor"
                    value={providerCode}
                    onChange={(e) => setProviderCode(e.target.value)}
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
                        <div className="font-semibold">Cálculo Automático de Precios</div>
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
                          checked={useAutoCalculation}
                          onChange={(e) => {
                            setUseAutoCalculation(e.target.checked)
                            if (!e.target.checked) {
                              setSalePrice('')
                            } else if (e.target.checked && cost && parseFloat(cost) > 0) {
                              const calculatedPrice = calculateSalePrice(cost)
                              setSalePrice(calculatedPrice)
                            }
                          }}
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
                    <span className="label-text font-semibold">Costo del producto</span>
                    <span className="label-text-alt text-error">*</span>
                  </label>
                  <div className="w-full join">
                    <span className="btn btn-disabled btn-outline join-item">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={cost}
                      onChange={(e) => {
                        const newCost = e.target.value
                        const regex = /^[0-9]*(\.[0-9]{0,2})?$/
                        if (regex.test(newCost)) {
                          setCost(newCost)
                          if (
                            settings.autoCalculatePrice &&
                            useAutoCalculation &&
                            newCost &&
                            parseFloat(newCost) > 0
                          ) {
                            const calculatedPrice = calculateSalePrice(newCost)
                            setSalePrice(calculatedPrice)
                          }
                        }
                      }}
                      className={`input-bordered input flex-1 join-item focus:border-accent ${
                        errors.cost ? 'input-error' : ''
                      }`}
                      required
                    />
                  </div>
                  {errors.cost && (
                    <div className="label">
                      <span className="label-text-alt text-error">{errors.cost}</span>
                    </div>
                  )}
                </div>

                {/* Precio de Venta */}
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Precio de venta</span>
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
                    <span className="btn btn-disabled btn-outline join-item">$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder={
                        settings.autoCalculatePrice && useAutoCalculation
                          ? 'Se calculará automáticamente'
                          : '0.00'
                      }
                      value={salePrice}
                      onChange={(e) => {
                        const newSalePrice = e.target.value
                        const regex = /^[0-9]*(\.[0-9]{0,2})?$/
                        if (regex.test(newSalePrice)) {
                          setSalePrice(newSalePrice)
                        }
                      }}
                      className={`input-bordered input flex-1 join-item focus:border-accent ${
                        errors.salePrice ? 'input-error' : ''
                      } ${
                        settings.autoCalculatePrice && useAutoCalculation && cost
                          ? 'bg-success/10 border-success/30'
                          : ''
                      }`}
                      disabled={
                        settings.autoCalculatePrice &&
                        useAutoCalculation &&
                        cost &&
                        parseFloat(cost) > 0
                      }
                      required
                    />
                  </div>
                  {errors.salePrice && (
                    <div className="label">
                      <span className="label-text-alt text-error">{errors.salePrice}</span>
                    </div>
                  )}
                  {settings.autoCalculatePrice && useAutoCalculation && (
                    <div className="label">
                      <span className="label-text-alt text-xs text-info">
                        💡{' '}
                        {settings.markupType === 'percentage'
                          ? `Ganancia: ${settings.priceMarkupPercentage}%`
                          : `Ganancia fija: $${settings.priceMarkupPercentage}`}
                      </span>
                    </div>
                  )}

                  {cost && salePrice && (
                    <div className="label">
                      <span className="label-text-alt text-info">
                        Margen:{' '}
                        {(
                          ((parseFloat(salePrice) - parseFloat(cost)) / parseFloat(cost)) *
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
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                {talles.map((talle, talleIndex) => (
                  <div
                    key={talleIndex}
                    className="card border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 shadow-md"
                  >
                    <div className="card-body">
                      {/* Header del talle */}
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-lg font-semibold">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                            <span className="text-xs font-bold text-primary">{talleIndex + 1}</span>
                          </div>
                          Talle {talleIndex + 1}
                        </h3>
                        {talles.length > 1 && (
                          <div className="tooltip" data-tip="Eliminar este talle">
                            <button
                              type="button"
                              className="btn btn-error"
                              onClick={() => handleDeleteTalle(talleIndex)}
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
                            <span className="label-text font-semibold">Seleccionar talle</span>
                            <span className="label-text-alt text-error">*</span>
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={talle.talle}
                              onChange={(e) => handleTalleChange(talleIndex, e.target.value)}
                              className="select-bordered select flex-1 focus:border-primary"
                              required
                            >
                              <option value="" disabled>
                                Seleccione un talle
                              </option>
                              {getTallesDisponibles(talleIndex).map((talleBDItem) => (
                                <option key={talleBDItem.id} value={talleBDItem.size_name}>
                                  {talleBDItem.size_name}
                                </option>
                              ))}
                            </select>
                            <ModalSize onRefresh={refreshData} />
                          </div>
                        </div>
                      </div>

                      {/* Sección de colores */}
                      <div>
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Colores y cantidades</span>
                            <ModalColor onRefresh={refreshData} />
                          </div>
                          <button
                            type="button"
                            onClick={() => agregarColor(talleIndex)}
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
                                    coloresDisponiblesPorTalle[talle.talle] !== undefined
                                      ? colors.filter((colorItem) =>
                                          coloresDisponiblesPorTalle[talle.talle]?.includes(
                                            colorItem.color_name
                                          )
                                        )
                                      : []
                                  }
                                  value={color.color || ''}
                                  onChange={(selectedColorName) => {
                                    console.log('🎨 Color seleccionado:', selectedColorName)
                                    console.log('🎨 Color actual en state:', color.color)
                                    handleColorSelect(
                                      talleIndex,
                                      colorIndex,
                                      'color',
                                      selectedColorName
                                    )
                                  }}
                                  className="w-full"
                                  placeholder={
                                    coloresDisponiblesPorTalle[talle.talle] !== undefined
                                      ? 'Seleccione un color'
                                      : 'Seleccione un talle primero'
                                  }
                                  disabled={coloresDisponiblesPorTalle[talle.talle] === undefined}
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
                                <div className="tooltip" data-tip="Eliminar color">
                                  <button
                                    type="button"
                                    className="btn btn-error "
                                    onClick={() => handleDeleteColor(talleIndex, colorIndex)}
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
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
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
                  <span className="label-text font-semibold">Comentarios o notas</span>
                  <span className="label-text-alt text-base-content/60">(Opcional)</span>
                </label>
                <textarea
                  name="comments"
                  placeholder="Ingrese observaciones, notas especiales, o cualquier información adicional sobre el producto..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="textarea-bordered textarea h-24 w-full resize-none focus:border-info"
                  rows="3"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Sección: Resumen y Acciones */}
          <div className="card border border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 shadow-xl">
            <div className="card-body">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                {/* Resumen */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-primary">Resumen del Producto</h3>
                  <div className="stats shadow">
                    <div className="stat">
                      <div className="stat-title">Cantidad Total</div>
                      <div className="stat-value text-primary">{cantidadTotal}</div>
                      <div className="stat-desc">unidades</div>
                    </div>
                    <div className="stat">
                      <div className="stat-title">Talles</div>
                      <div className="stat-value text-secondary">
                        {talles.filter((t) => t.talle).length}
                      </div>
                      <div className="stat-desc">diferentes</div>
                    </div>
                    <div className="stat">
                      <div className="stat-title">Colores</div>
                      <div className="stat-value text-accent">
                        {
                          [
                            ...new Set(
                              talles.flatMap((t) => t.colores.map((c) => c.color).filter(Boolean))
                            )
                          ].length
                        }
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

                    <button
                      type="button"
                      onClick={handleSubmitAgregarPrenda}
                      className="btn btn-primary flex-1 gap-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <LoaderCircle className="h-5 w-5 animate-spin" />
                      ) : (
                        <PackagePlus className="h-5 w-5" />
                      )}
                      {isSubmitting ? 'Agregando...' : 'Agregar Otra Prenda'}
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
