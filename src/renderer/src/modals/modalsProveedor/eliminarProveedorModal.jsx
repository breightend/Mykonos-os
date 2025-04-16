import React from 'react'
import { deleteData } from '../../services/proveedores/proveedorService'
import toast, { Toaster } from 'react-hot-toast'
import { useLocation } from 'wouter'

function EliminarProveedorModal({ provider }) {
  const [setLocation] = useLocation()
  const handleDelete = async () => {
    try {
      await deleteData(provider.id)
      console.log('Proveedor eliminado:', provider.id)
      toast.success('Proveedor eliminado correctamente')
      setLocation('/proveedores')
    } catch (error) {
      console.error('Error eliminando proveedor:', error)
      toast.error('Error eliminando proveedor')
    }
  }
  return (
    <div>
      <dialog id="eliminandoProvider" className="modal">
        <div className="modal-box w-11/12 max-w-5xl">
          <h3 className="text-lg font-bold">Eliminar a: {provider?.entity_name} </h3>
          <p className="py-4">¿Estás seguro que queres eliminar a {provider?.entity_name}? </p>
          <div className="modal-action">
            <form method="dialog">
              <div className="space-x-4">
                <button className="btn btn-neutral">Cancelar</button>
                <button className="btn btn-success" onClick={handleDelete}>
                  Eliminar provider
                </button>
                <Toaster position="bottom-right" />
              </div>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  )
}

export default EliminarProveedorModal
