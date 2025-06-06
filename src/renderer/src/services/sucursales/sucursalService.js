import axios from 'axios';


export const getSucursales = async () => {
    try {
        const response = await axios.get('http://localhost:5000/api/sucursales');
        return response.data;
    } catch (error) {
        console.error('Error fetching sucursales:', error);
        throw error;
    }
    }
    