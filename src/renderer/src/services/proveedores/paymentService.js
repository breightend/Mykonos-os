import axios from 'axios'
import { API_ENDPOINTS } from '../../config/apiConfig.js';
const API_BASE_URL = API_ENDPOINTS.PURCHASES

// Create a new payment for a purchase
export async function createPurchasePayment(purchaseId, paymentData) {
    try {
        console.log('🔄 Creating payment for purchase:', purchaseId, paymentData)
        const response = await axios.post(`${API_BASE_URL}/${purchaseId}/payments`, paymentData)
        console.log('✅ Payment creation response:', response.data)
        return response.data
    } catch (error) {
        console.error('❌ Error creating payment:', error)
        console.error('❌ Error details:', error.response?.data || error.message)
        throw error
    }
}

// Get all payments for a purchase
export async function getPurchasePayments(purchaseId) {
    try {
        const response = await axios.get(`${API_BASE_URL}/${purchaseId}/payments`)
        return response.data
    } catch (error) {
        console.error('Error fetching purchase payments:', error)
        throw error
    }
}

// Update a payment
export async function updatePurchasePayment(purchaseId, paymentId, paymentData) {
    try {
        const response = await axios.put(`${API_BASE_URL}/${purchaseId}/payments/${paymentId}`, paymentData)
        return response.data
    } catch (error) {
        console.error('Error updating payment:', error)
        throw error
    }
}

// Delete a payment
export async function deletePurchasePayment(purchaseId, paymentId) {
    try {
        const response = await axios.delete(`${API_BASE_URL}/${purchaseId}/payments/${paymentId}`)
        return response.data
    } catch (error) {
        console.error('Error deleting payment:', error)
        throw error
    }
}

// Get all payments across all purchases
export async function getAllPayments(filters = {}) {
    try {
        const params = new URLSearchParams()

        if (filters.payment_method) params.append('payment_method', filters.payment_method)
        if (filters.start_date) params.append('start_date', filters.start_date)
        if (filters.end_date) params.append('end_date', filters.end_date)
        if (filters.purchase_id) params.append('purchase_id', filters.purchase_id)

        const response = await axios.get(`${API_ENDPOINTS.PAYMENTS}?${params}`)
        return response.data
    } catch (error) {
        console.error('Error fetching all payments:', error)
        throw error
    }
}