import { useState, useEffect } from 'react'
import { Printer, X, Package, Palette, Tag, Ruler, DollarSign, Save, RefreshCw } from 'lucide-react'
import { inventoryService } from '../../services/inventory/inventoryService'
import { barcodePrintService } from '../../services/barcodePrintService'
import printSettingsService from '../../services/printSettingsService'
import { pinwheel } from 'ldrs'
import toast from 'react-hot-toast'
import '../../assets/modal-improvements.css'

pinwheel.register()

export default function PrintBarcodeModal({ isOpen, onClose, productId, currentStorageId }) {
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

  // Estados para configuraciones
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [configurationChanged, setConfigurationChanged] = useState(false)

  // Estado para vista previa
  const [previewVariant, setPreviewVariant] = useState(null)
  const [barcodePreview, setBarcodePreview] = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  // Cargar configuraciones guardadas
  const loadPrintSettings = async () => {
    try {
      setSettingsLoading(true)
      const response = await printSettingsService.getPrintSettings()

      if (response.status === 'success' && response.settings) {
        const settings = response.settings
        setPrintOptions({
          includeProductName: settings.showProductName,
          includeColor: settings.showColor,
          includeSize: settings.showSize,
          includePrice: settings.showPrice,
          includeCode: settings.showBarcode
        })
        console.log('✅ Configuraciones cargadas:', settings)
      }
    } catch (error) {
      console.error('❌ Error cargando configuraciones:', error)
    } finally {
      setSettingsLoading(false)
    }
  }

  // Guardar configuraciones
  const savePrintSettings = async () => {
    try {
      setSettingsSaving(true)

      const settings = {
        showProductName: printOptions.includeProductName,
        showColor: printOptions.includeColor,
        showSize: printOptions.includeSize,
        showPrice: printOptions.includePrice,
        showBarcode: printOptions.includeCode,
        // Valores por defecto para otros campos
        printWidth: 450,
        printHeight: 200,
        fontSize: 12,
        backgroundColor: '#FFFFFF',
        textColor: '#000000'
      }

      const response = await printSettingsService.savePrintSettings(settings)

      if (response.status === 'success') {
        toast.success('✅ Configuraciones guardadas')
        setConfigurationChanged(false)
      }
    } catch (error) {
      console.error('❌ Error guardando configuraciones:', error)
      toast.error('❌ Error al guardar configuraciones')
    } finally {
      setSettingsSaving(false)
    }
  }

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

  // Cargar configuraciones cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadPrintSettings()
    }
  }, [isOpen])

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

      console.log('🏪 Cargando variantes para sucursal:', currentStorageId)

      // Cargar información básica del producto
      const productResponse = await inventoryService.getProductDetail(productId)
      if (productResponse.status === 'success') {
        setProduct(productResponse.data)
      }

      // Cargar variantes del producto filtradas por sucursal actual
      const variantsResponse = await inventoryService.getProductVariants(
        productId,
        currentStorageId
      )
      if (variantsResponse.status === 'success') {
        const variantsList = variantsResponse.data
        setVariants(variantsList)

        console.log(`✅ Cargadas ${variantsList.length} variantes de la sucursal actual`)

        if (variantsList.length === 0) {
          setError('No hay variantes con stock disponible en esta sucursal')
        }

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
      // Seleccionar todas las variantes con su stock disponible como cantidad
      const allQuantities = {}
      variants.forEach((variant) => {
        allQuantities[variant.id] = variant.stock || 1 // Usar stock disponible o 1 como fallback
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
    // Marcar que hubo cambios en la configuración
    setConfigurationChanged(true)

    // Recargar vista previa con nuevas opciones
    if (previewVariant) {
      loadBarcodePreview(previewVariant)
    }
  }

  // Función para imprimir solo la vista previa
  const handlePrintPreview = () => {
    if (!barcodePreview?.png_data) {
      alert('No hay vista previa PNG para imprimir')
      return
    }

    // Crear canvas para imprimir la imagen PNG
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = function () {
      // Configurar canvas con el tamaño de la imagen
      canvas.width = img.width
      canvas.height = img.height

      // Dibujar la imagen en el canvas
      ctx.drawImage(img, 0, 0)

      // Crear contenido HTML para impresión
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
              <img src="${canvas.toDataURL('image/png')}" alt="Código de barras" style="max-width: 100%; height: auto;"/>
            </div>
          </body>
        </html>
      `

      // Crear iframe oculto para imprimir
      const iframe = document.createElement('iframe')
      iframe.style.position = 'absolute'
      iframe.style.width = '0px'
      iframe.style.height = '0px'
      iframe.style.border = 'none'
      iframe.style.visibility = 'hidden'
      document.body.appendChild(iframe)

      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
        iframeDoc.open()
        iframeDoc.write(printContent)
        iframeDoc.close()

        // Esperar un momento para que cargue el contenido
        setTimeout(() => {
          iframe.contentWindow.focus()
          iframe.contentWindow.print()

          // Limpiar el iframe después de imprimir
          setTimeout(() => {
            if (iframe.parentNode) {
              document.body.removeChild(iframe)
            }
          }, 1000)
        }, 500)
      } catch (error) {
        console.error('Error al preparar la impresión:', error)
        alert('Error al preparar la impresión. Intenta nuevamente.')
        if (iframe.parentNode) {
          document.body.removeChild(iframe)
        }
      }
    }

    img.onerror = function () {
      alert('Error al cargar la imagen PNG para imprimir')
    }

    // Cargar la imagen base64
    img.src = `data:image/png;base64,${barcodePreview.png_data}`
  }

  // Función alternativa para descargar la vista previa como PNG
  const handleDownloadPreview = () => {
    if (!barcodePreview?.png_data) {
      alert('No hay vista previa PNG para descargar')
      return
    }

    try {
      // Crear blob de la imagen PNG
      const byteCharacters = atob(barcodePreview.png_data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'image/png' })

      // Crear enlace de descarga
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `codigo-barras-${barcodePreview.variant_info.product_name.replace(/[^a-zA-Z0-9]/g, '-')}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Imagen PNG descargada correctamente')
    } catch (error) {
      console.error('Error al descargar PNG:', error)
      toast.error('Error al descargar la imagen PNG')
    }
  }

  // Función para imprimir códigos de barras
  const handlePrintBarcodes = async () => {
    try {
      setLoading(true)

      // Preparar variantes seleccionadas con sus cantidades
      const selectedVariants = Object.entries(quantities)
        .filter(([, quantity]) => quantity > 0)
        .map(([variantId, quantity]) => {
          const variant = variants.find((v) => v.id.toString() === variantId)
          return {
            variant: variant,
            quantity: quantity
          }
        })

      if (selectedVariants.length === 0) {
        toast.error('Por favor selecciona al menos una variante para imprimir')
        return
      }

      // Mostrar mensaje de progreso
      toast.loading('Generando códigos de barras...', { duration: 2000 })

      // Usar el servicio de impresión de códigos de barras
      const result = await barcodePrintService.processPrintRequest(
        selectedVariants,
        product,
        printOptions
      )

      if (result.success) {
        toast.success(result.message, { duration: 4000 })
        console.log('📊 Impresión exitosa:', result)

        // Cerrar el modal después de una impresión exitosa
        setTimeout(() => {
          onClose()
        }, 1000)
      } else {
        toast.error(result.message, { duration: 4000 })
        console.error('❌ Error en impresión:', result.message)
      }
    } catch (err) {
      console.error('Error imprimiendo códigos:', err)
      toast.error('Error inesperado al imprimir códigos de barras', { duration: 4000 })
    } finally {
      setLoading(false)
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
    <div className="print-modal-container">
      <div className="print-modal-box">
        {/* Header mejorado con gradiente */}
        <div className="print-modal-header bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                <Printer className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary">Imprimir Códigos de Barras</h3>
                <p className="text-xs text-gray-500">
                  Genera etiquetas personalizadas para tus productos
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="hover:bg-error/10 btn btn-ghost btn-sm px-3 py-2 transition-all duration-200 hover:text-error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Contenido con scroll */}
        <div className="print-modal-content space-y-6">
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
              {/* Información del producto mejorada */}
              <div className="overflow-hidden rounded-xl border border-base-300 bg-gradient-to-br from-base-100 to-base-200 shadow-lg">
                <div className="border-b border-base-300 bg-primary/5 px-6 py-4">
                  <h4 className="flex items-center gap-3 text-lg font-bold text-primary">
                    <div className="rounded-full bg-primary/20 p-2">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    Producto Seleccionado
                  </h4>
                </div>

                <div className="p-6">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    {/* Info principal */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <h5 className="text-xl font-bold text-base-content">{product.name}</h5>
                        <div className="mt-2 flex flex-wrap gap-3">
                          <div className="badge badge-outline gap-2">
                            <span className="text-xs">🏷️</span>
                            Marca: {product.brand || 'Sin marca'}
                          </div>
                          <div className="badge badge-success gap-2">
                            <span className="text-xs">💰</span>$
                            {product.sale_price
                              ? parseFloat(product.sale_price).toFixed(2)
                              : '0.00'}
                          </div>
                          {variants.length > 0 && variants[0].branch_name && (
                            <div className="badge badge-primary gap-2">
                              <span className="text-xs">🏪</span>
                              {variants[0].branch_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats del lado derecho */}
                    <div className="bg-base-100/50 rounded-lg p-4 lg:min-w-[200px]">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">
                            Variantes disponibles
                          </span>
                          <span className="badge badge-info">{variants.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Seleccionadas</span>
                          <span className="badge badge-warning">
                            {Object.values(quantities).filter((q) => q > 0).length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Total etiquetas</span>
                          <span className="badge badge-accent">
                            {Object.values(quantities).reduce((sum, qty) => sum + (qty || 0), 0)}
                          </span>
                        </div>
                      </div>

                      {currentStorageId && (
                        <div className="bg-info/10 mt-3 rounded-md p-2">
                          <p className="text-xs text-info">ℹ️ Solo variantes con stock local</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Opciones de impresión mejoradas */}
              <div className="overflow-hidden rounded-xl border border-base-300 bg-gradient-to-br from-base-100 to-base-200 shadow-lg">
                <div className="border-b border-base-300 bg-secondary/5 px-6 py-4">
                  <h4 className="flex items-center gap-3 text-lg font-bold text-secondary">
                    <div className="rounded-full bg-secondary/20 p-2">
                      <Tag className="h-5 w-5 text-secondary" />
                    </div>
                    Configuración de Etiquetas
                  </h4>
                  <p className="mt-1 text-sm text-gray-600">
                    Personaliza qué información incluir en tus códigos de barras
                  </p>
                </div>

                <div className="p-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Nombre del producto */}
                    <div className="rounded-lg border-2 border-dashed border-base-300 bg-base-100 p-4 transition-all hover:border-primary hover:shadow-md">
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary mt-1"
                          checked={printOptions.includeProductName}
                          onChange={(e) =>
                            handlePrintOptionChange('includeProductName', e.target.checked)
                          }
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="rounded-full bg-primary/20 p-1">
                              <Package className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-semibold text-primary">Nombre del producto</span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Incluye el nombre completo del producto
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Color */}
                    <div className="rounded-lg border-2 border-dashed border-base-300 bg-base-100 p-4 transition-all hover:border-secondary hover:shadow-md">
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-secondary mt-1"
                          checked={printOptions.includeColor}
                          onChange={(e) =>
                            handlePrintOptionChange('includeColor', e.target.checked)
                          }
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="rounded-full bg-secondary/20 p-1">
                              <Palette className="h-4 w-4 text-secondary" />
                            </div>
                            <span className="font-semibold text-secondary">Color</span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Muestra el color de la variante
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Talle */}
                    <div className="rounded-lg border-2 border-dashed border-base-300 bg-base-100 p-4 transition-all hover:border-accent hover:shadow-md">
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-accent mt-1"
                          checked={printOptions.includeSize}
                          onChange={(e) => handlePrintOptionChange('includeSize', e.target.checked)}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="rounded-full bg-accent/20 p-1">
                              <Ruler className="h-4 w-4 text-accent" />
                            </div>
                            <span className="font-semibold text-accent">Talle</span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Incluye el talle del producto
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Precio */}
                    <div className="rounded-lg border-2 border-dashed border-base-300 bg-base-100 p-4 transition-all hover:border-success hover:shadow-md">
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-success mt-1"
                          checked={printOptions.includePrice}
                          onChange={(e) =>
                            handlePrintOptionChange('includePrice', e.target.checked)
                          }
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="bg-success/20 rounded-full p-1">
                              <DollarSign className="h-4 w-4 text-success" />
                            </div>
                            <span className="font-semibold text-success">Precio</span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">Muestra el precio de venta</p>
                        </div>
                      </label>
                    </div>

                    {/* Código */}
                    <div className="rounded-lg border-2 border-dashed border-base-300 bg-base-100 p-4 transition-all hover:border-info hover:shadow-md sm:col-span-2 lg:col-span-1">
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          className="checkbox checkbox-info mt-1"
                          checked={printOptions.includeCode}
                          onChange={(e) => handlePrintOptionChange('includeCode', e.target.checked)}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="bg-info/20 rounded-full p-1">
                              <Tag className="h-4 w-4 text-info" />
                            </div>
                            <span className="font-semibold text-info">Código alfanumérico</span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Incluye el código de barras en texto
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Botón para aplicar configuraciones */}
                  <div className="mt-6 flex flex-col gap-4 border-t border-base-300 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      {configurationChanged && (
                        <div className="flex items-center gap-2 text-warning">
                          <div className="h-2 w-2 animate-pulse rounded-full bg-warning"></div>
                          <span className="text-sm font-medium">Configuración modificada</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={savePrintSettings}
                        disabled={settingsSaving || !configurationChanged}
                        className="btn btn-secondary btn-sm gap-2"
                      >
                        {settingsSaving ? (
                          <l-pinwheel
                            size="16"
                            stroke="2"
                            speed="0.9"
                            color="currentColor"
                          ></l-pinwheel>
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {settingsSaving ? 'Guardando...' : 'Guardar configuración'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de variantes mejorada */}

              {/* Vista previa del código de barras */}
              {variants.length > 0 && (
                <div className="rounded-lg bg-base-200 p-4">
                  <h4 className="text-md mb-3 flex items-center gap-2 font-semibold">
                    <Tag className="h-4 w-4" />
                    Vista Previa del Código de Barras
                  </h4>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Selector de variante para vista previa */}
                    <div>
                      <label className="label">
                        <span className="label-text font-medium">Variante a previsualizar:</span>
                      </label>
                      <select
                        className="select-bordered select w-full"
                        onChange={(e) => {
                          const variantId = parseInt(e.target.value)
                          const selectedVariant =
                            variants.find((v) => v.id === variantId) || variants[0]
                          setPreviewVariant(selectedVariant)
                          loadBarcodePreview(selectedVariant)
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Selecciona una variante
                        </option>
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
                      <div className="flex min-h-[60px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-4">
                        {loadingPreview ? (
                          <div className="flex flex-col items-center">
                            <l-pinwheel
                              size="20"
                              stroke="2"
                              speed="0.9"
                              color="#570df8"
                            ></l-pinwheel>
                            <p className="mt-2 text-xs text-gray-500">Generando código...</p>
                          </div>
                        ) : barcodePreview ? (
                          <div className="w-full text-center">
                            {/* Información de debug */}
                            <div className="mb-2 text-xs text-gray-400">
                              Debug: Código {barcodePreview.barcode_code}
                            </div>

                            {/* PNG del código de barras real */}
                            <div
                              className="mx-auto mb-2 rounded border-2 border-dashed border-gray-200 bg-white p-2"
                              style={{
                                maxWidth: '300px',
                                overflow: 'hidden'
                              }}
                            >
                              {barcodePreview.png_data ? (
                                <img
                                  src={`data:image/png;base64,${barcodePreview.png_data}`}
                                  alt="Código de barras"
                                  style={{ width: '100%', height: 'auto' }}
                                  className="mx-auto"
                                />
                              ) : (
                                <div className="text-xs text-red-500">
                                  No se pudo cargar la imagen PNG
                                </div>
                              )}
                            </div>

                            {/* Texto personalizado con mejor formato */}
                            <div className="space-y-1 text-xs">
                              {barcodePreview.text_lines && barcodePreview.text_lines.length > 0 ? (
                                barcodePreview.text_lines.map((line, index) => (
                                  <div
                                    key={index}
                                    className={` ${line.includes('$') ? 'font-semibold text-blue-600' : ''} ${index === 0 ? 'font-bold text-gray-800' : 'text-gray-600'} ${line.includes('Talle:') || line.includes('Color:') ? 'text-gray-500' : ''} ${line.includes('Código:') ? 'font-mono text-xs text-gray-600' : ''} `.trim()}
                                  >
                                    {line}
                                  </div>
                                ))
                              ) : (
                                <div className="text-gray-500">
                                  No hay líneas de texto disponibles
                                </div>
                              )}
                            </div>

                            {/* Información de debug adicional */}
                            <div className="mt-2 text-xs text-gray-400">
                              <details>
                                <summary className="cursor-pointer">Ver datos debug</summary>
                                <pre className="mt-1 overflow-x-auto rounded bg-gray-100 p-2 text-left text-xs">
                                  {JSON.stringify(
                                    {
                                      ...barcodePreview,
                                      png_data: barcodePreview.png_data
                                        ? `[Base64 PNG: ${barcodePreview.png_data.length} chars]`
                                        : null
                                    },
                                    null,
                                    2
                                  )}
                                </pre>
                              </details>
                            </div>

                            {/* Botones para imprimir y descargar vista previa */}
                            <div className="mt-3 flex justify-center gap-2">
                              <button
                                onClick={handlePrintPreview}
                                className="btn btn-primary btn-outline btn-xs"
                                disabled={loadingPreview}
                              >
                                🖨️ Imprimir
                              </button>
                              <button
                                onClick={handleDownloadPreview}
                                className="btn btn-secondary btn-outline btn-xs"
                                disabled={loadingPreview}
                                title="Descargar como PNG para imprimir después"
                              >
                                📥 Descargar PNG
                              </button>
                            </div>
                          </div>
                        ) : previewVariant ? (
                          <div className="text-center">
                            <div className="mb-1 font-mono text-lg font-bold">
                              ||||||||||||||||||||||||
                            </div>
                            <div className="break-all text-xs text-gray-700">
                              {generatePreviewText(previewVariant)}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">
                            Selecciona una variante para ver la vista previa
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Control de selección masiva */}
              <div className="flex items-center justify-between rounded-lg bg-base-200 p-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <span className="font-medium">Seleccionar todas las variantes</span>
                  <span className="ml-2 text-xs text-gray-500">(con stock completo)</span>
                </label>
                <div className="text-sm text-gray-600">
                  Total etiquetas:{' '}
                  {Object.values(quantities).reduce((sum, qty) => sum + (qty || 0), 0)}
                </div>
              </div>

              {/* Lista de variantes */}
              <div className="rounded-lg bg-base-200 p-4">
                <h4 className="text-md mb-3 font-semibold">Variantes del Producto</h4>

                {variants.length === 0 ? (
                  <div className="py-8 text-center">
                    <Package className="mx-auto mb-2 h-12 w-12 opacity-50" />
                    <p className="text-gray-600">No se encontraron variantes para este producto</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
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
                                className="input-bordered input input-sm w-20"
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
        </div>

        {/* Footer fijo fuera del scroll */}
        <div className="print-modal-footer">
          <div className="flex justify-end gap-2">
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
    </div>
  )
}
