import axios from 'axios'
import { API_ENDPOINTS } from '../../config/apiConfig.js'

const API_BASE_URL = API_ENDPOINTS.CLIENT_SALES

export const clientSalesService = {
    /**
     * Gets the sales history for a specific client
     * @param {number} entityId - Client ID
     * @returns {Promise<Object>} API response with sales history
     */
    async getClientSalesHistory(entityId) {
        try {
            const response = await axios.get(`${API_BASE_URL}/history/${entityId}`)
            return response.data
        } catch (error) {
            console.error('Error getting client sales history:', error)
            throw error
        }
    },

    /**
     * Creates a return transaction
     * @param {Object} data - Return data
     * @param {number} data.entity_id - Client ID
     * @param {number} data.original_sale_id - Original sale ID
     * @param {number} data.return_amount - Amount to return
     * @param {string} data.return_reason - Reason for return
     * @param {Array} data.products_returned - Products being returned (optional)
     * @returns {Promise<Object>} API response
     */
    async createReturn(data) {
        try {
            const response = await axios.post(`${API_BASE_URL}/return`, data)
            return response.data
        } catch (error) {
            console.error('Error creating return:', error)
            throw error
        }
    },

    /**
     * Creates an exchange transaction
     * @param {Object} data - Exchange data
     * @param {number} data.entity_id - Client ID
     * @param {number} data.original_sale_id - Original sale ID
     * @param {Object} data.exchange_details - Exchange details
     * @returns {Promise<Object>} API response
     */
    async createExchange(data) {
        try {
            const response = await axios.post(`${API_BASE_URL}/exchange`, data)
            return response.data
        } catch (error) {
            console.error('Error creating exchange:', error)
            throw error
        }
    },

    /**
     * Gets detailed information about a specific sale
     * @param {number} saleId - Sale ID
     * @returns {Promise<Object>} API response with sale details
     */
    async getSaleDetails(saleId) {
        try {
            const response = await axios.get(`${API_BASE_URL}/details/${saleId}`)
            return response.data
        } catch (error) {
            console.error('Error getting sale details:', error)
            throw error
        }
    },

    /**
     * Gets all sales with client information
     * @returns {Promise<Object>} API response with all sales
     */
    async getAllSales() {
        try {
            const response = await axios.get(`${API_BASE_URL}/all`)
            return response.data
        } catch (error) {
            console.error('Error getting all sales:', error)
            throw error
        }
    }
}

export default clientSalesService
