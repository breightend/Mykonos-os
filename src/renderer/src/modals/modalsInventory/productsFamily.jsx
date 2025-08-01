import { useState, useEffect } from 'react'
import { postFamilyData, fetchFamilyProducts } from '../../services/products/familyService'
import { Plus, Minus } from 'lucide-react'
import buildHierarchy from '../../componentes especificos/FamilyGroupList'

export default function ProductsFamily({ onGroupSelect, selectedGroupId }) {
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

  // Nueva función para manejar la selección de grupos para filtrado
  const handleGroupClick = (groupId, groupName) => {
    if (onGroupSelect) {
      // Encontrar los datos completos del grupo incluyendo sus hijos
      const findGroupData = (groups, targetId) => {
        for (const group of groups) {
          if (group.id === targetId) {
            return group
          }
          if (group.children && group.children.length > 0) {
            const found = findGroupData(group.children, targetId)
            if (found) return found
          }
        }
        return null
      }

      const groupData = findGroupData(hierarchicalFamilyGroup, groupId)
      console.log('🔍 Datos del grupo encontrado:', groupData)
      console.log('🌳 Jerarquía completa disponible:', hierarchicalFamilyGroup)
      onGroupSelect(groupId, groupName, groupData)
    }
  }

  // Función para obtener información del grupo activo
  const getActiveGroupInfo = () => {
    if (!selectedGroupId) return ''

    const findGroup = (groups, id) => {
      for (const group of groups) {
        if (group.id.toString() === id) return group
        if (group.children) {
          const found = findGroup(group.children, id)
          if (found) return found
        }
      }
      return null
    }

    const getAllChildrenCount = (group) => {
      if (!group || !group.children) return 0
      let count = group.children.length
      group.children.forEach((child) => {
        count += getAllChildrenCount(child)
      })
      return count
    }

    const activeGroup = findGroup(hierarchicalFamilyGroup, selectedGroupId)
    const totalChildCount = getAllChildrenCount(activeGroup)
    const directChildCount = activeGroup?.children?.length || 0

    return `${activeGroup?.group_name || `ID ${selectedGroupId}`}${
      totalChildCount > 0
        ? ` (${directChildCount} subgrupos directos, ${totalChildCount} total)`
        : ' (sin subgrupos)'
    }`
  }

  // Función para limpiar el filtro
  const handleClearFilter = () => {
    if (onGroupSelect) {
      onGroupSelect('', '', null)
    }
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

  const FamilyGroupList = ({ groups, onGroupClick, selectedId }) => {
    return (
      <ul className="tree">
        {groups &&
          groups.map((group) => (
            <li key={group.id} className="relative">
              <div
                className={`hover:bg-base-200 cursor-pointer rounded p-2 transition-colors ${
                  selectedId === group.id ? 'bg-warning/20 border-warning border-l-4' : ''
                }`}
                onClick={() => onGroupClick(group.id, group.group_name)}
              >
                <span className="flex items-center gap-2">
                  <span>{group.group_name}</span>
                  {selectedId === group.id && (
                    <span className="badge badge-warning badge-xs">ACTIVO</span>
                  )}
                </span>
              </div>
              {group.children && group.children.length > 0 && (
                <FamilyGroupList
                  groups={group.children}
                  onGroupClick={onGroupClick}
                  selectedId={selectedId}
                />
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
            <div className="flex items-center gap-2">
              {selectedGroupId && (
                <button
                  className="btn btn-sm btn-warning"
                  onClick={handleClearFilter}
                  title="Quitar filtro de inventario"
                >
                  ✕ Quitar Filtro
                </button>
              )}
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
          </div>

          {/* Instrucciones para el filtro */}
          <div className="mb-4 rounded bg-blue-50 p-3">
            <p className="text-sm text-blue-800">
              💡 <strong>Filtrar inventario:</strong> Haz clic en cualquier grupo para filtrar los
              productos. El filtro incluirá automáticamente todos los productos de ese grupo y sus
              subgrupos.
              {selectedGroupId && (
                <span className="text-warning ml-2 font-semibold">
                  🔍 Filtro activo: {getActiveGroupInfo()}
                </span>
              )}
            </p>
          </div>

          {hierarchicalFamilyGroup.length > 0 ? (
            <div className="py-2">
              <FamilyGroupList
                groups={hierarchicalFamilyGroup}
                onGroupClick={handleGroupClick}
                selectedId={selectedGroupId ? parseInt(selectedGroupId) : null}
              />
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
