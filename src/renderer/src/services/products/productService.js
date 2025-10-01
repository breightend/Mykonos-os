import axios from 'axios'
import { API_ENDPOINTS, apiClient } from '../../config/apiConfig.js'
import { cacheService, CACHE_TTL } from '../cacheService.js'

const API_BASE_URL = API_ENDPOINTS.PRODUCT

// Crear un producto con sus relaciones de talles y colores
export default async function postData(data) {
    try {
        const response = await apiClient.post('/api/product', data)

        // Invalidar caché de productos después de crear uno nuevo
        cacheService.delete('products:all')
        console.log('🔄 Cache invalidated: products after create')

        return response.data
    } catch (e) {
        console.error('Error:', e)
        throw e
    }
}

// Obtener todos los productos (con caché)
export async function fetchProductos() {
    return cacheService.cached(
        'products:all',
        async () => {
            const response = await apiClient.get('/api/product')
            return response.data
        },
        CACHE_TTL.PRODUCTS
    )
}

// Obtener un producto completo con sus talles y colores (con caché)
export async function fetchProductoCompleto(productId) {
    return cacheService.cached(
        `product:${productId}:details`,
        async () => {
            const response = await apiClient.get(`/api/product/${productId}/details`)
            return response.data
        },
        CACHE_TTL.PRODUCTS
    )
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
