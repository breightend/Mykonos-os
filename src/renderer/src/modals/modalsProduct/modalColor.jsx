import { Palette, Trash2 } from 'lucide-react'
import { fetchColor, postData, deleteColor } from '../../services/products/colorService'
import { useEffect, useState } from 'react'

//TODO: arreglar funcion del backend GET
//TODO: Ver el tema del post
//TODO: poder eliminar colores

export default function ModalColor() {
  const [formData, setFormData] = useState({
    color_name: '',
    color_hex: '#000000'
  })
  const [colors, setColors] = useState([])

  const onChange = (e) => {
    const { name, value } = e.target
    setFormData((prevState) => ({
      ...prevState,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await postData(formData)
      console.log(response)
      setFormData({
        color_name: '',
        color_hex: ''
      })
      fetchColor()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleDeleteColor = async (colorId) => {
    try {
      await deleteColor(colorId)
      fetchColor()
    } catch (error) {
      console.error('Error deleting color:', error)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchColor()
        setColors(response)
      } catch (error) {
        console.error('Error fetching colors:', error)
      }
    }
    fetchData()
  }, [])

  console.log({ colors })

  return (
    <div>
      <button
        className="btn btn-ghost btn-sm rounded-btn tooltip tooltip-bottom"
        data-tip="Agregar nuevo color"
        onClick={() => document.getElementById('colorModal').showModal()}
      >
        <Palette />
      </button>
      <dialog id="colorModal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="text-bold text-2xl text-gray-800">Colores del sistema:</h3>
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
                          className="btn btn-sm btn-warning"
                          onClick={() => handleDeleteColor(color.id)}
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
                onChange={onChange}
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
                onChange={onChange}
                className="input input-bordered w-full max-w-xs"
              />
            </div>

            <div className="modal-action">
              <button
                type="submit"
                className="btn btn-neutral"
                onClick={() => document.getElementById('colorModal').close()}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-success" onClick={handleSubmit}>
                Agregar
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  )
}
