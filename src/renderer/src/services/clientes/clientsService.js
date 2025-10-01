import axios from "axios";
import { API_ENDPOINTS } from '../../config/apiConfig.js';

//Anda
export async function fetchCliente() {
    try {
        const response = await axios.get(`${API_ENDPOINTS.CLIENT}/`);
        return response.data;
    } catch (error) {
        console.error("Error fetching cliente:", error);
        throw error;
    }
}
//Anda
export async function fetchClienteById(id) {
    try {
        const response = await axios.get(`${API_ENDPOINTS.CLIENT}/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching cliente by ID:", error);
        throw error;
    }
}
//Anda
export async function postData(data) {
    try {
        const response = await axios.post(`${API_ENDPOINTS.CLIENT}/`, data);
        return response.data;
    } catch (error) {
        console.error("Error posting data:", error);
        throw error;
    }
}
//Anda
export async function putData(id, data) {
    try {
        const response = await axios.put(`${API_ENDPOINTS.CLIENT}/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating data:", error);
        throw error;
    }
}
//Anda
export async function deleteData(id) {
    try {
        const response = await axios.delete(`${API_ENDPOINTS.CLIENT}/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting data:", error);
        throw error;
    }
}