import { ChevronsUp, Plus, Ruler, Trash2 } from 'lucide-react'
import {
  fetchCategorySize,
  postDataSize,
  getCategoryXsize,
  postDataCategory,
  deleteCategory,
  deleteSize,
  fetchSize
} from '../../services/products/sizeService'
import { useEffect, useState } from 'react'

export default function ModalSize({ onRefresh }) {
  const [formData, setFormData] = useState({
    size_name: '',
    category_id: '',
    description: '',
    category_name: '',
    permanent: 1
  })
  const [category, setCategory] = useState([])
  const [sizes, setSizes] = useState([])
  const [, setSizeXcategory] = useState([])
  const [, setLoading] = useState(false)
  const [mostrarAgregarCategoria, setMostrarAgregarCategoria] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (category.length === 0) {
      setMostrarAgregarCategoria(true)
    }
  }, [category])

  const handleMostrarAgregarCategoria = () => {
    setMostrarAgregarCategoria(!mostrarAgregarCategoria)
    setError('')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    setError('')
  }

  const handleSubmitSize = async (e) => {
    e.preventDefault()
    setError('')
    const { size_name, category_id } = formData

    const sizeExists = sizes.some(
      (size) =>
        size.size_name.toLowerCase() === size_name.toLowerCase() &&
        size.category_id === parseInt(category_id)
    )

    if (sizeExists) {
      setError(`El talle "${size_name}" ya existe para esta categoría.`)
      return
    }

    try {
      const response = await postDataSize(formData)
      console.log('Talle agregado:', response)

      // Limpiar formulario
      setFormData({
        ...formData,
        size_name: '',
        category_id: '',
        description: ''
      })

      // Refrescar la lista de talles
      const updatedSizes = await fetchSize()
      setSizes(updatedSizes)
      console.log('Talles actualizados:', updatedSizes)

      // Llamar a onRefresh si está disponible para actualizar el componente padre
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Ocurrió un error al agregar el talle.')
    }
  }

  const handleSubmitCategorySize = async (e) => {
    e.preventDefault()
    setError('') // Clear previous error
    const { category_name } = formData

    // Check if the category name already exists
    const categoryExists = category.some(
      (cat) => cat.category_name.toLowerCase() === category_name.toLowerCase()
    )

    if (categoryExists) {
      setError(`La categoría "${category_name}" ya existe.`)
      return
    }

    try {
      const response = await postDataCategory(formData)
      console.log('Categoría agregada:', response)

      // Limpiar formulario
      setFormData({
        ...formData,
        category_name: '',
        permanent: 1
      })

      // Refrescar la lista de categorías
      const updatedCategories = await fetchCategorySize()
      setCategory(updatedCategories)
      console.log('Categorías actualizadas:', updatedCategories)

      setMostrarAgregarCategoria(false)

      // Llamar a onRefresh si está disponible para actualizar el componente padre
      if (onRefresh) {
        onRefresh()
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Ocurrió un error al agregar la categoría.')
    }
  }

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (
      window.confirm(
        `¿Estás seguro de que quieres eliminar la categoría "${categoryName}"?\n\nEsto solo será posible si no hay talles o productos asociados.`
      )
    ) {
      try {
        const response = await deleteCategory(categoryId)
        console.log('Categoría eliminada:', response)

        const updatedCategories = await fetchCategorySize()
        setCategory(updatedCategories)

        const updatedSizes = await fetchSize()
        setSizes(updatedSizes)

        if (onRefresh) {
          onRefresh()
        }

        setError('') // Clear any previous errors
      } catch (error) {
        console.error('Error:', error)
        if (error.response?.data?.mensaje) {
          setError(error.response.data.mensaje)
        } else {
          setError('Ocurrió un error al eliminar la categoría.')
        }
      }
    }
  }

  const handleDeleteSize = async (sizeId, sizeName) => {
    if (
      window.confirm(
        `¿Estás seguro de que quieres eliminar el talle "${sizeName}"?\n\nEsto solo será posible si no hay productos que lo utilicen.`
      )
    ) {
      try {
        const response = await deleteSize(sizeId)
        console.log('Talle eliminado:', response)

        // Refrescar la lista de talles
        const updatedSizes = await fetchSize()
        setSizes(updatedSizes)

        // Llamar a onRefresh si está disponible
        if (onRefresh) {
          onRefresh()
        }

        setError('') // Clear any previous errors
      } catch (error) {
        console.error('Error:', error)
        if (error.response?.data?.mensaje) {
          setError(error.response.data.mensaje)
        } else {
          setError('Ocurrió un error al eliminar el talle.')
        }
      }
    }
  }

  useEffect(() => {
    setLoading(true)
    const fetchData = async () => {
      try {
        const sizesResponse = await fetchSize()
        setSizes(sizesResponse)

        const categoryResponse = await fetchCategorySize()
        setCategory(categoryResponse)

        const sizeXcategoryResponse = await getCategoryXsize()
        setSizeXcategory(sizeXcategoryResponse)
      } catch (error) {
        console.error('Error fetching data:', error)
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
        <Ruler className="text-secondary h-6 w-6" />
      </button>
      <dialog id="sizeModal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">✕</button>
          </form>
          <h3 className="mb-4 text-lg font-bold">Talles Existentes</h3>
          <div className="border-base-300 mb-4 max-h-96 overflow-y-auto rounded-lg border-2 p-2">
            {category && category.length > 0 ? (
              <table className="table w-full">
                {category.map((cat) => (
                  <div
                    key={cat.id}
                    className="rounded-box border-base-300 bg-base-100 relative mb-2 border"
                    style={{
                      background: 'var(--fallback-b1,oklch(var(--b1)/var(--tw-bg-opacity)))',
                      borderColor: 'var(--fallback-bc,oklch(var(--bc)/0.2))'
                    }}
                  >
                    <details className="collapse">
                      <summary className="collapse-title cursor-pointer pr-16 font-medium">
                        <div className="flex w-full items-center justify-between">
                          <span className="flex-1">{cat.category_name}</span>
                          <button
                            className="btn btn-ghost btn-xs ml-2 flex-shrink-0 text-red-500 hover:bg-red-100"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleDeleteCategory(cat.id, cat.category_name)
                            }}
                            title="Eliminar categoría"
                            type="button"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </summary>
                      <div className="collapse-content">
                        <ul className="space-y-1">
                          {sizes
                            .filter((size) => size.category_id === cat.id)
                            .map((size) => (
                              <li
                                key={size.id}
                                className="flex items-center justify-between rounded bg-gray-50 px-2 py-2"
                              >
                                <span className="flex-1">{size.size_name}</span>
                                <button
                                  className="btn btn-ghost btn-xs ml-2 flex-shrink-0 text-red-500 hover:bg-red-100"
                                  onClick={() => handleDeleteSize(size.id, size.size_name)}
                                  title="Eliminar talle"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </li>
                            ))}
                          {sizes.filter((size) => size.category_id === cat.id).length === 0 && (
                            <li className="px-2 py-2 text-sm text-gray-500 italic">
                              No hay talles para esta categoría
                            </li>
                          )}
                        </ul>
                      </div>
                    </details>
                  </div>
                ))}
              </table>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <p className="mb-2">📂 No hay categorías creadas</p>
                <p className="text-sm">Crea una categoría primero para poder agregar talles</p>
              </div>
            )}
          </div>

          <h3 className="mt-6 mb-2 text-lg font-bold">Agregar Nuevo Talle</h3>
          {error && (
            <div className="alert alert-error mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 shrink-0 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}
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
                disabled={category.length === 0}
              >
                <option value="" disabled>
                  {category.length === 0
                    ? 'No hay categorías - Crea una primero'
                    : 'Seleccionar categoría'}
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
                    <ChevronsUp className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
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
                  <button
                    className="btn btn-sm btn-primary"
                    type="button"
                    onClick={handleSubmitCategorySize}
                  >
                    Agregar Categoría
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="modal-action mt-6 justify-end">
            <button
              type="submit"
              onClick={handleSubmitSize}
              className="btn btn-primary"
              disabled={category.length === 0}
            >
              Agregar Talle
            </button>
            {category.length === 0 && (
              <p className="mr-4 text-sm text-gray-500">
                Crea una categoría primero para poder agregar talles
              </p>
            )}
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>Cerrar</button>
        </form>
      </dialog>
    </div>
  )
}
