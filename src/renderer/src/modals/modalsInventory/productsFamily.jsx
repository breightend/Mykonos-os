import { useState, useEffect } from 'react'
import { postFamilyData, fetchFamilyProducts } from '../../services/products/familyService'
import { Plus, Minus } from 'lucide-react'

export default function ProductsFamily() {
  const [formData, setFormData] = useState({
    group_name: '',
    parent_group_id: '',
    marked_as_root: ''
  })
  const [familyGroup, setFamilyGroup] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const familyGroupResponse = await fetchFamilyProducts()
        setFamilyGroup(familyGroupResponse)
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

  return (
    <div>
      <dialog id="productsFamily" className="modal">
        <div className="modal-box max-w-5xl">
          <h3 className="text-lg font-bold">Familia de productos</h3>

          {!mostrarAgregarFamilia ? (
            <>
              <button
                className="btn btn-icon btn-ghost btn-circle rotate-90 transition-all transition-discrete duration-350"
                onClick={handleAgregarALaFamilia}
              >
                <Plus />
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-icon btn-ghost btn-circle tooltip transition-all transition-discrete duration-350"
                onClick={handleAgregarALaFamilia}
                data-tip="Mostrar menos"
              >
                <Minus />
              </button>
              <div className="flex flex-col gap-4">
                {familyGroup && (
                  <>
                    <label htmlFor="" className="">
                      Selecciona la familia de productos:{' '}
                    </label>
                    <select
                      className="select select-bordered w-full max-w-xs"
                      name="parent_group_id"
                      onChange={(e) => {
                        setFormData({ ...formData, parent_group_id: e.target.value })
                      }}
                    >
                      <option value="">Selecciona una familia</option>
                      {familyGroup.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.group_name}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                <label htmlFor="" className="">
                  Nombre de la familia:{' '}
                </label>
                <input
                  type="text"
                  className="input"
                  name="group_name"
                  placeholder="Nombre de la familia"
                />
              </div>
              <btn className="btn btn-primary" onClick={handleSubmit}>
                + Agregar
              </btn>
            </>
          )}

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
