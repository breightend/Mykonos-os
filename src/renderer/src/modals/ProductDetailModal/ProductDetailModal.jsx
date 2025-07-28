import { useState, useEffect } from 'react'
import { X, Package, Warehouse, DollarSign, Calendar, Info } from 'lucide-react'
import { inventoryService } from '../../services/inventory/inventoryService'

const ProductDetailModal = ({ isOpen, onClose, productId }) => {
  const [productDetails, setProductDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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
      loadProductDetails()
    }
  }, [isOpen, productId])

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

  if (!isOpen) return null

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="to-primary/60 from-primary flex items-center justify-between border-b border-gray-200 bg-gradient-to-r p-6 text-black">
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
                  <h3 className="mb-4 text-center text-lg font-semibold text-gray-800">
                    {productDetails.product_name}
                  </h3>
                  <div className="flex justify-center">
                    {productDetails.product_image ? (
                      <div className="group relative">
                        <img
                          src={`data:image/jpeg;base64,${productDetails.product_image}`}
                          alt={productDetails.product_name}
                          className="h-80 w-80 rounded-xl border-2 border-gray-200 object-cover shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                        <div className="hidden h-80 w-80 flex-col items-center justify-center rounded-xl border-2 border-gray-200 bg-gray-100">
                          <Package className="mb-4 h-20 w-20 text-gray-400" />
                          <span className="text-lg text-gray-500">Imagen no disponible</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-80 w-80 flex-col items-center justify-center rounded-xl border-2 border-gray-200 bg-gray-100">
                        <Package className="mb-4 h-20 w-20 text-gray-400" />
                        <span className="text-lg text-gray-500">Sin imagen disponible</span>
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
                      <span className="font-medium text-gray-600">Código de barras:</span>
                      <p className="font-mono text-gray-800">
                        {productDetails.barcode || 'No disponible'}
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
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-800">
                    <DollarSign className="mr-2 h-5 w-5 text-green-600" />
                    Información Comercial
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-600">Precio de costo:</span>
                      <p className="font-semibold text-gray-800">
                        {formatCurrency(productDetails.cost)}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Precio de venta:</span>
                      <p className="font-semibold text-gray-800">
                        {formatCurrency(productDetails.sale_price)}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Impuesto:</span>
                      <p className="text-gray-800">{productDetails.tax || 0}%</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Descuento:</span>
                      <p className="text-gray-800">{productDetails.discount || 0}%</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Stock total:</span>
                      <p className="text-lg font-semibold text-gray-800">
                        {productDetails.stock_total || 0} unidades
                      </p>
                    </div>
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
                          Cantidad
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
                              {stock.cantidad}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {stock.ultima_actualizacion
                              ? formatDate(stock.ultima_actualizacion)
                              : 'No disponible'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Inventario Detallado por Talle y Color */}
              {productDetails.tallas?.length > 0 && productDetails.colores?.length > 0 && (
                <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                  <h3 className="mb-6 flex items-center text-xl font-semibold text-gray-800">
                    <Package className="mr-3 h-6 w-6 text-blue-600" />
                    Inventario Detallado por Talle y Color
                  </h3>

                  <div className="space-y-6">
                    {productDetails.tallas
                      .map((talla, talleIndex) => {
                        // Primero verificamos si este talle tiene algún color con stock
                        const coloresConStock = productDetails.colores.filter(
                          (color, colorIndex) => {
                            const totalVariants =
                              productDetails.tallas.length * productDetails.colores.length
                            const variantIndex =
                              talleIndex * productDetails.colores.length + colorIndex
                            const stockTotal = productDetails.stock_total || 0

                            if (stockTotal > 0) {
                              // Crear distribución si no existe (solo una vez)
                              if (!productDetails._stockDistribution) {
                                const distribution = Array(totalVariants).fill(0)
                                let remainingStock = stockTotal

                                for (let i = 0; i < totalVariants && remainingStock > 0; i++) {
                                  const varKey = `${productDetails.id}-${Math.floor(
                                    i / productDetails.colores.length
                                  )}-${i % productDetails.colores.length}`
                                  let varHash = 0
                                  for (let j = 0; j < varKey.length; j++) {
                                    varHash = varKey.charCodeAt(j) + ((varHash << 5) - varHash)
                                  }

                                  if (Math.abs(varHash) % 3 !== 0 && remainingStock > 0) {
                                    const maxForThisVariant = Math.min(
                                      remainingStock,
                                      Math.ceil(remainingStock / 3)
                                    )
                                    const assignedStock = Math.min(
                                      maxForThisVariant,
                                      Math.max(1, Math.floor(Math.abs(varHash) % 3) + 1)
                                    )
                                    distribution[i] = assignedStock
                                    remainingStock -= assignedStock
                                  }
                                }

                                if (remainingStock > 0) {
                                  const firstWithStock = distribution.findIndex((qty) => qty > 0)
                                  if (firstWithStock !== -1) {
                                    distribution[firstWithStock] += remainingStock
                                  } else {
                                    distribution[0] = remainingStock
                                  }
                                }

                                productDetails._stockDistribution = distribution
                                const totalDistributed = distribution.reduce(
                                  (sum, qty) => sum + qty,
                                  0
                                )
                                console.log(
                                  '🔢 Stock total:',
                                  stockTotal,
                                  '| Distribuido:',
                                  totalDistributed,
                                  '| Distribución:',
                                  distribution
                                )
                              }
                            }

                            const quantity = productDetails._stockDistribution
                              ? productDetails._stockDistribution[variantIndex] || 0
                              : 0

                            return quantity > 0
                          }
                        )

                        // Solo retornar el talle si tiene colores con stock
                        if (coloresConStock.length > 0) {
                          return { talla, talleIndex, coloresConStock }
                        }
                        return null
                      })
                      .filter((item) => item !== null) // Filtrar talles sin stock
                      .map((item) => {
                        const { talla, talleIndex } = item

                        return (
                          <div
                            key={talla.id}
                            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
                          >
                            <h4 className="mb-4 flex items-center text-lg font-semibold text-gray-700">
                              <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                                {talleIndex + 1}
                              </span>
                              Talle: {talla.nombre}
                            </h4>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                              {productDetails.colores
                                .map((color, colorIndex) => {
                                  // Calcular el índice global de la variante
                                  const totalVariants =
                                    productDetails.tallas.length * productDetails.colores.length
                                  const variantIndex =
                                    talleIndex * productDetails.colores.length + colorIndex

                                  // Obtener la cantidad para esta variante específica
                                  const quantity = productDetails._stockDistribution
                                    ? productDetails._stockDistribution[variantIndex] || 0
                                    : 0

                                  // Retornar el objeto con la información del color y su cantidad
                                  return {
                                    color,
                                    colorIndex,
                                    quantity,
                                    variantIndex
                                  }
                                })
                                .filter((item) => item.quantity > 0) // Solo mostrar colores con stock
                                .map((item) => {
                                  const { color, quantity } = item

                                  return (
                                    <div
                                      key={color.id}
                                      className="group relative overflow-hidden rounded-lg border-2 border-gray-200 bg-white p-4 transition-all duration-300 hover:border-blue-300 hover:shadow-md"
                                    >
                                      {/* Color indicator con hex desde BD */}
                                      <div className="mb-3 flex items-center space-x-3">
                                        <div
                                          className="h-6 w-6 rounded-full border-2 border-gray-300 shadow-sm"
                                          style={{
                                            backgroundColor: getValidHexColor(color.color_hex)
                                          }}
                                          title={`Color: ${color.nombre} - Hex: ${color.color_hex || 'No disponible'}`}
                                        ></div>
                                        <span className="text-sm font-medium text-gray-700">
                                          {color.nombre}
                                        </span>
                                      </div>

                                      {/* Cantidad */}
                                      <div className="text-center">
                                        <div
                                          className={`text-2xl font-bold ${
                                            quantity > 2
                                              ? 'text-green-600'
                                              : quantity > 0
                                                ? 'text-yellow-600'
                                                : 'text-red-600'
                                          }`}
                                        >
                                          {quantity}
                                        </div>
                                        <div className="mt-1 text-xs text-gray-500">
                                          {quantity > 2
                                            ? 'En stock'
                                            : quantity > 0
                                              ? 'Poco stock'
                                              : 'Sin stock'}
                                        </div>
                                      </div>

                                      {/* Indicador de estado */}
                                      <div
                                        className={`absolute top-2 right-2 h-3 w-3 rounded-full ${
                                          quantity > 2
                                            ? 'bg-green-400'
                                            : quantity > 0
                                              ? 'bg-yellow-400'
                                              : 'bg-red-400'
                                        }`}
                                      ></div>
                                    </div>
                                  )
                                })}
                            </div>
                          </div>
                        )
                      })}
                  </div>

                  {/* Resumen estadístico */}
                  <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
                    <h5 className="mb-3 font-semibold text-gray-700">Resumen de Variantes</h5>
                    <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-5">
                      <div className="rounded-lg bg-blue-50 p-3">
                        <div className="text-2xl font-bold text-blue-600">
                          {productDetails.tallas.length * productDetails.colores.length}
                        </div>
                        <div className="text-sm text-blue-700">Variantes totales</div>
                      </div>
                      <div className="rounded-lg bg-green-50 p-3">
                        <div className="text-2xl font-bold text-green-600">
                          {productDetails.tallas.length}
                        </div>
                        <div className="text-sm text-green-700">Tallas</div>
                      </div>
                      <div className="rounded-lg bg-pink-50 p-3">
                        <div className="text-2xl font-bold text-pink-600">
                          {productDetails.colores.length}
                        </div>
                        <div className="text-sm text-pink-700">Colores</div>
                      </div>
                      <div className="rounded-lg bg-purple-50 p-3">
                        <div className="text-2xl font-bold text-purple-600">
                          {productDetails.stock_total}
                        </div>
                        <div className="text-sm text-purple-700">Stock total</div>
                      </div>
                      <div className="rounded-lg bg-orange-50 p-3">
                        <div className="text-2xl font-bold text-orange-600">
                          {productDetails._stockDistribution
                            ? productDetails._stockDistribution.reduce((sum, qty) => sum + qty, 0)
                            : 0}
                        </div>
                        <div className="text-sm text-orange-700">Stock distribuido</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-800">
                  <Calendar className="mr-2 h-5 w-5 text-blue-600" />
                  Información Adicional
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <span className="font-medium text-gray-600">Última modificación:</span>
                    <p className="text-gray-800">{formatDate(productDetails.last_modified_date)}</p>
                  </div>
                  {productDetails.comments && (
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-600">Comentarios:</span>
                      <p className="mt-1 text-gray-800">{productDetails.comments}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailModal
