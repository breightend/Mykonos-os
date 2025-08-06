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

export default function ModalColoresYTalles({ onRefresh }) {
  const [colors, setColors] = useState([])
  const [sizes, setSizes] = useState([])
  const [category, setCategory] = useState([])
  const [, setSizeXcategory] = useState([])
  const [loading, setLoading] = useState(false)
  const [mostrarAgregarCategoria, setMostrarAgregarCategoria] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('colors') // 'colors', 'sizes', 'categories'

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
  const [formDataCategory, setFormDataCategory] = useState({
    category_name: '',
    description: '',
    permanent: 1
  })

  const handleChangeColor = (e) => {
    const { name, value } = e.target
    setFormDataColor({
      ...formDataColor,
      [name]: value
    })
  }

  const handleChangeSize = (e) => {
    const { name, value } = e.target
    setFormDataSize({
      ...formDataSize,
      [name]: value
    })
  }

  const handleChangeCategory = (e) => {
    const { name, value } = e.target
    setFormDataCategory({
      ...formDataCategory,
      [name]: value
    })
  }

  const handleSubmitColor = async (e) => {
    e.preventDefault()
    try {
      const response = await postData(formDataColor)
      console.log('Color agregado:', response)
      setColors([...colors, response])
      setFormDataColor({
        color_name: '',
        color_hex: '#000000'
      })
      setError('')
    } catch (error) {
      console.error('Error al agregar color:', error)
      setError('Error al agregar el color')
    }
  }

  const handleSubmitSize = async (e) => {
    e.preventDefault()
    try {
      const response = await postDataSize(formDataSize)
      console.log('Talle agregado:', response)
      const updatedSizes = await fetchSize()
      setSizes(updatedSizes)
      setFormDataSize({
        size_name: '',
        category_id: '',
        description: '',
        category_name: '',
        permanent: 1
      })
      setError('')
    } catch (error) {
      console.error('Error al agregar talle:', error)
      setError('Error al agregar el talle')
    }
  }

  const handleSubmitCategory = async (e) => {
    e.preventDefault()
    try {
      const response = await postDataCategory(formDataCategory)
      console.log('Categoría agregada:', response)
      const updatedCategories = await fetchCategorySize()
      setCategory(updatedCategories)
      setFormDataCategory({
        category_name: '',
        description: '',
        permanent: 1
      })
      setError('')
    } catch (error) {
      console.error('Error al agregar categoría:', error)
      setError('Error al agregar la categoría')
    }
  }
  const handleDeleteColor = async (colorId, colorName) => {
    if (
      window.confirm(
        `¿Estás seguro de que quieres eliminar el color "${colorName}"?\n\nEsto solo será posible si no hay productos que lo utilicen.`
      )
    ) {
      try {
        await deleteColor(colorId)
        setColors(colors.filter((color) => color.id !== colorId))
        console.log('Color eliminado:', colorId)
        setError('')
      } catch (error) {
        console.error('Error al eliminar color:', error)
        if (error.response?.data?.mensaje) {
          setError(error.response.data.mensaje)
        } else {
          setError('Ocurrió un error al eliminar el color.')
        }
      }
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

        setError('') 
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

        if (onRefresh) {
          onRefresh()
        }

        setError('') 
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
      <dialog id="sizeColorModal" className="modal ">
        <div className="modal-box w-11/12 max-w-5xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-warning text-2xl font-bold">Gestión de Colores y Talles</h2>
            <button
              className="btn btn-sm btn-circle btn-ghost"
              onClick={() => document.getElementById('sizeColorModal').close()}
            >
              ✕
            </button>
          </div>

          {/* Mostrar errores */}
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
              <button className="btn btn-sm btn-outline btn-error" onClick={() => setError('')}>
                ✕
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="tabs tabs-boxed mb-6">
            <button
              className={`tab tab-lg ${activeTab === 'colors' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('colors')}
            >
              🎨 Colores
            </button>
            <button
              className={`tab tab-lg ${activeTab === 'categories' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              📂 Categorías
            </button>
            <button
              className={`tab tab-lg ${activeTab === 'sizes' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('sizes')}
            >
              📏 Talles
            </button>
          </div>

          {/* Contenido de Colors */}
          {activeTab === 'colors' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Lista de colores */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold">Colores Disponibles</h3>
                  <div className="max-h-80 overflow-x-auto">
                    <table className="table-zebra table w-full">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Vista</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {colors && colors.length > 0 ? (
                          colors.map((color) => (
                            <tr key={color.id}>
                              <td className="font-medium">{color.color_name}</td>
                              <td>
                                <div
                                  className="h-8 w-8 rounded-full border-2 shadow-sm"
                                  style={{ backgroundColor: color.color_hex }}
                                  title={color.color_hex}
                                ></div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-error text-white"
                                  onClick={() => handleDeleteColor(color.id, color.color_name)}
                                  title="Eliminar color"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="py-8 text-center text-gray-500">
                              No hay colores disponibles
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Formulario para agregar color */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold">Agregar Nuevo Color</h3>
                  <form onSubmit={handleSubmitColor} className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">Nombre del color</span>
                      </label>
                      <input
                        type="text"
                        name="color_name"
                        value={formDataColor.color_name}
                        onChange={handleChangeColor}
                        placeholder="Ej: Rojo Ferrari"
                        className="input input-bordered w-full"
                        required
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">Color</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          name="color_hex"
                          value={formDataColor.color_hex}
                          onChange={handleChangeColor}
                          className="h-12 w-16 cursor-pointer rounded border"
                        />
                        <input
                          type="text"
                          value={formDataColor.color_hex}
                          onChange={(e) =>
                            setFormDataColor({ ...formDataColor, color_hex: e.target.value })
                          }
                          className="input input-bordered flex-1"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-warning w-full">
                      <Plus size={16} />
                      Agregar Color
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Contenido de Categories */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Lista de categorías */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold">Categorías Disponibles</h3>
                  <div className="max-h-80 overflow-x-auto">
                    <table className="table-zebra table w-full">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Descripción</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {category && category.length > 0 ? (
                          category.map((cat) => (
                            <tr key={cat.id}>
                              <td className="font-medium">{cat.category_name}</td>
                              <td className="text-sm text-gray-600">
                                {cat.description || 'Sin descripción'}
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-error text-white"
                                  onClick={() => handleDeleteCategory(cat.id, cat.category_name)}
                                  title="Eliminar categoría"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="py-8 text-center text-gray-500">
                              No hay categorías disponibles
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Formulario para agregar categoría */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold">Agregar Nueva Categoría</h3>
                  <form onSubmit={handleSubmitCategory} className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">Nombre de la categoría</span>
                      </label>
                      <input
                        type="text"
                        name="category_name"
                        value={formDataCategory.category_name}
                        onChange={handleChangeCategory}
                        placeholder="Ej: Remeras"
                        className="input input-bordered w-full"
                        required
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">Descripción (opcional)</span>
                      </label>
                      <textarea
                        name="description"
                        value={formDataCategory.description}
                        onChange={handleChangeCategory}
                        placeholder="Descripción de la categoría"
                        className="textarea textarea-bordered w-full"
                        rows={3}
                      />
                    </div>
                    <button type="submit" className="btn btn-warning w-full">
                      <Plus size={16} />
                      Agregar Categoría
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Contenido de Sizes */}
          {activeTab === 'sizes' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Lista de talles */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold">Talles Disponibles</h3>
                  <div className="max-h-80 overflow-x-auto">
                    <table className="table-zebra table w-full">
                      <thead>
                        <tr>
                          <th>Talle</th>
                          <th>Categoría</th>
                          <th>Descripción</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sizes && sizes.length > 0 ? (
                          sizes.map((size) => (
                            <tr key={size.id}>
                              <td className="font-medium">{size.size_name}</td>
                              <td>
                                <span className="badge badge-outline">
                                  {category.find((cat) => cat.id === size.category_id)
                                    ?.category_name || 'Sin categoría'}
                                </span>
                              </td>
                              <td className="text-sm text-gray-600">
                                {size.description || 'Sin descripción'}
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-error text-white"
                                  onClick={() => handleDeleteSize(size.id, size.size_name)}
                                  title="Eliminar talle"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-gray-500">
                              No hay talles disponibles
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Formulario para agregar talle */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold">Agregar Nuevo Talle</h3>
                  <form onSubmit={handleSubmitSize} className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">Nombre del talle</span>
                      </label>
                      <input
                        type="text"
                        name="size_name"
                        value={formDataSize.size_name}
                        onChange={handleChangeSize}
                        placeholder="Ej: XL, 42, L"
                        className="input input-bordered w-full"
                        required
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">Categoría</span>
                      </label>
                      <select
                        name="category_id"
                        value={formDataSize.category_id}
                        onChange={handleChangeSize}
                        className="select select-bordered w-full"
                        required
                      >
                        <option value="">Seleccionar categoría</option>
                        {category.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.category_name}
                          </option>
                        ))}
                      </select>
                      {category.length === 0 && (
                        <label className="label">
                          <span className="label-text-alt text-warning">
                            ⚠️ Primero debes crear una categoría
                          </span>
                        </label>
                      )}
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">Descripción (opcional)</span>
                      </label>
                      <textarea
                        name="description"
                        value={formDataSize.description}
                        onChange={handleChangeSize}
                        placeholder="Descripción del talle"
                        className="textarea textarea-bordered w-full"
                        rows={3}
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn btn-warning w-full"
                      disabled={category.length === 0}
                    >
                      <Plus size={16} />
                      Agregar Talle
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <span className="loading loading-spinner loading-md text-warning"></span>
              <span className="ml-2">Cargando...</span>
            </div>
          )}
        </div>
      </dialog>
    </>
  )
}
