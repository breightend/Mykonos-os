import axios from "axios";

export async function fetchSize() {
    try {
        const response = await axios.get("http://localhost:5000/api/product/sizes");
        return response.data;
    } catch (error) {
        console.error("Error fetching size:", error);
        throw error;
    }
}

export async function postDataSize(data) {
    try {
        const response = await axios.post("http://localhost:5000/api/product/sizes", data);
        return response.data;
    } catch (error) {
        console.error("Error posting data:", error);
        throw error;
    }
}

export async function fetchCategorySize() {
    try {
        const response = await axios.get("http://localhost:5000/api/product/category");
        return response.data;
    } catch (error) {
        console.error("Error fetching category size:", error);
        throw error;
    }
}

export async function postDataCategory(data) {
    try {
        const response = await axios.post("http://localhost:5000/api/product/category", data);
        return response.data;

    } catch (error) {
        console.error("Error posting data:", error);
        throw error;
    }
}

export async function getCategoryXsize() {
    try {
        const response = await axios.get("http://localhost:5000/api/product/sizeXcategory");
        return response.data;
    } catch (error) {
        console.error("Error fetching category size:", error);
        throw error;
    }
}

export async function deleteCategory(categoryId) {
    try {
        const response = await axios.delete(`http://localhost:5000/api/product/category/${categoryId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting category:", error);
        throw error;
    }
}

export async function deleteSize(sizeId) {
    try {
        const response = await axios.delete(`http://localhost:5000/api/product/sizes/${sizeId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting size:", error);
        throw error;
    }
}