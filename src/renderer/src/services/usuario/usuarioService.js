import axios from "axios";

export async function fetchData() {
    const response = await axios.get("http://localhost:5000/api/user/employees")
    console.log(response)
}

export async function enviarData(data) {
    const response = await axios.post("http://localhost:5000/api/user/employees", data)
    console.log(response)
    return response
}