import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api/payment-methods'

export const paymentMethodsService = {
    /**
     * Gets all payment methods
     * @param {boolean} activeOnly - If true, only returns active payment methods
     * @returns {Promise<Object>} API response with payment methods
     */
    async getAllPaymentMethods(activeOnly = false) {
        try {
            const response = await axios.get(`${API_BASE_URL}/`, {
                params: { active_only: activeOnly }
            })
            return response.data
        } catch (error) {
            console.error('Error getting payment methods:', error)
            throw error
        }
    },

    /**
     * Gets a specific payment method by ID
     * @param {number} paymentMethodId - Payment method ID
     * @returns {Promise<Object>} API response with payment method
     */
    async getPaymentMethodById(paymentMethodId) {
        try {
            const response = await axios.get(`${API_BASE_URL}/${paymentMethodId}`)
            return response.data
        } catch (error) {
            console.error('Error getting payment method:', error)
            throw error
        }
    },

    /**
     * Gets a payment method by its internal name
     * @param {string} methodName - Internal method name
     * @returns {Promise<Object>} API response with payment method
     */
    async getPaymentMethodByName(methodName) {
        try {
            const response = await axios.get(`${API_BASE_URL}/by-name/${methodName}`)
            return response.data
        } catch (error) {
            console.error('Error getting payment method by name:', error)
            throw error
        }
    },

    /**
     * Creates a new payment method
     * @param {Object} paymentMethodData - Payment method data
     * @param {string} paymentMethodData.method_name - Internal name (required)
     * @param {string} paymentMethodData.display_name - Display name (required)
     * @param {string} paymentMethodData.description - Description (optional)
     * @param {boolean} paymentMethodData.requires_reference - If requires reference (optional)
     * @param {string} paymentMethodData.icon_name - Icon name (optional)
     * @returns {Promise<Object>} API response
     */
    async createPaymentMethod(paymentMethodData) {
        try {
            const response = await axios.post(`${API_BASE_URL}/`, paymentMethodData)
            return response.data
        } catch (error) {
            console.error('Error creating payment method:', error)
            throw error
        }
    },

    /**
     * Updates a payment method
     * @param {number} paymentMethodId - Payment method ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} API response
     */
    async updatePaymentMethod(paymentMethodId, updateData) {
        try {
            const response = await axios.put(`${API_BASE_URL}/${paymentMethodId}`, updateData)
            return response.data
        } catch (error) {
            console.error('Error updating payment method:', error)
            throw error
        }
    },

    /**
     * Deletes (deactivates) a payment method
     * @param {number} paymentMethodId - Payment method ID
     * @returns {Promise<Object>} API response
     */
    async deletePaymentMethod(paymentMethodId) {
        try {
            const response = await axios.delete(`${API_BASE_URL}/${paymentMethodId}`)
            return response.data
        } catch (error) {
            console.error('Error deleting payment method:', error)
            throw error
        }
    },

    /**
     * Activates a payment method
     * @param {number} paymentMethodId - Payment method ID
     * @returns {Promise<Object>} API response
     */
    async activatePaymentMethod(paymentMethodId) {
        try {
            const response = await axios.post(`${API_BASE_URL}/${paymentMethodId}/activate`)
            return response.data
        } catch (error) {
            console.error('Error activating payment method:', error)
            throw error
        }
    },

    /**
     * Initializes default payment methods
     * @returns {Promise<Object>} API response
     */
    async initializeDefaultPaymentMethods() {
        try {
            const response = await axios.post(`${API_BASE_URL}/initialize`)
            return response.data
        } catch (error) {
            console.error('Error initializing default payment methods:', error)
            throw error
        }
    },

    /**
     * Converts payment methods array to format expected by UI components
     * @param {Array} paymentMethods - Array of payment methods from API
     * @returns {Array} Formatted payment methods for UI
     */
    formatPaymentMethodsForUI(paymentMethods) {
        return paymentMethods.map(method => ({
            id: method.method_name,
            label: method.display_name,
            icon: method.icon_name || 'DollarSign',
            requiresReference: Boolean(method.requires_reference),
            description: method.description
        }))
    },

    /**
     * Gets display name for a payment method by its internal name
     * @param {string} methodName - Internal method name
     * @param {Array} paymentMethods - Array of payment methods (optional, will fetch if not provided)
     * @returns {Promise<string>} Display name
     */
    async getDisplayName(methodName, paymentMethods = null) {
        try {
            if (!paymentMethods) {
                const response = await this.getAllPaymentMethods(true)
                paymentMethods = response.payment_methods || []
            }

            const method = paymentMethods.find(m => m.method_name === methodName)
            return method ? method.display_name : methodName
        } catch (error) {
            console.error('Error getting display name:', error)
            return methodName
        }
    }
}

export default paymentMethodsService