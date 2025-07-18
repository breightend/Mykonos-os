import { ArrowLeft, Pencil, Trash2, Plus, Edit2, X, Users, Package } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'wouter'
import { fetchProviderById } from '../services/proveedores/proveedorService'
import {
  fetchBrandByProviders,
  fetchBrand,
  postDataBrand,
  putDataBrand,
  deleteDataBrand,
  assignBrandToProvider,
  removeBrandFromProvider
} from '../services/proveedores/brandService'
import EditarProveedorModal from '../modals/modalsProveedor/editarProveedorModal'
import AgregarPagoModal from '../modals/modalsProveedor/agregarPagoModal'
import EliminarProveedorModal from '../modals/modalsProveedor/eliminarProveedorModal'
import AgregarCompraModal from '../modals/modalsProveedor/agregarCompraModal'
import toast, { Toaster } from 'react-hot-toast'

export default function InfoProvider() {
  const [, setLocation] = useLocation()
  const [searchParams] = useSearchParams()
  const providerId = searchParams.get('id')
  const [provider, setProvider] = useState(null)
  const [operacionSeleccionada, setOperacionSeleccionada] = useState(null)

  // Brand management state
  const [providerBrands, setProviderBrands] = useState([])
  const [allBrands, setAllBrands] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateBrandModal, setShowCreateBrandModal] = useState(false)
  const [showEditBrandModal, setShowEditBrandModal] = useState(false)
  const [showAssignBrandModal, setShowAssignBrandModal] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [brandFormData, setBrandFormData] = useState({
    brand_name: '',
    description: ''
  })
  const [brandSearchTerm, setBrandSearchTerm] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const data = await fetchProviderById(providerId)
        console.log(data)
        setProvider(data)

        const brands = await fetchBrandByProviders(providerId)
        console.log('Fetched provider brands:', brands)
        setProviderBrands(Array.isArray(brands) ? brands : [])

        const allBrandsData = await fetchBrand()
        console.log('Fetched all brands:', allBrandsData)
        setAllBrands(Array.isArray(allBrandsData) ? allBrandsData : [])
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Error al cargar la información')
      } finally {
        setLoading(false)
      }
    }
    if (providerId) {
      fetchData()
    }
  }, [providerId])

  const handleBrandInputChange = (e) => {
    const { name, value } = e.target
    setBrandFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCreateBrand = async (e) => {
    e.preventDefault()
    if (!brandFormData.brand_name.trim()) {
      toast.error('El nombre de la marca es requerido')
      return
    }

    try {
      setLoading(true)
      const currentDate = new Date().toISOString()
      const brandResponse = await postDataBrand({
        ...brandFormData,
        creation_date: currentDate,
        last_modified_date: currentDate
      })

      if (brandResponse.status === 'éxito' && brandResponse.brand_id) {
        await assignBrandToProvider(providerId, brandResponse.brand_id)

        const brands = await fetchBrandByProviders(providerId)
        setProviderBrands(Array.isArray(brands) ? brands : [])

        toast.success('Marca creada y asignada exitosamente')
      } else {
        toast.success('Marca creada exitosamente')
      }

      setShowCreateBrandModal(false)
      setBrandFormData({ brand_name: '', description: '' })

      const allBrandsData = await fetchBrand()
      setAllBrands(Array.isArray(allBrandsData) ? allBrandsData : [])
    } catch (error) {
      console.error('Error creating brand:', error)
      toast.error('Error al crear la marca')
    } finally {
      setLoading(false)
    }
  }

  const handleEditBrand = async (e) => {
    e.preventDefault()
    if (!brandFormData.brand_name.trim()) {
      toast.error('El nombre de la marca es requerido')
      return
    }

    try {
      setLoading(true)
      await putDataBrand(selectedBrand.id, {
        ...brandFormData,
        last_modified_date: new Date().toISOString()
      })

      toast.success('Marca actualizada exitosamente')
      setShowEditBrandModal(false)
      setBrandFormData({ brand_name: '', description: '' })
      setSelectedBrand(null)

      // Refresh brands
      const brands = await fetchBrandByProviders(providerId)
      setProviderBrands(Array.isArray(brands) ? brands : [])
      const allBrandsData = await fetchBrand()
      setAllBrands(Array.isArray(allBrandsData) ? allBrandsData : [])
    } catch (error) {
      console.error('Error updating brand:', error)
      toast.error('Error al actualizar la marca')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBrand = async (brandId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta marca?')) {
      return
    }

    try {
      setLoading(true)
      await deleteDataBrand(brandId)
      toast.success('Marca eliminada exitosamente')

      const brands = await fetchBrandByProviders(providerId)
      setProviderBrands(Array.isArray(brands) ? brands : [])
      const allBrandsData = await fetchBrand()
      setAllBrands(Array.isArray(allBrandsData) ? allBrandsData : [])
    } catch (error) {
      console.error('Error deleting brand:', error)
      toast.error('Error al eliminar la marca')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignBrand = async (brandId) => {
    try {
      setLoading(true)
      await assignBrandToProvider(providerId, brandId)
      toast.success('Marca asignada exitosamente')
      setShowAssignBrandModal(false)

      // Refresh provider brands
      const brands = await fetchBrandByProviders(providerId)
      setProviderBrands(Array.isArray(brands) ? brands : [])
    } catch (error) {
      console.error('Error assigning brand:', error)
      toast.error('Error al asignar la marca')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveBrand = async (brandId) => {
    if (!confirm('¿Estás seguro de que deseas remover esta marca del proveedor?')) {
      return
    }

    try {
      setLoading(true)
      await removeBrandFromProvider(providerId, brandId)
      toast.success('Marca removida exitosamente')

      // Refresh provider brands
      const brands = await fetchBrandByProviders(providerId)
      setProviderBrands(Array.isArray(brands) ? brands : [])
    } catch (error) {
      console.error('Error removing brand:', error)
      toast.error('Error al remover la marca')
    } finally {
      setLoading(false)
    }
  }

  const openEditBrandModal = (brand) => {
    setSelectedBrand(brand)
    setBrandFormData({
      brand_name: brand.brand_name,
      description: brand.description || ''
    })
    setShowEditBrandModal(true)
  }

  const getUnassignedBrands = () => {
    if (!Array.isArray(providerBrands) || !Array.isArray(allBrands)) {
      return []
    }
    const assignedIds = providerBrands.map((brand) => brand.id)
    return allBrands.filter((brand) => !assignedIds.includes(brand.id))
  }

  const getFilteredUnassignedBrands = () => {
    const unassigned = getUnassignedBrands()
    if (!brandSearchTerm.trim()) {
      return unassigned
    }
    return unassigned.filter(
      (brand) =>
        brand.brand_name?.toLowerCase().includes(brandSearchTerm.toLowerCase()) ||
        brand.description?.toLowerCase().includes(brandSearchTerm.toLowerCase())
    )
  }

  const handleRowClick = (row) => {
    setOperacionSeleccionada(row.id)
    console.log('Proveedor seleccionado:', row)
  }

  return (
    <div>
      <div className="w-full rounded-2xl p-2">
        <div className="mb-4 flex items-center gap-4 rounded-2xl bg-gray-800 p-4 text-white dark:bg-gray-400 dark:text-black">
          <button
            className="btn btn-circle btn-ghost tooltip tooltip-bottom ml-5"
            data-tip="Volver"
            onClick={() => setLocation('/proveedores')}
          >
            <ArrowLeft />
          </button>
          <h3 className="text-2xl font-bold">{provider?.entity_name}</h3>
        </div>
        <div className="w-full">
          <div className="items-center justify-between gap-8 space-x-4">
            <button
              className="btn btn-dash mb-4 justify-end"
              onClick={() => document.getElementById('editandoProvider').showModal()}
            >
              <Pencil />
              Editar Proveedor
            </button>
            <button
              className="btn btn-error mb-4 justify-end"
              onClick={() => document.getElementById('eliminandoProvider').showModal()}
            >
              <Trash2 />
              Eliminar Proveedor
            </button>
          </div>
        </div>
        <div className="bg-base-200 overflow-x-auto rounded-lg border p-4 shadow-md">
          <table className="table-zebra table w-full">
            <thead>
              <tr>
                <th>Emrpesa</th>
                <th>CUIT</th>
                <th>Teléfono</th>
                <th>Nombre de Contacto</th>
                <th>Email</th>
                <th>Razon social</th>
                <th>Dirección</th>
                <th>Responsabilidad iva</th>
                <th>Fecha Inicio Actividades</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              <tr key={provider?.id} onClick={() => handleRowClick(provider)}>
                <td>{provider?.entity_name}</td>
                <td>{provider?.cuit}</td>
                <td>{provider?.phone_number}</td>
                <td>{provider?.contact_name}</td>
                <td>{provider?.email}</td>
                <td>{provider?.razon_social}</td>
                <td>{provider?.domicilio_comercial}</td>
                <td>{provider?.responsabilidad_iva}</td>
                <td>{provider?.inicio_actividades}</td>
                <td>{provider?.observations}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <Package className="h-8 w-8" />
              Marcas del Proveedor
            </h1>
            <div className="flex gap-2">
              <button
                className="btn btn-success btn-sm"
                onClick={() => setShowCreateBrandModal(true)}
                disabled={loading}
              >
                <Plus className="mr-1 h-4 w-4" />
                Nueva Marca
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowAssignBrandModal(true)}
                disabled={loading}
              >
                <Users className="mr-1 h-4 w-4" />
                Asignar Marca
              </button>
            </div>
          </div>

          {/* Provider Brands Table */}
          <div className="mb-6 overflow-x-auto rounded-lg bg-white p-4 shadow-md">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="loading loading-spinner loading-lg"></div>
                <span className="ml-2">Cargando marcas...</span>
              </div>
            ) : (
              <table className="table w-full">
                <thead className="rounded-2xl bg-gray-800 text-white">
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Fecha Creación</th>
                    <th>Última Modificación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(providerBrands) && providerBrands.length > 0 ? (
                    providerBrands.map((brand) => (
                      <tr key={brand.id} className="hover:bg-gray-50">
                        <td>{brand.id}</td>
                        <td className="font-semibold">{brand.brand_name}</td>
                        <td>{brand.description || 'N/A'}</td>
                        <td>
                          {brand.creation_date
                            ? new Date(brand.creation_date).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td>
                          {brand.last_modified_date
                            ? new Date(brand.last_modified_date).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td>
                          <div className="flex gap-1">
                            <button
                              onClick={() => openEditBrandModal(brand)}
                              className="btn btn-ghost btn-sm text-blue-600 hover:bg-blue-50"
                              disabled={loading}
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveBrand(brand.id)}
                              className="btn btn-ghost btn-sm text-orange-600 hover:bg-orange-50"
                              disabled={loading}
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBrand(brand.id)}
                              className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-4 text-center text-gray-500">
                        No hay marcas asignadas a este proveedor
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          <h1 className="text-3xl font-bold"> Registro de operaciones </h1>
        </div>
        <div className="w-full">
          <div className="flex justify-end gap-4">
            <button
              className="btn btn-accent"
              onClick={() => document.getElementById('agregandoCompra').showModal()}
            >
              Agregar compra
            </button>
            <button
              className="btn btn-primary"
              onClick={() => document.getElementById('agregandoPago').showModal()}
            >
              Agregar pago
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table-xs table-zebra w-full">
            {/* head */}
            <thead>
              <tr>
                <th></th>
                <th>Fecha</th>
                <th>Operación</th>
                <th>Cantidad</th>
                <th>Monto</th>
                <th>Descripción</th>
                <th>Vendedor</th>
              </tr>
            </thead>
            <tbody>
              {/* row 1 */}
              <tr>
                <th>1</th>
                <td>Cy Ganderton</td>
                <td>Quality Control Specialist</td>
                <td>Blue</td>
              </tr>
              {/* row 2 */}
              <tr>
                <th>2</th>
                <td>Hart Hagerty</td>
                <td>Desktop Support Technician</td>
                <td>Purple</td>
              </tr>
              {/* row 3 */}
              <tr>
                <th>3</th>
                <td>Brice Swyre</td>
                <td>Tax Accountant</td>
                <td>Red</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-4 mr-4 flex justify-end">
        <button className="btn btn-primary" onClick={() => setLocation('/proveedores')}>
          Cerrar
        </button>
      </div>
      <EditarProveedorModal provider={provider} />
      <AgregarPagoModal provider={provider} />
      <EliminarProveedorModal provider={provider} />
      <AgregarCompraModal provider={provider} />

      {/* Create Brand Modal */}
      {showCreateBrandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-lg bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-gray-800">Nueva Marca</h3>
            <form onSubmit={handleCreateBrand} className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Nombre de la Marca *</span>
                </label>
                <input
                  type="text"
                  name="brand_name"
                  value={brandFormData.brand_name}
                  onChange={handleBrandInputChange}
                  className="input input-bordered w-full"
                  placeholder="Nombre de la marca"
                  required
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Descripción</span>
                </label>
                <textarea
                  name="description"
                  value={brandFormData.description}
                  onChange={handleBrandInputChange}
                  className="textarea textarea-bordered w-full"
                  placeholder="Descripción de la marca"
                  rows="3"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setShowCreateBrandModal(false)
                    setBrandFormData({ brand_name: '', description: '' })
                  }}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success" disabled={loading}>
                  {loading ? 'Creando...' : 'Crear Marca'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Brand Modal */}
      {showEditBrandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-lg bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-gray-800">Editar Marca</h3>
            <form onSubmit={handleEditBrand} className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Nombre de la Marca *</span>
                </label>
                <input
                  type="text"
                  name="brand_name"
                  value={brandFormData.brand_name}
                  onChange={handleBrandInputChange}
                  className="input input-bordered w-full"
                  placeholder="Nombre de la marca"
                  required
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Descripción</span>
                </label>
                <textarea
                  name="description"
                  value={brandFormData.description}
                  onChange={handleBrandInputChange}
                  className="textarea textarea-bordered w-full"
                  placeholder="Descripción de la marca"
                  rows="3"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setShowEditBrandModal(false)
                    setBrandFormData({ brand_name: '', description: '' })
                    setSelectedBrand(null)
                  }}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Brand Modal */}
      {showAssignBrandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-3/4 max-w-2xl rounded-lg bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-gray-800">Asignar Marca</h3>

            {getUnassignedBrands().length > 0 ? (
              <>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Buscar marca por nombre o descripción..."
                    value={brandSearchTerm}
                    onChange={(e) => setBrandSearchTerm(e.target.value)}
                    className="input input-bordered w-full"
                  />
                </div>

                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {getFilteredUnassignedBrands().length > 0 ? (
                    getFilteredUnassignedBrands().map((brand) => (
                      <div
                        key={brand.id}
                        className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                      >
                        <div>
                          <h4 className="font-medium">{brand.brand_name}</h4>
                          <p className="text-sm text-gray-600">{brand.description}</p>
                        </div>
                        <button
                          onClick={() => handleAssignBrand(brand.id)}
                          className="btn btn-primary btn-sm"
                          disabled={loading}
                        >
                          Asignar
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="py-4 text-center text-gray-500">
                      No se encontraron marcas que coincidan con la búsqueda
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="py-4 text-center text-gray-500">
                No hay marcas disponibles para asignar
              </p>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setShowAssignBrandModal(false)
                  setBrandSearchTerm('')
                }}
                className="btn"
                disabled={loading}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster position="bottom-right" />
    </div>
  )
}
