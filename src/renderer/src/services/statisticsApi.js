// Statistics API service
const API_BASE_URL = 'http://localhost:5000/api/statistics'

export const statisticsApi = {
    // Get dashboard overview statistics
    getDashboardStats: async (params = {}) => {
        try {
            const searchParams = new URLSearchParams(params)
            const response = await fetch(`${API_BASE_URL}/dashboard?${searchParams}`)
            const data = await response.json()

            if (data.status === 'success') {
                return data.data
            } else {
                throw new Error(data.message || 'Error fetching dashboard stats')
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error)
            throw error
        }
    },

    // Get sales data by month
    getSalesByMonth: async (params = {}) => {
        try {
            const searchParams = new URLSearchParams(params)
            const response = await fetch(`${API_BASE_URL}/sales-by-month?${searchParams}`)
            const data = await response.json()

            if (data.status === 'success') {
                return data.data
            } else {
                throw new Error(data.message || 'Error fetching sales by month')
            }
        } catch (error) {
            console.error('Error fetching sales by month:', error)
            throw error
        }
    },

    // Get sales data by category
    getSalesByCategory: async (params = {}) => {
        try {
            const searchParams = new URLSearchParams(params)
            const response = await fetch(`${API_BASE_URL}/sales-by-category?${searchParams}`)
            const data = await response.json()

            if (data.status === 'success') {
                return data.data
            } else {
                throw new Error(data.message || 'Error fetching sales by category')
            }
        } catch (error) {
            console.error('Error fetching sales by category:', error)
            throw error
        }
    },

    // Get top selling products
    getTopProducts: async (params = {}) => {
        try {
            const searchParams = new URLSearchParams(params)
            const response = await fetch(`${API_BASE_URL}/top-products?${searchParams}`)
            const data = await response.json()

            if (data.status === 'success') {
                return data.data
            } else {
                throw new Error(data.message || 'Error fetching top products')
            }
        } catch (error) {
            console.error('Error fetching top products:', error)
            throw error
        }
    },

    // Get sales vs purchases comparison
    getSalesVsPurchases: async (params = {}) => {
        try {
            const searchParams = new URLSearchParams(params)
            const response = await fetch(`${API_BASE_URL}/sales-vs-purchases?${searchParams}`)
            const data = await response.json()

            if (data.status === 'success') {
                return data.data
            } else {
                throw new Error(data.message || 'Error fetching sales vs purchases')
            }
        } catch (error) {
            console.error('Error fetching sales vs purchases:', error)
            throw error
        }
    },

    // Get profit analysis
    getProfitAnalysis: async (params = {}) => {
        try {
            const searchParams = new URLSearchParams(params)
            const response = await fetch(`${API_BASE_URL}/profit-analysis?${searchParams}`)
            const data = await response.json()

            if (data.status === 'success') {
                return data.data
            } else {
                throw new Error(data.message || 'Error fetching profit analysis')
            }
        } catch (error) {
            console.error('Error fetching profit analysis:', error)
            throw error
        }
    },

    // Get purchases data by month
    getPurchasesByMonth: async (params = {}) => {
        try {
            const searchParams = new URLSearchParams(params)
            const response = await fetch(`${API_BASE_URL}/purchases-by-month?${searchParams}`)
            const data = await response.json()

            if (data.status === 'success') {
                return data.data
            } else {
                throw new Error(data.message || 'Error fetching purchases by month')
            }
        } catch (error) {
            console.error('Error fetching purchases by month:', error)
            throw error
        }
    }
}

export default statisticsApi
