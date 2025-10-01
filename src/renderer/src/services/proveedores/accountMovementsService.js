import axios from 'axios'
import { API_ENDPOINTS } from '../../config/apiConfig.js';

const BASE_URL = API_ENDPOINTS.ACCOUNT

export const accountMovementsService = {
    // Get all movements for a provider
    async getProviderMovements(providerId) {
        try {
            const response = await axios.get(`${BASE_URL}/provider/movements/${providerId}`)
            return response.data
        } catch (error) {
            console.error('Error fetching provider movements:', error)
            throw error
        }
    },

    // Get provider balance
    async getProviderBalance(providerId) {
        try {
            const response = await axios.get(`${BASE_URL}/provider/balance/${providerId}`)
            return response.data
        } catch (error) {
            console.error('Error fetching provider balance:', error)
            throw error
        }
    },

    // Create provider debit movement
    async createProviderDebitMovement(data) {
        try {
            const response = await axios.post(`${BASE_URL}/provider/debit`, data)
            return response.data
        } catch (error) {
            console.error('Error creating provider debit movement:', error)
            throw error
        }
    },

    // Create provider credit movement (payment)
    async createProviderCreditMovement(data) {
        try {
            const response = await axios.post(`${BASE_URL}/provider/credit`, data)
            return response.data
        } catch (error) {
            console.error('Error creating provider credit movement:', error)
            throw error
        }
    },

    // Get all movements (for admin purposes)
    async getAllMovements() {
        try {
            const response = await axios.get(`${BASE_URL}/all`)
            return response.data
        } catch (error) {
            console.error('Error fetching all movements:', error)
            throw error
        }
    },

    // Validate provider balance integrity
    async validateProviderBalance(providerId) {
        try {
            const response = await axios.get(`${BASE_URL}/provider/${providerId}/validate`)
            return response.data
        } catch (error) {
            console.error('Error validating provider balance:', error)
            throw error
        }
    },

    // Recalculate provider balance
    async recalculateProviderBalance(providerId) {
        try {
            const response = await axios.post(`${BASE_URL}/provider/${providerId}/recalculate`)
            return response.data
        } catch (error) {
            console.error('Error recalculating provider balance:', error)
            throw error
        }
    },

    // Fix missing purchase movements
    async fixMissingPurchaseMovements() {
        try {
            const response = await axios.post(`${BASE_URL}/fix-missing-purchase-movements`)
            return response.data
        } catch (error) {
            console.error('Error fixing missing purchase movements:', error)
            throw error
        }
    }
}

// Helper function to format movement type
export const formatMovementType = (movement) => {
    if (movement.debe > 0) {
        return {
            type: 'debit',
            label: 'Compra/Deuda',
            color: 'text-red-600',
            badge: 'badge-error'
        }
    } else if (movement.haber > 0) {
        return {
            type: 'credit',
            label: 'Pago',
            color: 'text-green-600',
            badge: 'badge-success'
        }
    }
    return {
        type: 'unknown',
        label: 'Desconocido',
        color: 'text-gray-600',
        badge: 'badge-neutral'
    }
}

// Helper function to get movement amount
export const getMovementAmount = (movement) => {
    return movement.debe > 0 ? movement.debe : movement.haber
}

// Helper function to format currency
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS'
    }).format(amount || 0)
}