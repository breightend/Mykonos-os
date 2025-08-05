import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api/account'

export const accountMovementsService = {
    /**
     * Creates a debit movement (when client buys on credit)
     * @param {Object} data - Movement data
     * @param {number} data.entity_id - Client ID
     * @param {number} data.amount - Total amount of the purchase
     * @param {string} data.description - Description of the movement
     * @param {number} data.purchase_id - Related purchase ID (optional)
     * @param {number} data.partial_payment - Amount paid upfront (optional)
     * @param {string} data.partial_payment_method - Payment method for partial payment (optional)
     * @returns {Promise<Object>} API response
     */
    async createDebitMovement(data) {
        try {
            const response = await axios.post(`${API_BASE_URL}/debit`, data)
            return response.data
        } catch (error) {
            console.error('Error creating debit movement:', error)
            throw error
        }
    },

    /**
     * Creates a credit movement (when client makes a payment)
     * @param {Object} data - Movement data
     * @param {number} data.entity_id - Client ID
     * @param {number} data.amount - Amount to credit
     * @param {string} data.description - Description of the movement
     * @param {string} data.medio_pago - Payment method
     * @param {string} data.numero_de_comprobante - Receipt number (optional)
     * @returns {Promise<Object>} API response
     */
    async createCreditMovement(data) {
        try {
            const response = await axios.post(`${API_BASE_URL}/credit`, data)
            return response.data
        } catch (error) {
            console.error('Error creating credit movement:', error)
            throw error
        }
    },

    /**
     * Gets the current balance for a client
     * @param {number} entityId - Client ID
     * @returns {Promise<Object>} API response with balance
     */
    async getClientBalance(entityId) {
        try {
            const response = await axios.get(`${API_BASE_URL}/balance/${entityId}`)
            return response.data
        } catch (error) {
            console.error('Error getting client balance:', error)
            throw error
        }
    },

    /**
     * Gets all movements for a specific client
     * @param {number} entityId - Client ID
     * @returns {Promise<Object>} API response with movements
     */
    async getClientMovements(entityId) {
        try {
            const response = await axios.get(`${API_BASE_URL}/movements/${entityId}`)
            return response.data
        } catch (error) {
            console.error('Error getting client movements:', error)
            throw error
        }
    },

    /**
     * Gets all account movements with client information
     * @returns {Promise<Object>} API response with all movements
     */
    async getAllMovements() {
        try {
            const response = await axios.get(`${API_BASE_URL}/all`)
            return response.data
        } catch (error) {
            console.error('Error getting all movements:', error)
            throw error
        }
    }
}

export default accountMovementsService
