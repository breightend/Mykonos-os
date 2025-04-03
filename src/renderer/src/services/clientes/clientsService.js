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

export async function postData(data) {
    try {
        const response = await axios.post("http://localhost:5000/api/client/", data);
        return response.data;
    } catch (error) {
        console.error("Error posting data:", error);
        throw error;
    }
}