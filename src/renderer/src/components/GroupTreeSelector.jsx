import { useState } from 'react'
import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react'

function GroupTreeNode({ group, selectedGroupId, onSelectGroup, level = 0 }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasChildren = group.children && group.children.length > 0
  const isSelected = selectedGroupId === group.id

  const handleToggleExpand = (e) => {
    e.stopPropagation()
    if (hasChildren) {
      setIsExpanded(!isExpanded)
    }
  }

  const handleSelectGroup = () => {
    onSelectGroup(group)
  }

  return (
    <div className="w-full">
      {/* Nodo actual */}
      <div
        className={`hover:bg-base-200 flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-all duration-200 ${
          isSelected ? 'bg-primary/10 border-primary border-l-4' : ''
        }`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={handleSelectGroup}
      >
        {/* Icono de expansión */}
        <div
          className="flex h-5 w-5 flex-shrink-0 items-center justify-center"
          onClick={handleToggleExpand}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="text-base-content/60 h-4 w-4" />
            ) : (
              <ChevronRight className="text-base-content/60 h-4 w-4" />
            )
          ) : (
            <div className="h-4 w-4" />
          )}
        </div>

        {/* Icono de carpeta */}
        <div className="flex-shrink-0">
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="text-warning h-4 w-4" />
            ) : (
              <Folder className="text-warning h-4 w-4" />
            )
          ) : (
            <div className="bg-primary/20 flex h-4 w-4 items-center justify-center rounded-sm">
              <div className="bg-primary h-2 w-2 rounded-full" />
            </div>
          )}
        </div>

        {/* Nombre del grupo */}
        <span
          className={`flex-1 text-sm font-medium ${
            isSelected ? 'text-primary font-semibold' : 'text-base-content'
          }`}
        >
          {group.group_name}
        </span>

        {/* Badge para grupos raíz */}
        {group.marked_as_root === 1 && <span className="badge badge-xs badge-accent">RAÍZ</span>}
      </div>

      {/* Nodos hijos */}
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {group.children.map((child) => (
            <GroupTreeNode
              key={child.id}
              group={child}
              selectedGroupId={selectedGroupId}
              onSelectGroup={onSelectGroup}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function GroupTreeSelector({
  groups,
  selectedGroupId,
  onSelectGroup,
  className = '',
  placeholder = 'Seleccione un grupo...',
  emptyMessage = 'No hay grupos disponibles'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const selectedGroup = selectedGroupId ? findGroupById(groups, selectedGroupId) : null

  // Función recursiva para encontrar un grupo por ID
  function findGroupById(groupList, id) {
    for (const group of groupList) {
      if (group.id === id) {
        return group
      }
      if (group.children) {
        const found = findGroupById(group.children, id)
        if (found) return found
      }
    }
    return null
  }

  // Función recursiva para filtrar grupos por búsqueda
  function filterGroups(groupList, term) {
    if (!term) return groupList

    const filtered = []
    for (const group of groupList) {
      const matchesSearch = group.group_name.toLowerCase().includes(term.toLowerCase())
      const filteredChildren = group.children ? filterGroups(group.children, term) : []

      if (matchesSearch || filteredChildren.length > 0) {
        filtered.push({
          ...group,
          children: filteredChildren
        })
      }
    }
    return filtered
  }

  const filteredGroups = filterGroups(groups, searchTerm)

  const handleSelectGroup = (group) => {
    onSelectGroup(group)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div className={`relative ${className}`}>
      {/* Selector principal */}
      <div
        className="select select-bordered flex w-full cursor-pointer items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedGroup ? 'text-base-content' : 'text-base-content/50'}>
          {selectedGroup ? (
            <div className="flex items-center gap-2">
              <Folder className="text-warning h-4 w-4" />
              <span>{selectedGroup.group_name}</span>
              {selectedGroup.marked_as_root === 1 && (
                <span className="badge badge-xs badge-accent">RAÍZ</span>
              )}
            </div>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Dropdown con árbol */}
      {isOpen && (
        <div className="bg-base-100 border-base-300 absolute top-full right-0 left-0 z-50 mt-1 max-h-80 overflow-hidden rounded-lg border shadow-lg">
          {/* Barra de búsqueda */}
          <div className="border-base-300 border-b p-3">
            <input
              type="text"
              placeholder="Buscar grupos..."
              className="input input-sm input-bordered w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Árbol de grupos */}
          <div className="max-h-64 overflow-y-auto p-2">
            {filteredGroups.length > 0 ? (
              filteredGroups.map((group) => (
                <GroupTreeNode
                  key={group.id}
                  group={group}
                  selectedGroupId={selectedGroupId}
                  onSelectGroup={handleSelectGroup}
                  level={0}
                />
              ))
            ) : (
              <div className="text-base-content/50 p-4 text-center text-sm">
                {searchTerm ? 'No se encontraron grupos' : emptyMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay para cerrar */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false)
            setSearchTerm('')
          }}
        />
      )}
    </div>
  )
}
