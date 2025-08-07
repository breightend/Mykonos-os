import { useEffect, useState, useCallback } from 'react'
import { pinwheel } from 'ldrs'
import inventoryService from '../../services/inventory/inventoryService'
import { salesService } from '../../services/salesService'
import { useLocation } from 'wouter'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Package,
  CheckSquare,
  Square,
  ArrowRight,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Scan,
  Plus,
  Minus,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { useSession } from '../../contexts/SessionContext'

pinwheel.register()
//TODO: hacer que ande! Y que se conecten entre sucursales
export default function MoveInventory() {
  const [storageList, setStorageList] = useState([]) // Lista de sucursales
  const [selectedVariants, setSelectedVariants] = useState([]) // Variantes seleccionadas para mover
  const [selectedDestination, setSelectedDestination] = useState('') // Sucursal seleccionada
  const [, setLocation] = useLocation()
  const [loading, setLoading] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [error, setError] = useState(null)
  const [step, setStep] = useState(1) // 1: Seleccionar productos, 2: Seleccionar destino
  const [showPendingShipments, setShowPendingShipments] = useState(false)
  const [showSentShipments, setShowSentShipments] = useState(false)
  const [pendingShipments, setPendingShipments] = useState([])
  const [sentShipments, setSentShipments] = useState([])
  const [loadingShipments, setLoadingShipments] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState('')
  const [searchingBarcode, setSearchingBarcode] = useState(false)
  const [availableVariants, setAvailableVariants] = useState([]) // Variantes disponibles del producto actual

  // Estados para el modal de productos
  const [showProductModal, setShowProductModal] = useState(false)
  const [selectedShipmentProducts, setSelectedShipmentProducts] = useState([])
  const [selectedShipmentInfo, setSelectedShipmentInfo] = useState(null)

  // Estado para manejar filas expandidas en envíos realizados
  const [expandedSentShipments, setExpandedSentShipments] = useState(new Set())

  const { getCurrentStorage } = useSession()
  const currentStorage = getCurrentStorage()

  // Función para limpiar y validar el color hex (similar a ProductDetailModal)
  const getValidHexColor = (hexValue) => {
    if (!hexValue) return '#6B7280' // fallback gris

    // Limpiar espacios y caracteres invisibles
    const cleanHex = hexValue.toString().trim()

    // Verificar si es un formato hex válido
    const hexRegex = /^#[0-9A-Fa-f]{6}$/

    if (hexRegex.test(cleanHex)) {
      return cleanHex
    }

    // Si no tiene # al inicio pero tiene 6 caracteres hex válidos, agregarlo
    const hexWithoutHash = cleanHex.replace('#', '')
    if (/^[0-9A-Fa-f]{6}$/.test(hexWithoutHash)) {
      return `#${hexWithoutHash}`
    }

    console.warn('Color hex inválido:', hexValue, 'usando fallback')
    return '#6B7280' // fallback gris
  }

  // Buscar producto por código de barras de variante
  const searchByBarcode = async (barcode) => {
    if (!barcode.trim()) return

    try {
      setSearchingBarcode(true)
      console.log('🔍 Buscando por código de barras:', barcode)

      const response = await salesService.getProductByVariantBarcode(barcode)

      if (response.status === 'success' && response.data) {
        const variantData = response.data

        // Verificar que la variante pertenece a la sucursal actual
        if (variantData.sucursal_id !== currentStorage?.id) {
          alert(
            `❌ Esta variante pertenece a la sucursal "${variantData.sucursal_nombre}", no a la actual`
          )
          return
        }

        // Verificar si ya está seleccionada
        const isAlreadySelected = selectedVariants.find(
          (v) => v.variant_id === variantData.variant_id
        )

        if (isAlreadySelected) {
          alert('⚠️ Esta variante ya está seleccionada')
          return
        }

        // Agregar a variantes seleccionadas
        const newVariant = {
          variant_id: variantData.variant_id,
          product_id: variantData.product_id,
          product_name: variantData.product_name,
          brand_name: variantData.brand_name,
          size_name: variantData.size_name,
          color_name: variantData.color_name,
          color_hex: variantData.color_hex,
          variant_barcode: variantData.variant_barcode,
          available_stock: variantData.stock_disponible,
          move_quantity: 1,
          size_id: variantData.size_id,
          color_id: variantData.color_id
        }

        setSelectedVariants((prev) => [...prev, newVariant])
        setBarcodeInput('')
        console.log('✅ Variante agregada:', newVariant)
      }
    } catch (error) {
      console.error('❌ Error buscando por código de barras:', error)
      if (error.message.includes('404')) {
        alert('❌ Producto no encontrado o sin stock disponible')
      } else {
        alert('❌ Error al buscar el producto: ' + error.message)
      }
    } finally {
      setSearchingBarcode(false)
    }
  }

  // Manejar input de código de barras
  const handleBarcodeInput = (e) => {
    const value = e.target.value
    setBarcodeInput(value)

    // Auto-buscar cuando se presiona Enter o se completa un código típico
    if (e.key === 'Enter' || (value.length >= 10 && value.startsWith('VAR'))) {
      searchByBarcode(value)
    }
  }

  // Cargar variantes disponibles de productos
  const loadAvailableVariants = useCallback(async () => {
    if (!currentStorage?.id) {
      setError('No hay sucursal actual seleccionada')
      return
    }

    try {
      setLoadingProducts(true)
      console.log('📦 Cargando variantes disponibles de sucursal:', currentStorage.id)

      const response = await inventoryService.getProductsSummary(currentStorage.id)

      if (response.status === 'success' && response.data) {
        // Para cada producto, obtener sus variantes detalladas
        const allVariants = []

        for (const product of response.data) {
          if (product.cantidad_total > 0) {
            try {
              const detailResponse = await inventoryService.getProductDetails(product.id)
              if (detailResponse.status === 'success' && detailResponse.data.stock_variants) {
                const productVariants = detailResponse.data.stock_variants
                  .filter(
                    (variant) =>
                      variant.sucursal_id === currentStorage.id &&
                      variant.quantity > 0 &&
                      variant.variant_barcode
                  )
                  .map((variant) => ({
                    variant_id: variant.id,
                    product_id: product.id,
                    product_name: product.producto,
                    brand_name: product.marca,
                    size_name: variant.size_name,
                    color_name: variant.color_name,
                    color_hex: variant.color_hex,
                    variant_barcode: variant.variant_barcode,
                    available_stock: variant.quantity,
                    size_id: variant.size_id,
                    color_id: variant.color_id
                  }))

                allVariants.push(...productVariants)
              }
            } catch (detailError) {
              console.warn('⚠️ Error cargando detalles del producto:', product.id, detailError)
            }
          }
        }

        setAvailableVariants(allVariants)
        setError(null)
        console.log('✅ Variantes cargadas:', allVariants.length)
      } else {
        setError('No se pudieron cargar las variantes')
      }
    } catch (error) {
      console.error('❌ Error cargando variantes:', error)
      setError(error.message || 'Error al cargar variantes')
    } finally {
      setLoadingProducts(false)
    }
  }, [currentStorage?.id])

  // Agregar variante desde la lista
  const addVariantFromList = (variant) => {
    // Verificar si ya está seleccionada
    const isAlreadySelected = selectedVariants.find((v) => v.variant_id === variant.variant_id)

    if (isAlreadySelected) {
      alert('⚠️ Esta variante ya está seleccionada')
      return
    }

    const newVariant = {
      ...variant,
      move_quantity: 1
    }

    setSelectedVariants((prev) => [...prev, newVariant])
  }

  // Remover variante seleccionada
  const removeSelectedVariant = (variantId) => {
    setSelectedVariants((prev) => prev.filter((v) => v.variant_id !== variantId))
  }

  // Actualizar cantidad a mover
  const updateMoveQuantity = (variantId, quantity) => {
    setSelectedVariants((prev) =>
      prev.map((v) =>
        v.variant_id === variantId
          ? {
              ...v,
              move_quantity: Math.min(Math.max(1, parseInt(quantity) || 1), v.available_stock)
            }
          : v
      )
    )
  }

  const handleDestinationChange = (event) => {
    setSelectedDestination(event.target.value)
  }

  const loadProductsFromCurrentStorage = async () => {
    if (!currentStorage?.id) {
      setError('No hay sucursal actual seleccionada')
      return
    }

    try {
      setLoadingProducts(true)
      console.log('📦 Cargando productos de sucursal actual:', currentStorage.id)

      const response = await inventoryService.getProductsSummary(currentStorage.id)
      console.log('📦 Productos recibidos:', response)

      if (response.status === 'success' && response.data) {
        // Filtrar solo productos con stock > 0
        const productsWithStock = response.data.filter((product) => product.cantidad_total > 0)
        setProductsList(productsWithStock)
        setError(null) // Limpiar errores previos
      } else {
        setError('No se pudieron cargar los productos')
      }
    } catch (error) {
      console.error('❌ Error cargando productos:', error)
      setError(error.message || 'Error al cargar productos')
    } finally {
      setLoadingProducts(false)
    }
  }

  const loadSentShipments = async () => {
    try {
      setLoadingShipments(true)
      if (currentStorage?.id) {
        console.log('📤 Cargando envíos realizados desde sucursal:', currentStorage.id)
        const response = await inventoryService.getSentShipments(currentStorage.id)

        console.log('🔍 DEBUG: Respuesta completa de getSentShipments:', response)

        if (response.status === 'success' && response.data) {
          console.log('🔍 DEBUG: Datos de envíos recibidos:', response.data)

          // Log detallado de la estructura de cada envío
          response.data.forEach((shipment, index) => {
            console.log(`🔍 DEBUG: Envío ${index + 1} (ID: ${shipment.id}):`, {
              shipment_structure: Object.keys(shipment),
              products_count: shipment.products?.length || 0,
              products_structure: shipment.products?.map((p, idx) => ({
                index: idx,
                keys: Object.keys(p),
                data: p
              }))
            })
          })

          // Procesar cada envío y enriquecer los productos
          const enrichedShipments = response.data.map((shipment) => {
            console.log('🔍 DEBUG: Procesando envío:', shipment.id)

            // Por ahora, NO procesar nada, solo devolver tal como viene del backend
            console.log('� Envío tal como viene del backend:', shipment)

            return {
              ...shipment,
              // Si los productos ya tienen la información completa, usarla
              products: (shipment.products || []).map((product, index) => {
                console.log(`📦 Producto ${index + 1} original del backend:`, product)

                // Devolver exactamente como viene del backend
                return {
                  ...product
                }
              })
            }
          })

          setSentShipments(response.data)
          console.log('✅ Envíos realizados cargados con información completa:', response.data)
        } else {
          console.log('⚠️ No se recibieron datos de envíos o respuesta fallida')
          setSentShipments([])
        }
      }
    } catch (error) {
      console.error('❌ Error cargando envíos salientes:', error)
      setError(error.message || 'Error al cargar envíos salientes')

      // Mostrar datos de ejemplo mejorados en caso de error (para desarrollo)
      console.log('🧪 Usando datos mock debido a error')
      const mockSentShipments = [
        {
          id: 3,
          fromStorage: currentStorage?.name || 'Mi Sucursal',
          toStorage: 'Sucursal Norte',
          products: [
            {
              name: 'Zapatillas Nike Air Max',
              quantity: 2,
              brand: 'Nike',
              sale_price: 89999,
              cost: 45000,
              size: '42',
              color: 'Negro',
              color_hex: '#000000',
              variant_barcode: 'VAR0001042001'
            },
            {
              name: 'Remera Adidas Classic',
              quantity: 5,
              brand: 'Adidas',
              sale_price: 25999,
              cost: 12000,
              size: 'L',
              color: 'Blanco',
              color_hex: '#FFFFFF',
              variant_barcode: 'VAR0002003002'
            }
          ],
          status: 'empacado',
          createdAt: '2024-01-16'
        },
        {
          id: 4,
          fromStorage: currentStorage?.name || 'Mi Sucursal',
          toStorage: 'Sucursal Sur',
          products: [
            {
              name: "Pantalón Levi's 501",
              quantity: 1,
              brand: "Levi's",
              sale_price: 67999,
              cost: 34000,
              size: '32',
              color: 'Azul',
              color_hex: '#1E40AF',
              variant_barcode: 'VAR0003032003'
            }
          ],
          status: 'en_transito',
          createdAt: '2024-01-15'
        }
      ]
      setSentShipments(mockSentShipments)
    } finally {
      setLoadingShipments(false)
    }
  }

  const updateSentShipmentStatus = async (shipmentId, newStatus) => {
    try {
      const response = await inventoryService.updateShipmentStatus(shipmentId, newStatus)

      if (response.status === 'success') {
        setSentShipments((prev) =>
          prev.map((shipment) =>
            shipment.id === shipmentId ? { ...shipment, status: newStatus } : shipment
          )
        )
        console.log(`✅ Envío ${shipmentId} actualizado a estado: ${newStatus}`)
      }
    } catch (error) {
      console.error('❌ Error actualizando estado del envío:', error)
      // Actualizar localmente mientras tanto
      setSentShipments((prev) =>
        prev.map((shipment) =>
          shipment.id === shipmentId ? { ...shipment, status: newStatus } : shipment
        )
      )
    }
  }

  const loadPendingShipments = async () => {
    try {
      setLoadingShipments(true)
      if (currentStorage?.id) {
        console.log(`🔍 Cargando envíos pendientes para sucursal ${currentStorage.id}...`)
        const response = await inventoryService.getPendingShipments(currentStorage.id)
        console.log('📦 Respuesta de envíos pendientes:', response)

        if (response.status === 'success' && response.data) {
          setPendingShipments(response.data)
          console.log(`✅ ${response.data.length} envíos pendientes cargados`)
        } else {
          console.log('⚠️ No se encontraron envíos pendientes o respuesta inválida')
          setPendingShipments([])
        }
      }
    } catch (error) {
      console.error('❌ Error cargando envíos pendientes:', error)
      setError(error.message || 'Error al cargar envíos pendientes')

      // Solo mostrar datos mock en caso de error de conexión
      if (error.message?.includes('Network Error') || error.code === 'NETWORK_ERROR') {
        console.log('🧪 Mostrando datos mock debido a error de red')
        const mockShipments = [
          {
            id: 1,
            fromStorage: 'Sucursal Centro',
            toStorage: currentStorage?.name || 'Mi Sucursal',
            products: [
              { name: 'Producto A', quantity: 5 },
              { name: 'Producto B', quantity: 3 }
            ],
            status: 'en_transito',
            createdAt: '2024-01-15'
          },
          {
            id: 2,
            fromStorage: 'Sucursal Norte',
            toStorage: currentStorage?.name || 'Mi Sucursal',
            products: [{ name: 'Producto C', quantity: 2 }],
            status: 'empacado',
            createdAt: '2024-01-14'
          }
        ]
        setPendingShipments(mockShipments)
      } else {
        setPendingShipments([])
      }
    } finally {
      setLoadingShipments(false)
    }
  }

  // Función para crear envíos de prueba (temporal)
  const createTestShipments = async () => {
    try {
      console.log('🧪 Creando envíos de prueba...')
      const response = await inventoryService.createTestShipments()

      if (response.status === 'success') {
        toast.success('✅ Envíos de prueba creados exitosamente')
        // Recargar envíos pendientes
        await loadPendingShipments()
      } else {
        toast.error(
          '❌ Error al crear envíos de prueba: ' + (response.message || 'Error desconocido')
        )
      }
    } catch (error) {
      console.error('❌ Error creando envíos de prueba:', error)
      toast.error('❌ Error al crear envíos de prueba: ' + error.message)
    }
  }

  const markShipmentReceived = async (shipmentId, received) => {
    try {
      const status = received ? 'recibido' : 'no_recibido'
      console.log(`🔄 Actualizando envío ${shipmentId} a estado: ${status}`)

      const response = await inventoryService.updateShipmentStatus(shipmentId, status)

      if (response.status === 'success') {
        setPendingShipments((prev) =>
          prev.map((shipment) =>
            shipment.id === shipmentId ? { ...shipment, status: status } : shipment
          )
        )
        toast.success(`✅ Envío ${received ? 'recibido' : 'marcado como no recibido'} exitosamente`)
        console.log(`✅ Envío ${shipmentId} marcado como ${status}`)
      } else {
        toast.error('❌ Error al actualizar estado: ' + (response.message || 'Error desconocido'))
      }
    } catch (error) {
      console.error('❌ Error actualizando estado del envío:', error)
      toast.error('❌ Error al actualizar estado: ' + error.message)

      // Actualizar localmente solo si es un error temporal
      if (error.message?.includes('Network Error')) {
        setPendingShipments((prev) =>
          prev.map((shipment) =>
            shipment.id === shipmentId
              ? { ...shipment, status: received ? 'recibido' : 'no_recibido' }
              : shipment
          )
        )
      }
    }
  }

  // Función para marcar envío como en proceso (cuando sale de la sucursal origen)
  const markShipmentInTransit = async (shipmentId) => {
    try {
      console.log(`🚚 Marcando envío ${shipmentId} como en tránsito`)

      const response = await inventoryService.updateShipmentStatus(shipmentId, 'en_transito')

      if (response.status === 'success') {
        setPendingShipments((prev) =>
          prev.map((shipment) =>
            shipment.id === shipmentId ? { ...shipment, status: 'en_transito' } : shipment
          )
        )
        toast.success('✅ Envío marcado como en tránsito')
      } else {
        toast.error('❌ Error al actualizar estado: ' + (response.message || 'Error desconocido'))
      }
    } catch (error) {
      console.error('❌ Error actualizando estado del envío:', error)
      toast.error('❌ Error al actualizar estado: ' + error.message)
    }
  }

  // Función para abrir el modal de productos
  const openProductModal = (shipment) => {
    setSelectedShipmentProducts(shipment.products)
    setSelectedShipmentInfo(shipment)
    setShowProductModal(true)
  }

  // Función para cerrar el modal de productos
  const closeProductModal = () => {
    setShowProductModal(false)
    setSelectedShipmentProducts([])
    setSelectedShipmentInfo(null)
  }

  // Funciones para manejar la expansión de productos en envíos realizados
  const toggleSentShipmentExpansion = (shipmentId) => {
    setExpandedSentShipments((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(shipmentId)) {
        newSet.delete(shipmentId)
      } else {
        newSet.add(shipmentId)
      }
      return newSet
    })
  }

  const executeMovement = async () => {
    if (!selectedDestination || selectedVariants.length === 0) return

    try {
      console.log('🚚 Ejecutando movimiento de variantes:', selectedVariants)

      // Preparar datos para el movimiento de variantes
      const variants = selectedVariants.map((variant) => ({
        variant_id: variant.variant_id,
        product_id: variant.product_id,
        size_id: variant.size_id,
        color_id: variant.color_id,
        quantity: variant.move_quantity,
        variant_barcode: variant.variant_barcode
      }))

      const response = await inventoryService.createVariantMovement(
        currentStorage.id,
        selectedDestination,
        variants
      )

      if (response.status === 'success') {
        toast.success('✅ Movimiento de variantes ejecutado exitosamente')
        resetSelection()
      } else {
        toast.error(
          '❌ Error al ejecutar el movimiento: ' + (response.message || 'Error desconocido')
        )
      }
    } catch (error) {
      console.error('❌ Error ejecutando movimiento:', error)
      alert('❌ Error al ejecutar el movimiento: ' + error.message)
    }
  }

  const handleProductSelect = (product) => {
    // Esta función ya no se usa con el nuevo sistema de variantes
    console.log('handleProductSelect deprecated, use addVariantFromList instead')
  }

  const handleQuantityChange = (productId, quantity) => {
    // Esta función ya no se usa con el nuevo sistema de variantes
    console.log('handleQuantityChange deprecated, use updateMoveQuantity instead')
  }

  const handleSelectAllProducts = () => {
    // Seleccionar todas las variantes disponibles
    if (selectedVariants.length === availableVariants.length) {
      // Deseleccionar todas
      setSelectedVariants([])
    } else {
      // Seleccionar todas con cantidad 1
      setSelectedVariants(availableVariants.map((variant) => ({ ...variant, move_quantity: 1 })))
    }
  }

  const isProductSelected = (productId) => {
    // Verificar si alguna variante del producto está seleccionada
    return selectedVariants.some((v) => v.product_id === productId)
  }

  const proceedToDestination = () => {
    if (selectedVariants.length > 0) {
      // Auto-seleccionar destino si solo hay una sucursal disponible
      const availableStorages = storageList.filter((storage) => storage[0] != currentStorage?.id)

      if (availableStorages.length === 1) {
        setSelectedDestination(availableStorages[0][0])
        console.log(`✅ Auto-seleccionada única sucursal de destino: ${availableStorages[0][1]}`)
      }

      setStep(2)
    }
  }

  const resetSelection = () => {
    setStep(1)
    setSelectedDestination('')
    setSelectedVariants([])
    setAvailableVariants([])
    setBarcodeInput('')
    setShowPendingShipments(false)
    setShowSentShipments(false)
  }

  const startProductSelection = () => {
    setShowPendingShipments(false)
    setShowSentShipments(false)
    setStep(1)
    loadAvailableVariants()
  }

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('🏪 Cargando datos iniciales...')

        // Cargar sucursales
        const storageResponse = await inventoryService.getStorageList()
        console.log('🏪 Respuesta sucursales:', storageResponse)

        if (storageResponse.status === 'success' && storageResponse.data) {
          console.log('🏪 Sucursales recibidas:', storageResponse.data)
          setStorageList(storageResponse.data)
        } else {
          console.error('❌ Respuesta inesperada:', storageResponse)
          setError('Formato de respuesta inesperado')
        }

        // Cargar variantes disponibles si tenemos currentStorage
        if (currentStorage?.id) {
          await loadAvailableVariants()
        }
      } catch (error) {
        console.error('❌ Error al cargar datos iniciales:', error)
        setError(error.message || 'Error al cargar datos iniciales')
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [currentStorage?.id]) // Recargar cuando cambie la sucursal actual

  const handleBackClick = () => {
    setLocation('/inventario')
  }

  return (
    <div className="bg-base-100 min-h-screen p-4">
      <div className="mb-4 flex items-center gap-4">
        <button onClick={handleBackClick} className="btn btn-neutral mb-4">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h3 className="text-xl font-bold">Movimiento de Inventario</h3>
      </div>

      {/* Información de la sucursal actual */}
      <div className="bg-base-200 mb-4 rounded-lg p-4">
        <p className="text-sm opacity-70">Sucursal actual:</p>
        <p className="text-lg font-semibold">{currentStorage?.name || 'No seleccionada'}</p>
      </div>

      {/* Loading inicial */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <l-pinwheel size="40" stroke="3" speed="0.9" color="#d97706"></l-pinwheel>
          <span className="ml-3 text-lg">Cargando datos iniciales...</span>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="alert alert-error mb-4">
          <XCircle className="h-5 w-5" />
          <span>{error}</span>
          <button
            className="btn btn-sm btn-outline"
            onClick={() => {
              setError(null)
              if (currentStorage?.id) {
                loadAvailableVariants()
              }
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Botones principales */}
          <div className="mb-6 flex gap-4">
            <button
              onClick={startProductSelection}
              className={`btn ${!showPendingShipments && !showSentShipments && step >= 1 ? 'btn-primary' : 'btn-outline btn-primary'}`}
              disabled={!currentStorage?.id}
            >
              <Package className="h-5 w-5" />
              Enviar Productos
            </button>
            <button
              onClick={() => {
                setShowPendingShipments(true)
                setShowSentShipments(false)
                loadPendingShipments()
              }}
              className={`btn ${showPendingShipments ? 'btn-secondary' : 'btn-outline btn-secondary'}`}
            >
              <Clock className="h-5 w-5" />
              Envíos Pendientes
              {showPendingShipments && <span className="ml-1">📍</span>}
            </button>
            <button
              onClick={() => {
                setShowSentShipments(true)
                setShowPendingShipments(false)
                loadSentShipments()
              }}
              className={`btn ${showSentShipments ? 'btn-accent' : 'btn-outline btn-accent'}`}
            >
              <Truck className="h-5 w-5" />
              Envíos Realizados
              {showSentShipments && <span className="ml-1">📍</span>}
            </button>

            {/* Botón temporal para crear envíos de prueba */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={createTestShipments}
                className="btn btn-outline btn-warning btn-sm"
                title="Crear envíos de prueba (solo desarrollo)"
              >
                🧪 Test Data
              </button>
            )}
          </div>

          {/* Vista de envíos pendientes */}
          {showPendingShipments && (
            <div className="card bg-base-200 mb-6 shadow-xl">
              <div className="card-body">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h4 className="card-title text-secondary">📥 Envíos Pendientes</h4>
                    <div className="badge badge-secondary">Recibiendo</div>
                  </div>
                  <button
                    onClick={() => setShowPendingShipments(false)}
                    className="btn btn-ghost btn-sm"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                  </button>
                </div>

                {loadingShipments && (
                  <div className="flex items-center gap-3">
                    <l-pinwheel size="25" stroke="2.5" speed="0.9" color="#d97706"></l-pinwheel>
                    <span className="text-warning font-medium">Cargando envíos pendientes...</span>
                  </div>
                )}

                {!loadingShipments && pendingShipments.length === 0 && (
                  <div className="py-8 text-center">
                    <Truck className="mx-auto mb-2 h-12 w-12 opacity-50" />
                    <p>No hay envíos pendientes</p>
                  </div>
                )}

                {!loadingShipments && pendingShipments.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Desde</th>
                          <th>Productos</th>
                          <th>Estado</th>
                          <th>Fecha</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingShipments.map((shipment) => (
                          <tr key={shipment.id} className="hover">
                            <td>
                              <div className="font-medium">{shipment.fromStorage}</div>
                              <div className="text-sm opacity-70">Envío #{shipment.id}</div>
                            </td>
                            <td>
                              <div className="text-sm">
                                <button
                                  onClick={() => openProductModal(shipment)}
                                  className="btn btn-info btn-xs"
                                  title="Ver detalles de productos"
                                >
                                  📦 Ver Productos
                                </button>
                                <div className="mt-1 text-xs opacity-70">
                                  {shipment.products.length} producto
                                  {shipment.products.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                            </td>
                            <td>
                              <div
                                className={`badge ${
                                  shipment.status === 'en_transito'
                                    ? 'badge-warning'
                                    : shipment.status === 'empacado'
                                      ? 'badge-info'
                                      : shipment.status === 'recibido'
                                        ? 'badge-success'
                                        : shipment.status === 'no_recibido'
                                          ? 'badge-error'
                                          : 'badge-neutral'
                                }`}
                              >
                                {shipment.status === 'en_transito'
                                  ? '🚚 En tránsito'
                                  : shipment.status === 'empacado'
                                    ? '📦 Empacado'
                                    : shipment.status === 'recibido'
                                      ? '✅ Recibido'
                                      : shipment.status === 'no_recibido'
                                        ? '❌ No recibido'
                                        : shipment.status}
                              </div>
                            </td>
                            <td>
                              <div className="text-sm">{shipment.createdAt}</div>
                              {shipment.shippedAt && (
                                <div className="text-xs opacity-70">
                                  Enviado: {shipment.shippedAt}
                                </div>
                              )}
                            </td>
                            <td>
                              <div className="flex flex-col gap-1">
                                {/* Solo mostrar botones de acción para envíos en tránsito */}
                                {shipment.status === 'en_transito' && (
                                  <>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => markShipmentReceived(shipment.id, true)}
                                        className="btn btn-success btn-xs"
                                        title="Marcar como recibido correctamente"
                                      >
                                        ✅ Recibido
                                      </button>
                                      <button
                                        onClick={() => markShipmentReceived(shipment.id, false)}
                                        className="btn btn-error btn-xs"
                                        title="Marcar como no recibido (problemas)"
                                      >
                                        ❌ No recibido
                                      </button>
                                    </div>
                                    <div className="text-center text-xs opacity-70">
                                      ¿Llegó el envío?
                                    </div>
                                  </>
                                )}

                                {/* Estados informativos - no editables */}
                                {shipment.status === 'empacado' && (
                                  <div className="text-center text-xs opacity-70">
                                    📦 Esperando salida
                                  </div>
                                )}

                                {shipment.status === 'recibido' && (
                                  <div className="text-center text-xs opacity-70">
                                    🎉 Envío completado
                                  </div>
                                )}

                                {shipment.status === 'no_recibido' && (
                                  <div className="text-center text-xs opacity-70">
                                    ⚠️ Requiere atención
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vista de envíos realizados */}
          {showSentShipments && (
            <div className="card bg-base-200 mb-6 shadow-xl">
              <div className="card-body">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h4 className="card-title text-accent">📤 Envíos Realizados</h4>
                    <div className="badge badge-accent">Enviando</div>
                  </div>
                  <button
                    onClick={() => setShowSentShipments(false)}
                    className="btn btn-ghost btn-sm"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                  </button>
                </div>

                {loadingShipments && (
                  <div className="flex items-center gap-3">
                    <l-pinwheel size="25" stroke="2.5" speed="0.9" color="#d97706"></l-pinwheel>
                    <span className="text-warning font-medium">Cargando envíos realizados...</span>
                  </div>
                )}

                {!loadingShipments && sentShipments.length === 0 && (
                  <div className="py-8 text-center">
                    <Truck className="mx-auto mb-2 h-12 w-12 opacity-50" />
                    <p>No hay envíos realizados</p>
                  </div>
                )}

                {!loadingShipments && sentShipments.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Hacia</th>
                          <th>Productos</th>
                          <th>Estado</th>
                          <th>Fecha</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sentShipments.map((shipment) => (
                          <>
                            <tr key={shipment.id} className="hover">
                              <td>
                                <div className="font-medium">{shipment.toStorage}</div>
                              </td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => toggleSentShipmentExpansion(shipment.id)}
                                    className="btn btn-ghost btn-xs"
                                    title="Ver/ocultar detalles de productos"
                                  >
                                    {expandedSentShipments.has(shipment.id) ? (
                                      <ChevronDown className="h-3 w-3" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3" />
                                    )}
                                    Más información
                                  </button>
                                  <span className="text-xs opacity-70">
                                    {shipment.products.length} producto
                                    {shipment.products.length !== 1 ? 's' : ''} ({' '}
                                    {shipment.products.reduce((sum, p) => sum + p.quantity, 0)}{' '}
                                    unidades)
                                  </span>
                                </div>
                              </td>
                              <td>
                                <div
                                  className={`badge ${
                                    shipment.status === 'empacado'
                                      ? 'badge-info'
                                      : shipment.status === 'en_transito'
                                        ? 'badge-warning'
                                        : shipment.status === 'entregado' ||
                                            shipment.status === 'recibido'
                                          ? 'badge-success'
                                          : shipment.status === 'cancelado'
                                            ? 'badge-error'
                                            : shipment.status === 'retomado'
                                              ? 'badge-secondary'
                                              : 'badge-neutral'
                                  }`}
                                >
                                  {shipment.status === 'empacado'
                                    ? 'Empacado'
                                    : shipment.status === 'en_transito'
                                      ? 'En tránsito'
                                      : shipment.status === 'entregado'
                                        ? 'Entregado'
                                        : shipment.status === 'cancelado'
                                          ? 'Cancelado'
                                          : shipment.status === 'retomado'
                                            ? 'Retomado'
                                            : shipment.status === 'recibido'
                                              ? 'Recibido'
                                              : shipment.status}
                                </div>
                              </td>
                              <td>{shipment.createdAt}</td>
                              <td>
                                {shipment.status === 'empacado' && (
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      onClick={() =>
                                        updateSentShipmentStatus(shipment.id, 'en_transito')
                                      }
                                      className="btn btn-warning btn-xs"
                                      title="Marcar como en tránsito (envío salió de la sucursal)"
                                    >
                                      🚚 En tránsito
                                    </button>
                                    <button
                                      onClick={() =>
                                        updateSentShipmentStatus(shipment.id, 'cancelado')
                                      }
                                      className="btn btn-error btn-xs"
                                      title="Cancelar envío"
                                    >
                                      ❌ Cancelar
                                    </button>
                                  </div>
                                )}
                                {shipment.status === 'en_transito' && (
                                  <div className="flex flex-wrap gap-2">
                                    <div className="text-sm text-gray-500">
                                      🚚 Envío en camino al destino
                                    </div>
                                    <button
                                      onClick={() =>
                                        updateSentShipmentStatus(shipment.id, 'cancelado')
                                      }
                                      className="btn btn-error btn-xs"
                                      title="Cancelar envío"
                                    >
                                      ❌ Cancelar
                                    </button>
                                  </div>
                                )}
                                {shipment.status === 'cancelado' && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        updateSentShipmentStatus(shipment.id, 'retomado')
                                      }
                                      className="btn btn-info btn-xs"
                                      title="Retomar envío"
                                    >
                                      🔄 Retomar
                                    </button>
                                  </div>
                                )}
                                {shipment.status === 'retomado' && (
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      onClick={() =>
                                        updateSentShipmentStatus(shipment.id, 'en_transito')
                                      }
                                      className="btn btn-warning btn-xs"
                                      title="Marcar como en tránsito"
                                    >
                                      🚚 En tránsito
                                    </button>
                                    <button
                                      onClick={() =>
                                        updateSentShipmentStatus(shipment.id, 'cancelado')
                                      }
                                      className="btn btn-error btn-xs"
                                      title="Cancelar envío nuevamente"
                                    >
                                      ❌ Cancelar
                                    </button>
                                  </div>
                                )}
                                {(shipment.status === 'entregado' ||
                                  shipment.status === 'recibido') && (
                                  <div className="text-sm text-gray-500">
                                    ✅ Envío completado por el destinatario
                                  </div>
                                )}
                              </td>
                            </tr>
                            {/* Fila expandible con detalles de productos */}
                            {expandedSentShipments.has(shipment.id) && (
                              <tr key={`${shipment.id}-details`} className="bg-base-300">
                                <td colSpan="5" className="p-0">
                                  <div className="p-4">
                                    <h6 className="mb-3 text-sm font-semibold">
                                      Detalles de productos:
                                    </h6>
                                    <div className="grid gap-2">
                                      {shipment.products.map((product, idx) => (
                                        <div
                                          key={idx}
                                          className="bg-base-100 flex items-center justify-between rounded-lg p-3"
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="avatar placeholder">
                                              <div className="bg-neutral text-neutral-content h-8 w-8 rounded text-xs">
                                                <span>{product.name.charAt(0)}</span>
                                              </div>
                                            </div>
                                            <div>
                                              <div className="text-sm font-medium">
                                                {product.name}
                                              </div>
                                              <div className="flex flex-wrap items-center gap-2 text-xs opacity-70">
                                                {product.brand && (
                                                  <span className="badge badge-outline badge-xs">
                                                    {product.brand}
                                                  </span>
                                                )}
                                                {product.size && (
                                                  <span className="badge badge-outline badge-xs">
                                                    Talle: {product.size}
                                                  </span>
                                                )}
                                                {product.color && (
                                                  <span className="badge badge-outline badge-xs flex items-center gap-1">
                                                    {product.color_hex && (
                                                      <div
                                                        className="h-2 w-2 rounded-full border border-gray-300"
                                                        style={{
                                                          backgroundColor: getValidHexColor(
                                                            product.color_hex
                                                          )
                                                        }}
                                                      ></div>
                                                    )}
                                                    {product.color}
                                                  </span>
                                                )}
                                                {!product.brand &&
                                                  !product.size &&
                                                  !product.color && (
                                                    <span className="text-xs italic opacity-50">
                                                      Sin detalles adicionales disponibles
                                                    </span>
                                                  )}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-sm font-medium">
                                              Cantidad:{' '}
                                              <span className="badge badge-primary badge-sm">
                                                {product.quantity}
                                              </span>
                                            </div>
                                            {product.sale_price && (
                                              <div className="text-xs opacity-70">
                                                Precio:{' '}
                                                <span className="font-mono">
                                                  ${parseFloat(product.sale_price).toFixed(2)}
                                                </span>
                                              </div>
                                            )}
                                            {product.sale_price && (
                                              <div className="text-xs opacity-70">
                                                Total:{' '}
                                                <span className="font-mono font-semibold">
                                                  $
                                                  {(
                                                    parseFloat(product.sale_price) *
                                                    product.quantity
                                                  ).toFixed(2)}
                                                </span>
                                              </div>
                                            )}
                                            {!product.sale_price && (
                                              <div className="text-xs italic opacity-50">
                                                Precio no disponible
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="border-base-300 mt-3 flex justify-between border-t pt-3 text-sm">
                                      <span>
                                        <strong>Total productos:</strong> {shipment.products.length}
                                      </span>
                                      <span>
                                        <strong>Total unidades:</strong>{' '}
                                        {shipment.products.reduce((sum, p) => sum + p.quantity, 0)}
                                      </span>
                                      <span>
                                        <strong>Valor total:</strong>{' '}
                                        {shipment.products.some((p) => p.sale_price) ? (
                                          `$${shipment.products
                                            .reduce(
                                              (sum, p) =>
                                                sum +
                                                (p.sale_price
                                                  ? parseFloat(p.sale_price) * p.quantity
                                                  : 0),
                                              0
                                            )
                                            .toFixed(2)}`
                                        ) : (
                                          <span className="italic opacity-50">No disponible</span>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pasos de envío de productos */}
          {!showPendingShipments && !showSentShipments && (
            <>
              <div className="mb-6">
                <ul className="steps w-full">
                  <li className={`step ${step >= 1 ? 'step-primary' : ''}`}>
                    Seleccionar Productos
                  </li>
                  <li className={`step ${step >= 2 ? 'step-primary' : ''}`}>Sucursal Destino</li>
                </ul>
              </div>

              {/* Paso 1: Seleccionar variantes */}
              {step === 1 && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Búsqueda por código de barras */}
                  <div className="card bg-base-200 shadow-xl">
                    <div className="card-body">
                      <h4 className="card-title flex items-center gap-2">
                        <Scan className="h-5 w-5" />
                        Buscar por Código de Barras
                      </h4>
                      <div className="form-control">
                        <div className="input-group">
                          <input
                            type="text"
                            placeholder="Escanear o escribir código de barras..."
                            className="input input-bordered flex-1"
                            value={barcodeInput}
                            onChange={(e) => setBarcodeInput(e.target.value)}
                            onKeyDown={handleBarcodeInput}
                            disabled={searchingBarcode}
                          />
                          <button
                            className="btn btn-primary"
                            onClick={() => searchByBarcode(barcodeInput)}
                            disabled={searchingBarcode || !barcodeInput.trim()}
                          >
                            {searchingBarcode ? (
                              <l-pinwheel
                                size="20"
                                stroke="2"
                                speed="0.9"
                                color="white"
                              ></l-pinwheel>
                            ) : (
                              <Search className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        <label className="label">
                          <span className="label-text-alt">
                            Código formato: VAR + 4 dígitos producto + 3 dígitos talle + 3 dígitos
                            color
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Lista de variantes disponibles */}
                  <div className="card bg-base-200 shadow-xl">
                    <div className="card-body">
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="card-title">Variantes Disponibles</h4>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSelectAllProducts}
                            className="btn btn-sm btn-outline"
                          >
                            {selectedVariants.length === availableVariants.length &&
                            availableVariants.length > 0 ? (
                              <Square className="h-4 w-4" />
                            ) : (
                              <CheckSquare className="h-4 w-4" />
                            )}
                            {selectedVariants.length === availableVariants.length &&
                            availableVariants.length > 0
                              ? 'Deseleccionar Todo'
                              : 'Seleccionar Todo'}
                          </button>
                          <button onClick={resetSelection} className="btn btn-sm btn-ghost">
                            Reiniciar
                          </button>
                        </div>
                      </div>

                      {loadingProducts && (
                        <div className="flex items-center gap-3">
                          <l-pinwheel
                            size="25"
                            stroke="2.5"
                            speed="0.9"
                            color="#d97706"
                          ></l-pinwheel>
                          <span className="text-warning font-medium">Cargando variantes...</span>
                        </div>
                      )}

                      {!loadingProducts && availableVariants.length === 0 && (
                        <div className="py-8 text-center">
                          <Package className="mx-auto mb-2 h-12 w-12 opacity-50" />
                          <p>No hay variantes con stock en esta sucursal</p>
                          <button
                            onClick={loadAvailableVariants}
                            className="btn btn-sm btn-primary mt-2"
                          >
                            Recargar Variantes
                          </button>
                        </div>
                      )}

                      {!loadingProducts && availableVariants.length > 0 && (
                        <div className="max-h-96 overflow-x-auto">
                          <table className="table-sm table-pin-rows table">
                            <thead>
                              <tr>
                                <th>Acción</th>
                                <th>Código</th>
                                <th>Producto</th>
                                <th>Marca</th>
                                <th>Talle</th>
                                <th>Color</th>
                                <th>Stock</th>
                              </tr>
                            </thead>
                            <tbody>
                              {availableVariants.map((variant) => (
                                <tr key={variant.variant_id} className="hover">
                                  <td>
                                    <button
                                      className="btn btn-xs btn-primary"
                                      onClick={() => addVariantFromList(variant)}
                                      disabled={selectedVariants.some(
                                        (v) => v.variant_id === variant.variant_id
                                      )}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </td>
                                  <td className="font-mono text-xs">{variant.variant_barcode}</td>
                                  <td>{variant.product_name}</td>
                                  <td>{variant.brand_name}</td>
                                  <td>
                                    <span className="badge badge-outline badge-sm">
                                      {variant.size_name}
                                    </span>
                                  </td>
                                  <td>
                                    <div className="flex items-center gap-1">
                                      <div
                                        className="h-4 w-4 rounded border"
                                        style={{
                                          backgroundColor: getValidHexColor(variant.color_hex)
                                        }}
                                      ></div>
                                      <span className="text-xs">{variant.color_name}</span>
                                    </div>
                                  </td>
                                  <td>
                                    <span className="badge badge-primary badge-sm">
                                      {variant.available_stock}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Variantes seleccionadas */}
                  <div className="card bg-base-200 shadow-xl lg:col-span-2">
                    <div className="card-body">
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="card-title">
                          Variantes a Mover ({selectedVariants.length})
                        </h4>
                        {selectedVariants.length > 0 && (
                          <button onClick={proceedToDestination} className="btn btn-primary btn-sm">
                            <ArrowRight className="h-4 w-4" />
                            {storageList.filter((storage) => storage[0] != currentStorage?.id)
                              .length === 1
                              ? 'Continuar (Auto-destino)'
                              : 'Continuar'}
                          </button>
                        )}
                      </div>

                      {selectedVariants.length === 0 && (
                        <div className="py-8 text-center">
                          <CheckSquare className="mx-auto mb-2 h-12 w-12 opacity-50" />
                          <p>Busca por código de barras o selecciona variantes de la lista</p>
                        </div>
                      )}

                      {selectedVariants.length > 0 && (
                        <div className="max-h-96 overflow-x-auto">
                          <table className="table-sm table-pin-rows table">
                            <thead>
                              <tr>
                                <th>Acción</th>
                                <th>Código</th>
                                <th>Producto</th>
                                <th>Talle/Color</th>
                                <th>Stock Disp.</th>
                                <th>Cantidad a Mover</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedVariants.map((variant) => (
                                <tr key={variant.variant_id} className="hover">
                                  <td>
                                    <button
                                      className="btn btn-xs btn-error"
                                      onClick={() => removeSelectedVariant(variant.variant_id)}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </button>
                                  </td>
                                  <td className="font-mono text-xs">{variant.variant_barcode}</td>
                                  <td>
                                    <div>
                                      <div className="font-medium">{variant.product_name}</div>
                                      <div className="text-sm opacity-70">{variant.brand_name}</div>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="flex items-center gap-2">
                                      <span className="badge badge-outline badge-sm">
                                        {variant.size_name}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <div
                                          className="h-3 w-3 rounded border"
                                          style={{
                                            backgroundColor: getValidHexColor(variant.color_hex)
                                          }}
                                        ></div>
                                        <span className="text-xs">{variant.color_name}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <span className="badge badge-outline badge-sm">
                                      {variant.available_stock}
                                    </span>
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      className="input input-sm input-bordered w-20"
                                      value={variant.move_quantity}
                                      onChange={(e) =>
                                        updateMoveQuantity(variant.variant_id, e.target.value)
                                      }
                                      onKeyPress={(e) => {
                                        // Solo permitir números
                                        if (!/[0-9]/.test(e.key)) {
                                          e.preventDefault()
                                        }
                                      }}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 2: Seleccionar destino */}
              {step === 2 && (
                <div className="card bg-base-200 shadow-xl">
                  <div className="card-body">
                    <h4 className="card-title">Paso 2: Selecciona la sucursal de destino</h4>

                    <div className="mb-4">
                      <label className="label">
                        <span className="label-text">Sucursal de destino</span>
                      </label>

                      {/* Mostrar información si se auto-seleccionó */}
                      {storageList.filter((storage) => storage[0] != currentStorage?.id).length ===
                        1 && (
                        <div className="alert alert-info mb-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            className="h-6 w-6 shrink-0 stroke-current"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            ></path>
                          </svg>
                          <span>
                            ✅ Única sucursal de destino disponible - seleccionada automáticamente
                          </span>
                        </div>
                      )}

                      <select
                        value={selectedDestination}
                        onChange={handleDestinationChange}
                        className="select select-bordered w-full max-w-md"
                        disabled={
                          storageList.filter((storage) => storage[0] != currentStorage?.id)
                            .length === 1
                        }
                      >
                        <option value="">Seleccione la sucursal de destino</option>
                        {storageList
                          .filter((storage) => storage[0] != currentStorage?.id) // Excluir origen
                          .map((storage) => {
                            const id = storage[0]
                            const name = storage[1]
                            return (
                              <option key={id} value={id}>
                                {name}
                              </option>
                            )
                          })}
                      </select>

                      {/* Mostrar información si hay múltiples opciones */}
                      {storageList.filter((storage) => storage[0] != currentStorage?.id).length >
                        1 && (
                        <label className="label">
                          <span className="label-text-alt">
                            Selecciona la sucursal donde quieres enviar los productos
                          </span>
                        </label>
                      )}
                    </div>

                    {selectedDestination && (
                      <div className="bg-base-100 mb-4 rounded-lg p-4">
                        <h5 className="mb-2 font-semibold">Resumen del movimiento:</h5>
                        <p>
                          <strong>Desde:</strong> {currentStorage?.name}
                        </p>
                        <p>
                          <strong>Hacia:</strong>{' '}
                          {storageList.find((s) => s[0] == selectedDestination)?.[1]}
                        </p>
                        <p>
                          <strong>Variantes:</strong> {selectedVariants.length} variantes
                        </p>
                        <p>
                          <strong>Total unidades:</strong>{' '}
                          {selectedVariants.reduce((sum, v) => sum + v.move_quantity, 0)}
                        </p>
                      </div>
                    )}

                    <div className="card-actions justify-between">
                      <button onClick={() => setStep(1)} className="btn btn-ghost">
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Productos
                      </button>

                      {selectedDestination && (
                        <button className="btn btn-success" onClick={executeMovement}>
                          Ejecutar Movimiento
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modal de productos del envío */}
      {showProductModal && selectedShipmentInfo && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-7xl">
            <h3 className="mb-4 text-lg font-bold">
              Productos del Envío #{selectedShipmentInfo.id}
            </h3>

            <div className="bg-base-200 mb-4 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p>
                    <strong>Desde:</strong> {selectedShipmentInfo.fromStorage}
                  </p>
                  <p>
                    <strong>Hacia:</strong> {selectedShipmentInfo.toStorage}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Estado:</strong>
                    <span
                      className={`badge ml-2 ${
                        selectedShipmentInfo.status === 'en_transito'
                          ? 'badge-warning'
                          : selectedShipmentInfo.status === 'empacado'
                            ? 'badge-info'
                            : selectedShipmentInfo.status === 'recibido'
                              ? 'badge-success'
                              : selectedShipmentInfo.status === 'no_recibido'
                                ? 'badge-error'
                                : 'badge-neutral'
                      }`}
                    >
                      {selectedShipmentInfo.status === 'en_transito'
                        ? '🚚 En tránsito'
                        : selectedShipmentInfo.status === 'empacado'
                          ? '📦 Empacado'
                          : selectedShipmentInfo.status === 'recibido'
                            ? '✅ Recibido'
                            : selectedShipmentInfo.status === 'no_recibido'
                              ? '❌ No recibido'
                              : selectedShipmentInfo.status}
                    </span>
                  </p>
                  <p>
                    <strong>Fecha:</strong> {selectedShipmentInfo.createdAt}
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="table-zebra table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Marca</th>
                    <th>Variante</th>
                    <th>Color</th>
                    <th>Cantidad</th>
                    <th>Precio Venta</th>
                    <th>Código</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedShipmentProducts.map((product, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="font-medium">{product.name}</div>
                      </td>
                      <td>
                        <span className="badge badge-outline">{product.brand}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="badge badge-sm">{product.size}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <div
                            className="h-4 w-4 rounded border"
                            style={{ backgroundColor: getValidHexColor(product.color_hex) }}
                          ></div>
                          <span className="text-xs">{product.color}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-primary">{product.quantity}</span>
                      </td>
                      <td>
                        <span className="font-mono">
                          ${(parseFloat(product.sale_price) || 0).toFixed(2)}
                        </span>
                      </td>

                      <td>
                        <span className="font-mono text-xs">{product.variant_barcode}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-base-200 mt-4 rounded-lg p-3">
              <div className="flex justify-between text-sm">
                <span>
                  <strong>Total productos:</strong> {selectedShipmentProducts.length}
                </span>
                <span>
                  <strong>Total unidades:</strong>{' '}
                  {selectedShipmentProducts.reduce((sum, p) => sum + p.quantity, 0)}
                </span>
                <span>
                  <strong>Valor total:</strong> $
                  {selectedShipmentProducts
                    .reduce((sum, p) => sum + (parseFloat(p.sale_price) || 0) * p.quantity, 0)
                    .toFixed(2)}
                </span>
              </div>
            </div>

            <div className="modal-action">
              {/* Solo mostrar botones de acción para envíos en tránsito */}
              {selectedShipmentInfo.status === 'en_transito' && (
                <>
                  <button
                    onClick={() => {
                      markShipmentReceived(selectedShipmentInfo.id, true)
                      closeProductModal()
                    }}
                    className="btn btn-success"
                  >
                    ✅ Marcar como Recibido
                  </button>
                  <button
                    onClick={() => {
                      markShipmentReceived(selectedShipmentInfo.id, false)
                      closeProductModal()
                    }}
                    className="btn btn-error"
                  >
                    ❌ Marcar como No Recibido
                  </button>
                </>
              )}
              <button onClick={closeProductModal} className="btn">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
