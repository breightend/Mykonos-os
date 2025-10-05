import { apiClient, API_ENDPOINTS } from '../../config/apiConfig.js'
import { cacheService, CACHE_TTL } from '../cacheService.js'

const API_URL = API_ENDPOINTS.INVENTORY

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
        const cacheKey = `products_by_storage_${storageId || 'all'}`

        return cacheService.cached(cacheKey, async () => {
            const url = storageId
                ? `${API_URL}/products-by-storage?storage_id=${storageId}`
                : `${API_URL}/products-by-storage`

            const response = await apiClient.get(url)
            return response.data
        }, CACHE_TTL.INVENTORY)
    },

    async getAllProducts() {
        return cacheService.cached('all_products', async () => {
            const response = await apiClient.get(`${API_URL}/products`)
            return response.data
        }, CACHE_TTL.INVENTORY)
    },

    /**
     * Obtiene la lista de sucursales desde el endpoint de inventario
     * @returns {Promise} Lista de sucursales
     */
    async getStorageList() {
        return cacheService.cached('storage_list', async () => {
            const response = await apiClient.get(`${API_URL}/storage-list`)
            return response.data
        }, CACHE_TTL.LONG)
    },

    /**
     * Obtiene el stock de un producto específico en todas las sucursales
     * @param {number} productId - ID del producto
     * @returns {Promise} Stock del producto por sucursal
     */
    async getProductStockByStorage(productId) {
        const cacheKey = `product_stock_${productId}`

        return cacheService.cached(cacheKey, async () => {
            const response = await apiClient.get(`${API_URL}/product-stock/${productId}`)
            return response.data
        }, CACHE_TTL.INVENTORY)
    },

    /**
     * Actualiza el stock de un producto en una sucursal específica
     * @param {number} productId - ID del producto
     * @param {number} storageId - ID de la sucursal
     * @param {number} quantity - Nueva cantidad
     * @returns {Promise} Resultado de la actualización
     */
    async updateStock(productId, storageId, quantity) {
        const response = await apiClient.put(`${API_URL}/update-stock`, {
            product_id: productId,
            storage_id: storageId,
            quantity: quantity
        })

        // Invalidar caché relacionado
        cacheService.delete(`product_stock_${productId}`)
        cacheService.delete(`products_by_storage_${storageId}`)
        cacheService.delete('products_by_storage_all')
        cacheService.deleteByPattern(/^products_summary_/)

        return response.data
    },

    /**
     * Obtiene el stock total de un producto sumando todas las sucursales
     * @param {number} productId - ID del producto
     * @returns {Promise} Stock total del producto
     */
    async getTotalStock(productId) {
        const cacheKey = `total_stock_${productId}`

        return cacheService.cached(cacheKey, async () => {
            const response = await apiClient.get(`${API_URL}/total-stock/${productId}`)
            return response.data
        }, CACHE_TTL.INVENTORY)
    },

    /**
     * Obtiene resumen de productos para la tabla principal
     * @param {number} storageId - ID de la sucursal (opcional)
     * @returns {Promise} Lista de productos con información resumida
     */
    async getProductsSummary(storageId = null) {
        const cacheKey = `products_summary_${storageId || 'all'}`

        return cacheService.cached(cacheKey, async () => {
            const url = storageId
                ? `${API_URL}/products-summary?storage_id=${storageId}`
                : `${API_URL}/products-summary`

            const response = await apiClient.get(url)
            return response.data
        }, CACHE_TTL.INVENTORY)
    },

    /**
     * Obtiene detalles completos de un producto específico
     * @param {number} productId - ID del producto
     * @returns {Promise} Información detallada del producto
     */
    async getProductDetails(productId) {
        const cacheKey = `product_details_${productId}`

        return cacheService.cached(cacheKey, async () => {
            const response = await apiClient.get(`${API_URL}/product-details/${productId}`)
            return response.data
        }, CACHE_TTL.SHORT)
    },

    /**
     * Crea un nuevo movimiento de inventario entre sucursales
     * @param {number} fromStorageId - ID de la sucursal origen
     * @param {number} toStorageId - ID de la sucursal destino
     * @param {Array} products - Array de productos con {id, quantity}
     * @returns {Promise} Resultado del movimiento
     */
    async createMovement(fromStorageId, toStorageId, products) {
        const response = await apiClient.post(`${API_URL}/movements`, {
            from_storage_id: fromStorageId,
            to_storage_id: toStorageId,
            products: products,
            notes: '',
            user_id: 1 // TODO: Obtener del contexto de sesión
        })

        // Invalidar caché de inventario para ambas sucursales
        cacheService.deleteByPattern(/^products_by_storage_/)
        cacheService.deleteByPattern(/^products_summary_/)
        cacheService.deleteByPattern(/^total_stock_/)
        cacheService.deleteByPattern(/^product_stock_/)

        return response.data
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
            console.log('📤 Creando movimiento de variantes:', {
                from: fromStorageId,
                to: toStorageId,
                variants: variants.length
            })

            const response = await apiClient.post(`${API_URL}/variant-movements`, {
                from_storage_id: fromStorageId,
                to_storage_id: toStorageId,
                variants: variants,
                notes: '',
                user_id: 1 // TODO: Obtener del contexto de sesión
            })

            console.log('✅ Movimiento de variantes creado exitosamente')

            // Invalidar caché de inventario para ambas sucursales de manera segura
            try {
                console.log('🧹 Limpiando caché de inventario...')
                cacheService.deleteByPattern(/^products_by_storage_/)
                cacheService.deleteByPattern(/^products_summary_/)
                cacheService.deleteByPattern(/^variants_by_storage_/)
                console.log('✅ Caché limpiado exitosamente')
            } catch (cacheError) {
                console.warn('⚠️ Error limpiando caché (no crítico):', cacheError)
                // No fallar por errores de caché
            }

            return response.data
        } catch (error) {
            console.error('❌ Error creando movimiento de variantes:', error)
            throw error
        }
    },

    /**
     * Obtiene envíos pendientes para una sucursal
     * @param {number} storageId - ID de la sucursal
     * @returns {Promise} Lista de envíos pendientes
     */
    async getPendingShipments(storageId) {
        const response = await apiClient.get(`${API_URL}/pending-shipments/${storageId}`)
        return response.data
    },

    /**
     * Actualiza el estado de un envío
     * @param {number} shipmentId - ID del envío
     * @param {string} status - Nuevo estado ('recibido', 'no_recibido', 'en_transito', 'entregado')
     * @returns {Promise} Resultado de la actualización
     */
    async updateShipmentStatus(shipmentId, status) {
        const response = await apiClient.put(`${API_URL}/shipments/${shipmentId}/status`, {
            status: status,
            user_id: 1 // TODO: Obtener del contexto de sesión
        })

        // Invalidar caché de inventario si el envío fue recibido
        if (status === 'recibido') {
            cacheService.deleteByPattern(/^products_by_storage_/)
            cacheService.deleteByPattern(/^products_summary_/)
            cacheService.deleteByPattern(/^variants_by_storage_/)
        }

        return response.data
    },

    /**
     * Obtiene envíos realizados desde una sucursal
     * @param {number} storageId - ID de la sucursal
     * @returns {Promise} Lista de envíos realizados
     */
    async getSentShipments(storageId) {
        const response = await apiClient.get(`${API_URL}/sent-shipments/${storageId}`)
        return response.data
    },

    /**
     * Actualiza un producto con nueva información
     * @param {number} productId - ID del producto a actualizar
     * @param {Object} updateData - Datos a actualizar
     * @returns {Promise} Respuesta de la actualización
     */
    async updateProduct(productId, updateData) {
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

        const response = await apiClient.put(`${API_URL}/products/${productId}`, dataToSend)

        // Invalidar caché relacionado al producto
        cacheService.delete(`product_details_${productId}`)
        cacheService.delete(`product_stock_${productId}`)
        cacheService.delete(`total_stock_${productId}`)
        cacheService.deleteByPattern(/^products_summary_/)
        cacheService.deleteByPattern(/^products_by_storage_/)
        cacheService.delete('all_products')

        console.log('✅ Producto actualizado:', response.data)
        return response.data
    },

    /**
     * Crea envíos de prueba (temporal para desarrollo)
     * @returns {Promise} Resultado de la creación
     */
    async createTestShipments() {
        const response = await apiClient.post(`${API_URL}/create-test-shipments`)
        return response.data
    },

    /**
     * Obtiene los detalles de un producto específico
     * @param {number} productId - ID del producto
     * @returns {Promise} Detalles del producto
     */
    async getProductDetail(productId) {
        const cacheKey = `product_detail_${productId}`

        return cacheService.cached(cacheKey, async () => {
            const response = await apiClient.get(`${API_URL}/product-detail/${productId}`)
            return response.data
        }, CACHE_TTL.SHORT)
    },

    /**
     * Envía códigos de barras a imprimir
     * @param {Object} printData - Datos de impresión (producto, variantes, opciones)
     * @returns {Promise} Resultado de la impresión
     */
    async printBarcodes(printData) {
        const response = await apiClient.post(`${API_URL}/print-barcodes`, printData)
        return response.data
    },

    /**
     * Genera vista previa del código de barras en formato PNG
     * @param {number} variantId - ID de la variante
     * @param {Object} options - Opciones de texto {includeProductName, includeSize, includeColor, includePrice, includeCode}
     * @returns {Promise} Respuesta con el PNG base64 del código de barras
     */
    async generateBarcodePreview(variantId, options = {}) {
        const response = await apiClient.post(`${API_URL}/generate-barcode-preview/${variantId}`, {
            options: options
        })
        return response.data
    },

    /**
     * Obtiene las variantes de un producto (talles y colores)
     * @param {number} productId - ID del producto
     * @param {number} storageId - ID de la sucursal (opcional)
     * @returns {Promise} Lista de variantes del producto
     */
    async getProductVariants(productId, storageId = null) {
        const cacheKey = `product_variants_${productId}_${storageId || 'all'}`

        return cacheService.cached(cacheKey, async () => {
            let url = `${API_URL}/product-variants/${productId}`

            // Agregar parámetro de sucursal si se especifica
            if (storageId) {
                url += `?storage_id=${storageId}`
            }

            const response = await apiClient.get(url)
            return response.data
        }, CACHE_TTL.SHORT)
    },

    /**
     * Get all available variants for a storage in a single optimized query
     * This replaces the N+1 query problem in loadAvailableVariants
     * Performance improvement: 1 query instead of N+1 queries
     * @param {number} storageId - ID of the storage
     * @returns {Promise} All variants with stock for the storage
     */
    async getVariantsByStorage(storageId) {
        const cacheKey = `variants_by_storage_${storageId}`

        return cacheService.cached(cacheKey, async () => {
            console.log(`🚀 OPTIMIZED: Fetching variants for storage ${storageId} with single query`)
            const response = await apiClient.get(`${API_URL}/variants-by-storage/${storageId}`)
            console.log(`✅ OPTIMIZED: Received ${response.data.count || 0} variants in single request`)
            return response.data
        }, CACHE_TTL.INVENTORY)
    }
}

export default inventoryService
