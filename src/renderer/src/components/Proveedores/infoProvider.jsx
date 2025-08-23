import {
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  Edit2,
  X,
  Users,
  Package,
  HandCoins,
  ShoppingBasket,
  Receipt,
  Handshake
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'wouter'
import { fetchProviderById } from '../../services/proveedores/proveedorService'
import {
  fetchBrandByProviders,
  fetchBrand,
  postDataBrand,
  putDataBrand,
  deleteDataBrand,
  assignBrandToProvider,
  removeBrandFromProvider
} from '../../services/proveedores/brandService'
import { fetchPurchasesByProvider } from '../../services/proveedores/purchaseService'
import {
  accountMovementsService,
  formatCurrency,
  formatMovementType
} from '../../services/proveedores/accountMovementsService'
import EditarProveedorModal from '../../modals/modalsProveedor/editarProveedorModal'
import AgregarPagoModal from '../../modals/modalsProveedor/agregarPagoModal'
import EliminarProveedorModal from '../../modals/modalsProveedor/eliminarProveedorModal'
import PurchaseDetailsModal from '../PurchaseDetailsModal'
import OperationDetailsModal from '../OperationDetailsModal'
import toast, { Toaster } from 'react-hot-toast'

export default function InfoProvider() {
  const [, setLocation] = useLocation()
  const [searchParams] = useSearchParams()
  const providerId = searchParams.get('id')
  const [provider, setProvider] = useState(null)

  // Brand management state
  const [providerBrands, setProviderBrands] = useState([])
  const [allBrands, setAllBrands] = useState([])
  const [loading, setLoading] = useState(false)

  // Purchase management state
  const [purchases, setPurchases] = useState([])
  const [loadingPurchases, setLoadingPurchases] = useState(false)
  const [showPurchases, setShowPurchases] = useState(true)
  const [providerBalance, setProviderBalance] = useState(0)
  const [showBrands, setShowBrands] = useState(true)

  // Account movements state
  const [movements, setMovements] = useState([])
  const [loadingMovements, setLoadingMovements] = useState(false)
  const [showMovements, setShowMovements] = useState(true)

  // Purchase details modal
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(null)
  const [showPurchaseDetails, setShowPurchaseDetails] = useState(false)

  // Operation details modal
  const [selectedOperation, setSelectedOperation] = useState(null)
  const [showOperationDetails, setShowOperationDetails] = useState(false)

  // Modal states
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
        setLoadingPurchases(true)
        setLoadingMovements(true)

        // Cargar información del proveedor
        const data = await fetchProviderById(providerId)
        console.log(data)
        setProvider(data)

        // Cargar marcas del proveedor
        const brands = await fetchBrandByProviders(providerId)
        console.log('Fetched provider brands:', brands)
        setProviderBrands(Array.isArray(brands) ? brands : [])

        // Cargar todas las marcas
        const allBrandsData = await fetchBrand()
        console.log('Fetched all brands:', allBrandsData)
        setAllBrands(Array.isArray(allBrandsData) ? allBrandsData : [])

        // Cargar compras del proveedor
        const purchasesData = await fetchPurchasesByProvider(providerId)
        console.log('Fetched provider purchases:', purchasesData)
        setPurchases(Array.isArray(purchasesData) ? purchasesData : [])

        // Cargar movimientos de cuenta del proveedor
        try {
          const movementsData = await accountMovementsService.getProviderMovements(providerId)
          console.log('Fetched provider movements:', movementsData)
          setMovements(Array.isArray(movementsData.movements) ? movementsData.movements : [])
        } catch (movementsError) {
          console.warn('Error loading movements:', movementsError)
          setMovements([])
        }

        // Calculate provider balance (total pending payments)
        const [movementsResponse, balanceResponse] = await Promise.all([
          accountMovementsService.getProviderMovements(providerId),
          accountMovementsService.getProviderBalance(providerId)
        ])

        if (movementsResponse.success) {
          setMovements(movementsResponse.movements || [])
        }

        if (balanceResponse.success) {
          setProviderBalance(balanceResponse.balance || 0)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Error al cargar la información')
      } finally {
        setLoading(false)
        setLoadingPurchases(false)
        setLoadingMovements(false)
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

    // Check if brand name already exists
    const brandExists = allBrands.some(
      (brand) => brand.brand_name.toLowerCase() === brandFormData.brand_name.toLowerCase()
    )

    if (brandExists) {
      toast.error(`Ya existe una marca con el nombre "${brandFormData.brand_name}"`)
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
        try {
          // Try to assign the brand to the provider
          await assignBrandToProvider(providerId, brandResponse.brand_id)

          const brands = await fetchBrandByProviders(providerId)
          setProviderBrands(Array.isArray(brands) ? brands : [])

          toast.success('Marca creada y asignada exitosamente')
        } catch (assignError) {
          console.error('Error assigning brand to provider:', assignError)

          // Even if assignment fails, the brand was created successfully
          if (assignError.response?.data?.error_type === 'duplicate_assignment') {
            toast('Marca creada, pero ya estaba asignada a este proveedor', {
              icon: '⚠️',
              style: {
                borderRadius: '10px',
                background: '#f59e0b',
                color: '#fff'
              }
            })
          } else {
            toast('Marca creada exitosamente, pero hubo un error al asignarla al proveedor', {
              icon: '⚠️',
              style: {
                borderRadius: '10px',
                background: '#f59e0b',
                color: '#fff'
              }
            })
          }

          const brands = await fetchBrandByProviders(providerId)
          setProviderBrands(Array.isArray(brands) ? brands : [])
        }
      } else {
        toast.success('Marca creada exitosamente')
      }

      setShowCreateBrandModal(false)
      setBrandFormData({ brand_name: '', description: '' })

      const allBrandsData = await fetchBrand()
      setAllBrands(Array.isArray(allBrandsData) ? allBrandsData : [])
    } catch (error) {
      console.error('Error creating brand:', error)

      if (error.response?.data?.error_type === 'duplicate_brand_name') {
        toast.error(`Ya existe una marca con el nombre "${brandFormData.brand_name}"`)
      } else if (error.response?.data?.mensaje) {
        toast.error(error.response.data.mensaje)
      } else if (error.response?.status === 400) {
        toast.error('Datos inválidos. Verifica la información ingresada.')
      } else {
        toast.error('Error al crear la marca')
      }
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

  const handleViewPurchaseDetails = (purchaseId) => {
    setSelectedPurchaseId(purchaseId)
    setShowPurchaseDetails(true)
  }

  const handleClosePurchaseDetails = () => {
    setShowPurchaseDetails(false)
    setSelectedPurchaseId(null)
  }

  const handlePurchaseUpdate = async () => {
    try {
      setLoadingPurchases(true)
      setLoadingMovements(true)
      const purchasesData = await fetchPurchasesByProvider(providerId)
      setPurchases(Array.isArray(purchasesData) ? purchasesData : [])

      // Reload movements as well
      try {
        const movementsData = await accountMovementsService.getProviderMovements(providerId)
        setMovements(Array.isArray(movementsData.movements) ? movementsData.movements : [])
      } catch (movementsError) {
        console.warn('Error reloading movements:', movementsError)
      }

      // Recalculate provider balance
      if (Array.isArray(purchasesData)) {
        const pendingAmount = purchasesData
          .filter(
            (purchase) => purchase.status === 'Pendiente de pago' || purchase.status === 'Pendiente'
          )
          .reduce((total, purchase) => total + (purchase.total || 0), 0)
        setProviderBalance(pendingAmount)
      }
    } catch (error) {
      console.error('Error reloading purchases:', error)
    } finally {
      setLoadingPurchases(false)
      setLoadingMovements(false)
    }
  }

  const handleOperationDoubleClick = (operation) => {
    setSelectedOperation(operation)
    setShowOperationDetails(true)
  }

  const handleCloseOperationDetails = () => {
    setShowOperationDetails(false)
    setSelectedOperation(null)
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

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto max-w-7xl p-6">
        <div className="mb-6 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-primary to-secondary p-6 text-white shadow-lg">
          <button
            className="tooltip tooltip-bottom rounded-full bg-orange-600 px-3 py-2 hover:bg-orange-500"
            data-tip="Volver"
            onClick={() => setLocation('/proveedores')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h3 className="text-3xl font-bold">{provider?.entity_name}</h3>
            <p className="mt-1 text-blue-100">Información del proveedor</p>
          </div>
        </div>
        <div className="card mb-6 bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                <button
                  className="btn btn-primary gap-2 shadow-md transition-all hover:shadow-lg"
                  onClick={() => document.getElementById('editandoProvider').showModal()}
                >
                  <Pencil className="h-4 w-4" />
                  Editar Proveedor
                </button>
                <button
                  className="btn btn-error gap-2 shadow-md transition-all hover:shadow-lg"
                  onClick={() => document.getElementById('eliminandoProvider').showModal()}
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar Proveedor
                </button>
              </div>
            </div>

            {provider && (
              <div className="overflow-x-auto rounded-lg">
                <table className="table w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600">
                      <th className="text-slate-700 dark:text-slate-200">Empresa</th>
                      <th className="text-slate-700 dark:text-slate-200">CUIT</th>
                      <th className="text-slate-700 dark:text-slate-200">Teléfono</th>
                      <th className="text-slate-700 dark:text-slate-200">Contacto</th>
                      <th className="text-slate-700 dark:text-slate-200">Email</th>
                      <th className="text-slate-700 dark:text-slate-200">Razón Social</th>
                      <th className="text-slate-700 dark:text-slate-200">Dirección</th>
                      <th className="text-slate-700 dark:text-slate-200">Resp. IVA</th>
                      <th className="text-slate-700 dark:text-slate-200">Inicio Act.</th>
                      <th className="text-slate-700 dark:text-slate-200">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700">
                      <td className="font-medium">{provider?.entity_name}</td>
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
            )}
          </div>
        </div>
        <div>
          <hr className="my-6 border-slate-200 dark:border-slate-600" />

          {/* Brands Section - Slideable */}
          <div className="card mb-6 bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="flex items-center gap-2 text-2xl font-bold text-primary">
                    <Package className="h-6 w-6 text-primary" />
                    Marcas del Proveedor
                  </h2>
                  <button
                    className="btn btn-ghost btn-sm px-3 py-2 hover:bg-primary/10"
                    onClick={() => setShowBrands(!showBrands)}
                  >
                    {showBrands ? (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn btn-success btn-sm gap-2 shadow-md transition-all hover:shadow-lg"
                    onClick={() => setShowCreateBrandModal(true)}
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4" />
                    Nueva Marca
                  </button>
                  <button
                    className="btn btn-primary btn-sm gap-2 shadow-md transition-all hover:shadow-lg"
                    onClick={() => setShowAssignBrandModal(true)}
                    disabled={loading}
                  >
                    <Users className="h-4 w-4" />
                    Asignar Marca
                  </button>
                </div>
              </div>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${showBrands ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
              >
                <div className="overflow-x-auto rounded-lg">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center gap-3">
                        <div className="loading loading-spinner loading-md"></div>
                        <span className="text-slate-600 dark:text-slate-300">
                          Cargando marcas...
                        </span>
                      </div>
                    </div>
                  ) : (
                    <table className="table table-zebra w-full">
                      <thead>
                        <tr className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600">
                          <th className="text-slate-700 dark:text-slate-200">ID</th>
                          <th className="text-slate-700 dark:text-slate-200">Nombre</th>
                          <th className="text-slate-700 dark:text-slate-200">Descripción</th>
                          <th className="text-slate-700 dark:text-slate-200">Fecha Creación</th>
                          <th className="text-slate-700 dark:text-slate-200">
                            Última Modificación
                          </th>
                          <th className="text-slate-700 dark:text-slate-200">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(providerBrands) && providerBrands.length > 0 ? (
                          providerBrands.map((brand) => (
                            <tr
                              key={brand.id}
                              className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                              <td className="font-medium">{brand.id}</td>
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
                                    className="tooltip tooltip-top btn btn-ghost btn-sm text-blue-600 hover:bg-blue-50"
                                    data-tip="Editar Marca"
                                    disabled={loading}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveBrand(brand.id)}
                                    className="tooltip tooltip-top btn btn-ghost btn-sm text-orange-600 hover:bg-orange-50"
                                    data-tip="Remover Marca"
                                    disabled={loading}
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBrand(brand.id)}
                                    className="tooltip tooltip-top btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
                                    data-tip="Eliminar Marca"
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
                            <td colSpan="6" className="py-8 text-center">
                              <div className="text-slate-500 dark:text-slate-400">
                                <Package className="mx-auto mb-2 h-12 w-12 opacity-50" />
                                No hay marcas asignadas a este proveedor
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/*  */}
        <div className="card mb-6 bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="flex items-center gap-2 text-2xl font-bold text-primary">
                  <Handshake className="h-6 w-6 text-primary" />
                  Operaciones
                </h2>
                <button
                  className="btn btn-ghost btn-sm px-3 py-2 hover:bg-primary/10"
                  onClick={() => setShowPurchases(!showPurchases)}
                >
                  {showPurchases ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Saldo actual:</div>
                  <div
                    className={`text-2xl font-bold ${providerBalance > 0 ? 'text-red-600' : providerBalance < 0 ? 'text-green-600' : 'text-gray-600'}`}
                  >
                    ${Number(providerBalance || 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {providerBalance > 0
                      ? 'Debemos'
                      : providerBalance < 0
                        ? 'A nuestro favor'
                        : 'Sin deuda'}
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${showPurchases ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className="mb-4 flex flex-wrap justify-end gap-2">
                <button
                  className="btn btn-accent gap-2 shadow-md transition-all hover:shadow-lg"
                  onClick={() => setLocation('agregandoCompraProveedor')}
                >
                  <ShoppingBasket className="h-4 w-4" />
                  Agregar compra
                </button>
                <button
                  className="btn btn-primary gap-2 shadow-md transition-all hover:shadow-lg"
                  onClick={() => document.getElementById('agregandoPago').showModal()}
                >
                  <HandCoins className="h-4 w-4" />
                  Agregar pago
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg">
                <h3 className="mb-4 text-lg font-semibold text-primary">Historial de Compras</h3>
                {loadingPurchases ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-3">
                      <div className="loading loading-spinner loading-md"></div>
                      <span className="text-slate-600 dark:text-slate-300">
                        Cargando compras...
                      </span>
                    </div>
                  </div>
                ) : (
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600">
                        <th className="text-slate-700 dark:text-slate-200">N° Op.</th>
                        <th className="text-slate-700 dark:text-slate-200">Fecha</th>
                        <th className="text-slate-700 dark:text-slate-200">Tipo</th>
                        <th className="text-slate-700 dark:text-slate-200">Descripción</th>
                        <th className="text-slate-700 dark:text-slate-200">Debe</th>
                        <th className="text-slate-700 dark:text-slate-200">Haber</th>
                        <th className="text-slate-700 dark:text-slate-200">Saldo</th>
                        <th className="text-slate-700 dark:text-slate-200">Método Pago</th>
                        <th className="text-slate-700 dark:text-slate-200">Comprobante</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(movements) && movements.length > 0 ? (
                        movements.map((movement) => {
                          const movementType = formatMovementType(movement)
                          return (
                            <tr
                              key={movement.id}
                              className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
                              onDoubleClick={() => handleOperationDoubleClick(movement)}
                            >
                              <td className="font-mono font-medium">
                                #{movement.numero_operacion}
                              </td>
                              <td>
                                {movement.created_at
                                  ? new Date(movement.created_at).toLocaleDateString('es-AR')
                                  : 'N/A'}
                              </td>
                              <td>
                                <span className={`badge ${movementType.badge} badge-sm`}>
                                  {movementType.label}
                                </span>
                              </td>
                              <td className="max-w-xs truncate">
                                {movement.descripcion || 'Sin descripción'}
                              </td>
                              <td className="text-right font-mono">
                                <span
                                  className={
                                    movement.debe > 0 ? 'font-bold text-red-600' : 'text-gray-400'
                                  }
                                >
                                  {formatCurrency(movement.debe)}
                                </span>
                              </td>
                              <td className="text-right font-mono">
                                <span
                                  className={
                                    movement.haber > 0
                                      ? 'font-bold text-green-600'
                                      : 'text-gray-400'
                                  }
                                >
                                  {formatCurrency(movement.haber)}
                                </span>
                              </td>
                              <td className="text-right font-mono font-bold">
                                <span
                                  className={
                                    movement.saldo > 0
                                      ? 'text-red-600'
                                      : movement.saldo < 0
                                        ? 'text-green-600'
                                        : 'text-gray-600'
                                  }
                                >
                                  {formatCurrency(movement.saldo)}
                                </span>
                              </td>
                              <td className="capitalize">{movement.medio_pago || 'N/A'}</td>
                              <td className="font-mono text-sm">
                                {movement.numero_de_comprobante || '-'}
                              </td>
                            </tr>
                          )
                        })
                      ) : (
                        <tr>
                          <td colSpan="9" className="py-8 text-center">
                            <div className="text-slate-500 dark:text-slate-400">
                              <Receipt className="mx-auto mb-2 h-12 w-12 opacity-50" />
                              No hay movimientos registrados
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account Movements Section */}

        <div className="mb-6 flex justify-center">
          <button
            className="btn btn-primary btn-wide gap-2 shadow-lg transition-all hover:shadow-xl"
            onClick={() => setLocation('/proveedores')}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Proveedores
          </button>
        </div>

        {/* Modals */}
        <EditarProveedorModal provider={provider} />
        <AgregarPagoModal provider={provider} onPaymentAdded={handlePurchaseUpdate} />
        <EliminarProveedorModal provider={provider} />

        {/* Crear Marca */}
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
                    className="input-bordered input w-full"
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
                    className="textarea-bordered textarea w-full"
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

        {/* Editar marca */}
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
                    className="input-bordered input w-full"
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
                    className="textarea-bordered textarea w-full"
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

        {/* Modal de marca*/}
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
                      className="input-bordered input w-full"
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

        <PurchaseDetailsModal
          purchaseId={selectedPurchaseId}
          isOpen={showPurchaseDetails}
          onClose={handleClosePurchaseDetails}
          onUpdate={handlePurchaseUpdate}
        />

        <OperationDetailsModal
          operation={selectedOperation}
          isOpen={showOperationDetails}
          onClose={handleCloseOperationDetails}
        />

        <Toaster position="bottom-right" />
      </div>
    </div>
  )
}
