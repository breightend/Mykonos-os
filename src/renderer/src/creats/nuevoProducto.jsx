import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { ArrowLeft, LoaderCircle, Save, Trash2, PackagePlus, Menu } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import ModalSize from '../modals/modalsProduct/modalSize'
import ModalColor from '../modals/modalsProduct/modalColor'
import BarcodeGenerator from '../componentes especificos/Barcode'
import { fetchSize } from '../services/products/sizeService'
import { fetchColor } from '../services/products/colorService'
import { fetchProvider } from '../services/proveedores/proveedorService'
import { fetchBrandByProviders } from '../services/proveedores/brandService'
import postData from '../services/products/productService'
import { fetchFamilyProductsTree } from '../services/products/familyService'
import GroupTreeSelector from '../components/GroupTreeSelector'
import GroupTreePreviewModal from '../components/GroupTreePreviewModal'
import ColorSelect from '../components/ColorSelect'
//TODO: colocar la condicion que si un color esta colocado en un producto no se puede eliminar, si no tiene ningun vinculo chau chau.
export default function NuevoProducto() {
  // Estados para el formulario
  const [productName, setProductName] = useState('')
  const [tipo, setTipo] = useState('')
  const [marca, setMarca] = useState('')
  const [selectedProvider, setSelectedProvider] = useState('')
  const [cost, setCost] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [comments, setComments] = useState('')
  const [cantidad] = useState(0)
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sizesResponse = await fetchSize()
        setTallesBD(sizesResponse)

        const colorsResponse = await fetchColor()
        setColors(colorsResponse)

        const providerResponse = await fetchProvider()
        setProvider(providerResponse)

        const grupoTreeData = await fetchFamilyProductsTree()
        setGrupoTree(grupoTreeData)

        if (colorsResponse && sizesResponse) {
          const coloresDisponibles = {}
          sizesResponse.forEach((talle) => {
            coloresDisponibles[talle.size_name] = colorsResponse.map((color) => color.color_name)
          })
          setColoresDisponiblesPorTalle(coloresDisponibles)
        }
      } catch (error) {
        console.error('Error Fetching data: ', error)
        // setErrorData(error)
      } finally {
        setLoadingData(false)
      }
    }
    fetchData()
  }, [])

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
          console.log(
            '✅ Imagen cargada exitosamente:',
            file.name,
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

    // Crear blob a partir de matrices de bytes
    const blob = new Blob(byteArrays, { type: contentType })

    // Crear y devolver URL del objeto
    return URL.createObjectURL(blob)
  }

  // Función para preparar los datos del producto
  const prepareProductData = () => {
    // Obtener IDs de talles y colores únicos
    const uniqueSizes = [...new Set(talles.map((t) => t.talle).filter(Boolean))]
    const uniqueColors = [
      ...new Set(talles.flatMap((t) => t.colores.map((c) => c.color).filter(Boolean)))
    ]

    // Mapear nombres a IDs
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

    // Obtener brand_id de la marca seleccionada
    const selectedBrand = brandByProvider.find((brand) => brand.brand_name === marca)
    const brandId = selectedBrand ? selectedBrand.id : null

    // Generar código de barras temporal si no existe
    const generatedBarcode = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Preparar imagen para envío (extraer solo el base64 sin el prefijo data URI)
    let imageToSend = null
    if (productImage) {
      // Si la imagen tiene el prefijo data:image/...;base64, lo extraemos
      if (productImage.startsWith('data:')) {
        imageToSend = productImage.split(',')[1] // Extraer solo la parte base64
      } else {
        imageToSend = productImage // Ya es solo base64
      }
    }

    // Preparar datos del producto para el backend
    return {
      barcode: generatedBarcode,
      provider_code: `PROV-${selectedProvider}`,
      product_name: productName, // Changed from empty string to use productName state
      group_id: parseInt(tipo), // Usar el grupo seleccionado
      provider_id: parseInt(selectedProvider),
      description: '', // Keep as empty for now, or add a separate description field if needed
      cost: parseFloat(cost) || 0,
      sale_price: parseFloat(salePrice) || 0,
      tax: 0, // Por defecto
      discount: 0, // Por defecto
      comments: comments || null,
      user_id: 1, // Usuario por defecto por ahora
      images_ids: null, // Se actualizará automáticamente en el backend
      brand_id: brandId,
      creation_date: new Date().toISOString(),
      last_modified_date: new Date().toISOString(),
      size_ids: sizeIds,
      color_ids: colorIds,
      product_image: imageToSend // Imagen en formato base64 limpio
    }
  }

  // Función para validar el formulario
  const validateForm = () => {
    const newErrors = {}

    if (!productName.trim()) newErrors.productName = 'El nombre del producto es requerido'
    if (!tipo) newErrors.tipo = 'El grupo de producto es requerido'
    if (!selectedProvider) newErrors.provider = 'El proveedor es requerido'
    if (!marca) newErrors.marca = 'La marca es requerida'
    if (!cost || parseFloat(cost) <= 0) newErrors.cost = 'El costo debe ser mayor a 0'
    if (!salePrice || parseFloat(salePrice) <= 0)
      newErrors.salePrice = 'El precio de venta debe ser mayor a 0'
    if (cantidadTotal <= 0) newErrors.cantidad = 'Debe agregar al menos una unidad'

    // Validar que todos los talles tengan colores con cantidad
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
    setProductImage('')
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
      const response = await postData(productData)

      console.log('Producto guardado exitosamente:', response)

      // Mostrar mensaje de éxito si hay imagen
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

      // Mostrar mensaje de éxito si hay imagen
      if (productImage && response.image_id) {
        console.log('✅ Imagen subida exitosamente con ID:', response.image_id)
      }

      // Limpiar formulario pero mantener proveedor y marca
      clearForm()

      // Mostrar mensaje de éxito temporal
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
        <div className="bg-base-100 flex min-h-screen items-center justify-center p-6">
          <div className="flex items-center space-x-4 p-4">
            <div className="">
              <LoaderCircle className="h-10 w-10 animate-spin" />
            </div>
            <h1 className="text-4xl font-bold">Cargando...</h1>
          </div>
        </div>
      </>
    )
  }

  /*   if (errorData) {
    return <div>Error al cargar los datos: {errorData.message}</div>
  } */

  return (
    <div className="from-base-100 to-base-200 min-h-screen bg-gradient-to-br">
      {/* Header con gradiente y sombra */}
      <div className="bg-base-100/95 border-base-300 top-0 z-10 border-b shadow-lg backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="tooltip" data-tip="Volver al inventario">
                <button
                  className="btn btn-circle btn-outline hover:btn-primary transition-all duration-300 hover:scale-110"
                  onClick={() => setLocation('/inventario')}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </div>
              <div>
                <h1 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent">
                  Agregar Artículo
                </h1>
                <p className="text-base-content/70 text-sm">
                  Complete los datos del nuevo producto
                </p>
              </div>
            </div>
            <BarcodeGenerator />
          </div>
        </div>
      </div>

      {/* Container principal con máximo ancho */}
      <div className="container mx-auto px-6 py-8">
        <form className="mx-auto max-w-6xl space-y-8">
          {/* Sección: Información Básica */}
          <div className="card bg-base-100 border-base-300 border shadow-xl">
            <div className="card-body">
              <h2 className="card-title mb-6 flex items-center gap-3 text-2xl">
                <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                  <span className="text-primary font-bold">1</span>
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
                    className={`input input-bordered focus:border-primary w-full ${
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
                    <span className="label-text-alt text-base-content/60">Opcional</span>
                  </label>

                  {productImage && (
                    <div className="mb-4 flex justify-center">
                      <div className="avatar">
                        <div className="ring-primary ring-offset-base-100 h-32 w-32 rounded-xl ring ring-offset-2">
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
                    className={`hover:border-primary/50 cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
                      isDragActive
                        ? 'border-primary bg-primary/5'
                        : errors.productImage
                          ? 'border-error bg-error/5'
                          : 'border-base-300 hover:bg-base-200/50'
                    } ${isUploadingImage ? 'pointer-events-none opacity-50' : ''}`}
                  >
                    <input {...getInputProps()} />
                    <div className="space-y-2">
                      <div className="bg-primary/10 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
                        {isUploadingImage ? (
                          <LoaderCircle className="text-primary h-6 w-6 animate-spin" />
                        ) : (
                          <svg
                            className="text-primary h-6 w-6"
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
          <div className="card bg-base-100 border-base-300 border shadow-xl">
            <div className="card-body">
              <h2 className="card-title mb-6 flex items-center gap-3 text-2xl">
                <div className="bg-secondary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                  <span className="text-secondary font-bold">2</span>
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
                      className="btn btn-outline btn-secondary"
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
                    className={`select select-bordered focus:border-secondary w-full ${
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
                    className={`select select-bordered focus:border-secondary w-full ${
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
              </div>
            </div>
          </div>

          {/* Sección: Precios */}
          <div className="card bg-base-100 border-base-300 border shadow-xl">
            <div className="card-body">
              <h2 className="card-title mb-6 flex items-center gap-3 text-2xl">
                <div className="bg-accent/10 flex h-8 w-8 items-center justify-center rounded-lg">
                  <span className="text-accent font-bold">3</span>
                </div>
                Precios y Costos
              </h2>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Costo */}
                <div>
                  <label className="label">
                    <span className="label-text font-semibold">Costo del producto</span>
                    <span className="label-text-alt text-error">*</span>
                  </label>
                  <div className="join w-full">
                    <span className="join-item btn btn-outline btn-disabled">$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      className={`input input-bordered join-item focus:border-accent flex-1 ${
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
                  </label>
                  <div className="join w-full">
                    <span className="join-item btn btn-outline btn-disabled">$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={salePrice}
                      onChange={(e) => setSalePrice(e.target.value)}
                      className={`input input-bordered join-item focus:border-accent flex-1 ${
                        errors.salePrice ? 'input-error' : ''
                      }`}
                      required
                    />
                  </div>
                  {errors.salePrice && (
                    <div className="label">
                      <span className="label-text-alt text-error">{errors.salePrice}</span>
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
              <div className="bg-base-200 mt-4 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Impuestos aplicables:</span>
                  <span className="font-semibold">$0.00</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sección: Talles, Colores y Cantidades */}
          <div className="card bg-base-100 border-base-300 border shadow-xl">
            <div className="card-body">
              <h2 className="card-title mb-6 flex items-center gap-3 text-2xl">
                <div className="bg-success/10 flex h-8 w-8 items-center justify-center rounded-lg">
                  <span className="text-success font-bold">4</span>
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
                    className="card from-primary/5 to-secondary/5 border-primary/20 border bg-gradient-to-br shadow-md"
                  >
                    <div className="card-body">
                      {/* Header del talle */}
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-lg font-semibold">
                          <div className="bg-primary/20 flex h-6 w-6 items-center justify-center rounded-full">
                            <span className="text-primary text-xs font-bold">{talleIndex + 1}</span>
                          </div>
                          Talle {talleIndex + 1}
                        </h3>
                        {talles.length > 1 && (
                          <div className="tooltip" data-tip="Eliminar este talle">
                            <button
                              type="button"
                              className="btn btn-circle btn-sm btn-error btn-outline hover:btn-error"
                              onClick={() => handleDeleteTalle(talleIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
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
                              className="select select-bordered focus:border-primary flex-1"
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
                            <ModalSize />
                          </div>
                        </div>
                      </div>

                      {/* Sección de colores */}
                      <div>
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Colores y cantidades</span>
                            <ModalColor />
                          </div>
                          <button
                            type="button"
                            onClick={() => agregarColor(talleIndex)}
                            className="btn btn-sm btn-outline btn-primary"
                            disabled={!talle.talle}
                          >
                            + Agregar color
                          </button>
                        </div>

                        <div className="space-y-3">
                          {talle.colores.map((color, colorIndex) => (
                            <div
                              key={colorIndex}
                              className="bg-base-100 border-base-300 flex items-center gap-3 rounded-lg border p-3"
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
                                  onChange={(selectedColorName) =>
                                    handleColorSelect(
                                      talleIndex,
                                      colorIndex,
                                      'color',
                                      selectedColorName
                                    )
                                  }
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
                                  type="number"
                                  placeholder="Qty"
                                  min="1"
                                  value={color.cantidad}
                                  onChange={(e) =>
                                    handleColorChange(
                                      talleIndex,
                                      colorIndex,
                                      'cantidad',
                                      parseInt(e.target.value, 10)
                                    )
                                  }
                                  className="input input-bordered input-sm w-full text-center"
                                  required
                                />
                              </div>
                              {talle.colores.length > 1 && (
                                <div className="tooltip" data-tip="Eliminar color">
                                  <button
                                    type="button"
                                    className="btn btn-circle btn-sm btn-error btn-outline"
                                    onClick={() => handleDeleteColor(talleIndex, colorIndex)}
                                  >
                                    <Trash2 className="h-3 w-3" />
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
                  className="btn btn-outline btn-primary gap-2"
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
          <div className="card bg-base-100 border-base-300 border shadow-xl">
            <div className="card-body">
              <h2 className="card-title mb-6 flex items-center gap-3 text-2xl">
                <div className="bg-info/10 flex h-8 w-8 items-center justify-center rounded-lg">
                  <span className="text-info font-bold">5</span>
                </div>
                Observaciones Adicionales
              </h2>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Comentarios o notas</span>
                  <span className="label-text-alt text-base-content/60">Opcional</span>
                </label>
                <textarea
                  name="comments"
                  placeholder="Ingrese observaciones, notas especiales, o cualquier información adicional sobre el producto..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="textarea textarea-bordered focus:border-info h-24 w-full resize-none"
                  rows="3"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Sección: Resumen y Acciones */}
          <div className="card from-primary/5 to-secondary/5 border-primary/20 border bg-gradient-to-r shadow-xl">
            <div className="card-body">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                {/* Resumen */}
                <div className="space-y-4">
                  <h3 className="text-primary text-xl font-bold">Resumen del Producto</h3>
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
