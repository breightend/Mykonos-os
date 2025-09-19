// Add this method to inventoryService.js to use the optimized endpoint

/**
 * Get all available variants for a storage in a single optimized query
 * This replaces the N+1 query problem in loadAvailableVariants
 * @param {number} storageId - ID of the storage
 * @returns {Promise} All variants with stock for the storage
 */
async getVariantsByStorage(storageId) {
    try {
        const response = await axios.get(`${API_URL}/variants-by-storage/${storageId}`)
        return response.data
    } catch (error) {
        console.error('Error al obtener variantes por sucursal:', error)
        throw error
    }
}