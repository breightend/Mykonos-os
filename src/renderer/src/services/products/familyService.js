import axios from "axios";

export async function postFamilyData(data) {
    try {
        const response = await axios.post("http://localhost:5000/api/product/familyProducts", data)
        return response.data
    } catch (e) {
        console.error('Error:', e)
        throw e
    }
}

export async function fetchFamilyProducts() {
    try {
        const response = await axios.get("http://localhost:5000/api/product/familyProducts")
        return response.data
    } catch (error) {
        console.log(error)
        throw error
    }
}

export async function fetchFamilyProductsTree() {
    try {
        const response = await axios.get("http://localhost:5000/api/product/familyProducts/tree")
        return response.data
    } catch (error) {
        console.log(error)
        throw error
    }
}

export async function modfifyFamilyProduct(id, data) {
    try {
        const response = await axios.put(`http://localhost:5000/api/product/familyProducts/${id}`, data)
        return response.data
    } catch (error) {
        console.log(error)
        throw error
    }
}