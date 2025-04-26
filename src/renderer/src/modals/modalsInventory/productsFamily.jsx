import { useState, useEffect } from 'react'
import { postFamilyData, fetchFamilyProducts } from '../../services/products/familyService'

export default function ProductsFamily() {
  const [formData, setFormData] = useState({
    group_name: '',
    parent_group_id: '',
    marked_as_root: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchFamilyProducts()
        if (response) {
          setFormData({
            group_name: response.group_name || '',
            parent_group_id: response.parent_group_id || '',
            marked_as_root: response.marked_as_root || ''
          })
        }
      } catch (error) {
        console.error('Error fetching family products:', error)
      }
    }
    fetchData()
  }, [])
  return (
    <div>
      <dialog id="productsFamily" className="modal">
        <div className="modal-box max-w-5xl">
          <h3 className="text-lg font-bold">Familia de productos</h3>
          <div className="flex flex-col gap-4">
            <label htmlFor="" className="">
              Nombre de la familia:{' '}
            </label>
            <input type="text" className="input" placeholder="Nombre de la familia" />
            <label htmlFor="">Descripción: </label>
            <input type="text" className="input" placeholder="Descripción" />
            <label htmlFor="">Observaciones: </label>
            <input type="text" className="input" placeholder="Observaciones" />
          </div>
          <form method="dialog">
            <div className="modal-action">
              <button className="btn btn-success">Guardar</button>
              <button className="btn btn-neutral">Cancelar</button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  )
}
