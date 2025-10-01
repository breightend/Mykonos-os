import axios from "axios";
import { API_ENDPOINTS } from '../../config/apiConfig.js';

export async function fetchProvider() {
    try {
        const response = await axios.get(`${API_ENDPOINTS.PROVIDER}/`);
        return response.data;
    } catch (error) {
        console.error("Error fetching provider:", error);
        throw error;
    }
}

export async function fetchProviderById(id) {
    try {
        const response = await axios.get(`${API_ENDPOINTS.PROVIDER}/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching provider by ID:", error);
        throw error;
    }
}
//Anda
export async function postData(data) {
    try {
        const response = await axios.post(`${API_ENDPOINTS.PROVIDER}/`, data);
        return response.data;
    } catch (error) {
        console.error("Error posting data:", error);
        throw error;
    }
}
//Anda
export async function putData(id, data) {
    try {
        const response = await axios.put(`${API_ENDPOINTS.PROVIDER}/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating data:", error);
        throw error;
    }
}
//Anda
export async function deleteData(id) {
    try {
        const response = await axios.delete(`${API_ENDPOINTS.PROVIDER}/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting data:", error);
        throw error;
    }
}