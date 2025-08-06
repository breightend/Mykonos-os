import { useState, useEffect } from 'react'
import { Printer, X, Package, Palette, Tag, Ruler, DollarSign } from 'lucide-react'
import { inventoryService } from '../../services/inventory/inventoryService'
import { pinwheel } from 'ldrs'

pinwheel.register()

export default function PrintBarcodeModal({ isOpen, onClose, productId }) {
  const [product, setProduct] = useState(null)
  const [variants, setVariants] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Estados para las cantidades y selección
  const [quantities, setQuantities] = useState({})
  const [selectAll, setSelectAll] = useState(false)

  // Estados para opciones de texto del código de barras
  const [printOptions, setPrintOptions] = useState({
    includeColor: true,
    includePrice: true,
    includeCode: true,
    includeSize: true,
    includeProductName: true
  })

  // Estado para vista previa
  const [previewVariant, setPreviewVariant] = useState(null)
  const [barcodePreview, setBarcodePreview] = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  // Función para generar texto de vista previa
  const generatePreviewText = (variant) => {
    if (!variant || !product) return ''
    
    const textParts = []
    
    if (printOptions.includeProductName) {
      textParts.push(product.name)
    }
    
    if (printOptions.includeSize && variant.size_name) {
      textParts.push(`Talle: ${variant.size_name}`)
    }
    
    if (printOptions.includeColor && variant.color_name) {
      textParts.push(`Color: ${variant.color_name}`)
    }
    
    if (printOptions.includePrice && product.sale_price) {
      textParts.push(`$${parseFloat(product.sale_price).toFixed(2)}`)
    }
    
    if (printOptions.includeCode && variant.variant_barcode) {
      textParts.push(variant.variant_barcode)
    }
    
    return textParts.join(' | ')
  }

  // Función para cargar vista previa del código de barras SVG
  const loadBarcodePreview = async (variant) => {
    if (!variant) return

    try {
      setLoadingPreview(true)
      console.log('🔍 Cargando vista previa para variante:', variant.id)
      console.log('⚙️ Opciones actuales:', printOptions)
      
      const response = await inventoryService.generateBarcodePreview(variant.id, printOptions)
      
      console.log('📡 Respuesta completa del servidor:', response)
      
      if (response.status === 'success') {
        setBarcodePreview(response.data)
        console.log('✅ Vista previa cargada exitosamente!')
        console.log('   - Código de barras:', response.data.barcode_code)
        console.log('   - Líneas de texto:', response.data.text_lines)
        console.log('   - SVG content disponible:', !!response.data.svg_content)
        console.log('   - Longitud SVG:', response.data.svg_content?.length || 0)
      } else {
        console.error('❌ Error en respuesta del servidor:', response.message)
        setBarcodePreview(null)
      }
    } catch (error) {
      console.error('❌ Error cargando vista previa:', error)
      console.error('   - Error completo:', JSON.stringify(error, null, 2))
      setBarcodePreview(null)
    } finally {
      setLoadingPreview(false)
    }
  }

  // Cargar datos del producto y sus variantes
  useEffect(() => {
    if (isOpen && productId) {
      loadProductVariants()
    }
  }, [isOpen, productId])

  const loadProductVariants = async () => {
    try {
      setLoading(true)
      setError(null)

      // Cargar información básica del producto
      const productResponse = await inventoryService.getProductDetail(productId)
      if (productResponse.status === 'success') {
        setProduct(productResponse.data)
      }

      // Cargar variantes del producto
      const variantsResponse = await inventoryService.getProductVariants(productId)
      if (variantsResponse.status === 'success') {
        const variantsList = variantsResponse.data
        setVariants(variantsList)

        // Inicializar cantidades en 0 para cada variante
        const initialQuantities = {}
        variantsList.forEach((variant) => {
          initialQuantities[variant.id] = 0
        })
        setQuantities(initialQuantities)
        
        // Establecer primera variante como vista previa por defecto
        if (variantsList.length > 0) {
          const firstVariant = variantsList[0]
          setPreviewVariant(firstVariant)
          loadBarcodePreview(firstVariant)
        }
      }
    } catch (err) {
      console.error('Error cargando variantes:', err)
      setError('Error al cargar las variantes del producto')
    } finally {
      setLoading(false)
    }
  }

  // Manejar cambio de cantidad para una variante específica
  const handleQuantityChange = (variantId, quantity) => {
    const numQuantity = Math.max(0, parseInt(quantity) || 0)
    setQuantities((prev) => ({
      ...prev,
      [variantId]: numQuantity
    }))
  }

  // Manejar seleccionar todas las variantes
  const handleSelectAll = (checked) => {
    setSelectAll(checked)
    if (checked) {
      // Seleccionar todas las variantes con cantidad 1
      const allQuantities = {}
      variants.forEach((variant) => {
        allQuantities[variant.id] = 1
      })
      setQuantities(allQuantities)
    } else {
      // Deseleccionar todas
      const resetQuantities = {}
      variants.forEach((variant) => {
        resetQuantities[variant.id] = 0
      })
      setQuantities(resetQuantities)
    }
  }

  // Manejar cambios en opciones de impresión
  const handlePrintOptionChange = (option, checked) => {
    setPrintOptions((prev) => ({
      ...prev,
      [option]: checked
    }))
    // Recargar vista previa con nuevas opciones
    if (previewVariant) {
      loadBarcodePreview(previewVariant)
    }
  }

  // Función para imprimir solo la vista previa
  const handlePrintPreview = () => {
    if (!barcodePreview) {
      alert('No hay vista previa para imprimir')
      return
    }

    // Crear una ventana de impresión con el SVG
    const printWindow = window.open('', '_blank')
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vista Previa - ${barcodePreview.variant_info.product_name}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: white;
            }
            .barcode-container {
              text-align: center;
              border: 2px dashed #ccc;
              padding: 20px;
              border-radius: 8px;
              background: white;
            }
            .preview-title {
              margin-bottom: 15px;
              color: #666;
              font-size: 12px;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .preview-title { display: none; }
              .barcode-container { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            <div class="preview-title">Vista Previa del Código de Barras</div>
            ${barcodePreview.svg_content}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              }
            }
          </script>
        </body>
      </html>
    `
    
    printWindow.document.write(printContent)
    printWindow.document.close()
  }

  // Función para imprimir códigos de barras
  const handlePrintBarcodes = async () => {
    try {
      const selectedVariants = Object.entries(quantities)
        .filter(([, quantity]) => quantity > 0)
        .map(([variantId, quantity]) => ({
          variantId: parseInt(variantId),
          quantity: quantity
        }))

      if (selectedVariants.length === 0) {
        alert('Por favor selecciona al menos una variante para imprimir')
        return
      }

      const printData = {
        productId: productId,
        variants: selectedVariants,
        options: printOptions
      }

      console.log('🖨️ Datos para imprimir:', printData)

      // Llamar al servicio de impresión real
      const response = await inventoryService.printBarcodes(printData)

      if (response.status === 'success') {
        alert(`✅ ${response.message}`)
        console.log('📊 Detalles de impresión:', response.data)
      } else {
        alert(`❌ Error: ${response.message}`)
      }

      onClose()
    } catch (err) {
      console.error('Error imprimiendo códigos:', err)
      alert('❌ Error al imprimir códigos de barras')
    }
  }

  // Cerrar modal y limpiar estados
  const handleClose = () => {
    setProduct(null)
    setVariants([])
    setQuantities({})
    setSelectAll(false)
    setPreviewVariant(null)
    setBarcodePreview(null)
    setLoadingPreview(false)
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <Printer className="text-primary h-5 w-5" />
            Imprimir Códigos de Barras
          </h3>
          <button onClick={handleClose} className="btn btn-sm btn-circle btn-ghost">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <l-pinwheel size="40" stroke="3" speed="0.9" color="#570df8"></l-pinwheel>
            <p className="mt-3 text-sm text-gray-600">Cargando variantes del producto...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        {/* Contenido principal */}
        {!loading && !error && product && (
          <div className="space-y-6">
            {/* Información del producto */}
            <div className="bg-base-200 rounded-lg p-4">
              <h4 className="text-md mb-2 flex items-center gap-2 font-semibold">
                <Package className="h-4 w-4" />
                Producto Seleccionado
              </h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-600">Marca: {product.brand || 'Sin marca'}</p>
                  <p className="text-sm text-gray-600">
                    Precio: $
                    {product.sale_price ? parseFloat(product.sale_price).toFixed(2) : '0.00'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Variantes disponibles: {variants.length}</p>
                  <p className="text-sm text-gray-600">
                    Total seleccionadas: {Object.values(quantities).filter((q) => q > 0).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Opciones de impresión */}
            <div className="bg-base-200 rounded-lg p-4">
              <h4 className="text-md mb-3 flex items-center gap-2 font-semibold">
                <Tag className="h-4 w-4" />
                Opciones de Impresión
              </h4>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary checkbox-sm"
                    checked={printOptions.includeProductName}
                    onChange={(e) =>
                      handlePrintOptionChange('includeProductName', e.target.checked)
                    }
                  />
                  <span className="flex items-center gap-1 text-sm">
                    <Package className="h-3 w-3" />
                    Nombre del producto
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary checkbox-sm"
                    checked={printOptions.includeColor}
                    onChange={(e) => handlePrintOptionChange('includeColor', e.target.checked)}
                  />
                  <span className="flex items-center gap-1 text-sm">
                    <Palette className="h-3 w-3" />
                    Color
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary checkbox-sm"
                    checked={printOptions.includeSize}
                    onChange={(e) => handlePrintOptionChange('includeSize', e.target.checked)}
                  />
                  <span className="flex items-center gap-1 text-sm">
                    <Ruler className="h-3 w-3" />
                    Talle
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary checkbox-sm"
                    checked={printOptions.includePrice}
                    onChange={(e) => handlePrintOptionChange('includePrice', e.target.checked)}
                  />
                  <span className="flex items-center gap-1 text-sm">
                    <DollarSign className="h-3 w-3" />
                    Precio
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary checkbox-sm"
                    checked={printOptions.includeCode}
                    onChange={(e) => handlePrintOptionChange('includeCode', e.target.checked)}
                  />
                  <span className="flex items-center gap-1 text-sm">
                    <Tag className="h-3 w-3" />
                    Código alfanumérico
                  </span>
                </label>
              </div>
            </div>

            {/* Vista previa del código de barras */}
            {variants.length > 0 && (
              <div className="bg-base-200 rounded-lg p-4">
                <h4 className="text-md mb-3 flex items-center gap-2 font-semibold">
                  <Tag className="h-4 w-4" />
                  Vista Previa del Código de Barras
                </h4>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Selector de variante para vista previa */}
                  <div>
                    <label className="label">
                      <span className="label-text font-medium">Variante a previsualizar:</span>
                    </label>
                    <select 
                      className="select select-bordered w-full"
                      onChange={(e) => {
                        const variantId = parseInt(e.target.value)
                        const selectedVariant = variants.find((v) => v.id === variantId) || variants[0]
                        setPreviewVariant(selectedVariant)
                        loadBarcodePreview(selectedVariant)
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>Selecciona una variante</option>
                      {variants.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.size_name || 'Sin talle'} - {variant.color_name || 'Sin color'}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Vista previa */}
                  <div>
                    <label className="label">
                      <span className="label-text font-medium">Texto que aparecerá:</span>
                    </label>
                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[60px] flex items-center justify-center">
                      {loadingPreview ? (
                        <div className="flex flex-col items-center">
                          <l-pinwheel size="20" stroke="2" speed="0.9" color="#570df8"></l-pinwheel>
                          <p className="text-xs text-gray-500 mt-2">Generando código...</p>
                        </div>
                      ) : barcodePreview ? (
                        <div className="text-center w-full">
                          {/* Información de debug */}
                          <div className="text-xs text-gray-400 mb-2">
                            Debug: Código {barcodePreview.barcode_code}
                          </div>
                          
                          {/* SVG del código de barras real */}
                          <div 
                            className="mx-auto mb-2 border-2 border-dashed border-gray-200 p-2 bg-white rounded"
                            style={{ 
                              maxWidth: '300px',
                              overflow: 'hidden'
                            }}
                          >
                            {barcodePreview.svg_content ? (
                              <div 
                                dangerouslySetInnerHTML={{ __html: barcodePreview.svg_content }}
                                style={{ width: '100%' }}
                              />
                            ) : (
                              <div className="text-red-500 text-xs">No se pudo cargar el SVG</div>
                            )}
                          </div>
                          
                          {/* Texto personalizado con mejor formato */}
                          <div className="text-xs space-y-1">
                            {barcodePreview.text_lines && barcodePreview.text_lines.length > 0 ? (
                              barcodePreview.text_lines.map((line, index) => (
                                <div 
                                  key={index} 
                                  className={`
                                    ${line.includes('$') ? 'text-blue-600 font-semibold' : ''}
                                    ${index === 0 ? 'font-bold text-gray-800' : 'text-gray-600'}
                                    ${line.includes('Talle:') || line.includes('Color:') ? 'text-gray-500' : ''}
                                    ${line.includes('Código:') ? 'font-mono text-xs text-gray-600' : ''}
                                  `.trim()}
                                >
                                  {line}
                                </div>
                              ))
                            ) : (
                              <div className="text-gray-500">No hay líneas de texto disponibles</div>
                            )}
                          </div>
                          
                          {/* Información de debug adicional */}
                          <div className="mt-2 text-xs text-gray-400">
                            <details>
                              <summary className="cursor-pointer">Ver datos debug</summary>
                              <pre className="text-left mt-1 bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                                {JSON.stringify(barcodePreview, null, 2)}
                              </pre>
                            </details>
                          </div>
                          
                          {/* Botón para imprimir solo esta vista previa */}
                          <button
                            onClick={handlePrintPreview}
                            className="btn btn-xs btn-outline btn-primary mt-3"
                            disabled={loadingPreview}
                          >
                            🖨️ Imprimir esta vista previa
                          </button>
                        </div>
                      ) : previewVariant ? (
                        <div className="text-center">
                          <div className="font-mono text-lg font-bold mb-1">
                            ||||||||||||||||||||||||
                          </div>
                          <div className="text-xs text-gray-700 break-all">
                            {generatePreviewText(previewVariant)}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Selecciona una variante para ver la vista previa</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Control de selección masiva */}
            <div className="bg-base-200 flex items-center justify-between rounded-lg p-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={selectAll}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                <span className="font-medium">Seleccionar todas las variantes</span>
              </label>
              <div className="text-sm text-gray-600">
                Total etiquetas:{' '}
                {Object.values(quantities).reduce((sum, qty) => sum + (qty || 0), 0)}
              </div>
            </div>

            {/* Lista de variantes */}
            <div className="bg-base-200 rounded-lg p-4">
              <h4 className="text-md mb-3 font-semibold">Variantes del Producto</h4>

              {variants.length === 0 ? (
                <div className="py-8 text-center">
                  <Package className="mx-auto mb-2 h-12 w-12 opacity-50" />
                  <p className="text-gray-600">No se encontraron variantes para este producto</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table-zebra table w-full">
                    <thead>
                      <tr>
                        <th>Talle</th>
                        <th>Color</th>
                        <th>Código</th>
                        <th>Stock</th>
                        <th>Cantidad a Imprimir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((variant) => (
                        <tr key={variant.id}>
                          <td>
                            <span className="badge badge-outline">
                              {variant.size_name || 'Sin talle'}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-4 w-4 rounded border"
                                style={{ backgroundColor: variant.color_hex || '#cccccc' }}
                              ></div>
                              <span className="text-sm">{variant.color_name || 'Sin color'}</span>
                            </div>
                          </td>
                          <td>
                            <span className="font-mono text-xs">
                              {variant.variant_barcode || 'Sin código'}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`badge ${variant.quantity > 0 ? 'badge-success' : 'badge-error'}`}
                            >
                              {variant.quantity || 0}
                            </span>
                          </td>
                          <td>
                            <input
                              type="text"
                              pattern="[0-9]*"
                              className="input input-bordered input-sm w-20"
                              value={quantities[variant.id] || 0}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '') // Solo números
                                handleQuantityChange(variant.id, value)
                              }}
                              placeholder="0"
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
        )}

        {/* Footer con botones */}
        <div className="modal-action">
          <button onClick={handleClose} className="btn btn-ghost">
            Cancelar
          </button>
          <button
            onClick={handlePrintBarcodes}
            className="btn btn-primary"
            disabled={loading || Object.values(quantities).filter((q) => q > 0).length === 0}
          >
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Códigos
          </button>
        </div>
      </div>
    </div>
  )
}
