import axios from "axios";

export async function fetchProvider() {
    try {
        const response = await axios.get("http://localhost:5000/api/provider/");
        return response.data;
    } catch (error) {
        console.error("Error fetching provider:", error);
        throw error;
    }
}

export async function fetchProviderById(id) {
    try {
        const response = await axios.get(`http://localhost:5000/api/provider/${id}`,);
        return response.data;
    } catch (error) {
        console.error("Error fetching provider by ID:", error);
        throw error;
    }
}
//Anda
export async function postData(data) {
    try {
        const response = await axios.post("http://localhost:5000/api/provider/", data);
        return response.data;
    } catch (error) {
        console.error("Error posting data:", error);
        throw error;
    }
}
//Anda
export async function putData(id, data) {
    try {
        const response = await axios.put(`http://localhost:5000/api/provider/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating data:", error);
        throw error;
    }
}
//Anda
export async function deleteData(id) {
    try {
        const response = await axios.delete(`http://localhost:5000/api/provider/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting data:", error);
        throw error;
    }
}