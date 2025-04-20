import axios from "axios";

export async function fetchData() {
    const response = await axios.get("http://localhost:5000/api/user/employees")
    console.log(response)
}

export async function enviarData(data) {
    try {
        console.log("Data to be sent:", data)
        const response = await axios.post("http://localhost:5000/api/user/employees", data)
        return response.data
    }
    catch (error) {
        console.error("Error posting data: (El error esta aca )", error)
        throw error
    }
}