import axios from "axios";
import { API_ENDPOINTS } from '../../config/apiConfig.js';

export async function postFamilyData(data) {
    try {
        const response = await axios.post(`${API_ENDPOINTS.PRODUCT}/familyProducts`, data)
        return response.data
    } catch (e) {
        console.error('Error:', e)
        throw e
    }
}

export async function fetchFamilyProducts() {
    try {
        const response = await axios.get(`${API_ENDPOINTS.PRODUCT}/familyProducts`)
        return response.data
    } catch (error) {
        console.log(error)
        throw error
    }
}

export async function fetchFamilyProductsTree() {
    try {
        const response = await axios.get(`${API_ENDPOINTS.PRODUCT}/familyProducts/tree`)
        return response.data
    } catch (error) {
        console.log(error)
        throw error
    }
}

export async function modfifyFamilyProduct(id, data) {
    try {
        const response = await axios.put(`${API_ENDPOINTS.PRODUCT}/familyProducts/${id}`, data)
        return response.data
    } catch (error) {
        console.log(error)
        throw error
    }
}