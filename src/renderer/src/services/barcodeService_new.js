// Servicio para manejar códigos de barras desde el frontend
class BarcodeService {
    constructor(baseUrl = 'http://localhost:5000/api/barcode') {
        this.baseUrl = baseUrl
    }

    /**
     * Genera códigos de barras para múltiples variantes de un producto
     * @param {number} productId - ID del producto
     * @param {Array} variants - Array de objetos con size_id y color_id
     * @returns {Promise<Object>} - Objeto con los códigos de barras de todas las variantes
     */
    async generateVariantBarcodes(productId, variants) {
        try {
            const response = await fetch(`${this.baseUrl}/generate-variants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    product_id: productId,
                    variants: variants
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Error generando códigos de barras de variantes')
            }

            return data
        } catch (error) {
            console.error('Error generando códigos de barras de variantes:', error)
            throw error
        }
    }

    /**
     * Genera código de barras para una variante específica
     * @param {number} productId - ID del producto
     * @param {number} sizeId - ID del talle (opcional)
     * @param {number} colorId - ID del color (opcional)
     * @returns {Promise<Object>} - Objeto con el código de barras de la variante
     */
    async generateSingleVariantBarcode(productId, sizeId = null, colorId = null) {
        try {
            const response = await fetch(`${this.baseUrl}/generate-variant`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    product_id: productId,
                    size_id: sizeId,
                    color_id: colorId
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Error generando código de barras de variante')
            }

            return data
        } catch (error) {
            console.error('Error generando código de barras de variante:', error)
            throw error
        }
    }

    /**
     * Parsea un código de barras de variante para obtener los IDs
     * @param {string} barcode - Código de barras a parsear
     * @returns {Promise<Object>} - Objeto con product_id, size_id, color_id
     */
    async parseVariantBarcode(barcode) {
        try {
            const response = await fetch(`${this.baseUrl}/parse-variant/${barcode}`)
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Error parseando código de barras')
            }

            return data
        } catch (error) {
            console.error('Error parseando código de barras:', error)
            throw error
        }
    }

    /**
     * Genera un código de barras personalizado
     * @param {string} code - Código a generar
     * @param {string} type - Tipo de código de barras (code128, ean13, upca)
     * @param {string} format - Formato de salida (svg, image)
     * @returns {Promise<Object>} - Objeto con el código de barras
     */
    async generateCustomBarcode(code, type = 'code128', format = 'svg') {
        try {
            const response = await fetch(`${this.baseUrl}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: code,
                    type: type,
                    format: format
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Error generando código personalizado')
            }

            return data
        } catch (error) {
            console.error('Error generando código personalizado:', error)
            throw error
        }
    }

    /**
     * Prueba el servicio de códigos de barras
     * @returns {Promise<Object>} - Resultado de la prueba
     */
    async testService() {
        try {
            const response = await fetch(`${this.baseUrl}/test`)
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Error en el test del servicio')
            }

            return data
        } catch (error) {
            console.error('Error probando el servicio:', error)
            throw error
        }
    }

    /**
     * Procesa las variantes de un producto para generar códigos de barras
     * @param {number} productId - ID del producto
     * @param {Array} talles - Array de objetos con talle y colores
     * @returns {Promise<Object>} - Códigos de barras generados para todas las variantes
     */
    async processProductVariants(productId, talles) {
        try {
            // Convertir estructura de talles a formato de variantes
            const variants = []

            talles.forEach((talle) => {
                if (talle.colores && Array.isArray(talle.colores)) {
                    talle.colores.forEach((color) => {
                        if (color.cantidad && parseInt(color.cantidad) > 0) {
                            variants.push({
                                size_id: talle.talle_id || talle.talle,
                                color_id: color.color_id || color.color,
                                quantity: parseInt(color.cantidad)
                            })
                        }
                    })
                }
            })

            if (variants.length === 0) {
                throw new Error('No se encontraron variantes válidas para generar códigos de barras')
            }

            // Generar códigos para todas las variantes
            const result = await this.generateVariantBarcodes(productId, variants)

            return {
                success: true,
                variants_processed: variants.length,
                barcodes: result.variant_barcodes
            }
        } catch (error) {
            console.error('Error procesando variantes del producto:', error)
            throw error
        }
    }

    /**
     * Inserta un código de barras SVG en un elemento del DOM
     * @param {string} elementId - ID del elemento donde insertar el SVG
     * @param {string} svgContent - Contenido SVG del código de barras
     */
    insertBarcodeIntoDOM(elementId, svgContent) {
        const element = document.getElementById(elementId)
        if (element) {
            element.innerHTML = svgContent
        } else {
            console.warn(`Elemento con ID "${elementId}" no encontrado`)
        }
    }

    /**
     * Descarga un código de barras como imagen
     * @param {string} svgContent - Contenido SVG del código de barras
     * @param {string} filename - Nombre del archivo a descargar
     */
    downloadBarcode(svgContent, filename = 'barcode.svg') {
        const blob = new Blob([svgContent], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }
}

export default BarcodeService
