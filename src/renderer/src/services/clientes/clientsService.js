import axios from "axios";

export async function fetchCliente() {
    try {
        const response = await axios.get("http://localhost:5000/api/client/");
        return response.data;
    } catch (error) {
        console.error("Error fetching cliente:", error);
        throw error;
    }
}

export async function fetchClienteById(id) {
    try {
        const response = await axios.get(`http://localhost:5000/api/client/${id}`,);
        return response.data;
    } catch (error) {
        console.error("Error fetching cliente by ID:", error);
        throw error;
    }
}

export async function postData(data) {
    try {
        const response = await axios.post("http://localhost:5000/api/client/", data);
        return response.data;
    } catch (error) {
        console.error("Error posting data:", error);
        throw error;
    }
}