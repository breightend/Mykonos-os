import { useState, useEffect } from 'react'
import { postFamilyData, fetchFamilyProducts } from '../../services/products/familyService'
import { Plus, Minus } from 'lucide-react'
import buildHierarchy from '../../componentes especificos/FamilyGroupList'

export default function ProductsFamily() {
  const [formData, setFormData] = useState({
    group_name: '',
    parent_group_id: '',
    marked_as_root: ''
  })
  const [familyGroup, setFamilyGroup] = useState([])
  const [hierarchicalFamilyGroup, setHierarchicalFamilyGroup] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const familyGroupResponse = await fetchFamilyProducts()
        setFamilyGroup(familyGroupResponse)
        const hierarchy = buildHierarchy(familyGroupResponse)
        setHierarchicalFamilyGroup(hierarchy)
        console.log('Familia de productos jerárquica:', hierarchy)

        console.log('Familia de productos:', familyGroupResponse)
      } catch (error) {
        console.error('Error fetching family products:', error)
      }
    }
    fetchData()
  }, [])

  const [mostrarAgregarFamilia, setMostrarAgregarFamilia] = useState(false)

  const handleAgregarALaFamilia = () => {
    setMostrarAgregarFamilia(!mostrarAgregarFamilia)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.marked_as_root === '') {
      formData.marked_as_root = 1
    }
    if (formData.parent_group_id === '') {
      formData.parent_group_id = null
    }
    try {
      const response = await postFamilyData(formData)
      console.log('Familia de productos guardada:', response)
      setFormData({
        group_name: '',
        parent_group_id: '',
        marked_as_root: ''
      })
    } catch (error) {
      console.error('Error saving family product:', error)
    }
  }

  const FamilyGroupList = ({ groups }) => {
    return (
      <ul className="tree">
        {groups.map((group) => (
          <li key={group.id}>
            {group.group_name}
            {group.children && group.children.length > 0 && (
              <FamilyGroupList groups={group.children} />
            )}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div>
      <dialog id="productsFamily" className="modal">
        <div className="modal-box max-w-5xl p-6">
          <h3 className="mb-4 text-xl font-semibold">Administrar Familias de Productos</h3>

          <div className="mb-4 flex items-center justify-between border-b pb-2">
            <h4 className="text-lg">Listado de Familias</h4>
            <button
              className={`btn btn-sm ${!mostrarAgregarFamilia ? 'btn-primary' : 'btn-outline'}`}
              onClick={handleAgregarALaFamilia}
            >
              {!mostrarAgregarFamilia ? (
                <>
                  <Plus className="mr-2" size={16} /> Agregar Familia
                </>
              ) : (
                <>
                  <Minus className="mr-2" size={16} /> Ocultar Formulario
                </>
              )}
            </button>
          </div>

          {hierarchicalFamilyGroup.length > 0 ? (
            <div className="py-2">
              <FamilyGroupList groups={hierarchicalFamilyGroup} />
            </div>
          ) : (
            <p className="text-gray-500 italic">No hay familias de productos creadas.</p>
          )}

          {mostrarAgregarFamilia && (
            <div className="mt-6 border-t pt-4">
              <h4 className="mb-2 text-lg font-semibold">Agregar Nueva Familia</h4>
              <div className="flex flex-col gap-3">
                {familyGroup && (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Selecciona la familia padre (opcional):</span>
                    </label>
                    <select
                      className="select select-bordered w-full max-w-md"
                      name="parent_group_id"
                      onChange={(e) => {
                        setFormData({ ...formData, parent_group_id: e.target.value })
                      }}
                      value={formData.parent_group_id || ''}
                    >
                      <option value="">Ninguna (es raíz)</option>
                      {familyGroup.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.group_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Nombre de la familia:</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full max-w-md"
                    name="group_name"
                    placeholder="Nombre de la familia"
                    onChange={(e) => {
                      setFormData({ ...formData, group_name: e.target.value })
                    }}
                    value={formData.group_name}
                  />
                </div>
                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text">Marcar como raíz principal:</span>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary ml-2"
                      name="marked_as_root"
                      onChange={(e) => {
                        setFormData({ ...formData, marked_as_root: e.target.checked ? 1 : 0 })
                      }}
                      checked={formData.marked_as_root === 1 || formData.marked_as_root === true}
                    />
                  </label>
                </div>
              </div>
              <div className="modal-action mt-4 justify-start">
                <button className="btn btn-primary" onClick={handleSubmit}>
                  <Plus className="mr-2" size={16} /> Agregar
                </button>
                <button className="btn btn-outline" onClick={handleAgregarALaFamilia}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <form method="dialog">
            <div className="modal-action justify-end">
              <button className="btn btn-neutral">Cerrar</button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  )
}
