import { Ruler } from 'lucide-react'
import {
  fetchCategorySize,
  postDataSize,
  getCategoryXsize,
  postDataCategory
} from '../../services/products/sizeService'
import { fetchSize } from '../../services/products/sizeService'
import { useEffect, useState } from 'react'

export default function ModalSize() {
  const [formData, setFormData] = useState({
    size_name: '',
    category_id: '',
    description: '',
    category_name: '',
    permanent: ''
  })
  const [category, setCategory] = useState([])
  const [sizes, setSizes] = useState([])
  const [sizeXcategory, setSizeXcategory] = useState([])
  const [loading, setLoading] = useState(false)
  const [mostrarAgregarCategoria, setMostrarAgregarCategoria] = useState(false)

  const handleMostrarAgregarCategoria = () => {
    setMostrarAgregarCategoria(!mostrarAgregarCategoria)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }
  const handleSubmitSize = async (e) => {
    e.preventDefault()
    try {
      const response = await postDataSize(formData)
      console.log(response)
      setFormData({
        size_name: '',
        category_id: '',
        description: ''
      })
      fetchSize()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleSubmitCategorySize = async (e) => {
    e.preventDefault()
    try {
      const response = await postDataCategory(formData)
      console.log(response)
      setFormData({
        category_name: '',
        permanent: 1
      })
      fetchCategorySize()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  useEffect(() => {
    setLoading(true)
    const fetchData = async () => {
      try {
        fetchSize().then((response) => {
          console.log('Talles', response)
          setSizes(response)
        })
        fetchCategorySize().then((response) => {
          console.log('Categoria', response)
          setCategory(response)
        })
        getCategoryXsize().then((response) => {
          console.log('Categoria por talles', response)
          setSizeXcategory(response)
        })
      } catch (error) {
        console.error('Error fetching sizes:', error)
      }
      setLoading(false)
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
        <Ruler className="h-6 w-6" />
      </button>
      <dialog id="sizeModal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">✕</button>
          </form>
          <h3 className="mb-4 text-lg font-bold">Talles Existentes</h3>
          <div className="border-base-300 mb-4 max-h-96 overflow-y-auto rounded-lg border">
            <table className="table w-full">
              {category &&
                category.map((cat) => (
                  <div
                    key={cat.id}
                    className="collapse-arrow rounded-box border-base-300 bg-base-100 collapse border"
                  >
                    <input type="checkbox" className="peer" />
                    <div className="collapse-title font-medium">{cat.category_name}</div>
                    <div className="collapse-content">
                      <ul>
                        {sizes
                          .filter((size) => size.category_id === cat.id)
                          .map((size) => (
                            <li key={size.id} className="py-1">
                              {size.size_name}
                            </li>
                          ))}
                        {sizes.filter((size) => size.category_id === cat.id).length === 0 && (
                          <li className="py-1 text-sm text-gray-500">
                            No hay talles para esta categoría
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                ))}
            </table>
          </div>

          <h3 className="mt-6 mb-2 text-lg font-bold">Agregar Nuevo Talle</h3>
          <div className="space-y-3">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Nombre del talle:</span>
              </label>
              <input
                type="text"
                name="size_name"
                placeholder="Ej: S, M, L, 38, 40"
                className="input input-bordered w-full max-w-xs"
                value={formData.size_name}
                onChange={handleChange}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Categoría:</span>
              </label>
              <select
                name="category_id"
                className="select select-bordered w-full max-w-xs"
                value={formData.category_id}
                onChange={handleChange}
              >
                <option value="" disabled>
                  Seleccionar categoría
                </option>
                {category.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
              <div className="form-control mt-4">
                <label className="label">
                  <span className="label-text">Descripcion:</span>
                </label>
                <input
                  type="text"
                  name="description"
                  placeholder="Ej: Talle de ropa, calzado, etc."
                  className="input input-bordered w-full max-w-xs"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Agregar Categoría</h4>
                <button className="btn btn-xs" onClick={handleMostrarAgregarCategoria}>
                  {mostrarAgregarCategoria ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 13l-7 7-7-7m14-6l-7 7-7-7"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {mostrarAgregarCategoria && (
                <div className="mt-2 space-y-3">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Nombre de la categoría:</span>
                    </label>
                    <input
                      type="text"
                      name="category_name"
                      placeholder="Ej: Ropa, Calzado, Accesorios"
                      className="input input-bordered w-full max-w-xs"
                      value={formData.category_name}
                      onChange={handleChange}
                    />
                  </div>
                  <button className="btn btn-sm btn-primary" onClick={handleSubmitCategorySize}>
                    Agregar Categoría
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="modal-action mt-6 justify-end">
            <button type="submit" onClick={handleSubmitSize} className="btn btn-primary">
              Agregar Talle
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>Cerrar</button>
        </form>
      </dialog>
    </div>
  )
}
