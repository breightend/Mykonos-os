import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api/product'

/**
 * Servicio para operaciones relacionadas con ventas
 */
export const ventasService = {
    /**
     * Busca un producto por su código de barras
     * @param {string} barcode - Código de barras del producto
     * @returns {Promise} Información del producto encontrado
     */
    async getProductByBarcode(barcode) {
        try {
            console.log('🔍 Buscando producto por código de barras:', barcode)
            const response = await axios.get(`${API_BASE_URL}/barcode/${barcode}`)
            console.log('✅ Producto encontrado:', response.data)
            return response.data
        } catch (error) {
            console.error('❌ Error al buscar producto por código de barras:', error)
            if (error.response?.status === 404) {
                throw new Error('Producto no encontrado')
            }
            throw new Error('Error al conectar con el servidor')
        }
    }
}
