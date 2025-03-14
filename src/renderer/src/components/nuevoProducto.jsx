import { useState } from 'react'
import { useLocation } from 'wouter'
import { ArrowLeft, Trash2 } from 'lucide-react'

export default function NuevoProducto() {
  const [marca, setMarca] = useState('')
  const [cantidad] = useState(0)
  const [talles, setTalles] = useState([{ talle: '', colores: [{ color: '', cantidad: '' }] }])
  const [, setLocation] = useLocation()
  const [cantidadTotal, setCantidadTotal] = useState(0)

  // Opciones predefinidas, esto vuela con la implementacion de la bd.
  const marcas = ['Nike', 'Adidas', 'Puma', "Levi's", 'Zara']
  const tiposPrenda = ['Pantalón', 'Campera', 'Remera', 'Camisa', 'Buzo']
  const coloresPredefinidos = ['Negro', 'Blanco', 'Azul', 'Rojo', 'Verde']
  const tallesPredefinidos = ['S', 'M', 'L', 'XL', 'XXL']

  const handleCantidadTotal = () => {
    let cantidadTotal = 0
    talles.forEach((talle) => {
      talle.colores.forEach((color) => {
        cantidadTotal += color.cantidad
      })
    })
    setCantidadTotal(cantidadTotal)
  }

  const handleDeleteColor = (talleIndex, colorIndex) => {
    const nuevosTalles = [...talles]
    const colorEliminado = nuevosTalles[talleIndex].colores[colorIndex].color
    const talleActual = nuevosTalles[talleIndex].talle

    // Restaurar el color eliminado a la lista de disponibles
    if (colorEliminado) {
      setColoresDisponiblesPorTalle((prev) => ({
        ...prev,
        [talleActual]: [...prev[talleActual], colorEliminado]
      }))
    }

    nuevosTalles[talleIndex].colores.splice(colorIndex, 1)
    setTalles(nuevosTalles)
    handleCantidadTotal()
  }

  const handleDeleteTalle = (talleIndex) => {
    const nuevosTalles = [...talles]
    const talleEliminado = nuevosTalles[talleIndex]

    // Restaurar todos los colores del talle eliminado
    talleEliminado.colores.forEach((color) => {
      if (color.color) {
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

  const [coloresDisponiblesPorTalle, setColoresDisponiblesPorTalle] = useState(
    tallesPredefinidos.reduce((acc, talle) => {
      acc[talle] = [...coloresPredefinidos]
      return acc
    }, {})
  )
  //Crea una lista de colres disponibles que son todos, dependiendo del talle en que esta
  // Función para manejar el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault()
    const nuevaPrenda = {
      marca,
      cantidad,
      talles
    }
    console.log('Prenda agregada:', nuevaPrenda)
    // Aca se pueden enviar los datos a donde se necesite
  }

  // Función para agregar un nuevo talle, la cantidad tengo que modificar
  const agregarTalle = () => {
    setTalles([...talles, { talle: tallesPredefinidos[0], colores: [{ color: '', cantidad: 0 }] }])
  }

  // Función para manejar cambios en los talles
  const handleTalleChange = (talleIndex, value) => {
    const nuevosTalles = [...talles]
    nuevosTalles[talleIndex].talle = value
    setTalles(nuevosTalles)
  }

  // Función para agregar un color a un talle específico
  const agregarColor = (talleIndex) => {
    const nuevosTalles = [...talles]
    nuevosTalles[talleIndex].colores.push({ color: '', cantidad: '' })
    setTalles(nuevosTalles)
  }
  
//Aca no deberia ser on change sino en submit. 
  const handleColorChange = (talleIndex, colorIndex, field, value) => {
    const nuevosTalles = [...talles]
    const talleActual = nuevosTalles[talleIndex].talle
    const colorAnterior = nuevosTalles[talleIndex].colores[colorIndex].color

    // Si el campo modificado es un color
    if (field === 'color') {
      const nuevoColor = value

      // Solo actualizamos los disponibles si el color realmente cambió
      if (nuevoColor !== colorAnterior) {
        setColoresDisponiblesPorTalle((prev) => {
          // Restaurar el color anterior solo si no está siendo usado en otro select
          const coloresUsados = nuevosTalles[talleIndex].colores
            .filter((_, i) => i !== colorIndex) // excluimos el que está cambiando
            .map((c) => c.color)

          const coloresActualesDisponibles = prev[talleActual] ?? []

          // Restaurar color anterior solo si no está repetido
          const debeRestaurar = colorAnterior && !coloresUsados.includes(colorAnterior)

          const nuevosDisponibles = [
            ...(debeRestaurar
              ? [...coloresActualesDisponibles, colorAnterior]
              : coloresActualesDisponibles)
          ].filter((c) => c !== nuevoColor) // remover nuevo color

          return {
            ...prev,
            [talleActual]: nuevosDisponibles
          }
        })
      }
    }

    // Actualizar el valor en el array de talles
    nuevosTalles[talleIndex].colores[colorIndex][field] =
      field === 'cantidad' ? parseInt(value, 10) || 0 : value

    setTalles(nuevosTalles)
    handleCantidadTotal()
  }

  return (
    <div className="p-6 bg-base-100 min-h-screen">
      <div className="flex items-center space-x-4 p-4">
        <div className="tooltip " data-tip="Volver">
          <button className="btn btn-circle" onClick={() => setLocation('/inventario')}>
            <ArrowLeft />
          </button>
        </div>
        <h1 className="text-4xl font-bold">Agregar artículo al Inventario</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Descripción</label>
          <input
            type="text"
            placeholder="Remera..."
            className="input input-bordered w-full"
            required
          />
        </div>
        {/* Campo para el tipo de prenda */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Prenda</label>
            <select className="select select-bordered " required>
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

          {/* Campo para la marca */}
          <div>
            <label className="block text-sm font-medium mb-1">Marca</label>
            <select
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              className="select select-bordered "
              required
            >
              <option value="" disabled>
                Seleccione una marca
              </option>
              {marcas.map((marca, index) => (
                <option key={index} value={marca}>
                  {marca}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Precio */}
        <div>
          <label className="block text-sm  font-medium mb-1">Precio</label>
          <span className="flex gap-2 items-center">
            $
            <input type="number" name="" placeholder="####" id="" className="input w-1/5" />
          </span>
        </div>

        {/* Sección para talles, colores y cantidades */}
        <h2 className="text-xl font-semibold mb-2">Talles, Colores y Cantidades</h2>
        {talles.map((talle, talleIndex) => (
          <div key={talleIndex} className="mb-4 p-4 bg-primary/20 rounded-lg">
            {/* Campo para el talle */}
            <div className="mb-2">
              <span className=" text-md flex justify-between font-medium text-2xl mb-2">
                Talle
                <div className="tooltip" data-tip="Eliminar Talle">
                  <button
                    className="btn btn-neutral p-4 "
                    onClick={() => handleDeleteTalle(talleIndex)}
                  >
                    <Trash2 />
                  </button>
                </div>
              </span>
              <select
                value={talle.talle}
                onChange={(e) => handleTalleChange(talleIndex, e.target.value)}
                className="select select-bordered "
                required
              >
                <option value="" disabled>
                  Seleccione un talle
                </option>
                {tallesPredefinidos.map((talle, index) => (
                  <option key={index} value={talle}>
                    {talle}
                  </option>
                ))}
              </select>
            </div>

            {/* Sección para colores */}
            <div>
              <h2 className="text-md font-medium mb-2">Colores</h2>
              {talle.colores.map((color, colorIndex) => (
                <div key={colorIndex} className="space-x-4 flex items-center mb-2">
                  <select
                    value={color.color} // Asegúrate de que esto esté correctamente vinculado
                    onChange={(e) =>
                      handleColorChange(talleIndex, colorIndex, 'color', e.target.value)
                    }
                    className="select select-bordered flex-1"
                    required
                  >
                    <option disabled={true}>Seleccione un color</option>
                    {coloresDisponiblesPorTalle[talle.talle]?.map((colorDisponible, index) => (
                      <option key={index} value={colorDisponible}>
                        {colorDisponible}
                      </option>
                    ))}
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
                    className="input input-bordered w-1/5 "
                    required
                  />
                  <div className="tooltip" data-tip="Eliminar Color">
                    <button
                      className="btn btn-error"
                      onClick={() => handleDeleteColor(talleIndex, colorIndex)}
                    >
                      <Trash2 />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => agregarColor(talleIndex)}
                className="btn btn-sm btn-outline mt-2"
              >
                + Agregar color
              </button>
            </div>
          </div>
        ))}

        <div className=" flex justify-end">
          <p className="bg-blue-200 rounded-2xl p-2 px-2 dark:text-black dark:bg-blue-300">
            Cantidad de prendas agregadas: <span className="font-semibold">{cantidadTotal}</span>
          </p>
        </div>
        {/* Botón para agregar un nuevo talle */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={agregarTalle}
            className="btn btn-outline badge badge-secondary badge-outline"
          >
            + Agregar Talle
          </button>

          {/* Botón para enviar el formulario */}
          <button type="submit" className="btn btn-success mt-10 justify-end">
            Agregar Prenda
          </button>
        </div>
      </form>
    </div>
  )
}
