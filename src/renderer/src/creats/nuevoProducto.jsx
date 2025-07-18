import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { ArrowLeft, LoaderCircle, Trash2 } from 'lucide-react'
import ModalSize from '../modals/modalsProduct/modalSize'
import ModalColor from '../modals/modalsProduct/modalColor'
import BarcodeGenerator from '../componentes especificos/Barcode'
import { fetchSize } from '../services/products/sizeService'
import { fetchColor } from '../services/products/colorService' // Importa el servicio de colores
import { fetchProvider } from '../services/proveedores/proveedorService'
import { fetchBrandByProviders } from '../services/proveedores/brandService'

//TODO: Poder eliminar colores y talles.
//TODO: que no se puedan seleccionar dos talles iguales

export default function NuevoProducto() {
  const [marca, setMarca] = useState('')
  const [selectedProvider, setSelectedProvider] = useState('') // Estado para el proveedor seleccionado
  const [cantidad] = useState(0)
  const [talles, setTalles] = useState([{ talle: '', colores: [{ color: '', cantidad: '' }] }])
  const [, setLocation] = useLocation()
  const [cantidadTotal, setCantidadTotal] = useState(0)
  const [colors, setColors] = useState([]) // Estado para los colores
  // const [categoria, setCategoria] = useState([]) // Estado para las categorias - comentado temporalmente
  const [provider, setProvider] = useState([]) // Estado para los proveedores
  const [brandByProvider, setBrandByProvider] = useState([]) // Estado para las marcas por proveedor
  const [tallesBD, setTallesBD] = useState([]) // Estado para los talles de la BD
  const [loadingData, setLoadingData] = useState(true)
  // const [errorData, setErrorData] = useState(null) // Comentado temporalmente
  const [coloresDisponiblesPorTalle, setColoresDisponiblesPorTalle] = useState({}) // Inicializar como objeto vacío

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
          // Resetear la marca seleccionada cuando cambia el proveedor
          setMarca('')
        } catch (error) {
          console.error('Error fetching brands for provider: ', error)
          setBrandByProvider([])
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

    if (colorEliminado) {
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

    talleEliminado.colores.forEach((color) => {
      if (color.color && coloresDisponiblesPorTalle[talleEliminado.talle]) {
        setColoresDisponiblesPorTalle((prev) => ({
          ...prev,
          [talleEliminado.talle]: [...prev[talleEliminado.talle], color.color]
        }))
      }
    })

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
    setTalles([
      ...talles,
      { talle: tallesBD[0]?.size_name || '', colores: [{ color: '', cantidad: 0 }] }
    ])
  }

  const handleTalleChange = (talleIndex, value) => {
    const nuevosTalles = [...talles]
    nuevosTalles[talleIndex].talle = value
    setTalles(nuevosTalles)
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
        nuevosTalles[talleIndex].colores[colorIndex].color = nuevoColor
        setTalles(nuevosTalles)

        setColoresDisponiblesPorTalle((prev) => {
          const coloresUsados = nuevosTalles[talleIndex].colores.map((c) => c.color)
          const disponiblesActuales = prev[talleActual] ?? []

          const debeRestaurar = colorAnterior && !coloresUsados.includes(colorAnterior)
          let nuevosDisponibles = debeRestaurar
            ? [...disponiblesActuales, colorAnterior]
            : [...disponiblesActuales]

          nuevosDisponibles = nuevosDisponibles.filter((c) => c !== nuevoColor)

          return {
            ...prev,
            [talleActual]: nuevosDisponibles
          }
        })

        removeColorFromTalle(talleActual, nuevoColor)
      }
    }

    nuevosTalles[talleIndex].colores[colorIndex][field] =
      field === 'cantidad' ? parseInt(value, 10) || 0 : value

    setTalles(nuevosTalles)
    handleCantidadTotal()
  }

  const removeColorFromTalle = (talle, color) => {
    setColoresDisponiblesPorTalle((prev) => ({
      ...prev,
      [talle]: (prev[talle] || []).filter((c) => c !== color)
    }))
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
            className="input input-bordered w-full"
            required
          />
        </div>
        {/* Campo para el tipo de prenda */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Tipo de Prenda</label>
            <select className="select select-bordered" required>
              <option value="" disabled>
                Seleccione un tipo de prenda
              </option>
              {tiposPrenda.map((tipo, index) => (
                <option key={index} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          {/* Campo para el proveedor */}
          <div>
            <label className="mb-1 block text-sm font-medium">Proveedor</label>
            <select
              value={selectedProvider}
              onChange={handleProviderChange}
              className="select select-bordered"
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
          </div>

          {/* Campo para la marca */}
          <div>
            <label className="mb-1 block text-sm font-medium">Marca</label>
            <select
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              className="select select-bordered"
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
          </div>
        </div>

        {/* Precio */}
        <div>
          <label className="mb-1 block text-sm font-medium">Precio</label>
          <span className="flex items-center gap-2">
            $
            <input
              type="number"
              name=""
              placeholder="####"
              id=""
              className="input w-1/5 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </span>
        </div>

        {/* Sección para talles, colores y cantidades */}
        <h2 className="mb-2 text-xl font-semibold">Talles, Colores y Cantidades</h2>
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
                  {tallesBD.map((talleBDItem) => (
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
                      onChange={(e) =>
                        handleColorSelect(talleIndex, colorIndex, 'color', e.target.value)
                      }
                      className="select select-bordered flex-1"
                      required
                      defaultValue="Seleccione un color"
                    >
                      <option disabled>Seleccione un color</option>
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
        <div className="mt-8 flex justify-between">
          <p className="bg-secondary/20 rounded-2xl p-2 px-2 dark:bg-blue-300 dark:text-black">
            Cantidad de unidades agregadas: <span className="font-semibold">{cantidadTotal}</span>
          </p>
          <div className="flex">
            <button type="submit" className="btn btn-success transform justify-end hover:scale-105">
              Agregar Prenda
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
