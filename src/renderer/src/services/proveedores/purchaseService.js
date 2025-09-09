import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api/purchases'


// Crear una nueva compra
export async function createPurchase(purchaseData) {
    try {
        const response = await axios.post(API_BASE_URL, purchaseData)
        return response.data
    } catch (error) {
        console.error('Error creating purchase:', error)
        throw error
    }
}

// Obtener todas las compras
export async function fetchPurchases() {
    try {
        const response = await axios.get(API_BASE_URL)
        return response.data
    } catch (error) {
        console.error('Error fetching purchases:', error)
        throw error
    }
}

// Obtener compras por proveedor
export async function fetchPurchasesByProvider(providerId) {
    try {
        const response = await axios.get(`${API_BASE_URL}/provider/${providerId}`)
        return response.data
    } catch (error) {
        console.error('Error fetching purchases by provider:', error)
        throw error
    }
}

// Obtener una compra por ID con sus detalles
export async function fetchPurchaseById(purchaseId) {
    try {
        const response = await axios.get(`${API_BASE_URL}/${purchaseId}`)
        return response.data
    } catch (error) {
        console.error('Error fetching purchase by ID:', error)
        throw error
    }
}

// Actualizar el estado de una compra
export async function updatePurchaseStatus(purchaseId, status, deliveryDate = null) {
    try {
        const updateData = {
            status: status,
            delivery_date: deliveryDate || new Date().toISOString()
        }
        const response = await axios.put(`${API_BASE_URL}/${purchaseId}/status`, updateData)
        return response.data
    } catch (error) {
        console.error('Error updating purchase status:', error)
        throw error
    }
}

// Actualizar una compra completa
export async function updatePurchase(purchaseId, purchaseData) {
    try {
        const response = await axios.put(`${API_BASE_URL}/${purchaseId}`, purchaseData)
        return response.data
    } catch (error) {
        console.error('Error updating purchase:', error)
        throw error
    }
}

// Eliminar una compra
export async function deletePurchase(purchaseId) {
    try {
        const response = await axios.delete(`${API_BASE_URL}/${purchaseId}`)
        return response.data
    } catch (error) {
        console.error('Error deleting purchase:', error)
        throw error
    }
}

// Agregar producto a una compra
export async function addProductToPurchase(purchaseId, productData) {
    try {
        const response = await axios.post(`${API_BASE_URL}/${purchaseId}/products`, productData)
        return response.data
    } catch (error) {
        console.error('Error adding product to purchase:', error)
        throw error
    }
}

// Actualizar producto en una compra
export async function updateProductInPurchase(purchaseId, productDetailId, productData) {
    try {
        const response = await axios.put(`${API_BASE_URL}/${purchaseId}/products/${productDetailId}`, productData)
        return response.data
    } catch (error) {
        console.error('Error updating product in purchase:', error)
        throw error
    }
}

// Eliminar producto de una compra
export async function removeProductFromPurchase(purchaseId, productDetailId) {
    try {
        const response = await axios.delete(`${API_BASE_URL}/${purchaseId}/products/${productDetailId}`)
        return response.data
    } catch (error) {
        console.error('Error removing product from purchase:', error)
        throw error
    }
}

// Recibir compra y actualizar inventario
export async function receivePurchase(purchaseId, storageId) {
    try {
        const response = await axios.post(`${API_BASE_URL}/${purchaseId}/receive`, {
            storage_id: storageId
        })
        return response.data
    } catch (error) {
        console.error('Error receiving purchase:', error)
        throw error
    }
}

// Generar códigos de barras para productos de una compra
export async function generateBarcodes(purchaseId) {
    try {
        const response = await axios.post(`${API_BASE_URL}/${purchaseId}/barcodes`)
        return response.data
    } catch (error) {
        console.error('Error generating barcodes:', error)
        throw error
    }
}

// Obtener resumen estadístico de compras
export async function fetchPurchasesSummary() {
    try {
        const response = await axios.get(`${API_BASE_URL}/summary`)
        return response.data
    } catch (error) {
        console.error('Error fetching purchases summary:', error)
        throw error
    }
}

// Obtener estadísticas de productos por grupos
export async function fetchProductStatistics() {
    try {
        const response = await axios.get(`${API_BASE_URL}/product-stats`)
        return response.data
    } catch (error) {
        console.error('Error fetching product statistics:', error)
        throw error
    }
}
