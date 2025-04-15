import axios from "axios";
//Anda
export async function fetchCliente() {
    try {
        const response = await axios.get("http://localhost:5000/api/client/");
        return response.data;
    } catch (error) {
        console.error("Error fetching cliente:", error);
        throw error;
    }
}
//Anda
export async function fetchClienteById(id) {
    try {
        const response = await axios.get(`http://localhost:5000/api/client/${id}`,);
        return response.data;
    } catch (error) {
        console.error("Error fetching cliente by ID:", error);
        throw error;
    }
}
//Anda
export async function postData(data) {
    try {
        const response = await axios.post("http://localhost:5000/api/client/", data);
        return response.data;
    } catch (error) {
        console.error("Error posting data:", error);
        throw error;
    }
}
//Anda
export async function putData(id, data) {
    try {
        const response = await axios.put(`http://localhost:5000/api/client/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating data:", error);
        throw error;
    }
}
//Anda
export async function   deleteData(id) {
    try {
        const response = await axios.delete(`http://localhost:5000/api/client/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting data:", error);
        throw error;
    }
}