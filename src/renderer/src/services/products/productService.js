import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api/product'

// Crear un producto con sus relaciones de talles y colores
export default async function postData(data) {
    try {
        const response = await axios.post(API_BASE_URL, data)
        return response.data
    } catch (e) {
        console.error('Error:', e)
        throw e
    }
}

// Obtener todos los productos
export async function fetchProductos() {
    try {
        const response = await axios.get(API_BASE_URL)
        return response.data
    } catch (error) {
        console.log(error)
        throw error
    }
}

// Obtener un producto completo con sus talles y colores
export async function fetchProductoCompleto(productId) {
    try {
        const response = await axios.get(`${API_BASE_URL}/${productId}/details`)
        return response.data
    } catch (error) {
        console.error('Error fetching complete product:', error)
        throw error
    }
}

//Desvincular un producto a una tienda en especifico
export async function desvincularProductoDeTienda(productId, storeId) {
    try {
        const response = await axios.delete(`${API_BASE_URL}/${productId}/remove-from-storage/${storeId}`)
        return response.data
    } catch (error) {
        console.error('Error desvinculating product from store:', error)
        throw error
    }
}

// ============== GESTIÓN DE TALLES POR PRODUCTO ==============

// Agregar un talle a un producto
export async function agregarTalleAProducto(productId, sizeId) {
    try {
        const response = await axios.post(`${API_BASE_URL}/${productId}/sizes`, {
            size_id: sizeId
        })
        return response.data
    } catch (error) {
        console.error('Error adding size to product:', error)
        throw error
    }
}

// Remover un talle de un producto
export async function removerTalleDeProducto(productId, sizeId) {
    try {
        const response = await axios.delete(`${API_BASE_URL}/${productId}/sizes/${sizeId}`)
        return response.data
    } catch (error) {
        console.error('Error removing size from product:', error)
        throw error
    }
}

// Obtener todos los talles de un producto
export async function fetchTallesDeProducto(productId) {
    try {
        const response = await axios.get(`${API_BASE_URL}/${productId}/sizes`)
        return response.data
    } catch (error) {
        console.error('Error fetching product sizes:', error)
        throw error
    }
}

// Agregar múltiples talles a un producto
export async function agregarMultiplesTallesAProducto(productId, sizeIds) {
    try {
        const response = await axios.post(`${API_BASE_URL}/${productId}/sizes/bulk`, {
            size_ids: sizeIds
        })
        return response.data
    } catch (error) {
        console.error('Error adding multiple sizes to product:', error)
        throw error
    }
}

// ============== GESTIÓN DE COLORES POR PRODUCTO ==============

// Agregar un color a un producto
export async function agregarColorAProducto(productId, colorId) {
    try {
        const response = await axios.post(`${API_BASE_URL}/${productId}/colors`, {
            color_id: colorId
        })
        return response.data
    } catch (error) {
        console.error('Error adding color to product:', error)
        throw error
    }
}

// Remover un color de un producto
export async function removerColorDeProducto(productId, colorId) {
    try {
        const response = await axios.delete(`${API_BASE_URL}/${productId}/colors/${colorId}`)
        return response.data
    } catch (error) {
        console.error('Error removing color from product:', error)
        throw error
    }
}

// Obtener todos los colores de un producto
export async function fetchColoresDeProducto(productId) {
    try {
        const response = await axios.get(`${API_BASE_URL}/${productId}/colors`)
        return response.data
    } catch (error) {
        console.error('Error fetching product colors:', error)
        throw error
    }
}

// Agregar múltiples colores a un producto
export async function agregarMultiplesColoresAProducto(productId, colorIds) {
    try {
        const response = await axios.post(`${API_BASE_URL}/${productId}/colors/bulk`, {
            color_ids: colorIds
        })
        return response.data
    } catch (error) {
        console.error('Error adding multiple colors to product:', error)
        throw error
    }
}

// ============== CONSULTAS INVERSAS ==============

// Obtener todos los productos que tienen un talle específico
export async function fetchProductosPorTalle(sizeId) {
    try {
        const response = await axios.get(`${API_BASE_URL}/sizes/${sizeId}/products`)
        return response.data
    } catch (error) {
        console.error('Error fetching products by size:', error)
        throw error
    }
}

// Obtener todos los productos que tienen un color específico
export async function fetchProductosPorColor(colorId) {
    try {
        const response = await axios.get(`${API_BASE_URL}/colors/${colorId}/products`)
        return response.data
    } catch (error) {
        console.error('Error fetching products by color:', error)
        throw error
    }
}
