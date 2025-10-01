import axios from "axios";
import { API_ENDPOINTS } from '../../config/apiConfig.js';

export const postData = async (data) => {
    try {
        const response = await axios.post(`${API_ENDPOINTS.PRODUCT}/colors`, data)
        return response.data
    }
    catch (error) {
        console.error("Error posting data:", error)
        throw error
    }
}

export const fetchColor = async () => {
    try {
        const response = await axios.get(`${API_ENDPOINTS.PRODUCT}/colors`)
        return response.data
    } catch (error) {
        console.error("Error fetching color:", error)
        throw error
    }
}

export const deleteColor = async (colorId) => {
    try {
        const response = await axios.delete(`${API_ENDPOINTS.PRODUCT}/colors/${colorId}`)
        return response.data
    } catch (error) {
        console.error("Error deleting color:", error)
        throw error
    }
}

export const checkColorInUse = async (colorId) => {
    try {
        const response = await axios.get(`${API_ENDPOINTS.PRODUCT}/colors/${colorId}/usage`)
        return response.data
    } catch (error) {
        console.error("Error checking color usage:", error)
        throw error
    }
}
