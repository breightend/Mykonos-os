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
    }
}

export default inventoryService
