import { useState } from 'react'
import { useLocation } from 'wouter'
import { ArrowLeft, Trash2 } from 'lucide-react'

export default function NuevoProducto() {
  // Estados para manejar los datos del formulario
  const [marca, setMarca] = useState('')
  const [cantidad] = useState(0)
  const [talles, setTalles] = useState([{ talle: '', colores: [{ color: '', cantidad: 0 }] }])
  const [, setLocation] = useLocation()
  const [cantidadTotal, setCantidadTotal] = useState(0)

  // Opciones predefinidas
  const marcas = ['Nike', 'Adidas', 'Puma', "Levi's", 'Zara']
  const tiposPrenda = ['Pantalón', 'Campera', 'Remera', 'Camisa', 'Buzo']
  const coloresPredefinidos = ['Negro', 'Blanco', 'Azul', 'Rojo', 'Verde']
  const tallesPredefinidos = ['S', 'M', 'L', 'XL', 'XXL']

  // Función para manejar el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault()
    const nuevaPrenda = {
      marca,
      cantidad,
      talles
    }
    console.log('Prenda agregada:', nuevaPrenda)
    // Aquí podrías enviar los datos a una API o manejarlos como necesites
  }

  // Función para agregar un nuevo talle
  const agregarTalle = () => {
    setTalles([...talles, { talle: '', colores: [{ color: '', cantidad: 0 }] }])
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
    nuevosTalles[talleIndex].colores.push({ color: '', cantidad: 0 })
    setTalles(nuevosTalles)
  }

  // Función para manejar cambios en los colores
  const handleColorChange = (talleIndex, colorIndex, field, value) => {
    const nuevosTalles = [...talles]
    nuevosTalles[talleIndex].colores[colorIndex][field] = value
    setTalles(nuevosTalles)
    handleCantidadTotal()
  }

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
    nuevosTalles[talleIndex].colores.splice(colorIndex, 1)
    setTalles(nuevosTalles)
    handleCantidadTotal()
  }

  return (
    <div className="p-6 bg-base-100 min-h-screen">
      <button className="btn btn-circle" onClick={() => setLocation('/inventario')}>
        <ArrowLeft />
      </button>
      <h1 className="text-2xl font-bold mb-6">Agregar Prenda al Inventario</h1>
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
        <h2 className="text-lg font-semibold mb-2">Talles, Colores y Cantidades</h2>
        {talles.map((talle, talleIndex) => (
          <div key={talleIndex} className="mb-4 p-4 bg-primary/20 rounded-lg">
            {/* Campo para el talle */}
            <div className="mb-2">
              <label className="block text-md font-medium mb-2">Talle</label>
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
                    value={color.color}
                    onChange={(e) =>
                      handleColorChange(talleIndex, colorIndex, 'color', e.target.value)
                    }
                    className="select select-bordered flex-1"
                    required
                  >
                    <option value="" disabled>
                      Seleccione un color
                    </option>
                    {coloresPredefinidos.map((color, index) => (
                      <option key={index} value={color}>
                        {color}
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
                  <button className='btn btn-error'>
                  <Trash2  />
                  </button>
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
