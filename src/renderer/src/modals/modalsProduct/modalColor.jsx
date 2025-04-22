import { Palette } from 'lucide-react'
import { fetchColor, postData } from '../../services/products/colorService'
import { useEffect, useState } from 'react'
//TODO: arreglar funcion del backend GET
//TODO: Ver el tema del post
export default function ModalColor() {
  const [formData, setFormData] = useState({
    color_name: '',
    color_hex: ''
  })
  const [colors, setColors] = useState([])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    console.log(formData)
  }

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
      console.log('VALORES:')
      console.log(formData)
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

  console.log({colors})

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
                onChange={onChange}
                className="input input-bordered w-full max-w-xs"
              />
            </div>

            <div className="modal-action">
              <button type="submit" className="btn" onClick={handleSubmit}>
                Agregar
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  )
}
