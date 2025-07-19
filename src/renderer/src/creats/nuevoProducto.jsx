import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { ArrowLeft, LoaderCircle, Save, Trash2, PackagePlus } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import ModalSize from '../modals/modalsProduct/modalSize'
import ModalColor from '../modals/modalsProduct/modalColor'
import BarcodeGenerator from '../componentes especificos/Barcode'
import { fetchSize } from '../services/products/sizeService'
import { fetchColor } from '../services/products/colorService'
import { fetchProvider } from '../services/proveedores/proveedorService'
import { fetchBrandByProviders } from '../services/proveedores/brandService'
import postData from '../services/products/productService'

//TODO: Poder eliminar colores y talles.
//TODO: que no se puedan seleccionar dos talles iguales

export default function NuevoProducto() {
  // Estados para el formulario
  const [description, setDescription] = useState('')
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

  // Estados de control
  const [loadingData, setLoadingData] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [coloresDisponiblesPorTalle, setColoresDisponiblesPorTalle] = useState({})
  const [productImage, setProductImage] = useState('')
  const [errors, setErrors] = useState({})

  const tiposPrenda = ['Pantalón', 'Campera', 'Remera', 'Camisa', 'Buzo']

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sizesResponse = await fetchSize()
        setTallesBD(sizesResponse)

        // const categorySizeResponse = await fetchCategorySize()
        // setCategoria(categorySizeResponse)

        const colorsResponse = await fetchColor()
        setColors(colorsResponse)

        const providerResponse = await fetchProvider()
        setProvider(providerResponse)

        // Configurar colores disponibles por talle una vez que tenemos los datos
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

  // UseEffect para cargar marcas cuando se selecciona un proveedor
  useEffect(() => {
    const fetchBrandsForProvider = async () => {
      if (selectedProvider) {
        try {
          const brandsByProviderResponse = await fetchBrandByProviders(selectedProvider)
          setBrandByProvider(brandsByProviderResponse)

          // Si solo hay una marca, seleccionarla automáticamente
          if (brandsByProviderResponse.length === 1) {
            setMarca(brandsByProviderResponse[0].brand_name)
          } else {
            // Resetear la marca seleccionada cuando cambia el proveedor y hay múltiples marcas
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

  // Manejar cambio de proveedor
  const handleProviderChange = (e) => {
    setSelectedProvider(e.target.value)
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

    // Si hay un color eliminado, devolverlo a la lista de disponibles
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

    // Restaurar colores a la lista de disponibles del talle eliminado
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

  const handleSubmit = (e) => {
    e.preventDefault()
    const nuevaPrenda = {
      proveedor: selectedProvider,
      marca,
      cantidad,
      talles,
      cantidadT: cantidadTotal
    }
    console.log('Prenda agregada:', nuevaPrenda)
    // Aquí iría tu lógica para enviar los datos a la BD
  }

  const agregarTalle = () => {
    // Verificar que hay talles disponibles
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

    // Actualizar el talle
    nuevosTalles[talleIndex].talle = value
    setTalles(nuevosTalles)

    // Actualizar colores disponibles para el nuevo talle
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
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0]
      const base64 = await convertToBase64(file)
      setProductImage(base64)

      // Limpiar error de imagen si existe
      if (errors.productImage) {
        setErrors((prev) => ({ ...prev, productImage: '' }))
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

    // Preparar datos del producto para el backend
    return {
      description,
      product_type: tipo,
      brand: marca,
      provider_id: parseInt(selectedProvider),
      cost: parseFloat(cost) || 0,
      sale_price: parseFloat(salePrice) || 0,
      image: productImage || null,
      comments: comments || null,
      total_quantity: cantidadTotal,
      size_ids: sizeIds,
      color_ids: colorIds
    }
  }

  // Función para validar el formulario
  const validateForm = () => {
    const newErrors = {}

    if (!description.trim()) newErrors.description = 'La descripción es requerida'
    if (!tipo) newErrors.tipo = 'El tipo de prenda es requerido'
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

  // Función para limpiar el formulario (excepto proveedor y marca)
  const clearForm = () => {
    setDescription('')
    setTipo('')
    setCost('')
    setSalePrice('')
    setComments('')
    setProductImage('')
    setTalles([{ talle: '', colores: [{ color: '', cantidad: '' }] }])
    setCantidadTotal(0)
    setErrors({})

    // Restaurar colores disponibles
    if (colors.length > 0 && tallesBD.length > 0) {
      const coloresDisponibles = {}
      tallesBD.forEach((talle) => {
        coloresDisponibles[talle.size_name] = colors.map((color) => color.color_name)
      })
      setColoresDisponiblesPorTalle(coloresDisponibles)
    }
  }

  // Función para manejar el submit "Guardar"
  const handleSubmitGuardar = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const productData = prepareProductData()
      const response = await postData(productData)

      console.log('Producto guardado exitosamente:', response)

      // Redirigir al inventario
      setLocation('/inventario')
    } catch (error) {
      console.error('Error al guardar el producto:', error)
      setErrors({ submit: 'Error al guardar el producto. Intente nuevamente.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para manejar el submit "Agregar Prenda"
  const handleSubmitAgregarPrenda = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const productData = prepareProductData()
      const response = await postData(productData)

      console.log('Producto agregado exitosamente:', response)

      // Limpiar formulario pero mantener proveedor y marca
      clearForm()

      // Mostrar mensaje de éxito temporal
      setErrors({ success: 'Producto agregado exitosamente. Puede agregar otro.' })
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
    <div className="bg-base-100 min-h-screen p-6">
      <div className="flex items-center space-x-4 p-4">
        <div className="tooltip" data-tip="Volver">
          <button className="btn btn-circle" onClick={() => setLocation('/inventario')}>
            <ArrowLeft />
          </button>
        </div>
        <h1 className="text-4xl font-bold">Agregar artículo al Inventario</h1>
      </div>
      <BarcodeGenerator />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Descripción</label>
          <input
            type="text"
            placeholder="Remera..."
            className={`input input-bordered w-full ${errors.description ? 'input-error' : ''}`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
        </div>

        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Imagen del producto</span>
          </label>

          {productImage && (
            <div className="mt-2 flex flex-col items-center justify-center">
              <div className="avatar justify-center">
                <div className="ring-primary ring-offset-base-100 w-44 rounded-lg ring ring-offset-2">
                  <img src={base64ToObjectUrl(productImage)} alt="Preview del producto" />
                </div>
              </div>
            </div>
          )}

          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors duration-200 ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : errors.productImage
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300'
            }`}
          >
            <input {...getInputProps()} />
            <p>
              {isDragActive
                ? '¡Soltá la imagen aquí!'
                : 'Arrastrá la imagen del producto o hacé clic para seleccionar'}
            </p>
          </div>
          {errors.productImage && (
            <p className="mt-1 text-xs text-red-500">{errors.productImage}</p>
          )}
        </div>
        {/* Campo para el tipo de prenda */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Tipo de Prenda</label>
            <select
              className={`select select-bordered ${errors.tipo ? 'select-error' : ''}`}
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              required
            >
              <option value="" disabled>
                Seleccione un tipo de prenda
              </option>
              {tiposPrenda.map((tipoPrenda, index) => (
                <option key={index} value={tipoPrenda}>
                  {tipoPrenda}
                </option>
              ))}
            </select>
            {errors.tipo && <p className="mt-1 text-xs text-red-500">{errors.tipo}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Proveedor</label>
            <select
              value={selectedProvider}
              onChange={handleProviderChange}
              className={`select select-bordered ${errors.provider ? 'select-error' : ''}`}
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
            {errors.provider && <p className="mt-1 text-xs text-red-500">{errors.provider}</p>}
          </div>

          {/* Marca */}
          <div>
            <label className="mb-1 block text-sm font-medium">Marca</label>
            <select
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              className={`select select-bordered ${errors.marca ? 'select-error' : ''}`}
              required
              disabled={!selectedProvider}
            >
              <option value="" disabled>
                {!selectedProvider ? 'Seleccione un proveedor primero' : 'Seleccione una marca'}
              </option>
              {brandByProvider.map((marcaItem) => (
                <option key={marcaItem.id} value={marcaItem.brand_name}>
                  {marcaItem.brand_name}
                </option>
              ))}
            </select>
            {errors.marca && <p className="mt-1 text-xs text-red-500">{errors.marca}</p>}
          </div>
        </div>

        {/* Costo */}
        <div>
          <label className="mb-1 block text-sm font-medium">Costo</label>
          <span className="flex items-center gap-2">
            $
            <input
              type="number"
              name="cost"
              placeholder="####"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className={`input w-1/5 ${errors.cost ? 'input-error' : ''} [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
              required
            />
          </span>
          {errors.cost && <p className="mt-1 text-xs text-red-500">{errors.cost}</p>}
        </div>

        <div>
          <p>
            Impuestos: <span className="font-medium">$0.00</span>
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Precio</label>
          <span className="flex items-center gap-2">
            $
            <input
              type="number"
              name="sale_price"
              placeholder="####"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              className={`input w-1/5 ${errors.salePrice ? 'input-error' : ''} [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
              required
            />
          </span>
          {errors.salePrice && <p className="mt-1 text-xs text-red-500">{errors.salePrice}</p>}
        </div>

        {/* Sección para talles, colores y cantidades */}
        <h2 className="mb-2 text-xl font-semibold">Talles, Colores y Cantidades</h2>
        {errors.talles && <p className="mb-2 text-sm text-red-500">{errors.talles}</p>}
        {errors.cantidad && <p className="mb-2 text-sm text-red-500">{errors.cantidad}</p>}
        {talles.map((talle, talleIndex) => (
          <div key={talleIndex} className="bg-primary/20 mb-4 rounded-lg p-4">
            {/* Campo para el talle */}
            <div className="mb-2">
              <span className="text-md mb-2 flex justify-between text-2xl font-medium">
                Talle
                <div className="tooltip" data-tip="Eliminar talle">
                  <button
                    className="btn btn-ghost p-4"
                    onClick={() => handleDeleteTalle(talleIndex)}
                  >
                    <Trash2 />
                  </button>
                </div>
              </span>
              <div className="flex items-center space-x-4">
                <select
                  value={talle.talle}
                  onChange={(e) => handleTalleChange(talleIndex, e.target.value)}
                  className="select select-bordered"
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

            {/* Sección para colores */}
            <div>
              <div className="mb-2 flex items-center space-x-4">
                <h2 className="text-md mb-2 font-medium">Colores</h2>
                <ModalColor />
              </div>
              {talle &&
                talle.colores.map((color, colorIndex) => (
                  <div key={colorIndex} className="mb-2 flex items-center space-x-4">
                    <select
                      value={color.color || ''}
                      onChange={(e) =>
                        handleColorSelect(talleIndex, colorIndex, 'color', e.target.value)
                      }
                      className="select select-bordered flex-1"
                      required
                    >
                      <option value="" disabled>
                        Seleccione un color
                      </option>
                      {coloresDisponiblesPorTalle[talle.talle] !== undefined ? (
                        colors.map((colorItem) => {
                          const isColorAvailable = coloresDisponiblesPorTalle[
                            talle.talle
                          ]?.includes(colorItem.color_name)

                          return (
                            <option
                              key={colorItem.id}
                              value={colorItem.color_name}
                              disabled={!isColorAvailable}
                            >
                              {colorItem.color_name}
                            </option>
                          )
                        })
                      ) : (
                        <option value="No hay colores disponibles">
                          Seleccione un talle primero
                        </option>
                      )}
                    </select>
                    <input
                      type="number"
                      placeholder="Cantidad"
                      value={color.cantidad}
                      onChange={(e) =>
                        handleColorChange(
                          talleIndex,
                          colorIndex,
                          'cantidad',
                          parseInt(e.target.value, 10)
                        )
                      }
                      className="input input-bordered w-1/5 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      required
                    />
                    {colorIndex === talle.colores.length - 1 && (
                      <div className="tooltip" data-tip="Eliminar Color">
                        <button
                          type="button"
                          className="btn btn-error"
                          onClick={() => handleDeleteColor(talleIndex, colorIndex)}
                        >
                          <Trash2 />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              <div>
                <button type="button" onClick={() => agregarColor(talleIndex)}>
                  + Agregar color
                </button>
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={agregarTalle}
            className="btn btn-outline badge badge-secondary badge-outline transform p-6 hover:scale-105"
            disabled={loadingData || tallesBD.length === 0}
          >
            + Agregar Talle
          </button>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Observaciones</label>
          <textarea
            name="comments"
            id="comments"
            placeholder="Ingrese observaciones (opcional)"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="textarea textarea-bordered w-full"
          ></textarea>
        </div>
        <div className="mt-8 flex justify-between">
          <p className="bg-secondary/20 rounded-2xl p-2 px-2 dark:bg-blue-300 dark:text-black">
            Cantidad de unidades agregadas: <span className="font-semibold">{cantidadTotal}</span>
          </p>
          <div className="flex gap-2">
            {/* Mostrar errores de envío */}
            {errors.submit && (
              <div className="alert alert-error">
                <span>{errors.submit}</span>
              </div>
            )}
            {errors.success && (
              <div className="alert alert-success">
                <span>{errors.success}</span>
              </div>
            )}
            <button
              type="button"
              onClick={handleSubmitGuardar}
              className="btn btn-success transform justify-end hover:scale-105"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <LoaderCircle className="mr-2 animate-spin" />
              ) : (
                <Save className="mr-2" />
              )}
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={handleSubmitAgregarPrenda}
              className="btn btn-success transform justify-end hover:scale-105"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <LoaderCircle className="mr-2 animate-spin" />
              ) : (
                <PackagePlus className="mr-2" />
              )}
              {isSubmitting ? 'Agregando...' : 'Agregar Prenda'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
