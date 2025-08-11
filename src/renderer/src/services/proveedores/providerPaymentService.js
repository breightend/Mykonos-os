import axios from 'axios'
import { paymentMethodsService } from '../paymentMethodsService'

const API_BASE_URL = 'http://localhost:5000/api/account'

export const providerPaymentService = {
    /**
     * Creates a credit movement (when we pay a provider)
     * @param {Object} data - Payment data
     * @param {number} data.entity_id - Provider ID
     * @param {number} data.amount - Amount to pay
     * @param {string} data.description - Description of the payment
     * @param {string} data.medio_pago - Payment method
     * @param {string} data.numero_de_comprobante - Receipt number (optional)
     * @returns {Promise<Object>} API response
     */
    async createProviderPayment(data) {
        try {
            const response = await axios.post(`${API_BASE_URL}/provider/credit`, data)
            return response.data
        } catch (error) {
            console.error('Error creating provider payment:', error)
            throw error
        }
    },

    /**
     * Creates a debit movement (when we owe money to a provider from a purchase)
     * @param {Object} data - Movement data
     * @param {number} data.entity_id - Provider ID
     * @param {number} data.amount - Total amount of the purchase
     * @param {string} data.description - Description of the movement
     * @param {number} data.purchase_id - Related purchase ID (optional)
     * @param {number} data.partial_payment - Amount paid upfront (optional)
     * @param {string} data.partial_payment_method - Payment method for partial payment (optional)
     * @returns {Promise<Object>} API response
     */
    async createProviderDebt(data) {
        try {
            const response = await axios.post(`${API_BASE_URL}/provider/debit`, data)
            return response.data
        } catch (error) {
            console.error('Error creating provider debt:', error)
            throw error
        }
    },

    /**
     * Gets the current balance for a provider (how much we owe them)
     * @param {number} providerId - Provider ID
     * @returns {Promise<Object>} API response with balance
     */
    async getProviderBalance(providerId) {
        try {
            const response = await axios.get(`${API_BASE_URL}/provider/balance/${providerId}`)
            return response.data
        } catch (error) {
            console.error('Error getting provider balance:', error)
            throw error
        }
    },

    /**
     * Gets all movements for a specific provider
     * @param {number} providerId - Provider ID
     * @returns {Promise<Object>} API response with movements
     */
    async getProviderMovements(providerId) {
        try {
            const response = await axios.get(`${API_BASE_URL}/provider/movements/${providerId}`)
            return response.data
        } catch (error) {
            console.error('Error getting provider movements:', error)
            throw error
        }
    },

    /**
     * Formats currency for display
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency string
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(amount || 0)
    },

    /**
     * Gets the display name for a payment method
     * @param {string} method - Payment method ID
     * @returns {Promise<string>} Display name for the payment method
     */
    async getPaymentMethodName(method) {
        try {
            // Try to get from database first
            const displayName = await paymentMethodsService.getDisplayName(method)
            return displayName
        } catch (error) {
            console.error('Error getting payment method name from database:', error)
            // Fallback to hardcoded methods
            const methods = {
                efectivo: 'Efectivo',
                transferencia: 'Transferencia Bancaria',
                cheque: 'Cheque',
                tarjeta_credito: 'Tarjeta de Crédito',
                tarjeta_debito: 'Tarjeta de Débito',
                cuenta_corriente: 'Cuenta Corriente',
                otro: 'Otro'
            }
            return methods[method] || method
        }
    },

    /**
     * Gets the display name for a payment method (synchronous version with fallback)
     * @param {string} method - Payment method ID
     * @returns {string} Display name for the payment method
     */
    getPaymentMethodNameSync(method) {
        const methods = {
            efectivo: 'Efectivo',
            transferencia: 'Transferencia Bancaria',
            cheque: 'Cheque',
            tarjeta_credito: 'Tarjeta de Crédito',
            tarjeta_debito: 'Tarjeta de Débito',
            cuenta_corriente: 'Cuenta Corriente',
            otro: 'Otro'
        }
        return methods[method] || method
    },

    /**
     * Gets all available payment methods from the database
     * @returns {Promise<Array>} Array of payment methods formatted for UI
     */
    async getAvailablePaymentMethods() {
        try {
            const response = await paymentMethodsService.getAllPaymentMethods(true) // only active
            if (response.success) {
                return paymentMethodsService.formatPaymentMethodsForUI(response.payment_methods)
            }
            return this.getFallbackPaymentMethods()
        } catch (error) {
            console.error('Error getting payment methods from database:', error)
            return this.getFallbackPaymentMethods()
        }
    },

    /**
     * Gets fallback payment methods when database is not available
     * @returns {Array} Array of fallback payment methods
     */
    getFallbackPaymentMethods() {
        return [
            { id: 'efectivo', label: 'Efectivo', icon: 'HandCoins', requiresReference: false },
            { id: 'transferencia', label: 'Transferencia Bancaria', icon: 'Landmark', requiresReference: true },
            { id: 'tarjeta_debito', label: 'Tarjeta de Débito', icon: 'CreditCard', requiresReference: true },
            { id: 'tarjeta_credito', label: 'Tarjeta de Crédito', icon: 'CreditCard', requiresReference: true },
            { id: 'cheque', label: 'Cheque', icon: 'CheckCircle', requiresReference: true }
        ]
    }
}

export default providerPaymentService