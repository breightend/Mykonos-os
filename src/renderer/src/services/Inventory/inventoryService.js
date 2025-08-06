import axios from 'axios'

const API_URL = 'http://localhost:5000/api/inventory'

/**
 * Servicio para manejar operaciones de inventario
 */
export const inventoryService = {
    /**
     * Obtiene todos los productos con sus cantidades por sucursal
     * @param {number} storageId - ID de la sucursal (opcional)
     * @returns {Promise} Lista de productos con su stock por sucursal
     */
    async getProductsByStorage(storageId = null) {
        try {
            const url = storageId
                ? `${API_URL}/products-by-storage?storage_id=${storageId}`
                : `${API_URL}/products-by-storage`

            const response = await axios.get(url)
            return response.data
        } catch (error) {
            console.error('Error al obtener productos por sucursal:', error)
            throw error
        }
    },

    /**
     * Obtiene la lista de sucursales desde el endpoint de inventario
     * @returns {Promise} Lista de sucursales
     */
    async getStorageList() {
        try {
            const response = await axios.get(`${API_URL}/storage-list`)
            return response.data
        } catch (error) {
            console.error('Error al obtener lista de sucursales:', error)
            throw error
        }
    },

    /**
     * Obtiene el stock de un producto específico en todas las sucursales
     * @param {number} productId - ID del producto
     * @returns {Promise} Stock del producto por sucursal
     */
    async getProductStockByStorage(productId) {
        try {
            const response = await axios.get(`${API_URL}/product-stock/${productId}`)
            return response.data
        } catch (error) {
            console.error('Error al obtener stock del producto:', error)
            throw error
        }
    },

    /**
     * Actualiza el stock de un producto en una sucursal específica
     * @param {number} productId - ID del producto
     * @param {number} storageId - ID de la sucursal
     * @param {number} quantity - Nueva cantidad
     * @returns {Promise} Resultado de la actualización
     */
    async updateStock(productId, storageId, quantity) {
        try {
            const response = await axios.put(`${API_URL}/update-stock`, {
                product_id: productId,
                storage_id: storageId,
                quantity: quantity
            })
            return response.data
        } catch (error) {
            console.error('Error al actualizar stock:', error)
            throw error
        }
    },

    /**
     * Obtiene el stock total de un producto sumando todas las sucursales
     * @param {number} productId - ID del producto
     * @returns {Promise} Stock total del producto
     */
    async getTotalStock(productId) {
        try {
            const response = await axios.get(`${API_URL}/total-stock/${productId}`)
            return response.data
        } catch (error) {
            console.error('Error al obtener stock total:', error)
            throw error
        }
    },

    /**
     * Obtiene resumen de productos para la tabla principal
     * @param {number} storageId - ID de la sucursal (opcional)
     * @returns {Promise} Lista de productos con información resumida
     */
    async getProductsSummary(storageId = null) {
        try {
            const url = storageId
                ? `${API_URL}/products-summary?storage_id=${storageId}`
                : `${API_URL}/products-summary`

            const response = await axios.get(url)

            return response.data
        } catch (error) {
            console.error('Error al obtener resumen de productos:', error)
            throw error
        }
    },

    /**
     * Obtiene detalles completos de un producto específico
     * @param {number} productId - ID del producto
     * @returns {Promise} Información detallada del producto
     */
    async getProductDetails(productId) {
        try {
            const url = `${API_URL}/product-details/${productId}`

            const response = await axios.get(url)

            return response.data
        } catch (error) {
            console.error('Error al obtener detalles del producto:', error)
            throw error
        }
    },

    /**
     * Crea un nuevo movimiento de inventario entre sucursales
     * @param {number} fromStorageId - ID de la sucursal origen
     * @param {number} toStorageId - ID de la sucursal destino
     * @param {Array} products - Array de productos con {id, quantity}
     * @returns {Promise} Resultado del movimiento
     */
    async createMovement(fromStorageId, toStorageId, products) {
        try {
            const response = await axios.post(`${API_URL}/movements`, {
                from_storage_id: fromStorageId,
                to_storage_id: toStorageId,
                products: products,
                notes: '',
                user_id: 1 // TODO: Obtener del contexto de sesión
            })
            return response.data
        } catch (error) {
            console.error('❌ Error al crear movimiento:', error)
            throw error
        }
    },

    /**
     * Crea un nuevo movimiento de inventario de variantes específicas entre sucursales
     * @param {number} fromStorageId - ID de la sucursal origen
     * @param {number} toStorageId - ID de la sucursal destino
     * @param {Array} variants - Array de variantes con {variant_id, product_id, size_id, color_id, quantity, variant_barcode}
     * @returns {Promise} Resultado del movimiento
     */
    async createVariantMovement(fromStorageId, toStorageId, variants) {
        try {
            const response = await axios.post(`${API_URL}/variant-movements`, {
                from_storage_id: fromStorageId,
                to_storage_id: toStorageId,
                variants: variants,
                notes: '',
                user_id: 1 // TODO: Obtener del contexto de sesión
            })
            return response.data
        } catch (error) {
            console.error('❌ Error al crear movimiento de variantes:', error)
            throw error
        }
    },

    /**
     * Obtiene envíos pendientes para una sucursal
     * @param {number} storageId - ID de la sucursal
     * @returns {Promise} Lista de envíos pendientes
     */
    async getPendingShipments(storageId) {
        try {
            const response = await axios.get(`${API_URL}/pending-shipments/${storageId}`)
            return response.data
        } catch (error) {
            console.error('❌ Error al obtener envíos pendientes:', error)
            throw error
        }
    },

    /**
     * Actualiza el estado de un envío
     * @param {number} shipmentId - ID del envío
     * @param {string} status - Nuevo estado ('recibido', 'no_recibido', 'en_transito', 'entregado')
     * @returns {Promise} Resultado de la actualización
     */
    async updateShipmentStatus(shipmentId, status) {
        try {
            const response = await axios.put(`${API_URL}/shipments/${shipmentId}/status`, {
                status: status,
                user_id: 1 // TODO: Obtener del contexto de sesión
            })
            return response.data
        } catch (error) {
            console.error('❌ Error al actualizar estado del envío:', error)
            throw error
        }
    },

    /**
     * Obtiene envíos realizados desde una sucursal
     * @param {number} storageId - ID de la sucursal
     * @returns {Promise} Lista de envíos realizados
     */
    async getSentShipments(storageId) {
        try {
            const response = await axios.get(`${API_URL}/sent-shipments/${storageId}`)
            return response.data
        } catch (error) {
            console.error('❌ Error al obtener envíos realizados:', error)
            throw error
        }
    },

    /**
     * Actualiza un producto con nueva información
     * @param {number} productId - ID del producto a actualizar
     * @param {Object} updateData - Datos a actualizar
     * @returns {Promise} Respuesta de la actualización
     */
    async updateProduct(productId, updateData) {
        try {
            console.log('🔄 Actualizando producto:', productId, updateData)

            // Preparar datos para envío
            const dataToSend = { ...updateData }

            // Asegurar que los valores numéricos estén en el formato correcto
            if (dataToSend.cost !== undefined) {
                dataToSend.cost = parseFloat(dataToSend.cost) || 0
            }
            if (dataToSend.sale_price !== undefined) {
                dataToSend.sale_price = parseFloat(dataToSend.sale_price) || 0
            }
            if (dataToSend.original_price !== undefined) {
                dataToSend.original_price = parseFloat(dataToSend.original_price) || 0
            }
            if (dataToSend.discount_percentage !== undefined) {
                dataToSend.discount_percentage = parseFloat(dataToSend.discount_percentage) || 0
            }
            if (dataToSend.discount_amount !== undefined) {
                dataToSend.discount_amount = parseFloat(dataToSend.discount_amount) || 0
            }
            if (dataToSend.tax !== undefined) {
                dataToSend.tax = parseFloat(dataToSend.tax) || 0
            }

            // Convertir has_discount a booleano
            if (dataToSend.has_discount !== undefined) {
                dataToSend.has_discount = Boolean(dataToSend.has_discount)
            }

            // Validar y procesar stock_variants si existen
            if (dataToSend.stock_variants && Array.isArray(dataToSend.stock_variants)) {
                dataToSend.stock_variants = dataToSend.stock_variants.map(variant => ({
                    ...variant,
                    quantity: parseInt(variant.quantity) || 0,
                    size_id: parseInt(variant.size_id) || variant.size_id,
                    color_id: parseInt(variant.color_id) || variant.color_id,
                    sucursal_id: parseInt(variant.sucursal_id) || variant.sucursal_id || variant.branch_id,
                    is_new: Boolean(variant.is_new)
                }))
            }

            console.log('📤 Datos procesados para envío:', dataToSend)

            const response = await axios.put(`${API_URL}/products/${productId}`, dataToSend)
            console.log('✅ Producto actualizado:', response.data)
            return response.data
        } catch (error) {
            console.error('❌ Error al actualizar producto:', error)
            console.error('🔍 Error detallado:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            })
            throw error
        }
    },

    /**
     * Crea envíos de prueba (temporal para desarrollo)
     * @returns {Promise} Resultado de la creación
     */
    async createTestShipments() {
        try {
            const response = await axios.post(`${API_URL}/create-test-shipments`)
            return response.data
        } catch (error) {
            console.error('❌ Error al crear envíos de prueba:', error)
            throw error
        }
    },

    /**
     * Obtiene los detalles de un producto específico
     * @param {number} productId - ID del producto
     * @returns {Promise} Detalles del producto
     */
    async getProductDetail(productId) {
        try {
            const response = await axios.get(`${API_URL}/product-detail/${productId}`)
            return response.data
        } catch (error) {
            console.error('❌ Error al obtener detalles del producto:', error)
            throw error
        }
    },

    /**
     * Obtiene las variantes de un producto (talles y colores)
     * @param {number} productId - ID del producto
     * @returns {Promise} Lista de variantes del producto
     */
    async getProductVariants(productId) {
        try {
            const response = await axios.get(`${API_URL}/product-variants/${productId}`)
            return response.data
        } catch (error) {
            console.error('❌ Error al obtener variantes del producto:', error)
            throw error
        }
    },

    /**
     * Envía códigos de barras a imprimir
     * @param {Object} printData - Datos de impresión (producto, variantes, opciones)
     * @returns {Promise} Resultado de la impresión
     */
    async printBarcodes(printData) {
        try {
            const response = await axios.post(`${API_URL}/print-barcodes`, printData)
            return response.data
        } catch (error) {
            console.error('❌ Error al imprimir códigos de barras:', error)
            throw error
        }
    },

    /**
     * Genera un código de barras SVG para una variante específica
     * @param {number} variantId - ID de la variante
     * @param {Object} options - Opciones de texto {includeProductName, includeSize, includeColor, includePrice, includeCode}
     * @returns {Promise} Respuesta con el SVG del código de barras
     */
    async generateBarcodePreview(variantId, options = {}) {
        try {
            const response = await axios.post(`${API_URL}/generate-barcode-svg/${variantId}`, {
                options: options
            })
            return response.data
        } catch (error) {
            console.error('❌ Error al generar vista previa del código de barras:', error)
            throw error
        }
    }
}

export default inventoryService
