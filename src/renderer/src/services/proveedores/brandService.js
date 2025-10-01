import axios from 'axios'
import { API_ENDPOINTS } from '../../config/apiConfig.js';

export async function fetchBrand() {
    try {
        const response = await axios.get(`${API_ENDPOINTS.PROVIDER}/brand`)
        return response.data
    } catch (error) {
        console.error('Error fetching brand:', error)
        throw error
    }
}

export async function fetchBrandById(id) {
    try {
        const response = await axios.get(`${API_ENDPOINTS.PROVIDER}/brand/${id}`)
        return response.data
    } catch (error) {
        console.error('Error fetching brand by ID:', error)
        throw error
    }
}

export async function fetchBrandByProviders(idProvider) {
    try {
        const response = await axios.get(`${API_ENDPOINTS.PROVIDER}/brand/by-provider/${idProvider}`)
        return response.data
    } catch (error) {
        console.error('Error fetching brand by providers:', error)
        throw error
    }
}

export async function postDataBrand(data) {
    try {
        const response = await axios.post(`${API_ENDPOINTS.PROVIDER}/brand`, data)
        return response.data
    } catch (e) {
        console.error('Error: ', e)
        throw e
    }
}

export async function putDataBrand(id, data) {
    try {
        const response = await axios.put(`${API_ENDPOINTS.PROVIDER}/brand/${id}`, data)
        return response.data
    } catch (e) {
        console.error('Error updating brand: ', e)
        throw e
    }
}

export async function deleteDataBrand(id) {
    try {
        const response = await axios.delete(`${API_ENDPOINTS.PROVIDER}/brand/${id}`)
        return response.data
    } catch (e) {
        console.error('Error deleting brand: ', e)
        throw e
    }
}

export async function assignBrandToProvider(idProvider, idBrand) {
    try {
        const response = await axios.post(`${API_ENDPOINTS.PROVIDER}/providerXbrand`, {
            id_provider: idProvider,
            id_brand: idBrand
        })
        return response.data
    } catch (e) {
        console.error('Error assigning brand to provider: ', e)
        throw e
    }
}

export async function removeBrandFromProvider(idProvider, idBrand) {
    try {
        const response = await axios.delete(`${API_ENDPOINTS.PROVIDER}/providerXbrand/${idProvider}/${idBrand}`)
        return response.data
    } catch (e) {
        console.error('Error removing brand from provider: ', e)
        throw e
    }
}

export async function fetchProviderXBrand() {
    try {
        const response = await axios.get(`${API_ENDPOINTS.PROVIDER}/providerXbrand`)
        return response.data
    } catch (e) {
        console.error('Error fetching provider-brand relationships: ', e)
        throw e
    }
}

export async function fetchProviderJoinBrand() {
    try {
        const response = await axios.get(`${API_ENDPOINTS.PROVIDER}/providerJoinMarca`)
        return response.data
    } catch (e) {
        console.error('Error fetching provider-brand join: ', e)
        throw e
    }
}
