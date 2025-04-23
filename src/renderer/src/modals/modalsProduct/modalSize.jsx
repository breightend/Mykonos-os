import { Ruler } from 'lucide-react'
import {
  fetchCategorySize,
  postDataSize,
  getCategoryXsize
} from '../../services/products/sizeService'
import { fetchSize } from '../../services/products/sizeService'
import { useEffect, useState } from 'react'

export default function ModalSize() {
  const [formData, setFormData] = useState({
    size_name: '',
    category_id: '',
    description: ''
  })
  const [category, setCategory] = useState([])
  const [sizes, setSizes] = useState([])
  const [sizeXcategory, setSizeXcategory] = useState([])

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
      const response = await postDataSize(formData)
      console.log(response)
      setFormData({
        size_name: '',
        category: '',
        description: ''
      })
      fetchSize()
    } catch (error) {
      console.error('Error:', error)
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      try {
        fetchSize().then((response) => {
          console.log(response)
          setSizes(response)
        })
        fetchCategorySize().then((response) => {
          console.log(response)
          setCategory(response)
        })
        getCategoryXsize().then((response) => {
          console.log(response)
          setSizeXcategory(response)
        })
      } catch (error) {
        console.error('Error fetching sizes:', error)
      }
    }
    fetchData()
  }, [])

  return (
    <div>
      <button
        className="btn btn-ghost btn-sm rounded-btn tooltip tooltip-bottom"
        data-tip="Agregar nuevo talle"
        onClick={() => document.getElementById('sizeModal').showModal()}
      >
        <Ruler />
      </button>
      <dialog id="sizeModal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box w-11/12 max-w-5xl">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            <button className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">✕</button>
          </form>
          <h3>Talles existentes:</h3>
          <div className="overflow-x-auto">
            <div className="h-96 overflow-x-auto">
              <table className="table-pin-rows bg-base-200 table">
                <thead>
                  <tr>
                    <th>Argentina</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>40</td>
                  </tr>
                  <tr>
                    <td>42</td>
                  </tr>
                  <tr>
                    <td>44</td>
                  </tr>
                </tbody>
                <thead>
                  <tr>
                    <th>US</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>S</td>
                  </tr>
                  <tr>
                    <td>M</td>
                  </tr>
                  <tr>
                    <td>L</td>
                  </tr>
                  <tr>
                    <td>Black Canary</td>
                  </tr>
                  <tr>
                    <td>Black Panther</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Agregar nuevo talle</h3>
            <label htmlFor=""></label>
            <input
              type="text"
              name="size_name"
              placeholder="Nombre del talle"
              className="input input-bordered w-full max-w-xs"
              value={formData.size_name}
              onChange={handleChange}
            />
            <label htmlFor=""></label>
            <select
              name="category_id"
              className="select select-bordered w-full max-w-xs"
              value={formData.category_id}
              onChange={handleChange}
            >
              <option disabled selected>
                Seleccionar categoria
              </option>
              {category.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.category_name}
                </option>
              ))}
            </select>
          </div>
          
          <div className='flex flex-col gap-2 mt-2 w-1/2 justify-end'>

          <button type="submit" onClick={handleSubmit}
          className='btn  btn-success'>
            Agregar talle
          </button>
            </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>Cerrar</button>
          <button onClick={handleSubmit}>Aceptar</button>
        </form>
      </dialog>
    </div>
  )
}
