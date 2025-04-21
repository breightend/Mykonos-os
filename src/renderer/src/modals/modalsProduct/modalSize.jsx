import { Ruler } from 'lucide-react'
import { postData } from '../../services/products/sizeService'
import { fetchSize } from '../../services/products/sizeService'
import { useEffect, useState } from 'react'

export default function ModalSize() {
  const [formData, setFormData] = useState({
    size_name: '',
    category: '',
    description: ''
  })
  const [sizes, setSizes] = useState([])

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
        const response = await fetchSize()
        setSizes(response.data)
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
        <div className="modal-box">
          <h3>Talles existentes:</h3>
          <div className="overflow-x-auto">
            <div className="h-96 overflow-x-auto">
              <table className="table-pin-rows bg-base-200 table">
                <thead>
                  <tr>
                    <th>Categorias</th>
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
                    <th>Talles</th>
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
          <h3 className="text-lg font-bold">Agregar nuevo talle</h3>
          <label htmlFor=""></label>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>Cerrar</button>
          <button onClick={handleSubmit}>Aceptar</button>
        </form>
      </dialog>
    </div>
  )
}
