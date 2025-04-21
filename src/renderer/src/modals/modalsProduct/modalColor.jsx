import { Palette } from 'lucide-react'
import { postData } from '../../services/products/colorService'
import { fetchColor } from '../../services/products/colorService'
import { useEffect, useState } from 'react'

export default function ModalColor() {
  const [formData, setFormData] = useState({
    color_name: '',
    hex_code: ''
  })
  const [colors, setColors] = useState([])

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
      console.log(response)
      setFormData({
        color_name: '',
        hex_code: ''
      })
      fetchColor()
    } catch (error) {
      console.error('Error:', error)
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchColor()
        setColors(response.data)
      } catch (error) {
        console.error('Error fetching colors:', error)
      }
    }
    fetchData()
  }, [])
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
          <h3>Colores existentes:</h3>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Vista</th>
                </tr>
              </thead>
              <tbody>
                {colors.map((color) => (
                  <tr key={color.id}>
                    <td>{color.color_name}</td>
                    <td>
                      <div
                        className="h-6 w-6 rounded-full border"
                        style={{ backgroundColor: color.hex_code }}
                      ></div>
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
                name="hex_code"
                value={formData.hex_code}
                onChange={handleChange}
                className="input input-bordered w-full max-w-xs"
              />
            </div>

            <div className="modal-action">
              <button type="submit" className="btn">
                Agregar
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  )
}
