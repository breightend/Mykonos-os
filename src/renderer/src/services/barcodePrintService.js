/**
 * Servicio para impresión de códigos de barras
 * Maneja la comunicación con el backend para generar e imprimir códigos
*/

import { API_BASE_URL } from '../config/apiConfig.js'

export class BarcodePrintService {
    /**
     * Obtiene imágenes base64 y textos de códigos de barras de regalos para imprimir desde el frontend
     * @param {Array} giftDetails - Array de objetos { salesDetail: { id, quantity } }
     * @param {Object} printOptions - Opciones de impresión
     * @returns {Promise<Array>} - Array de objetos { png_base64, text_lines, sales_detail_id, quantity }
     */
    async getGiftBarcodesImages(giftDetails, printOptions) {
        try {
            const validatedOptions = this.validatePrintOptions(printOptions)
            const requestData = {
                sales_details: giftDetails.map(item => ({
                    sales_detail_id: item.salesDetail.id,
                    quantity: item.salesDetail.quantity
                })),
                options: validatedOptions
            }
            const response = await fetch(`${API_BASE_URL}/barcode/gift-barcodes-images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            })
            const data = await response.json()
            if (!response.ok || !data.images) {
                throw new Error(data.error || 'No se pudieron generar las imágenes de los códigos de barras')
            }
            return data.images
        } catch (error) {
            console.error('Error obteniendo imágenes de códigos de regalo:', error)
            throw error
        }
    }
    /**
     * Envía una solicitud de impresión de códigos de barras al backend
     * @param {Array} variants - Array de variantes con información del producto
     * @param {Object} printOptions - Opciones de qué incluir en la impresión
     * @returns {Promise} Respuesta del servidor
     */
    async printBarcodes(variants, printOptions) {
        try {
            const response = await fetch(`${API_BASE_URL}/inventory/print-barcodes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    variants,
                    print_options: printOptions
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Error al imprimir códigos de barras')
            }

            return data
        } catch (error) {
            console.error('Error en servicio de impresión:', error)
            throw error
        }
    }

    /**
     * Imprime códigos de barras para regalos, recibiendo un array de objetos { salesDetail: { id, quantity } }
     * @param {Array} giftDetails - Array de objetos { salesDetail: { id, quantity } }
     * @param {Object} printOptions - Opciones de impresión
     * @returns {Promise<Object>} - Resultado de la impresión
     */
    async printGiftBarcodes(giftDetails, printOptions) {
        try {
            // Validar opciones de impresión
            const validatedOptions = this.validatePrintOptions(printOptions)

            // Formatear datos para el backend
            const printData = {
                sales_details: giftDetails.map(item => ({
                    sales_detail_id: item.salesDetail.id,
                    quantity: item.salesDetail.quantity
                })),
                options: validatedOptions
            }

            // Enviar solicitud al backend
            const response = await fetch(`${API_BASE_URL}/barcode/print-gift-barcodes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(printData)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Error al imprimir códigos de barras de regalos')
            }

            return {
                success: true,
                message: data.message || 'Códigos de barras de regalos enviados a impresión',
                totalPrinted: data.data?.total_labels || 0,
                totalDetails: data.data?.total_details || 0
            }
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Error desconocido al imprimir códigos de barras de regalos'
            }
        }
    }

    /**
     * Formatea la información de una variante para el backend
     * @param {Object} variant - Variante del producto
     * @param {Object} product - Información del producto
     * @param {number} quantity - Cantidad a imprimir
     * @returns {Object} Objeto formateado para el backend
     */
    formatVariantForPrint(variant, product, quantity) {
        return {
            barcode: variant.barcode || this.generateFallbackBarcode(variant, product),
            product_info: {
                name: product?.name || 'Producto sin nombre',
                brand: product?.brand || 'Sin marca',
                size_name: variant?.size_name || null,
                color_name: variant?.color_name || null,
                price: product?.sale_price || variant?.price || 0
            },
            quantity: quantity || 1
        }
    }

    /**
     * Genera un código de barras de respaldo si no existe uno
     * @param {Object} variant - Variante del producto
     * @param {Object} product - Información del producto
     * @returns {string} Código de barras generado
     */
    generateFallbackBarcode(variant, product) {
        // Crear un código basado en IDs
        const productId = String(product?.id || 0).padStart(4, '0')
        const variantId = String(variant?.id || 0).padStart(4, '0')
        const sizeId = String(variant?.size_id || 0).padStart(2, '0')
        const colorId = String(variant?.color_id || 0).padStart(2, '0')

        // Crear un código de 13 dígitos (EAN13)
        const code12 = `1${productId}${variantId}${sizeId}${colorId}0`

        // Calcular dígito de verificación para EAN13
        const checkDigit = this.calculateEAN13CheckDigit(code12)

        return `${code12}${checkDigit}`
    }

    /**
     * Calcula el dígito de verificación para EAN13
     * @param {string} code12 - Los primeros 12 dígitos del código
     * @returns {string} Dígito de verificación
     */
    calculateEAN13CheckDigit(code12) {
        let sum = 0
        for (let i = 0; i < 12; i++) {
            const digit = parseInt(code12[i])
            if (i % 2 === 0) {
                sum += digit
            } else {
                sum += digit * 3
            }
        }
        const checkDigit = (10 - (sum % 10)) % 10
        return String(checkDigit)
    }

    /**
     * Valida las opciones de impresión
     * @param {Object} printOptions - Opciones de impresión
     * @returns {Object} Opciones validadas
     */
    validatePrintOptions(printOptions) {
        return {
            includeProductName: printOptions?.includeProductName ?? true,
            includeSize: printOptions?.includeSize ?? true,
            includeColor: printOptions?.includeColor ?? true,
            includePrice: printOptions?.includePrice ?? true,
            includeCode: printOptions?.includeCode ?? true
        }
    }

    /**
     * Procesa múltiples variantes para impresión (versión original - servidor backend)
     * @param {Array} selectedVariants - Variantes seleccionadas con cantidades
     * @param {Object} productInfo - Información del producto
     * @param {Object} printOptions - Opciones de impresión
     * @returns {Promise} Resultado de la impresión
     */
    async processPrintRequest(selectedVariants, productInfo, printOptions) {
        try {
            // Filtrar variantes con cantidad > 0
            const validVariants = selectedVariants.filter(item => item.quantity > 0)

            if (validVariants.length === 0) {
                throw new Error('No hay variantes seleccionadas para imprimir')
            }

            // Validar opciones de impresión
            const validatedOptions = this.validatePrintOptions(printOptions)

            // Formatear datos para el backend (formato esperado por el endpoint)
            const printData = {
                productId: productInfo?.id,
                variants: validVariants.map(item => ({
                    variantId: item.variant.id,
                    quantity: item.quantity
                })),
                options: validatedOptions
            }

            console.log('📤 Enviando datos de impresión:', printData)

            // Enviar solicitud al backend usando el nuevo formato
            const response = await fetch(`${API_BASE_URL}/inventory/print-barcodes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(printData)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Error al imprimir códigos de barras')
            }

            return {
                success: true,
                message: data.message || 'Códigos enviados a impresión',
                totalPrinted: data.data?.total_labels || 0,
                totalVariants: data.data?.total_variants || 0
            }

        } catch (error) {
            return {
                success: false,
                message: error.message || 'Error desconocido al imprimir códigos de barras'
            }
        }
    }

    /**
     * Descarga un archivo PNG como blob desde una URL
     * @param {string} downloadUrl - URL de descarga del archivo PNG
     * @returns {Promise<Blob>} Blob del archivo PNG
     */
    async downloadPngAsBlob(downloadUrl) {
        try {
            const fullUrl = `${API_BASE_URL}${downloadUrl}`
            console.log('📥 Iniciando descarga desde:', fullUrl)

            const response = await fetch(fullUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'image/png'
                }
            })

            console.log('📡 Respuesta de descarga:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            })

            if (!response.ok) {
                throw new Error(`Error al descargar archivo: ${response.status} ${response.statusText}`)
            }

            const blob = await response.blob()

            console.log('📦 Blob creado:', {
                size: blob.size,
                type: blob.type,
                sizeKB: Math.round(blob.size / 1024)
            })

            // Verificar que es realmente una imagen PNG
            if (!blob.type.includes('image')) {
                console.error('❌ Tipo de archivo incorrecto:', blob.type)
                throw new Error('El archivo descargado no es una imagen válida')
            }

            console.log('✅ Archivo PNG descargado exitosamente:', {
                size: blob.size,
                type: blob.type,
                url: downloadUrl
            })

            return blob
        } catch (error) {
            console.error('❌ Error descargando PNG desde:', downloadUrl, error)
            throw error
        }
    }

    /**
     * Abre una ventana de impresión usando iframe (sin popup bloqueado y sin scripts inline)
     * @param {Blob} pngBlob - Blob de la imagen PNG
     * @param {string} filename - Nombre del archivo para referencia
     * @param {number} quantity - Cantidad que debe imprimir el usuario
     * @returns {Promise<void>}
     */
    async openPrintDialog(pngBlob, filename, quantity) {
        return new Promise((resolve, reject) => {
            try {
                console.log(`🖼️ Creando impresión con iframe para: ${filename}`)

                // Crear URL temporal para la imagen
                const imageUrl = URL.createObjectURL(pngBlob)
                console.log(`📎 URL temporal creada: ${imageUrl.substring(0, 50)}...`)

                // Crear contenido HTML SIN scripts inline para cumplir CSP
                const printContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Imprimir Código de Barras - ${filename}</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #f5f5f5;
        }
        .print-container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            max-width: 600px;
            width: 100%;
        }
        .print-info {
            margin-bottom: 20px;
            padding: 15px;
            background: #e3f2fd;
            border-radius: 6px;
            border-left: 4px solid #2196f3;
        }
        .print-info h3 {
            margin: 0 0 10px 0;
            color: #1976d2;
            font-size: 18px;
        }
        .quantity-highlight {
            font-size: 24px;
            font-weight: bold;
            color: #f44336;
            background: #fff3e0;
            padding: 10px;
            border-radius: 4px;
            display: inline-block;
            margin: 10px 0;
        }
        .barcode-image {
            max-width: 100%;
            height: auto;
            border: 2px dashed #ccc;
            padding: 10px;
            background: white;
            margin: 20px 0;
        }
        .instructions {
            background: #fff3e0;
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
            border-left: 4px solid #ff9800;
            font-size: 14px;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
                margin: 0;
            }
            .print-container {
                box-shadow: none;
                max-width: none;
                padding: 10px;
            }
            .print-info {
                background: none;
                border: 1px solid #ccc;
            }
            .instructions {
                display: none;
            }
            .quantity-highlight {
                background: none;
                border: 2px solid #000;
            }
        }
    </style>
</head>
<body>
    <div class="print-container">
        <div class="print-info">
            <h3>🏷️ Código de Barras para Imprimir</h3>
            <p><strong>Archivo:</strong> ${filename}</p>
            <div class="quantity-highlight">
                Cantidad a imprimir: ${quantity}
            </div>
        </div>
        
        <img id="barcodeImg" src="${imageUrl}" alt="Código de Barras" class="barcode-image" />
        
        <div class="instructions">
            <h4>📋 Instrucciones:</h4>
            <ul>
                <li>Especifica <strong>${quantity}</strong> copias en el diálogo de impresión</li>
                <li>Ajusta el tamaño de papel según tus etiquetas</li>
                <li>Verifica la vista previa antes de imprimir</li>
            </ul>
        </div>
    </div>
</body>
</html>`

                console.log(`🌐 Creando iframe para impresión: ${filename}`)

                // Crear iframe oculto para impresión
                const iframe = document.createElement('iframe')
                iframe.style.position = 'absolute'
                iframe.style.width = '0px'
                iframe.style.height = '0px'
                iframe.style.border = 'none'
                iframe.style.visibility = 'hidden'
                iframe.style.opacity = '0'
                iframe.id = `print-iframe-${Date.now()}`

                // Agregar iframe al DOM
                document.body.appendChild(iframe)

                // Escribir contenido en el iframe
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
                    iframeDoc.open()
                    iframeDoc.write(printContent)
                    iframeDoc.close()

                    console.log(`✅ Iframe creado y contenido escrito para: ${filename}`)

                    // Esperar a que se cargue el contenido y luego configurar los eventos
                    iframe.onload = () => {
                        try {
                            const iframeWindow = iframe.contentWindow
                            const iframeDocument = iframeWindow.document
                            const img = iframeDocument.getElementById('barcodeImg')

                            console.log(`🔧 Configurando eventos para: ${filename}`)

                            // Función para iniciar impresión
                            const startPrint = () => {
                                console.log(`📄 Iniciando impresión para: ${filename}`)
                                try {
                                    iframeWindow.print()

                                    // Esperar un poco y luego limpiar
                                    setTimeout(() => {
                                        console.log(`✅ Impresión completada para: ${filename}`)
                                        if (iframe.parentNode) {
                                            document.body.removeChild(iframe)
                                        }
                                        URL.revokeObjectURL(imageUrl)
                                        resolve()
                                    }, 2000)
                                } catch (error) {
                                    console.error(`❌ Error al imprimir: ${error}`)
                                    if (iframe.parentNode) {
                                        document.body.removeChild(iframe)
                                    }
                                    URL.revokeObjectURL(imageUrl)
                                    reject(error)
                                }
                            }

                            // Verificar si la imagen ya está cargada
                            if (img.complete && img.naturalHeight !== 0) {
                                console.log(`✅ Imagen ya cargada para: ${filename}, iniciando impresión`)
                                setTimeout(startPrint, 500)
                            } else {
                                console.log(`⏳ Esperando carga de imagen para: ${filename}`)
                                img.onload = () => {
                                    console.log(`✅ Imagen cargada para: ${filename}, iniciando impresión`)
                                    setTimeout(startPrint, 500)
                                }
                                img.onerror = () => {
                                    console.error(`❌ Error cargando imagen para: ${filename}`)
                                    if (iframe.parentNode) {
                                        document.body.removeChild(iframe)
                                    }
                                    URL.revokeObjectURL(imageUrl)
                                    reject(new Error('Error cargando imagen'))
                                }
                            }

                            // Timeout de seguridad
                            setTimeout(() => {
                                if (iframe.parentNode) {
                                    console.log(`⏰ Timeout alcanzado para: ${filename}, limpiando recursos`)
                                    document.body.removeChild(iframe)
                                    URL.revokeObjectURL(imageUrl)
                                    resolve() // Resolver incluso si hay timeout
                                }
                            }, 10000)

                        } catch (eventError) {
                            console.error(`❌ Error configurando eventos para: ${filename}`, eventError)
                            if (iframe.parentNode) {
                                document.body.removeChild(iframe)
                            }
                            URL.revokeObjectURL(imageUrl)
                            reject(eventError)
                        }
                    }

                    // Timeout adicional en caso de que onload no se dispare
                    setTimeout(() => {
                        if (iframe.parentNode && !iframe.onload.called) {
                            console.log(`⏰ Timeout de onload para: ${filename}, disparando manualmente`)
                            iframe.onload()
                        }
                    }, 2000)

                } catch (error) {
                    console.error('❌ Error escribiendo en iframe:', error)
                    if (iframe.parentNode) {
                        document.body.removeChild(iframe)
                    }
                    URL.revokeObjectURL(imageUrl)
                    reject(error)
                }

            } catch (error) {
                console.error('❌ Error crítico en openPrintDialog:', error)
                reject(error)
            }
        })
    }

    /**
     * Método de fallback: descarga directa del archivo para impresión manual
     * @param {Blob} pngBlob - Blob de la imagen PNG
     * @param {string} filename - Nombre del archivo para referencia
     * @param {number} quantity - Cantidad que debe imprimir el usuario
     * @returns {Promise<void>}
     */
    async downloadForManualPrint(pngBlob, filename, quantity) {
        return new Promise((resolve) => {
            try {
                console.log(`📥 Descarga manual para: ${filename}`)

                // Crear enlace de descarga
                const url = URL.createObjectURL(pngBlob)
                const link = document.createElement('a')
                link.href = url
                link.download = filename
                link.style.display = 'none'

                // Agregar al DOM y hacer clic
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)

                // Limpiar URL después de un momento
                setTimeout(() => {
                    URL.revokeObjectURL(url)
                }, 1000)

                console.log(`✅ Archivo descargado para impresión manual: ${filename}`)
                resolve()

            } catch (error) {
                console.error('❌ Error en descarga manual:', error)
                resolve() // Resolver de todas formas para no bloquear el flujo
            }
        })
    }    /**
     * Procesa impresión automática de códigos de barras con descarga y popup automático
     * @param {Array} selectedVariants - Variantes seleccionadas con cantidades
     * @param {Object} productInfo - Información del producto
     * @param {Object} printOptions - Opciones de impresión
     * @param {Function} onProgress - Callback para reportar progreso (opcional)
     * @returns {Promise} Resultado de la impresión automática
     */
    async processAutomaticPrintRequest(selectedVariants, productInfo, printOptions, onProgress = null) {
        try {
            // Filtrar variantes con cantidad > 0
            const validVariants = selectedVariants.filter(item => item.quantity > 0)

            if (validVariants.length === 0) {
                throw new Error('No hay variantes seleccionadas para imprimir')
            }

            console.log('🚀 Iniciando impresión automática para', validVariants.length, 'variantes')

            // Validar opciones de impresión
            const validatedOptions = this.validatePrintOptions(printOptions)

            // Formatear datos para el backend (formato esperado por el endpoint)
            const printData = {
                productId: productInfo?.id,
                variants: validVariants.map(item => ({
                    variantId: item.variant.id,
                    quantity: item.quantity
                })),
                options: validatedOptions
            }

            console.log('📤 Enviando solicitud al backend:', printData)

            // Reportar progreso inicial
            if (onProgress) {
                onProgress({
                    step: 'request',
                    message: 'Generando códigos de barras...',
                    current: 0,
                    total: validVariants.length
                })
            }

            // Enviar solicitud al backend para generar los PNGs
            const response = await fetch(`${API_BASE_URL}/inventory/print-barcodes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(printData)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Error al generar códigos de barras')
            }

            // Verificar que tenemos URLs de descarga
            if (!data.data || !data.data.download_urls || !Array.isArray(data.data.download_urls)) {
                throw new Error('El servidor no retornó URLs de descarga válidas')
            }

            const downloadUrls = data.data.download_urls
            console.log('✅ Recibidas', downloadUrls.length, 'URLs de descarga:', downloadUrls)

            // Reportar progreso - URLs recibidas
            if (onProgress) {
                onProgress({
                    step: 'urls_received',
                    message: `Recibidas ${downloadUrls.length} URLs de descarga`,
                    current: 0,
                    total: downloadUrls.length
                })
            }

            // Procesar cada URL de descarga
            const results = []
            let successCount = 0
            let errorCount = 0

            for (let i = 0; i < downloadUrls.length; i++) {
                const urlData = downloadUrls[i]

                try {
                    // Reportar progreso actual
                    if (onProgress) {
                        onProgress({
                            step: 'processing',
                            message: `Procesando ${urlData.filename} (${i + 1}/${downloadUrls.length})`,
                            current: i + 1,
                            total: downloadUrls.length
                        })
                    }

                    console.log(`📥 [${i + 1}/${downloadUrls.length}] Procesando archivo:`, {
                        filename: urlData.filename,
                        variant_id: urlData.variant_id,
                        quantity: urlData.quantity,
                        download_url: urlData.download_url
                    })

                    // Descargar PNG como blob
                    console.log(`📥 [${i + 1}/${downloadUrls.length}] Descargando blob para: ${urlData.filename}`)
                    const pngBlob = await this.downloadPngAsBlob(urlData.download_url)
                    console.log(`✅ [${i + 1}/${downloadUrls.length}] Blob descargado para: ${urlData.filename}`)

                    // Abrir ventana de impresión con fallback
                    console.log(`🖨️ [${i + 1}/${downloadUrls.length}] Intentando impresión automática para: ${urlData.filename}`)

                    try {
                        await this.openPrintDialog(pngBlob, urlData.filename, urlData.quantity)
                        console.log(`✅ [${i + 1}/${downloadUrls.length}] Impresión automática exitosa para: ${urlData.filename}`)
                    } catch (printError) {
                        console.warn(`⚠️ [${i + 1}/${downloadUrls.length}] Impresión automática falló, usando descarga manual para: ${urlData.filename}`, printError.message)

                        // Fallback: descarga manual
                        await this.downloadForManualPrint(pngBlob, urlData.filename, urlData.quantity)
                        console.log(`✅ [${i + 1}/${downloadUrls.length}] Descarga manual completada para: ${urlData.filename}`)
                    }

                    results.push({
                        filename: urlData.filename,
                        variant_id: urlData.variant_id,
                        quantity: urlData.quantity,
                        success: true
                    })

                    successCount++
                    console.log(`🎉 [${i + 1}/${downloadUrls.length}] Procesado exitosamente: ${urlData.filename}`)

                    // Pausa de 2 segundos entre archivos (excepto el último)
                    if (i < downloadUrls.length - 1) {
                        console.log(`⏳ [${i + 1}/${downloadUrls.length}] Pausa de 2 segundos antes del siguiente archivo...`)
                        await new Promise(resolve => setTimeout(resolve, 2000))
                    }

                } catch (error) {
                    console.error(`❌ [${i + 1}/${downloadUrls.length}] Error procesando ${urlData.filename}:`, error)

                    results.push({
                        filename: urlData.filename,
                        variant_id: urlData.variant_id,
                        quantity: urlData.quantity,
                        success: false,
                        error: error.message
                    })

                    errorCount++
                }
            }

            // Reportar progreso final
            if (onProgress) {
                onProgress({
                    step: 'completed',
                    message: `Completado: ${successCount} exitosos, ${errorCount} errores`,
                    current: downloadUrls.length,
                    total: downloadUrls.length
                })
            }

            console.log('🎯 Proceso completado:', {
                total: downloadUrls.length,
                success: successCount,
                errors: errorCount,
                results: results
            })

            return {
                success: true,
                message: `Impresión automática completada: ${successCount} archivos procesados correctamente${errorCount > 0 ? `, ${errorCount} errores` : ''}`,
                totalFiles: downloadUrls.length,
                successCount: successCount,
                errorCount: errorCount,
                results: results
            }

        } catch (error) {
            console.error('❌ Error en impresión automática:', error)
            return {
                success: false,
                message: error.message || 'Error desconocido en la impresión automática',
                totalFiles: 0,
                successCount: 0,
                errorCount: 1,
                results: []
            }
        }
    }
}

export const barcodePrintService = new BarcodePrintService()
