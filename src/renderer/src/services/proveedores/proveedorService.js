import axios from "axios";

export async function fetchProveedores() {
    try {
        const response = await axios.get("http://localhost:5000/api/provider/");
        return response.data;
    } catch (error) {
        console.error("Error fetching proveedores:", error);
        throw error;
    }
}

export async function postData(data) {
    try {
        const response = await axios.post("http://localhost:5000/api/provider/", data);
        return response.data;
    } catch (error) {
        console.error("Error posting data:", error);
        throw error;
    }
}