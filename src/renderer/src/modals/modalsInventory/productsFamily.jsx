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

  // Nueva función para manejar doble clic: seleccionar grupo y cerrar modal
  const handleGroupDoubleClick = (groupId, groupName) => {
    handleGroupClick(groupId, groupName)
    // Cerrar el modal
    document.getElementById('productsFamily').close()
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

    // Validar datos requeridos
    if (!formData.group_name || formData.group_name.trim() === '') {
      alert('El nombre del grupo es requerido')
      return
    }

    // Preparar datos para envío
    const dataToSend = {
      group_name: formData.group_name.trim(),
      parent_group_id: formData.parent_group_id || null,
      marked_as_root: formData.marked_as_root || 0
    }

    console.log('📤 Enviando datos de familia:', dataToSend)

    try {
      const response = await postFamilyData(dataToSend)
      console.log('✅ Familia de productos guardada:', response)
      
      // Limpiar formulario
      setFormData({
        group_name: '',
        parent_group_id: '',
        marked_as_root: ''
      })

      // Recargar datos
      const fetchData = async () => {
        try {
          const familyGroupResponse = await fetchFamilyProducts()
          setFamilyGroup(familyGroupResponse)
          const hierarchy = buildHierarchy(familyGroupResponse)
          setHierarchicalFamilyGroup(hierarchy)
        } catch (error) {
          console.error('Error fetching family products after creation:', error)
        }
      }
      await fetchData()

      // Mostrar mensaje de éxito
      alert('Familia de productos creada exitosamente!')

      // Cerrar formulario
      setMostrarAgregarFamilia(false)
    } catch (error) {
      console.error('❌ Error saving family product:', error)
      console.error('❌ Error details:', error.response?.data)
      
      // Mostrar error específico si está disponible
      const errorMessage =
        error.response?.data?.mensaje || error.message || 'Error desconocido al crear la familia'
      alert(`Error al crear la familia de productos: ${errorMessage}`)
    }
  }

  const FamilyGroupList = ({ groups, onGroupClick, onGroupDoubleClick, selectedId, level = 0 }) => {
    return (
      <>
        {groups &&
          groups.map((group) => (
            <div key={group.id}>
              <div
                className={`hover:bg-base-200 cursor-pointer rounded-md px-2 py-1 transition-all duration-200 ${
                  selectedId === group.id
                    ? 'bg-warning/20 border-warning border-l-2 shadow-sm'
                    : 'hover:shadow-sm'
                }`}
                style={{ marginLeft: `${level * 12}px` }}
                onClick={() => onGroupClick(group.id, group.group_name)}
                onDoubleClick={() => onGroupDoubleClick(group.id, group.group_name)}
                title="Clic para seleccionar, doble clic para filtrar y cerrar"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    {/* Icono simple para jerarquía */}
                    {level > 0 && <span className="text-xs text-gray-400">→</span>}
                    <span className="text-sm">{group.group_name}</span>
                    {group.children && group.children.length > 0 && (
                      <span className="badge badge-ghost badge-xs">{group.children.length}</span>
                    )}
                  </span>
                  {selectedId === group.id && (
                    <span className="badge badge-warning badge-xs">ACTIVO</span>
                  )}
                </div>
              </div>
              {group.children && group.children.length > 0 && (
                <FamilyGroupList
                  groups={group.children}
                  onGroupClick={onGroupClick}
                  onGroupDoubleClick={onGroupDoubleClick}
                  selectedId={selectedId}
                  level={level + 1}
                />
              )}
            </div>
          ))}
      </>
    )
  }

  return (
    <div>
      <dialog id="productsFamily" className="modal">
        <div className="modal-box max-w-3xl p-3">
          <h3 className="mb-2 text-base font-semibold">🗂️ Familias de Productos</h3>

          <div className="mb-2 flex items-center justify-between border-b pb-1">
            <h4 className="text-sm font-medium">Listado de Familias</h4>
            <div className="flex items-center gap-1">
              {selectedGroupId && (
                <button
                  className="btn btn-xs btn-warning"
                  onClick={handleClearFilter}
                  title="Quitar filtro de inventario"
                >
                  ✕ Quitar
                </button>
              )}
              <button
                className={`btn btn-xs ${!mostrarAgregarFamilia ? 'btn-primary' : 'btn-outline'}`}
                onClick={handleAgregarALaFamilia}
              >
                {!mostrarAgregarFamilia ? (
                  <>
                    <Plus className="mr-1" size={10} /> Nueva
                  </>
                ) : (
                  <>
                    <Minus className="mr-1" size={10} /> Cerrar
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Instrucciones super compactas */}
          <div className="mb-2 rounded bg-blue-50 p-1.5">
            <p className="text-xs text-blue-800">
              💡 <strong>Clic:</strong> seleccionar - <strong>Doble clic:</strong> filtrar y cerrar
              {selectedGroupId && (
                <span className="text-warning ml-1 text-xs font-semibold">
                  🔍 {getActiveGroupInfo()}
                </span>
              )}
            </p>
          </div>

          {hierarchicalFamilyGroup.length > 0 ? (
            <div className="max-h-72 space-y-0 overflow-y-auto">
              <FamilyGroupList
                groups={hierarchicalFamilyGroup}
                onGroupClick={handleGroupClick}
                onGroupDoubleClick={handleGroupDoubleClick}
                selectedId={selectedGroupId ? parseInt(selectedGroupId) : null}
              />
            </div>
          ) : (
            <p className="py-3 text-center text-xs text-gray-500 italic">
              No hay familias de productos creadas.
            </p>
          )}

          {mostrarAgregarFamilia && (
            <div className="mt-2 border-t pt-2">
              <h4 className="mb-1 text-xs font-semibold">➕ Nueva Familia</h4>
              <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
                {familyGroup && (
                  <div className="form-control">
                    <label className="label py-0.5">
                      <span className="label-text text-xs">Familia padre:</span>
                    </label>
                    <select
                      className="select select-bordered select-xs w-full"
                      name="parent_group_id"
                      onChange={(e) => {
                        setFormData({ ...formData, parent_group_id: e.target.value })
                      }}
                      value={formData.parent_group_id || ''}
                    >
                      <option value="">Ninguna</option>
                      {familyGroup.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.group_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-control">
                  <label className="label py-0.5">
                    <span className="label-text text-xs">Nombre:</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-xs w-full"
                    name="group_name"
                    placeholder="Ej: Pantalones..."
                    onChange={(e) => {
                      setFormData({ ...formData, group_name: e.target.value })
                    }}
                    value={formData.group_name}
                  />
                </div>
                <div className="form-control col-span-full">
                  <label className="label cursor-pointer justify-start gap-1 py-0.5">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-xs"
                      name="marked_as_root"
                      onChange={(e) => {
                        setFormData({ ...formData, marked_as_root: e.target.checked ? 1 : 0 })
                      }}
                      checked={formData.marked_as_root === 1 || formData.marked_as_root === true}
                    />
                    <span className="label-text text-xs">Categoría principal</span>
                  </label>
                </div>
              </div>
              <div className="modal-action mt-2 justify-start">
                <button className="btn btn-primary btn-xs" onClick={handleSubmit}>
                  <Plus className="mr-1" size={10} /> Crear
                </button>
                <button className="btn btn-outline btn-xs" onClick={handleAgregarALaFamilia}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <form method="dialog">
            <div className="modal-action mt-1 justify-end">
              <button className="btn btn-neutral btn-xs">✕ Cerrar</button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  )
}
