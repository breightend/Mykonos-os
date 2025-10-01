import axios from 'axios'
import { API_ENDPOINTS } from '../../config/apiConfig.js';

// Get all sucursales
export async function fetchSucursales() {
    try {
        console.log('🌐 Intentando fetch a:', `${API_ENDPOINTS.STORAGE}/`)
        const response = await axios.get(`${API_ENDPOINTS.STORAGE}/`)
        console.log('✅ Respuesta recibida:', response)
        console.log('📊 Status de respuesta:', response.status)
        console.log('📊 Datos de sucursales:', response.data)

        // Verificar si la respuesta es exitosa
        if (response.status === 200) {
            // El backend devuelve directamente el array
            const data = response.data || []
            console.log('📋 Sucursales procesadas:', data)
            console.log('📋 Cantidad de sucursales:', data.length)

            // Devolver en formato estándar para compatibilidad
            return {
                status: 'success',
                data: Array.isArray(data) ? data : []
            }
        } else {
            console.warn('⚠️ Respuesta no exitosa:', response.status)
            return {
                status: 'error',
                data: [],
                message: `HTTP ${response.status}`
            }
        }
    } catch (error) {
        console.error('❌ Error fetching sucursales:', error)
        console.error('❌ Error response:', error.response?.data)
        console.error('❌ Error status:', error.response?.status)
        console.error('❌ Error message:', error.message)

        // Si es un error de red o el servidor no responde
        if (!error.response) {
            console.error('❌ Error de conexión - servidor no responde')
        }

        // Devolver formato estándar con error
        return {
            status: 'error',
            data: [],
            message: error.message || 'Error desconocido'
        }
    }
}

export const fetchStorages = fetchSucursales

// Get sucursal by ID
export async function fetchSucursalById(id) {
    try {
        const response = await axios.get(`${API_ENDPOINTS.STORAGE}/${id}`)
        return response.data
    } catch (error) {
        console.error('Error fetching sucursal by ID:', error)
        throw error
    }
}

// Create new sucursal
export async function postData(data) {
    try {
        const response = await axios.post(`${API_ENDPOINTS.STORAGE}/`, data)
        return response.data
    } catch (error) {
        console.error('Error posting data:', error)
        throw error
    }
}

// Update sucursal
export async function putData(id, data) {
    try {
        const response = await axios.put(`${API_ENDPOINTS.STORAGE}/${id}`, data)
        return response.data
    } catch (error) {
        console.error('Error updating data:', error)
        throw error
    }
}

// Delete sucursal
export async function deleteData(id) {
    try {
        const response = await axios.delete(`${API_ENDPOINTS.STORAGE}/${id}`)
        return response.data
    } catch (error) {
        console.error('Error deleting data:', error)
        throw error
    }
}

// Get employees for a specific sucursal
export async function fetchSucursalEmployees(storageId) {
    try {
        console.log(`Fetching employees for storage ID: ${storageId}`)

        if (!storageId) {
            throw new Error('Storage ID is required')
        }

        const response = await axios.get(`${API_ENDPOINTS.STORAGE}/${storageId}/employees`)
        console.log('Employees response:', response.data)
        return response.data
    } catch (error) {
        console.error('Error fetching sucursal employees:', error)
        if (error.response) {
            console.error('Response status:', error.response.status)
            console.error('Response data:', error.response.data)
            throw new Error(`Server error: ${error.response.data.mensaje || error.response.statusText}`)
        } else if (error.request) {
            console.error('No response received:', error.request)
            throw new Error('No response from server - check if the backend is running')
        } else {
            console.error('Request error:', error.message)
            throw error
        }
    }
}


// Assign employee to sucursal
export async function assignEmployeeToSucursal(storageId, userId) {
    try {
        const response = await axios.post(`${API_ENDPOINTS.STORAGE}/${storageId}/employees`, {
            user_id: userId
        })
        return response.data
    } catch (error) {
        console.error('Error assigning employee to sucursal:', error)
        throw error
    }
}

// Remove employee from sucursal
export async function removeEmployeeFromSucursal(storageId, userId) {
    try {
        const response = await axios.delete(
            `${API_ENDPOINTS.STORAGE}/${storageId}/employees/${userId}`
        )
        return response.data
    } catch (error) {
        console.error('Error removing employee from sucursal:', error)
        throw error
    }
}
