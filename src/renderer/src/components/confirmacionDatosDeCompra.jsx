import { useLocation } from 'wouter'
import { useSellContext } from '../contexts/sellContext'
import toast, { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { Gift, Printer, Replace, RotateCcw, Shirt } from 'lucide-react'
import { salesService } from '../services/salesService'
import { getCurrentBranchId } from '../utils/posUtils'
import { barcodePrintService } from '../services/barcodePrintService'
import { useSession } from '../contexts/SessionContext'

export default function ConfirmacionDatosDeCompra() {
  const { saleData } = useSellContext()
  console.log('Información del contexto:', saleData)
  const [, setLocation] = useLocation()
  const [isProcessing, setIsProcessing] = useState(false)
  const branchId = getCurrentBranchId()
  const userId = useSession().session.user_id

  const [printOptions] = useState({
    includeColor: false,
    includePrice: false,
    includeCode: true,
    includeSize: true,
    includeProductName: false,
    printWidth: 450,
    printHeight: 200,
    fontSize: 12,
    backgroundColor: '#FFFFFF',
    textColor: '#000000'
  })

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
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Vista Previa - Codigo regalos</title>
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
      link.download = `codigo-barras-.png`
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

  const handleSubmit = async () => {
    if (isProcessing) return

    setIsProcessing(true)

    try {
      // --- SPLIT PRODUCTS FOR GIFT LOGIC ---
      let splitProducts = []
      saleData.products.forEach((product) => {
        const quantity = parseInt(product.quantity || product.cantidad || 1)
        // Count how many gifts for this variant_id
        let giftCount = 0
        if (Array.isArray(saleData.gifts)) {
          giftCount = saleData.gifts
            .filter((g) => g.variant_id === product.variant_id)
            .reduce((sum, g) => sum + (parseInt(g.quantity) || 1), 0)
        }
        const nonGiftCount = quantity - giftCount
        // Add gift items
        for (let i = 0; i < giftCount; i++) {
          splitProducts.push({
            ...product,
            quantity: 1,
            gift: true
          })
        }
        // Add non-gift items
        for (let i = 0; i < nonGiftCount; i++) {
          splitProducts.push({
            ...product,
            quantity: 1,
            gift: false
          })
        }
      })

      const saleDataForBackend = {
        customer: saleData.customer || null,
        products: splitProducts.map((product) => ({
          product_id: product.product_id,
          variant_id: product.variant_id,
          product_name:
            product.description || product.descripcion || product.product_name || 'Producto',
          description: product.description || product.descripcion || '',
          brand: product.brand || product.marca || '',
          size_name: product.size_name || product.talle || '',
          color_name: product.color_name || product.color || '',
          price: parseFloat(product.price || product.precio || 0),
          quantity: parseInt(product.quantity || product.cantidad || 1),
          variant_barcode: product.variant_barcode || '',
          gift: product.gift === true
        })),
        exchange: saleData.exchange?.hasExchange
          ? {
              hasExchange: true,
              returnedProducts: saleData.exchange.returnedProducts.map((product) => ({
                product_id: product.product_id,
                variant_id: product.variant_id,
                product_name:
                  product.description || product.descripcion || product.product_name || 'Producto',
                description: product.description || product.descripcion || '',
                brand: product.brand || product.marca || '',
                size_name: product.size_name || product.talle || '',
                color_name: product.color_name || product.color || '',
                price: parseFloat(product.price || product.precio || 0),
                quantity: parseInt(product.quantity || product.cantidad || 1),
                variant_barcode: product.variant_barcode || ''
              })),
              totalProductsValue: parseFloat(saleData.exchange.totalProductsValue),
              totalReturnedValue: parseFloat(saleData.exchange.totalReturnedValue),
              finalAmount: parseFloat(saleData.exchange.finalAmount)
            }
          : null,
        payments: saleData.payments.map((payment) => ({
          method: payment.method,
          payment_method_id: payment.id || null,
          amount: parseFloat(payment.amount),
          method_name: payment.method_name || payment.label || payment.type,
          bank_id: payment.bank_id || null,
          reference: payment.reference || '',
          discount: payment.discount || 0
        })),
        // Calcular el total y descuento según el pago
        total:
          totalAbonado > totalVenta
            ? parseFloat(totalVenta) // Si pagó de más, el total es la suma de los productos (o el totalVenta)
            : parseFloat(totalAbonado), // Si pagó menos o igual, el total es lo que pagó (incluye descuento)
        discount:
          totalAbonado < totalVenta
            ? (parseFloat(totalVenta) - parseFloat(totalAbonado)).toFixed(2) // Descuento aplicado
            : 0,
        storage_id: branchId,
        employee_id: 1, // TODO: Obtener empleado de la venta
        cashier_user_id: userId
      }

      const result = await salesService.createSale(saleDataForBackend)
      if (result.status === 'success') {
        toast.success(
          `Venta finalizada con éxito${saleData.exchange?.hasExchange ? ' con intercambio' : ''}`,
          { duration: 3000 }
        )
        setTimeout(() => {
          setLocation('/ventas')
        }, 2000)
      } else {
        throw new Error(result.message || 'Error desconocido al procesar la venta')
      }
    } catch (error) {
      console.error('❌ Error al finalizar venta:', error)
      toast.error(`Error al finalizar la venta: ${error.message}`, { duration: 4000 })
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePrint = async () => {
    if (isProcessing) return

    setIsProcessing(true)

    try {
      const saleDataForBackend = {
        customer: saleData.customer || null,
        products: saleData.products.map((product) => ({
          product_id: product.product_id,
          variant_id: product.variant_id,
          product_name:
            product.description || product.descripcion || product.product_name || 'Producto',
          description: product.description || product.descripcion || '',
          brand: product.brand || product.marca || '',
          size_name: product.size_name || product.talle || '',
          color_name: product.color_name || product.color || '',
          price: parseFloat(product.price || product.precio || 0),
          quantity: parseInt(product.quantity || product.cantidad || 1),
          variant_barcode: product.variant_barcode || '',
          gift: product.gift || null
        })),
        exchange: saleData.exchange?.hasExchange
          ? {
              hasExchange: true,
              returnedProducts: saleData.exchange.returnedProducts.map((product) => ({
                product_id: product.product_id,
                variant_id: product.variant_id,
                product_name:
                  product.description || product.descripcion || product.product_name || 'Producto',
                description: product.description || product.descripcion || '',
                brand: product.brand || product.marca || '',
                size_name: product.size_name || product.talle || '',
                color_name: product.color_name || product.color || '',
                price: parseFloat(product.price || product.precio || 0),
                quantity: parseInt(product.quantity || product.cantidad || 1),
                variant_barcode: product.variant_barcode || ''
              })),
              totalProductsValue: parseFloat(saleData.exchange.totalProductsValue),
              totalReturnedValue: parseFloat(saleData.exchange.totalReturnedValue),
              finalAmount: parseFloat(saleData.exchange.finalAmount)
            }
          : null,
        payments: saleData.payments.map((payment) => ({
          method: payment.method,
          payment_method_id: payment.id || null,
          amount: parseFloat(payment.amount),
          method_name: payment.method_name || payment.label || payment.type,
          bank_id: payment.bank_id || null,
          reference: payment.reference || ''
        })),
        total: saleData.exchange?.hasExchange
          ? parseFloat(saleData.exchange.finalAmount)
          : parseFloat(saleData.total),
        storage_id: branchId,
        employee_id: 1, // TODO: Se puede agregar despues un selector de empleados
        cashier_user_id: userId
      }
      const result = await salesService.createSale(saleDataForBackend)

      if (result.status === 'success') {
        toast.success(
          `Venta finalizada con éxito${saleData.exchange?.hasExchange ? ' con intercambio' : ''}`,
          { duration: 3000 }
        )
        if (
          saleData.gifts &&
          saleData.gifts.length > 0 &&
          Array.isArray(result.data?.gift_sales_details)
        ) {
          const giftDetails = saleData.gifts
            .map((gift, idx) => ({
              salesDetail: {
                id: result.data.gift_sales_details[idx]?.sales_detail_id,
                quantity: gift.quantity
              }
            }))
            .filter((g) => g.salesDetail.id)

          if (giftDetails.length > 0) {
            try {
              // 1. Pedir al backend las imágenes de los códigos de barra
              const response = await fetch(
                'http://localhost:5000/api/barcode/gift-barcodes-images',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    sales_details: giftDetails.map((g) => ({
                      sales_detail_id: g.salesDetail.id,
                      quantity: g.salesDetail.quantity
                    })),
                    options: printOptions
                  })
                }
              )
              const data = await response.json()
              if (!response.ok || !data.images)
                throw new Error(data.error || 'No se pudieron generar las imágenes')

              // 2. Imprimir desde el frontend usando un iframe oculto
              console.log('Contenido de impresión:', data.images)
              printGiftBarcodesFromFrontend(data.images)
            } catch (err) {
              toast.error('No se pudo imprimir los códigos de barras de los regalos')
            }
          }
        }

        setTimeout(() => {
          setLocation('/ventas')
        }, 2000)
      } else {
        throw new Error(result.message || 'Error desconocido al procesar la venta')
      }
    } catch (error) {
      console.error('❌ Error al finalizar venta:', error)
      toast.error(`Error al finalizar la venta: ${error.message}`, { duration: 4000 })
    } finally {
      setIsProcessing(false)
    }
  }

  // Calcular total abonado excluyendo cuenta corriente (solo pagos reales)
  const totalAbonado = saleData.payments.reduce((sum, payment) => {
    // Solo sumar pagos que NO sean cuenta corriente
    if (payment.method !== 'cuenta_corriente') {
      return sum + payment.amount
    }
    return sum
  }, 0)

  // Calcular total en cuenta corriente
  const totalCuentaCorriente = saleData.payments.reduce((sum, payment) => {
    if (payment.method === 'cuenta_corriente') {
      return sum + payment.amount
    }
    return sum
  }, 0)

  // Usar el total correcto dependiendo si hay intercambio o no
  const totalVenta = saleData.exchange?.hasExchange ? saleData.exchange.finalAmount : saleData.total

  const [discount, setDiscount] = useState(0)
  const [change, setChange] = useState(0)

  const handleChange = () => {
    if (totalAbonado > totalVenta) {
      setChange(totalAbonado - totalVenta)
    } else {
      setChange(0)
    }
  }

  const handleDiscount = () => {
    if (totalAbonado <= totalVenta) {
      setDiscount((totalAbonado - totalVenta).toFixed(2))
    }
  }

  useEffect(() => {
    handleChange()
    handleDiscount()
  }, [totalAbonado, totalVenta])

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <h1 className="mb-6 text-center text-3xl font-bold">Resumen de Venta</h1>

      <div className="mb-6 rounded-lg bg-base-100 p-6 shadow-lg">
        {/* Resumen General */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="stats bg-primary text-primary-content">
            <div className="stat">
              <div className="stat-title">Total Venta</div>
              <div className="stat-value">${saleData.total.toFixed(2)}</div>
            </div>
          </div>

          <div className="stats bg-secondary text-secondary-content">
            <div className="stat">
              <div className="stat-title">Descuento</div>
              <div className="stat-value">${Math.abs(discount)}</div>
            </div>
          </div>

          <div className="stats bg-accent text-accent-content">
            <div className="stat">
              <div className="stat-title">Total abonado</div>
              <div className="stat-value">${totalAbonado.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Cliente */}
        {saleData.customer && (
          <div className="mb-6">
            <h2 className="mb-2 text-xl font-semibold">Cliente</h2>
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <p>
                  <span className="font-bold">Nombre:</span> {saleData.customer.name}
                </p>
                <p>
                  <span className="font-bold">Identificación:</span>{' '}
                  {saleData.customer.id || saleData.customer.dni}
                </p>
                {saleData.customer.contact && (
                  <p>
                    <span className="font-bold">Contacto:</span> {saleData.customer.contact}
                  </p>
                )}
                {saleData.customer.type && (
                  <p>
                    <span className="font-bold">Tipo:</span> {saleData.customer.type}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cliente de cuenta corriente desde payments (si no hay customer en saleData) */}
        {!saleData.customer &&
          saleData.payments.find((p) => p.method === 'cuenta_corriente' && p.costumer?.cliente) && (
            <div className="mb-6">
              <h2 className="mb-2 text-xl font-semibold">Cliente (Cuenta Corriente)</h2>
              <div className="card bg-base-200">
                <div className="card-body p-4">
                  {(() => {
                    const cuentaCorrientePago = saleData.payments.find(
                      (p) => p.method === 'cuenta_corriente' && p.costumer?.cliente
                    )
                    const cliente = cuentaCorrientePago?.costumer?.cliente
                    return (
                      <>
                        <p>
                          <span className="font-bold">Nombre:</span>{' '}
                          {cliente?.name || cliente?.entity_name}
                        </p>
                        <p>
                          <span className="font-bold">Identificación:</span>{' '}
                          {cliente?.dni || cliente?.id || cliente?.cuit}
                        </p>
                        {cliente?.contact && (
                          <p>
                            <span className="font-bold">Contacto:</span> {cliente.contact}
                          </p>
                        )}
                        <p>
                          <span className="font-bold">Tipo:</span> Cuenta Corriente
                        </p>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          )}

        {/* Productos */}
        <div className="mb-6">
          <h2 className="mb-2 text-xl font-semibold">
            {' '}
            <Shirt className="mr-2 inline h-5 w-5" /> Productos ({saleData.products.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Marca</th>
                  <th>Cantidad</th>
                  <th>Precio Unit.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {saleData.products.map((product, index) => (
                  <tr key={index}>
                    <td>{product.descripcion || product.description}</td>
                    <td>{product.marca || product.brand}</td>
                    <td>{product.cantidad || product.quantity}</td>
                    <td>${parseFloat(product.precio || product.price || 0).toFixed(2)}</td>
                    <td>
                      $
                      {(
                        parseFloat(product.precio || product.price || 0) *
                        (product.cantidad || product.quantity || 0)
                      ).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Productos Regalo */}
        {saleData.gifts && saleData.gifts.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-2 text-xl font-semibold text-green-700">
              <Gift className="mr-2 inline h-5 w-5" />
              Regalos ({saleData.gifts.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Marca</th>
                    <th>Cantidad</th>
                    <th>Talle</th>
                    <th>Color</th>
                  </tr>
                </thead>
                <tbody>
                  {saleData.gifts.map((gift, index) => (
                    <tr key={index}>
                      <td>{gift.product_name}</td>
                      <td>{gift.brand}</td>
                      <td>{gift.quantity}</td>
                      <td>{gift.size_name}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full border"
                            style={{ backgroundColor: gift.color_hex }}
                          ></div>
                          <span className="text-xs">{gift.color_name}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detalles del Intercambio - Solo mostrar si hubo intercambio */}
        {saleData.exchange?.hasExchange && (
          <div className="mb-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-blue-600">
              <Replace className="h-5 w-5" />
              Detalles del Intercambio
            </h2>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              {/* Resumen del intercambio */}
              <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="mb-1 text-sm text-gray-600">Productos que lleva</div>
                  <div className="text-lg font-bold text-green-600">
                    ${parseFloat(saleData.exchange.totalProductsValue || 0).toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="mb-1 text-sm text-gray-600">Productos devueltos</div>
                  <div className="text-lg font-bold text-red-600">
                    -${parseFloat(saleData.exchange.totalReturnedValue || 0).toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="mb-1 text-sm text-gray-600">Total a pagar</div>
                  <div className="text-xl font-bold text-blue-600">
                    ${parseFloat(saleData.exchange.finalAmount || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Productos devueltos */}
              <div className="mt-4">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-medium text-red-600">
                  <RotateCcw className="h-4 w-4" />
                  Productos Devueltos ({saleData.exchange.returnedProducts.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="table-compact table w-full">
                    <thead>
                      <tr className="bg-red-100">
                        <th>Producto</th>
                        <th>Marca</th>
                        <th>Talle</th>
                        <th>Color</th>
                        <th>Cantidad</th>
                        <th>Precio Unit.</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {saleData.exchange.returnedProducts.map((product, index) => (
                        <tr key={index}>
                          <td>{product.descripcion || product.description}</td>
                          <td>{product.marca || product.brand}</td>
                          <td>
                            <span className="badge badge-warning badge-sm">
                              {product.talle || product.size_name}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full border"
                                style={{ backgroundColor: product.color_hex }}
                              ></div>
                              <span className="text-xs">{product.color || product.color_name}</span>
                            </div>
                          </td>
                          <td>{product.cantidad || product.quantity}</td>
                          <td>${parseFloat(product.precio || product.price || 0).toFixed(2)}</td>
                          <td className="font-semibold text-red-600">
                            -$
                            {(
                              parseFloat(product.precio || product.price || 0) *
                              (product.cantidad || product.quantity || 0)
                            ).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Métodos de Pago */}
        <div className="mb-6">
          <h2 className="mb-2 text-xl font-semibold">Métodos de Pago</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {saleData.payments.map((method, index) => (
              <div key={index} className="card bg-base-200">
                <div className="card-body p-4">
                  <h3 className="card-title capitalize">{method.label}</h3>
                  <p className="text-lg font-bold">${method.amount.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen Final */}
        <div className="card bg-base-200">
          <div className="card-body">
            <div className="flex justify-between border-b pb-2">
              <span className="font-bold">
                {saleData.exchange?.hasExchange ? 'Total con intercambio:' : 'Subtotal:'}
              </span>
              <span>${parseFloat(totalVenta || 0).toFixed(2)}</span>
            </div>
            {saleData.exchange?.hasExchange && (
              <>
                <div className="flex justify-between border-b pb-1 text-sm text-gray-600">
                  <span>Productos que lleva:</span>
                  <span>${parseFloat(saleData.exchange.totalProductsValue || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b pb-2 text-sm text-gray-600">
                  <span>Productos devueltos:</span>
                  <span className="text-red-600">
                    -${parseFloat(saleData.exchange.totalReturnedValue || 0).toFixed(2)}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between border-b pb-2">
              <span className="font-bold">Total Pagado:</span>
              <span>${parseFloat(totalAbonado || 0).toFixed(2)}</span>
            </div>
            {totalCuentaCorriente > 0 && (
              <div className="flex justify-between border-b pb-2">
                <span className="font-bold text-orange-600">Pendiente (Cuenta Corriente):</span>
                <span className="text-orange-600">
                  ${parseFloat(totalCuentaCorriente || 0).toFixed(2)}
                </span>
              </div>
            )}
            <div className="mt-2 flex justify-between text-lg font-bold">
              <span>Cambio:</span>
              <span>${parseFloat(change || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="mb-6 flex justify-between">
        <button
          className="btn btn-neutral"
          onClick={() => setLocation('/ventas')}
          disabled={isProcessing}
        >
          Cancelar
        </button>
      </div>
      <div className="mb-6 flex items-center justify-end gap-8">
        <div className="flex justify-end">
          <button
            className={`btn btn-success ${isProcessing ? 'loading' : ''}`}
            onClick={handleSubmit}
            disabled={isProcessing}
          >
            {isProcessing ? 'Procesando...' : 'Finalizar venta'}
          </button>
        </div>
        {saleData.gifts && saleData.gifts.length > 0 && (
          <div className="flex justify-end">
            <button
              className={`btn ${isProcessing ? 'loading' : ''} btn-accent`}
              onClick={handlePrint}
              disabled={isProcessing}
            >
              <Printer className="mr-2" />
              {isProcessing ? 'Procesando...' : 'Imprimir y finalizar'}
            </button>
          </div>
        )}
      </div>
      <Toaster />
    </div>
  )
}
