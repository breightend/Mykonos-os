import { useState } from 'react'
import { Folder, FolderOpen, Eye, X } from 'lucide-react'

function GroupTreePreviewNode({ group, level = 0 }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = group.children && group.children.length > 0

  return (
    <div className="w-full">
      {/* Nodo actual */}
      <div
        className="flex items-center gap-2 rounded px-2 py-1 hover:bg-base-200"
        style={{ paddingLeft: `${level * 20 + 8}px` }}
      >
        {/* Icono de expansión */}
        <div
          className="flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center"
          onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        >
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-warning" />
            ) : (
              <Folder className="h-4 w-4 text-warning" />
            )
          ) : (
            <div className="flex h-4 w-4 items-center justify-center rounded-sm bg-primary/20">
              <div className="h-2 w-2 rounded-full bg-primary" />
            </div>
          )}
        </div>

        <span className="flex-1 text-sm">{group.group_name}</span>

        <span className="text-base-content/60 font-mono text-xs">#{group.id}</span>

        {group.marked_as_root === 1 && <span className="badge badge-accent badge-xs">RAÍZ</span>}
      </div>

      {/* Nodos hijos */}
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {group.children.map((child) => (
            <GroupTreePreviewNode key={child.id} group={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function GroupTreePreviewModal({ groups, isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-h-[80vh] w-full max-w-2xl rounded-lg bg-base-100 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-base-300 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Vista de Grupos</h3>
              <p className="text-base-content/60 text-sm">
                Estructura jerárquica de grupos de productos
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {groups.length > 0 ? (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {groups.map((group) => (
                <GroupTreePreviewNode key={group.id} group={group} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="inline-block rounded-lg bg-base-200 p-4">
                <Folder className="text-base-content/40 mx-auto mb-2 h-12 w-12" />
                <p className="text-base-content/60">No hay grupos disponibles</p>
                <p className="text-base-content/40 mt-1 text-sm">
                  Cree grupos desde la sección de Inventario
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-base-200/50 flex items-center justify-between border-t border-base-300 p-6">
          <div className="text-base-content/60 text-sm">Total de grupos: {groups.length}</div>
          <button onClick={onClose} className="btn btn-primary">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
