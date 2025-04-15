import axios from "axios";
//Anda
export async function fetchEmployeee() {
    try {
        const response = await axios.get("http://localhost:5000/api/employee/");
        return response.data;
    } catch (error) {
        console.error("Error fetching employeee:", error);
        throw error;
    }
}
//Anda
export async function fetchEmployeeeById(id) {
    try {
        const response = await axios.get(`http://localhost:5000/api/employee/${id}`,);
        return response.data;
    } catch (error) {
        console.error("Error fetching employeee by ID:", error);
        throw error;
    }
}
//Anda
export async function postData(data) {
    try {
        const response = await axios.post("http://localhost:5000/api/employee/", data);
        return response.data;
    } catch (error) {
        console.error("Error posting data:", error);
        throw error;
    }
}
//En proceso de validar
export async function putData(id, data) {
    try {
        const response = await axios.put(`http://localhost:5000/api/employee/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating data:", error);
        throw error;
    }
}

export async function deleteData(id) {
    try {
        const response = await axios.delete(`http://localhost:5000/api/employee/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting data:", error);
        throw error;
    }
}