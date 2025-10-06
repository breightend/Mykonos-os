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
  Trash2
} from 'lucide-react'
import { inventoryService } from '../../services/inventory/inventoryService'
import { desvincularProductoDeTienda } from '../../services/products/productService'
import BarcodeService from '../../services/barcodeService'
import { useLocation } from 'wouter'
import toast, { Toaster } from 'react-hot-toast'
import { getCurrentBranchId } from '../../utils/posUtils'
import { API_ENDPOINTS } from '../../config/apiConfig.js'

const ProductDetailModal = ({ isOpen, onClose, productId }) => {
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

  const branchId = getCurrentBranchId()

  useEffect(() => {
    const loadProductDetails = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('🔍 Cargando detalles del producto:', productId)

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

    // Función para cargar variantes específicas de la sucursal actual
    const loadCurrentBranchVariants = async (productId) => {
      if (!productId || !branchId) return

      try {
        setLoadingVariants(true)
        console.log('🔍 Cargando variantes específicas para:', { productId, branchId })

        const variantsResponse = await inventoryService.getProductVariants(productId, branchId)

        if (variantsResponse && variantsResponse.length > 0) {
          setCurrentBranchVariants(variantsResponse)
          console.log('✅ Variantes de sucursal cargadas:', variantsResponse.length)
          console.log('📊 Datos de variantes del frontend:', variantsResponse)

          // Debug específico para entender la estructura
          console.log('🔍 ESTRUCTURA DE PRIMERA VARIANTE:')
          if (variantsResponse[0]) {
            const firstVariant = variantsResponse[0]
            console.log('  id:', firstVariant.id)
            console.log('  size_name:', firstVariant.size_name)
            console.log('  color_name:', firstVariant.color_name)
            console.log('  quantity:', firstVariant.quantity)
            console.log('  variant_barcode:', firstVariant.variant_barcode)
            console.log('  Todas las propiedades:', Object.keys(firstVariant))
          }

          // Debug específico para el renderizado
          console.log('🎯 ANÁLISIS PARA RENDERIZADO:')
          variantsResponse.forEach((variant, index) => {
            console.log(`  Variante ${index + 1}:`)
            console.log(`    Talle: ${variant.size_name}`)
            console.log(`    Color: ${variant.color_name}`)
            console.log(`    Cantidad: ${variant.quantity}`)
            console.log(`    Barcode: ${variant.variant_barcode}`)
          })
        } else {
          setCurrentBranchVariants([])
          console.log('⚠️ No hay variantes para esta sucursal')
        }
      } catch (error) {
        console.error('❌ Error cargando variantes de sucursal:', error)
        setCurrentBranchVariants([])
      } finally {
        setLoadingVariants(false)
      }
    }

    if (isOpen && productId) {
      loadProductDetails()
      loadCurrentBranchVariants(productId)
    } else if (!isOpen) {
      setProductDetails(null)
      setCurrentBranchVariants([])
      setProductImageUrl(null)
      setImageError(false)
      setImageLoading(false)
      setError(null)
    }
  }, [isOpen, productId, branchId])

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
              {/* Inventario Detallado por Talle y Color - SOLO SUCURSAL ACTUAL */}
              {loadingVariants ? (
                <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                  <h3 className="mb-6 flex items-center text-xl font-semibold text-gray-800">
                    <Package className="mr-3 h-6 w-6 text-blue-600" />
                    📦 Inventario Detallado -{' '}
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
                    📦 Inventario Detallado -{' '}
                    {productDetails?.stock_por_sucursal?.find((s) => s.sucursal_id === branchId)
                      ?.sucursal_nombre || 'Sucursal Actual'}
                  </h3>

                  <div className="space-y-6">
                    {console.log('🎨 RENDERIZANDO VARIANTES:', currentBranchVariants)}
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
                            👕 Talle: {sizeName}
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
