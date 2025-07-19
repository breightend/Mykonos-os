import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api/product'

// Obtener todos los grupos de productos
export async function fetchGroups() {
    try {
        const response = await axios.get(`${API_BASE_URL}/familyProducts`)
        return response.data
    } catch (error) {
        console.error('Error fetching groups:', error)
        throw error
    }
}

// Obtener un grupo específico por ID
export async function fetchGroupById(groupId) {
    try {
        const response = await axios.get(`${API_BASE_URL}/familyProducts/${groupId}`)
        return response.data
    } catch (error) {
        console.error('Error fetching group by ID:', error)
        throw error
    }
}

// Crear un nuevo grupo
export async function createGroup(groupData) {
    try {
        const response = await axios.post(`${API_BASE_URL}/familyProducts`, groupData)
        return response.data
    } catch (error) {
        console.error('Error creating group:', error)
        throw error
    }
}

// Actualizar un grupo
export async function updateGroup(groupId, groupData) {
    try {
        const response = await axios.put(`${API_BASE_URL}/familyProducts/${groupId}`, groupData)
        return response.data
    } catch (error) {
        console.error('Error updating group:', error)
        throw error
    }
}
