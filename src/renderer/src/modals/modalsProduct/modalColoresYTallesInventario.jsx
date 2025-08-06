import { Trash2 } from 'lucide-react'
import { use, useEffect, useState } from 'react'
import {
  fetchColor,
  postData,
  deleteColor,
  checkColorInUse
} from '../../services/products/colorService'

export default function ModalColoresYTalles() {

  const [colors, setColors] = useState([])

  const [formData, setFormData] = useState({
    color_name: '',
    color_hex: '#000000'
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await postData(formData)
      console.log('Color agregado:', response)
      setColors([...colors, response])
      setFormData({
        color_name: '',
        color_hex: '#000000'
      })
    } catch (error) {
      console.error('Error al agregar color:', error)
    }
  }
  const handleDeleteColor = (colorId) => async () => {
    try {
      await deleteColor(colorId)
      setColors(colors.filter(color => color.id !== colorId))
      console.log('Color eliminado:', colorId)
    } catch (error) {
      console.error('Error al eliminar color:', error)
    }
  }
  useEffect(() => {
    const fetchColors = async () => {
      try {
        const response = await fetchColor()
        setColors(response)
      } catch (error) {
        console.error('Error al obtener colores:', error)
      }
    }
    fetchColors()
  }, [])

  return (
    <>
      <dialog id="sizeColorModal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h2 className="text-lg font-bold">Colores y Talles</h2>
          <h3 className="text-md font-semibold">Colores Disponibles</h3>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Vista</th>
                  <th>Eliminar</th>
                </tr>
              </thead>
              <tbody>
                {colors &&
                  colors.map((color) => (
                    <tr key={color.id}>
                      <td>{color.color_name}</td>
                      <td>
                        <div
                          className="h-6 w-6 rounded-full border"
                          style={{ backgroundColor: color.color_hex }}
                        ></div>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-error text-white"
                          onClick={handleDeleteColor(color.id, color.color_name)}
                        >
                          <Trash2 className="" size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
            <form onSubmit={handleSubmit}>
            <h3 className="text-lg font-bold">Agregar nuevo color</h3>
            <div className="form-control w-full max-w-xs">
              <label className="label">
                <span className="label-text">Nombre del color</span>
              </label>
              <input
                type="text"
                name="color_name"
                value={formData.color_name}
                onChange={handleChange}
                placeholder="Nombre del color"
                className="input input-bordered w-full max-w-xs"
              />
            </div>
            <div className="form-control w-full max-w-xs">
              <label className="label">
                <span className="label-text">Espectro</span>
              </label>
              <input
                type="color"
                name="color_hex"
                value={formData.color_hex}
                defaultValue={'#000000'}
                onChange={handleChange}
                className="input input-bordered w-full max-w-xs"
              />
            </div>

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-neutral"
                onClick={() => document.getElementById('colorModal').close()}
              >
                Cancelar
              </button>
              <button type="button" className="btn btn-success" onClick={handleSubmit}>
                Agregar
              </button>
            </div>
          </form>
          <div className="modal-action">
            <button
              className="btn"
              onClick={() => document.getElementById('sizeColorModal').close()}
            >
              Cerrar
            </button>
          </div>
        </div>
      </dialog>
    </>
  )
}
