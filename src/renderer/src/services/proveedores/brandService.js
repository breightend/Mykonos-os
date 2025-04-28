import axios from 'axios';


export async function fetchBrand() {
    try {
        const response = await axios.get('/api/provider/brand')
        return response.data
    } catch (error) {
        console.error('Error fetching brand:', error)
        throw error
    }
}

export async function fetchBrandById(id) {
    try {
        const response = await axios.get(`/api/provider/brand/${id}`)
        return response.data
    } catch (error) {
        console.error('Error fetching brand by ID:', error)
        throw error
    }
}

export async function fetchBrandXProviders(id_provider, ) {
    
}

export async function postDataBrand(data){
    try{
        const response = await axios.post('/api/provider/brand', data)
        return response.data
    }catch(e){
        console.error("Error: ", e)
    }
}
