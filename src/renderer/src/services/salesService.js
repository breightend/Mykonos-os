import axios from 'axios'

const API_URL = 'http://localhost:5000/api'

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
                `${API_URL}/sales/product-by-variant-barcode/${variantBarcode}`
            )
            return response.data
        } catch (error) {
            console.error('Error al buscar producto por código de variante:', error)
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
    }
}

export default salesService
