import axios from "axios";

export const postData = async (data) => {
    try {
        const response = await axios.post("http://localhost:5000/api/product/colors", data)
        return response.data
    }
    catch (error) {
        console.error("Error posting data:", error)
        throw error
    }
}

export const fetchColor = async () => {
    try {
        const response = await axios.get("http://localhost:5000/api/product/colors")
        return response.data
    } catch (error) {
        console.error("Error fetching color:", error)
        throw error
    }
}
