/**
 * Servicio para impresión de códigos de barras
 * Maneja la comunicación con el backend para generar e imprimir códigos
 */

const API_BASE_URL = 'http://localhost:5000/api'

export class BarcodePrintService {
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
 * Imprime un código de barras simple para un regalo (solo el código, sin texto)
 * @param {number|string} salesDetailId - ID único del detalle de venta (sales_detail)
 * @param {number} quantity - Cantidad de etiquetas a imprimir
 * @param {string} type - Tipo de código de barras (opcional, por defecto 'code128')
 * @param {string} format - Formato de imagen (opcional, por defecto 'PNG')
 * @returns {Promise<Object>} - Resultado de la impresión
 */
    async printGiftBarcode(salesDetailId, quantity = 1, type = 'code128', format = 'PNG') {
        try {
            const response = await fetch(`${API_BASE_URL}/barcode/print-gift-barcode`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sales_detail_id: salesDetailId,
                    quantity,
                    type,
                    format
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al imprimir código de barras de regalo');
            }

            return {
                success: true,
                message: data.message || 'Código de barras de regalo enviado a impresión',
                ...data
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Error desconocido al imprimir código de barras de regalo'
            };
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
     * Procesa múltiples variantes para impresión
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
}

export const barcodePrintService = new BarcodePrintService()
