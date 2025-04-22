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
        const response = await axios.get("http://localhost:5000/api/product/catgory");
        return response.data;
    } catch (error) {
        console.error("Error fetching category size:", error);
        throw error;
    }
}

export async function postDataCategory(data) {
    try {
        const response = await axios.post("http://localhost:5000/api/product/catgory", data);
        return response.data;

    } catch (error) {
        console.error("Error posting data:", error);
        throw error;
    }
}

export async function getCategoryXsize(){
    try {
        const response = await axios.get("http://localhost:5000/api/product/sizeXcategory");
        return response.data;
    } catch (error) {
        console.error("Error fetching category size:", error);
        throw error;
    }
}