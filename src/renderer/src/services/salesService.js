import axios from 'axios'
import { API_ENDPOINTS } from '../config/apiConfig.js'

/**
 * Servicio para manejar operaciones de ventas con códigos de barras de variantes
 */
export const salesService = {
    /**
     * Busca un producto por código de barras de variante
     * @param {string} variantBarcode - Código de barras de la variante
     * @returns {Promise} Información del producto con detalles de variante
     */
    async getProductByVariantBarcode(variantBarcode) {
        try {
            const response = await axios.get(
                `${API_ENDPOINTS.SALES}/product-by-variant-barcode/${variantBarcode}`
            )
            return response.data
        } catch (error) {
            console.error('Error al buscar producto por código de variante:', error)
            throw error
        }
    },

    /**
     * Busca un producto por código de barras de variante para intercambios
     * Permite encontrar productos incluso si están sin stock
     * @param {string} variantBarcode - Código de barras de la variante
     * @returns {Promise} Información del producto con detalles de variante
     */
    async getProductByVariantBarcodeForExchange(variantBarcode) {
        try {
            const response = await axios.get(
                `${API_URL}/sales/product-by-variant-barcode-exchange/${variantBarcode}`
            )
            return response.data
        } catch (error) {
            console.error('Error al buscar producto para intercambio por código de variante:', error)
            throw error
        }
    },

    /**
     * Verifica el stock disponible de una variante específica
     * @param {number} productId - ID del producto
     * @param {number} sizeId - ID del talle
     * @param {number} colorId - ID del color
     * @param {number} branchId - ID de la sucursal
     * @returns {Promise} Stock disponible de la variante
     */
    async checkVariantStock(productId, sizeId, colorId, branchId) {
        try {
            const response = await axios.get(`${API_URL}/sales/variant-stock`, {
                params: {
                    product_id: productId,
                    size_id: sizeId,
                    color_id: colorId,
                    branch_id: branchId
                }
            })
            return response.data
        } catch (error) {
            console.error('Error al verificar stock de variante:', error)
            throw error
        }
    },

    /**
     * Crea una nueva venta con o sin intercambio
     * @param {Object} saleData - Datos de la venta
     * @returns {Promise} Resultado de la creación de la venta
     */
    async createSale(saleData) {
        try {
            console.log('🔍 Enviando datos de venta al backend:', saleData)

            // Usar endpoint real ahora que sabemos que los datos llegan bien
            const response = await axios.post(`${API_URL}/sales/create-sale`, saleData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            console.log('✅ Respuesta del backend:', response.data)
            return response.data
        } catch (error) {
            console.error('❌ Error al crear venta:', error)
            // Extraer el mensaje de error del backend si está disponible
            if (error.response && error.response.data && error.response.data.message) {
                throw new Error(error.response.data.message)
            }
            throw error
        }
    },

    /**
     * Obtiene la lista de ventas registradas
     * @param {Object} filters - Filtros opcionales
     * @returns {Promise} Lista de ventas
     */
    async getSalesList(filters = {}) {
        try {
            const params = new URLSearchParams()

            if (filters.storage_id) params.append('storage_id', filters.storage_id)
            if (filters.start_date) params.append('start_date', filters.start_date)
            if (filters.end_date) params.append('end_date', filters.end_date)
            if (filters.search) params.append('search', filters.search)
            if (filters.limit) params.append('limit', filters.limit)
            if (filters.offset) params.append('offset', filters.offset)

            const response = await axios.get(`${API_ENDPOINTS.SALES}/list?${params}`)

            console.log('✅ Lista de ventas obtenida:', response.data)
            return response.data
        } catch (error) {
            console.error('❌ Error al obtener lista de ventas:', error)
            throw error
        }
    },

    /**
     * Obtiene los detalles completos de una venta específica
     * @param {number} saleId - ID de la venta
     * @returns {Promise} Detalles completos de la venta
     */
    async getSaleDetails(saleId) {
        try {
            const response = await axios.get(`${API_URL}/sales/${saleId}/details`)

            console.log('✅ Detalles de venta obtenidos:', response.data)
            return response.data
        } catch (error) {
            console.error('❌ Error al obtener detalles de venta:', error)
            throw error
        }
    },

    /**
     * Obtiene estadísticas de ventas
     * @param {Object} filters - Filtros opcionales 
     * @returns {Promise} Estadísticas de ventas
     */
    async getSalesStats(filters = {}) {
        try {
            const params = new URLSearchParams()

            if (filters.storage_id) params.append('storage_id', filters.storage_id)
            if (filters.start_date) params.append('start_date', filters.start_date)
            if (filters.end_date) params.append('end_date', filters.end_date)

            const response = await axios.get(`${API_ENDPOINTS.SALES}/stats?${params}`)

            console.log('✅ Estadísticas de ventas obtenidas:', response.data)
            return response.data
        } catch (error) {
            console.error('❌ Error al obtener estadísticas de ventas:', error)
            throw error
        }
    }
}

export default salesService
