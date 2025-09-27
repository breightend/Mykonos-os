import axios from 'axios'
import { API_ENDPOINTS } from '../../config/apiConfig.js'

const API_BASE_URL = API_ENDPOINTS.EXCHANGE

/**
 * Exchange Service
 * Handles product returns and exchanges
 */
export const exchangeService = {
    /**
     * Creates a new exchange/return transaction
     * @param {Object} data - Exchange data
     * @param {number} data.customer_id - Customer ID (optional)
     * @param {string} data.return_variant_barcode - Barcode of product to return
     * @param {number} data.return_quantity - Quantity to return
     * @param {string} data.new_variant_barcode - Barcode of new product (optional)
     * @param {number} data.new_quantity - Quantity of new product (optional)
     * @param {number} data.branch_id - Branch ID where exchange happens
     * @param {string} data.reason - Reason for exchange (optional)
     * @param {number} data.user_id - User processing the exchange (optional)
     * @returns {Promise<Object>} API response
     */
    async createExchange(data) {
        try {
            const response = await axios.post(`${API_BASE_URL}/create`, data)
            return response.data
        } catch (error) {
            console.error('Error creating exchange:', error)
            throw error.response?.data || error
        }
    },

    /**
     * Validates if a product can be returned
     * @param {Object} data - Validation data
     * @param {string} data.variant_barcode - Product variant barcode
     * @param {number} data.quantity - Quantity to return
     * @param {number} data.branch_id - Branch ID
     * @returns {Promise<Object>} API response with product info
     */
    async validateReturn(data) {
        try {
            const response = await axios.post(`${API_BASE_URL}/validate-return`, data)
            return response.data
        } catch (error) {
            console.error('Error validating return:', error)
            throw error.response?.data || error
        }
    },

    /**
     * Validates if a new product is available for exchange
     * @param {Object} data - Validation data
     * @param {string} data.variant_barcode - New product variant barcode
     * @param {number} data.quantity - Quantity requested
     * @param {number} data.branch_id - Branch ID
     * @returns {Promise<Object>} API response with product info
     */
    async validateNewProduct(data) {
        try {
            const response = await axios.post(`${API_BASE_URL}/validate-new-product`, data)
            return response.data
        } catch (error) {
            console.error('Error validating new product:', error)
            throw error.response?.data || error
        }
    },

    /**
     * Gets exchange history with optional filters
     * @param {Object} filters - Filter options
     * @param {number} filters.customer_id - Filter by customer ID
     * @param {number} filters.branch_id - Filter by branch ID
     * @param {number} filters.limit - Number of records to return
     * @returns {Promise<Object>} API response with exchange history
     */
    async getExchangeHistory(filters = {}) {
        try {
            const params = new URLSearchParams()
            if (filters.customer_id) params.append('customer_id', filters.customer_id)
            if (filters.branch_id) params.append('branch_id', filters.branch_id)
            if (filters.limit) params.append('limit', filters.limit)

            const response = await axios.get(`${API_BASE_URL}/history?${params}`)
            return response.data
        } catch (error) {
            console.error('Error getting exchange history:', error)
            throw error.response?.data || error
        }
    },

    /**
     * Gets exchange history for a specific customer
     * @param {number} customerId - Customer ID
     * @param {number} limit - Number of records to return
     * @returns {Promise<Object>} API response with customer exchange history
     */
    async getCustomerExchangeHistory(customerId, limit = 50) {
        try {
            const response = await axios.get(`${API_BASE_URL}/customer/${customerId}/history?limit=${limit}`)
            return response.data
        } catch (error) {
            console.error('Error getting customer exchange history:', error)
            throw error.response?.data || error
        }
    }
}

export default exchangeService
