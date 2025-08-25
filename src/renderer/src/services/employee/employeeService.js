import axios from "axios";

//Anda
export async function fetchEmployee() {
    try {
        const response = await axios.get("http://localhost:5000/api/user/employees");
        return response.data;
    } catch (error) {
        console.error("Error fetching empleado:", error);
        throw error;
    }
}

export async function fetchEmployeeById(id) {
    try {
        const response = await axios.get(`http://localhost:5000/api/user/employee/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching empleado by ID:", error);
        throw error;
    }
}

export async function postData(data) {
    try {
        const response = await axios.post("http://localhost:5000/api/user/employees", data);
        return response.data;
    } catch (error) {
        console.error("Error posting data:", error);
        throw error;
    }
}
//Anda
export async function putData(id, data) {
    try {
        const response = await axios.put(`http://localhost:5000/api/user/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating data:", error);
        throw error;
    }
}
//Anda
export async function deleteData(id) {
    try {
        const response = await axios.delete(`http://localhost:5000/api/user/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting data:", error);
        throw error;
    }
}

// Get employee's assigned storages
export async function fetchEmployeeStorages(employeeId) {
    try {
        const response = await axios.get(`http://localhost:5000/api/user/employee/${employeeId}/storages`);
        return response.data;
    } catch (error) {
        console.error("Error fetching employee storages:", error);
        throw error;
    }
}

// Assign storage to employee
export async function assignStorageToEmployee(employeeId, storageId) {
    try {
        const response = await axios.post(`http://localhost:5000/api/user/employee/${employeeId}/storages`, {
            storage_id: storageId
        });
        return response.data;
    } catch (error) {
        console.error("Error assigning storage to employee:", error);
        throw error;
    }
}

export async function removeStorageFromEmployee(employeeId, storageId) {
    try {
        const response = await axios.delete(`http://localhost:5000/api/user/employee/${employeeId}/storages/${storageId}`);
        return response.data;
    } catch (error) {
        console.error("Error removing storage from employee:", error);
        throw error;
    }
}

export async function fetchEmployeeByUsername(username) {
    try {
        const response = await axios.get(`http://localhost:5000/api/user/employee/username/${username}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching employee by username:", error);
        throw error;
    }
}
