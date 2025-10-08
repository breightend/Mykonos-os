import { useState, useEffect } from 'react'
import {
  X,
  Package,
  Warehouse,
  DollarSign,
  Calendar,
  Info,
  Edit,
  QrCode,
  HandCoins,
  PackageOpen,
  Trash2,
  FileText
} from 'lucide-react'
import { inventoryService } from '../../services/inventory/inventoryService'
import { desvincularProductoDeTienda } from '../../services/products/productService'
import BarcodeService from '../../services/barcodeService'
import { useLocation } from 'wouter'
import toast, { Toaster } from 'react-hot-toast'
import { getCurrentBranchId } from '../../utils/posUtils'
import { API_ENDPOINTS } from '../../config/apiConfig.js'

const ProductDetailModal = ({ isOpen, onClose, productId, storageId }) => {
  const [productDetails, setProductDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [, setLocation] = useLocation()

  // Estados para códigos de barras
  const [barcodePreview, setBarcodePreview] = useState(null)
  const [showBarcodeModal, setShowBarcodeModal] = useState(false)
  const barcodeService = new BarcodeService()

  // Estado para la URL de la imagen del producto
  const [productImageUrl, setProductImageUrl] = useState(null)
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)

  // Estado para variantes específicas de la sucursal actual
  const [currentBranchVariants, setCurrentBranchVariants] = useState([])
  const [loadingVariants, setLoadingVariants] = useState(false)

  // Use the passed storageId prop instead of static getCurrentBranchId()
  const branchId = storageId

  // Función para cargar variantes específicas de la sucursal actual
  const loadCurrentBranchVariants = async (productId) => {
    if (!productId || !branchId) {
      console.log('⚠️ Falta productId o storageId:', { productId, storageId: branchId })
      return
    }

    try {
      setLoadingVariants(true)
      console.log('🔍 Cargando variantes específicas para:', { productId, storageId: branchId })

      // Intentar usar el endpoint optimizado primero
      const variantsResponse = await inventoryService.getProductVariants(productId, branchId)

      if (variantsResponse && variantsResponse.length > 0) {
        setCurrentBranchVariants(variantsResponse)
        console.log(
          '✅ Variantes de sucursal cargadas desde endpoint optimizado:',
          variantsResponse.length
        )
        console.log('📊 Datos de variantes del endpoint:', variantsResponse)
      } else {
        // Fallback: usar datos ya disponibles en productDetails filtrados por sucursal
        console.log('⚠️ Endpoint optimizado sin datos, usando fallback con productDetails')
        console.log('🔍 productDetails disponible:', !!productDetails)
        console.log('🔍 stock_variants disponible:', productDetails?.stock_variants?.length || 0)

        if (productDetails?.stock_variants) {
          // Filtrar variantes por sucursal actual
          const branchVariants = productDetails.stock_variants.filter(
            (variant) => variant.sucursal_id === parseInt(branchId)
          )

          console.log('🏪 Variantes filtradas por sucursal:', branchVariants.length)
          console.log('📋 Variantes filtradas:', branchVariants)
          console.log('🎯 Filtrando por storageId:', branchId, 'vs variant.sucursal_id')

          setCurrentBranchVariants(branchVariants)
        } else {
          setCurrentBranchVariants([])
          console.log('⚠️ No hay variantes disponibles en productDetails')
        }
      }

      // Debug específico para el renderizado
      console.log('🎯 ANÁLISIS FINAL PARA RENDERIZADO:')
      const finalVariants =
        variantsResponse?.length > 0
          ? variantsResponse
          : productDetails?.stock_variants?.filter((v) => v.sucursal_id === parseInt(branchId)) ||
            []

      finalVariants.forEach((variant, index) => {
        console.log(`  Variante ${index + 1}:`)
        console.log(`    ID: ${variant.id}`)
        console.log(`    Talle: ${variant.size_name}`)
        console.log(`    Color: ${variant.color_name}`)
        console.log(`    Cantidad: ${variant.quantity}`)
        console.log(`    Barcode: ${variant.variant_barcode}`)
        console.log(`    Sucursal ID: ${variant.sucursal_id}`)
      })
    } catch (error) {
      console.error('❌ Error cargando variantes de sucursal:', error)

      // Fallback en caso de error: usar datos de productDetails
      if (productDetails?.stock_variants) {
        const branchVariants = productDetails.stock_variants.filter(
          (variant) => variant.sucursal_id === parseInt(branchId)
        )
        setCurrentBranchVariants(branchVariants)
        console.log('🔄 Usando fallback por error:', branchVariants.length)
      } else {
        setCurrentBranchVariants([])
      }
    } finally {
      setLoadingVariants(false)
    }
  }

  useEffect(() => {
    const loadProductDetails = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('🔍 Cargando detalles del producto:', productId, 'para storage:', storageId)

        const response = await inventoryService.getProductDetails(productId)

        if (response.status === 'success') {
          setProductDetails(response.data)
          console.log('✅ Detalles del producto cargados:', response.data)

          // Configurar URL de imagen si el producto tiene imagen
          if (response.data.has_image) {
            const imageUrl = `${API_ENDPOINTS.PRODUCT}/${productId}/image`
            setProductImageUrl(imageUrl)
            setImageError(false)
            setImageLoading(true)
          } else {
            setProductImageUrl(null)
            setImageError(false)
            setImageLoading(false)
          }
        } else {
          setError('Error al cargar los detalles del producto')
        }
      } catch (err) {
        console.error('❌ Error al cargar detalles:', err)
        setError('Error al cargar los detalles del producto')
      } finally {
        setLoading(false)
      }
    }

    if (isOpen && productId) {
      // Clear previous data when storage changes to prevent cache issues
      setCurrentBranchVariants([])
      setProductDetails(null)
      console.log('🔄 Limpiando cache para nueva carga - Storage:', storageId)

      loadProductDetails()
    } else if (!isOpen) {
      setProductDetails(null)
      setCurrentBranchVariants([])
      setProductImageUrl(null)
      setImageError(false)
      setImageLoading(false)
      setError(null)
    }
  }, [isOpen, productId, storageId])

  // useEffect separado para cargar variantes cuando productDetails esté disponible
  useEffect(() => {
    if (isOpen && productId && storageId && productDetails) {
      console.log('🔄 Storage cambió - Recargando variantes para storage:', storageId)
      // Clear current variants first to prevent showing stale data
      setCurrentBranchVariants([])
      setLoadingVariants(true)

      loadCurrentBranchVariants(productId)
    }
  }, [productDetails, isOpen, productId, storageId])

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible'
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Función para limpiar y validar el color hex
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

  const generateBarcodePreview = async (barcode) => {
    try {
      const result = await barcodeService.generateCustomBarcode(barcode, 'code128', 'svg')
      setBarcodePreview({ barcode, svg: result.barcode })
      setShowBarcodeModal(true)
    } catch (error) {
      console.error('Error generando preview del código de barras:', error)
    }
  }

  const handleDeleteFromStore = async (storeId, productId) => {
    try {
      const response = await desvincularProductoDeTienda(productId, storeId)
      if (response.success) {
        console.log('✅ Producto desvinculado de la tienda:', response)
        toast.success('¡Producto desvinculado de la tienda!', { duration: 4000 })
        onClose()
      } else {
        console.error('❌ Error al desvincular producto de la tienda', response)
        toast.error(`Error: ${response.message}`)
      }
    } catch (error) {
      console.error('❌ Error llamando a la API:', error)
      toast.error('Error, asegurate que no haya mas productos en la sucursal')
    }
  }

  if (!isOpen) return null

  // Calcular stock total correctamente
  const stockTotal =
    productDetails && productDetails.stock_por_sucursal
      ? productDetails.stock_por_sucursal.reduce((total, stock) => total + (stock.cantidad || 0), 0)
      : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-md">
      <div className="max-h-[100vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-primary to-primary/60 p-6 text-black">
          <div className="flex items-center space-x-3">
            <Package className="h-6 w-6" />
            <h2 className="text-xl font-bold">
              {loading ? 'Cargando...' : productDetails?.product_name || 'Detalles del Producto'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer p-1 transition-colors hover:scale-110 hover:text-gray-900"
            type="button"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Cargando detalles...</span>
            </div>
          )}

          {error && (
            <div className="p-6 text-center">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
                <Info className="mx-auto mb-2 h-6 w-6" />
                <p>{error}</p>
              </div>
            </div>
          )}

          {productDetails && !loading && !error && (
            <div className="space-y-6 p-6">
              {/* Imagen del Producto - Sección Principal */}
              <div className="mb-8 flex justify-center">
                <div className="w-full max-w-md">
                  <div className="flex justify-center">
                    {productImageUrl && !imageError ? (
                      <div className="group relative">
                        {imageLoading && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-xl border-2 border-gray-200 bg-gray-100">
                            <div className="flex flex-col items-center">
                              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                              <span className="mt-2 text-sm text-gray-500">Cargando imagen...</span>
                            </div>
                          </div>
                        )}
                        <img
                          src={productImageUrl}
                          alt={productDetails.product_name}
                          className={`h-80 w-80 rounded-xl border-2 border-gray-200 object-cover shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                          onError={(e) => {
                            console.error('❌ ERROR cargando imagen del producto:', productImageUrl)
                            setImageError(true)
                            setImageLoading(false)
                          }}
                          onLoad={(e) => {
                            console.log('✅ Imagen cargada exitosamente:', productImageUrl)
                            setImageLoading(false)
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex h-80 w-80 flex-col items-center justify-center rounded-xl border-2 border-gray-200 bg-gray-100">
                        <Package className="mb-4 h-20 w-20 text-gray-400" />
                        <span className="text-lg text-gray-500">
                          {imageError ? 'Error al cargar imagen' : 'Sin imagen disponible'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Información Básica */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-800">
                    <Info className="mr-2 h-5 w-5 text-blue-600" />
                    Información Básica
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-600">Nombre:</span>
                      <p className="text-gray-800">
                        {productDetails.product_name || 'No disponible'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Marca:</span>
                      <p className="text-gray-800">{productDetails.brand_name || 'Sin marca'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Proveedor:</span>
                      <p className="text-gray-800">
                        {productDetails.provider_name || 'Sin proveedor'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Código proveedor:</span>
                      <p className="font-mono text-gray-800">
                        {productDetails.provider_code || 'No disponible'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Descripción:</span>
                      <p className="text-gray-800">
                        {productDetails.description || 'No disponible'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Fecha de creación:</span>
                      <p className="text-gray-800">
                        {formatDate(productDetails.creation_date) || 'No disponible'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 p-6 shadow-sm">
                  <h3 className="mb-6 flex items-center text-xl font-bold text-gray-800">
                    <DollarSign className="mr-3 h-6 w-6 text-emerald-600" />
                    💰 Información Comercial y Precios
                  </h3>

                  <div className="space-y-6">
                    {/* Precios Base - Grid mejorado */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-blue-700">
                              Precio de Costo
                            </span>
                            <p className="text-2xl font-bold text-blue-900">
                              {formatCurrency(productDetails.cost)}
                            </p>
                          </div>
                          <div className="rounded-full bg-blue-200 p-2">
                            <HandCoins className="h-5 w-5 text-blue-700" />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-purple-700">
                              Precio Original
                            </span>
                            <p className="text-2xl font-bold text-purple-900">
                              {formatCurrency(
                                productDetails.original_price || productDetails.sale_price
                              )}
                            </p>
                          </div>
                          <div className="rounded-full bg-purple-200 p-2">
                            <PackageOpen className="h-5 w-5 text-purple-700" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Precio Final destacado */}
                    <div className="rounded-xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-100 to-green-100 p-6 shadow-lg">
                      <div className="text-center">
                        <span className="text-lg font-medium text-emerald-700">
                          Precio Final de Venta
                        </span>
                        <p className="text-4xl font-bold text-emerald-900">
                          {formatCurrency(productDetails.sale_price)}
                        </p>
                        <div className="mt-2 flex items-center justify-center space-x-4 text-sm text-emerald-600">
                          <span>📈 Stock: {stockTotal} unidades</span>
                          {productDetails.tax > 0 && (
                            <span>🏛️ Impuesto: {productDetails.tax}%</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sección de Descuentos */}
                    {(productDetails.has_discount || productDetails.discount > 0) && (
                      <div className="rounded-xl border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-red-50 p-6 shadow-lg">
                        <h4 className="mb-4 flex items-center text-lg font-bold text-orange-800">
                          Descuentos aplicados
                        </h4>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                          {productDetails.discount_percentage > 0 && (
                            <div className="rounded-lg bg-orange-100 p-3 text-center">
                              <div className="text-2xl font-bold text-orange-700">
                                {productDetails.discount_percentage}%
                              </div>
                              <div className="text-xs text-orange-600">Descuento Porcentual</div>
                            </div>
                          )}
                          {productDetails.discount_amount > 0 && (
                            <div className="col-span-2 rounded-lg bg-red-100 p-3 text-center">
                              <div className="text-lg font-bold text-red-700">
                                -{formatCurrency(productDetails.discount_amount)}
                              </div>
                              <div className="text-xs text-red-600">Descuento en Pesos</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stock por Sucursal */}
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-800">
                  <Warehouse className="mr-2 h-5 w-5 text-purple-600" />
                  Stock por Sucursal ({productDetails.sucursales_con_stock} sucursales)
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                          Sucursal
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                          Dirección
                        </th>
                        <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">
                          Stock actual
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                          Última Actualización
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {productDetails.stock_por_sucursal?.map((stock, index) => (
                        <tr
                          key={stock.sucursal_id}
                          className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        >
                          <td className="px-4 py-2 text-sm font-medium text-gray-800">
                            {stock.sucursal_nombre}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {stock.sucursal_direccion || 'No disponible'}
                          </td>
                          <td className="px-4 py-2 text-right text-sm">
                            <span
                              className={`font-semibold ${stock.cantidad > 0 ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {stock.cantidad} unidades
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {formatDate(stock.ultima_actualizacion) || 'No disponible'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Inventario Detallado por Talle y Color - SOLO SUCURSAL ACTUAL */}
              {loadingVariants ? (
                <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                  <h3 className="mb-6 flex items-center text-xl font-semibold text-gray-800">
                    <Package className="mr-3 h-6 w-6 text-blue-600" />
                    Inventario Detallado -{' '}
                    {productDetails?.stock_por_sucursal?.find((s) => s.sucursal_id === branchId)
                      ?.sucursal_nombre || 'Sucursal Actual'}
                  </h3>
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Cargando variantes...</span>
                  </div>
                </div>
              ) : currentBranchVariants.length > 0 ? (
                <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                  <h3 className="mb-6 flex items-center text-xl font-semibold text-gray-800">
                    <Package className="mr-3 h-6 w-6 text-blue-600" />
                    Inventario Detallado -{' '}
                    {productDetails?.stock_por_sucursal?.find((s) => s.sucursal_id === branchId)
                      ?.sucursal_nombre || 'Sucursal Actual'}
                  </h3>

                  <div className="space-y-6">
                    {console.log(' RENDERIZANDO VARIANTES:', currentBranchVariants)}
                    {/* Agrupar variantes por talle */}
                    {Object.entries(
                      currentBranchVariants.reduce((acc, variant) => {
                        const sizeName = variant.size_name || 'Sin talle'
                        console.log(
                          `📏 Procesando variante: ${variant.color_name} - ${sizeName} - Cantidad: ${variant.quantity}`
                        )
                        if (!acc[sizeName]) {
                          acc[sizeName] = []
                        }
                        acc[sizeName].push(variant)
                        return acc
                      }, {})
                    ).map(([sizeName, variants]) => {
                      console.log(
                        `👕 Renderizando talle: ${sizeName} con ${variants.length} variantes`
                      )
                      return (
                        <div
                          key={sizeName}
                          className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
                        >
                          <h4 className="mb-4 text-lg font-semibold text-gray-800">
                              Talle: {sizeName}
                          </h4>

                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {variants.map((variant) => (
                              <div
                                key={`${variant.id}-${variant.size_id}-${variant.color_id}`}
                                className="group relative overflow-hidden rounded-lg border-2 border-gray-200 bg-white p-4 transition-all duration-300 hover:border-blue-300 hover:shadow-md"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div
                                      className="h-8 w-8 rounded-full border-2 border-gray-300 shadow-sm"
                                      style={{
                                        backgroundColor: getValidHexColor(variant.color_hex)
                                      }}
                                      title={variant.color_name || 'Sin color'}
                                    ></div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-700">
                                        {variant.color_name || 'Sin color'}
                                      </p>
                                      <p className="text-xs text-gray-500">En esta sucursal</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-lg font-bold text-blue-600">
                                      {variant.quantity || 0}
                                    </span>
                                    <p className="text-xs text-gray-500">unidades</p>
                                  </div>
                                </div>

                                {/* Código de barras de la variante */}
                                <div className="mt-3 border-t border-gray-100 pt-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-600">
                                      Código:
                                    </span>
                                    {variant.variant_barcode ? (
                                      <div className="flex items-center space-x-2">
                                        <code className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700">
                                          {variant.variant_barcode}
                                        </code>
                                        <button
                                          onClick={() =>
                                            generateBarcodePreview(variant.variant_barcode)
                                          }
                                          className="flex items-center text-xs text-blue-600 hover:text-blue-800"
                                          title="Ver código de barras"
                                        >
                                          <QrCode className="h-3 w-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-400">Sin código</span>
                                    )}
                                  </div>
                                </div>

                                {variant.last_updated && (
                                  <div className="mt-2 text-xs text-gray-400">
                                    Actualizado: {formatDate(variant.last_updated)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}

                    {/* Resumen de variantes */}
                    <div className="mt-6 rounded-lg bg-blue-50 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-blue-800">
                          📊 Total variantes en esta sucursal:
                        </span>
                        <span className="font-bold text-blue-900">
                          {currentBranchVariants.length} variantes
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-blue-800">
                          📦 Total unidades disponibles:
                        </span>
                        <span className="font-bold text-blue-900">
                          {currentBranchVariants.reduce(
                            (total, variant) => total + (variant.quantity || 0),
                            0
                          )}{' '}
                          unidades
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                    <Package className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-yellow-800">
                    Sin inventario en esta sucursal
                  </h3>
                  <p className="text-yellow-700">
                    Este producto no tiene variantes disponibles en la sucursal actual.
                  </p>
                  <p className="mt-2 text-sm text-yellow-600">
                    Sucursal:{' '}
                    {productDetails?.stock_por_sucursal?.find((s) => s.sucursal_id === branchId)
                      ?.sucursal_nombre || 'Sucursal Actual'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Información Adicional */}
          {productDetails && (
            <div className="section border-t border-base-300 pt-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-base-content">
                <FileText className="h-5 w-5 text-blue-600" />
                Información Adicional
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Fechas importantes */}
                <div className="bg-base-50 rounded-lg p-4">
                  <h4 className="mb-3 font-medium text-base-content">📅 Fechas</h4>
                  <div className="space-y-2 text-sm">
                    {productDetails.fecha_creacion && (
                      <div className="flex justify-between">
                        <span className="text-base-content/70">Creado:</span>
                        <span className="font-medium">
                          {formatDate(productDetails.fecha_creacion)}
                        </span>
                      </div>
                    )}
                    {productDetails.last_updated && (
                      <div className="flex justify-between">
                        <span className="text-base-content/70">Actualizado:</span>
                        <span className="font-medium">
                          {formatDate(productDetails.last_updated)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Información del sistema */}
                <div className="bg-base-50 rounded-lg p-4">
                  <h4 className="mb-3 font-medium text-base-content">⚙️ Sistema</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-base-content/70">ID Producto:</span>
                      <span className="font-mono text-xs">{productDetails.id}</span>
                    </div>
                    {productDetails.sku && (
                      <div className="flex justify-between">
                        <span className="text-base-content/70">SKU:</span>
                        <span className="font-mono text-xs">{productDetails.sku}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Total Variantes:</span>
                      <span className="font-medium">{currentBranchVariants.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notas o descripciones adicionales */}
              {(productDetails.descripcion || productDetails.notas) && (
                <div className="mt-4 rounded-lg bg-amber-50 p-4">
                  <h4 className="mb-2 font-medium text-amber-800">📝 Notas</h4>
                  {productDetails.descripcion && (
                    <p className="mb-2 text-sm text-amber-700">
                      <strong>Descripción:</strong> {productDetails.descripcion}
                    </p>
                  )}
                  {productDetails.notas && (
                    <p className="text-sm text-amber-700">
                      <strong>Notas:</strong> {productDetails.notas}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="footer border-t border-base-300 bg-base-100 p-4">
          <div className="flex flex-wrap justify-between gap-4">
            <div className="flex flex-wrap gap-6">
              {/* Delete Button - Destructive */}
              <button
                onClick={() => handleDeleteFromStore(branchId, productId)}
                type="button"
                className="btn btn-error h-12 gap-2 rounded-lg px-5 shadow-sm transition hover:scale-105 hover:shadow-md"
                disabled={!productDetails}
              >
                <Trash2 className="h-5 w-5" />
                <span>Eliminar</span>
              </button>

              {/* Edit Button - Primary */}
              <button
                onClick={() => setLocation(`/editarProducto?id=${productId}`)}
                type="button"
                className="btn btn-primary h-12 gap-2 rounded-lg px-5 shadow-sm transition hover:scale-105 hover:shadow-md"
                disabled={!productDetails}
              >
                <Edit className="h-5 w-5" />
                <span>Editar</span>
              </button>

              {/* Close Button - Neutral */}
              <button
                onClick={onClose}
                type="button"
                className="btn btn-outline h-12 rounded-lg px-5 transition hover:scale-105 hover:bg-base-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para mostrar código de barras */}
      {showBarcodeModal && barcodePreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Código de Barras</h3>
              <button
                onClick={() => setShowBarcodeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="text-center">
              <div
                className="mb-4 flex justify-center"
                dangerouslySetInnerHTML={{ __html: barcodePreview.svg }}
              />
              <p className="font-mono text-sm text-gray-600">{barcodePreview.barcode}</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(barcodePreview.barcode)
                }}
                className="mt-3 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Copiar Código
              </button>
            </div>
          </div>
        </div>
      )}
      <Toaster position="top-center" />
    </div>
  )
}

export default ProductDetailModal
