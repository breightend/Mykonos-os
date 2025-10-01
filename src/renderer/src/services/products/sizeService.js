import axios from "axios";
import { API_ENDPOINTS } from '../../config/apiConfig.js';

export async function fetchSize() {
    try {
        const response = await axios.get(`${API_ENDPOINTS.PRODUCT}/sizes`);
        return response.data;
    } catch (error) {
        console.error("Error fetching size:", error);
        throw error;
    }
}

export async function postDataSize(data) {
    try {
        const response = await axios.post(`${API_ENDPOINTS.PRODUCT}/sizes`, data);
        return response.data;
    } catch (error) {
        console.error("Error posting data:", error);
        throw error;
    }
}

export async function fetchCategorySize() {
    try {
        const response = await axios.get(`${API_ENDPOINTS.PRODUCT}/category`);
        return response.data;
    } catch (error) {
        console.error("Error fetching category size:", error);
        throw error;
    }
}

export async function postDataCategory(data) {
    try {
        const response = await axios.post(`${API_ENDPOINTS.PRODUCT}/category`, data);
        return response.data;

    } catch (error) {
        console.error("Error posting data:", error);
        throw error;
    }
}

export async function getCategoryXsize() {
    try {
        const response = await axios.get(`${API_ENDPOINTS.PRODUCT}/sizeXcategory`);
        return response.data;
    } catch (error) {
        console.error("Error fetching category size:", error);
        throw error;
    }
}

export async function deleteCategory(categoryId) {
    try {
        const response = await axios.delete(`${API_ENDPOINTS.PRODUCT}/category/${categoryId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting category:", error);
        throw error;
    }
}

export async function deleteSize(sizeId) {
    try {
        const response = await axios.delete(`${API_ENDPOINTS.PRODUCT}/sizes/${sizeId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting size:", error);
        throw error;
    }
}