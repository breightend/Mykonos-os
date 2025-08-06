import { ChevronsUp, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  fetchColor,
  postData,
  deleteColor,
  checkColorInUse
} from '../../services/products/colorService'
import {
  fetchCategorySize,
  postDataSize,
  getCategoryXsize,
  postDataCategory,
  deleteCategory,
  deleteSize,
  fetchSize
} from '../../services/products/sizeService'
export default function ModalColoresYTalles() {
  const [colors, setColors] = useState([])
  const [sizes, setSizes] = useState([])
  const [category, setCategory] = useState([])
  const [, setSizeXcategory] = useState([])
  const [, setLoading] = useState(false)
  const [mostrarAgregarCategoria, setMostrarAgregarCategoria] = useState(false)
  const [error, setError] = useState('')

  const [formDataColor, setFormDataColor] = useState({
    color_name: '',
    color_hex: '#000000'
  })
  const [formDataSize, setFormDataSize] = useState({
    size_name: '',
    category_id: '',
    description: '',
    category_name: '',
    permanent: 1
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormDataColor({
      ...formDataColor,
      [name]: value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await postData(formDataColor)
      console.log('Color agregado:', response)
      setColors([...colors, response])
      setFormDataColor({
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
      setColors(colors.filter((color) => color.id !== colorId))
      console.log('Color eliminado:', colorId)
    } catch (error) {
      console.error('Error al eliminar color:', error)
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
    const fetchColors = async () => {
      try {
        const response = await fetchColor()
        setColors(response)
        const sizesResponse = await fetchSize()
        setSizes(sizesResponse)
        const categoryResponse = await fetchCategorySize()
        setCategory(categoryResponse)

        const sizeXcategoryResponse = await getCategoryXsize()
        setSizeXcategory(sizeXcategoryResponse)
      } catch (error) {
        console.error('Error al obtener colores:', error)
      }
      setLoading(false)
    }
    fetchColors()
  }, [])

  useEffect(() => {
    if (category.length === 0) {
      setMostrarAgregarCategoria(true)
    }
  }, [category])
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
                value={formDataColor.color_name}
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
                value={formDataColor.color_hex}
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
