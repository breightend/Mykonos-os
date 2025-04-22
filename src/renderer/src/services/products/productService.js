import axios from "axios";

export default async function postData(data) {
    try {
        const response = await axios.post("http://localhost:5000/api/product", data)
        return response.data
    } catch (e) {
        console.error('Error:', e)
        throw e
    }
}

export async function fetchProductos() {
    try {
        const response = await axios.get("http://localhost:5000/api/product")
        return response.data
    } catch (error) {
        console.log(error)
        throw error
    }

}