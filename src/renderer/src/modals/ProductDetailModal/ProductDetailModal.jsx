import { useState, useEffect } from 'react'
import { X, Package, Warehouse, DollarSign, Calendar, Info, Edit, QrCode } from 'lucide-react'
import { inventoryService } from '../../services/inventory/inventoryService'
import BarcodeService from '../../services/barcodeService'
import { useLocation } from 'wouter'

const ProductDetailModal = ({ isOpen, onClose, productId }) => {
  const [productDetails, setProductDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [, setLocation] = useLocation()

  // Estados para códigos de barras
  const [barcodePreview, setBarcodePreview] = useState(null)
  const [showBarcodeModal, setShowBarcodeModal] = useState(false)
  const barcodeService = new BarcodeService()

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
          console.log('🔍 Stock variants recibidas:', response.data.stock_variants)
          console.log('🔍 Cantidad de stock variants:', response.data.stock_variants?.length || 0)

          // 🔧 DEBUGGING ESPECÍFICO DE VARIANT_BARCODE
          if (response.data.stock_variants && response.data.stock_variants.length > 0) {
            console.log('🔧 DEBUGGING CÓDIGOS DE BARRAS:')
            response.data.stock_variants.forEach((variant, index) => {
              console.log(`   Variante ${index + 1}:`)
              console.log(`     ID: ${variant.id}`)
              console.log(`     Talle: ${variant.size_name}`)
              console.log(`     Color: ${variant.color_name}`)
              console.log(`     Sucursal: ${variant.sucursal_nombre}`)
              console.log(
                `     variant_barcode: "${variant.variant_barcode}" (tipo: ${typeof variant.variant_barcode})`
              )

              if (variant.variant_barcode === null) {
                console.log('     ❌ PROBLEMA: variant_barcode es NULL')
              } else if (variant.variant_barcode === '') {
                console.log('     ❌ PROBLEMA: variant_barcode es cadena vacía')
              } else if (variant.variant_barcode === undefined) {
                console.log('     ❌ PROBLEMA: variant_barcode es undefined')
              } else {
                console.log('     ✅ OK: variant_barcode tiene valor válido')
              }
            })

            // Verificar si todos tienen códigos válidos
            const variantsWithValidBarcodes = response.data.stock_variants.filter(
              (v) => v.variant_barcode && v.variant_barcode !== '' && v.variant_barcode !== null
            )
            console.log(
              `🎯 RESUMEN: ${variantsWithValidBarcodes.length}/${response.data.stock_variants.length} variantes tienen códigos válidos`
            )
          } else {
            console.log('⚠️ No hay stock_variants en la respuesta')
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

  const generateBarcodePreview = async (barcode) => {
    try {
      const result = await barcodeService.generateCustomBarcode(barcode, 'code128', 'svg')
      setBarcodePreview({ barcode, svg: result.barcode })
      setShowBarcodeModal(true)
    } catch (error) {
      console.error('Error generando preview del código de barras:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="max-h-[100vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl">
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
                  <div className="flex justify-center">
                    {productDetails.product_image ? (
                      <div className="group relative">
                        <img
                          src={`data:image/png;base64,${productDetails.product_image}`}
                          alt={productDetails.product_name}
                          className="h-80 w-80 rounded-xl border-2 border-gray-200 object-cover shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl"
                          onError={(e) => {
                            // Si falla con PNG, intentar con JPEG
                            if (e.target.src.includes('data:image/png')) {
                              e.target.src = `data:image/jpeg;base64,${productDetails.product_image}`
                            } else if (e.target.src.includes('data:image/jpeg')) {
                              // Si también falla con JPEG, intentar con WEBP
                              e.target.src = `data:image/webp;base64,${productDetails.product_image}`
                            } else {
                              // Si fallan todos los tipos, mostrar el placeholder
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }
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
              {productDetails.stock_variants?.length > 0 && (
                <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                  <h3 className="mb-6 flex items-center text-xl font-semibold text-gray-800">
                    <Package className="mr-3 h-6 w-6 text-blue-600" />
                    Inventario Detallado por Talle y Color
                  </h3>

                  <div className="space-y-6">
                    {/* Agrupar variantes por talle */}
                    {Object.entries(
                      productDetails.stock_variants.reduce((acc, variant) => {
                        const sizeName = variant.size_name || 'Sin talle'
                        if (!acc[sizeName]) {
                          acc[sizeName] = []
                        }
                        acc[sizeName].push(variant)
                        return acc
                      }, {})
                    ).map(([sizeName, variants]) => (
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
                              key={`${variant.size_id}-${variant.color_id}-${variant.sucursal_id}`}
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
                                    <p className="text-xs text-gray-500">
                                      {variant.sucursal_nombre}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-lg font-bold text-blue-600">
                                    {variant.quantity}
                                  </span>
                                  <p className="text-xs text-gray-500">unidades</p>
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
                    ))}
                  </div>

                  {/* Resumen de Variantes */}
                  <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
                    <h5 className="mb-3 font-semibold text-gray-700">Resumen de Variantes</h5>
                    <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-5">
                      <div className="rounded-lg bg-blue-50 p-3">
                        <div className="text-2xl font-bold text-blue-600">
                          {productDetails.stock_variants.length}
                        </div>
                        <div className="text-sm text-blue-700">Variantes con stock</div>
                      </div>
                      <div className="rounded-lg bg-green-50 p-3">
                        <div className="text-2xl font-bold text-green-600">
                          {new Set(productDetails.stock_variants.map((v) => v.size_name)).size}
                        </div>
                        <div className="text-sm text-green-700">Tallas disponibles</div>
                      </div>
                      <div className="rounded-lg bg-pink-50 p-3">
                        <div className="text-2xl font-bold text-pink-600">
                          {new Set(productDetails.stock_variants.map((v) => v.color_name)).size}
                        </div>
                        <div className="text-sm text-pink-700">Colores disponibles</div>
                      </div>
                      <div className="rounded-lg bg-purple-50 p-3">
                        <div className="text-2xl font-bold text-purple-600">
                          {productDetails.stock_variants.reduce((sum, v) => sum + v.quantity, 0)}
                        </div>
                        <div className="text-sm text-purple-700">Stock total real</div>
                      </div>
                      <div className="rounded-lg bg-orange-50 p-3">
                        <div className="text-2xl font-bold text-orange-600">
                          {
                            new Set(productDetails.stock_variants.map((v) => v.sucursal_nombre))
                              .size
                          }
                        </div>
                        <div className="text-sm text-orange-700">Sucursales</div>
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

              {/* Sección de Códigos de Barras */}
              <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                <h3 className="mb-6 flex items-center text-xl font-semibold text-gray-800">
                  <QrCode className="mr-3 h-6 w-6 text-blue-600" />
                  Códigos de Barras por Variante
                </h3>

                {productDetails.stock_variants?.length > 0 ? (
                  <div className="space-y-4">
                    {/* Resumen de códigos */}
                    <div className="rounded-lg bg-white p-4">
                      <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
                        <div className="rounded-lg bg-blue-50 p-3">
                          <div className="text-2xl font-bold text-blue-600">
                            {productDetails.stock_variants.filter((v) => v.variant_barcode).length}
                          </div>
                          <div className="text-sm text-blue-700">Códigos generados</div>
                        </div>
                        <div className="rounded-lg bg-green-50 p-3">
                          <div className="text-2xl font-bold text-green-600">
                            {new Set(productDetails.stock_variants.map((v) => v.size_name)).size}
                          </div>
                          <div className="text-sm text-green-700">Talles únicos</div>
                        </div>
                        <div className="rounded-lg bg-pink-50 p-3">
                          <div className="text-2xl font-bold text-pink-600">
                            {new Set(productDetails.stock_variants.map((v) => v.color_name)).size}
                          </div>
                          <div className="text-sm text-pink-700">Colores únicos</div>
                        </div>
                        <div className="rounded-lg bg-purple-50 p-3">
                          <div className="text-2xl font-bold text-purple-600">
                            {productDetails.stock_variants.length}
                          </div>
                          <div className="text-sm text-purple-700">Total variantes</div>
                        </div>
                      </div>
                    </div>

                    {/* Lista de códigos por variante */}
                    <div className="max-h-96 overflow-y-auto">
                      <div className="grid gap-3">
                        {Object.entries(
                          productDetails.stock_variants.reduce((acc, variant) => {
                            const key = variant.size_name || 'Sin talle'
                            if (!acc[key]) acc[key] = []
                            acc[key].push(variant)
                            return acc
                          }, {})
                        ).map(([sizeName, variants]) => (
                          <div
                            key={sizeName}
                            className="rounded-lg border border-gray-200 bg-white p-4"
                          >
                            <h5 className="mb-3 font-semibold text-gray-800">Talle: {sizeName}</h5>
                            <div className="grid gap-2 md:grid-cols-2">
                              {variants.map((variant) => (
                                <div
                                  key={`${variant.size_id}-${variant.color_id}-${variant.sucursal_id}`}
                                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3"
                                >
                                  <div className="flex items-center space-x-3">
                                    <div
                                      className="h-6 w-6 rounded-full border-2 border-gray-300"
                                      style={{
                                        backgroundColor: getValidHexColor(variant.color_hex)
                                      }}
                                      title={variant.color_name || 'Sin color'}
                                    ></div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-700">
                                        {variant.color_name || 'Sin color'}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {variant.sucursal_nombre} • {variant.quantity} unidades
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    {variant.variant_barcode ? (
                                      <div>
                                        <p className="font-mono text-xs text-gray-600">
                                          {variant.variant_barcode}
                                        </p>
                                        <button
                                          onClick={() =>
                                            generateBarcodePreview(variant.variant_barcode)
                                          }
                                          className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                                        >
                                          Ver código
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-400">Sin código</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <QrCode className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                    <p className="text-gray-500">
                      No hay variantes con códigos de barras disponibles
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="footer border-base-300 bg-base-100 border-t p-4">
          <div className="flex w-full justify-end gap-3">
            <button
              onClick={() => setLocation(`/editarProducto?id=${productId}`)}
              type="button"
              className="btn btn-primary h-12 gap-2 rounded-lg" // Usamos btn-primary para destacar
              disabled={!productDetails}
            >
              <Edit className="h-4 w-4" />
              Editar Producto
            </button>
            <button onClick={onClose} type="button" className="btn btn-neutral h-12 rounded-lg">
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Modal para mostrar código de barras */}
      {showBarcodeModal && barcodePreview && (
        <div className="bg-opacity-50 fixed inset-0 z-60 flex items-center justify-center bg-black p-4">
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
                  // Opcional: mostrar un toast de confirmación
                }}
                className="mt-3 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Copiar Código
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductDetailModal
