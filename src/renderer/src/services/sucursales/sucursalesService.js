import axios from 'axios'

// Get all sucursales
export async function fetchSucursales() {
    try {
        const response = await axios.get('http://localhost:5000/api/storage/')
        return response.data
    } catch (error) {
        console.error('Error fetching sucursales:', error)
        throw error
    }
}

// Get sucursal by ID
export async function fetchSucursalById(id) {
    try {
        const response = await axios.get(`http://localhost:5000/api/storage/${id}`)
        return response.data
    } catch (error) {
        console.error('Error fetching sucursal by ID:', error)
        throw error
    }
}

// Create new sucursal
export async function postData(data) {
    try {
        const response = await axios.post('http://localhost:5000/api/storage/', data)
        return response.data
    } catch (error) {
        console.error('Error posting data:', error)
        throw error
    }
}

// Update sucursal
export async function putData(id, data) {
    try {
        const response = await axios.put(`http://localhost:5000/api/storage/${id}`, data)
        return response.data
    } catch (error) {
        console.error('Error updating data:', error)
        throw error
    }
}

// Delete sucursal
export async function deleteData(id) {
    try {
        const response = await axios.delete(`http://localhost:5000/api/storage/${id}`)
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

        const response = await axios.get(`http://localhost:5000/api/storage/${storageId}/employees`)
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
        const response = await axios.post(`http://localhost:5000/api/storage/${storageId}/employees`, {
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
            `http://localhost:5000/api/storage/${storageId}/employees/${userId}`
        )
        return response.data
    } catch (error) {
        console.error('Error removing employee from sucursal:', error)
        throw error
    }
}
