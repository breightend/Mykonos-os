// Replace the loadAvailableVariants function in moveInventory.jsx with this optimized version

const loadAvailableVariants = useCallback(async () => {
    if (!currentStorage?.id) {
        setError('No hay sucursal actual seleccionada')
        return
    }

    try {
        setLoadingProducts(true)
        console.log('📦 Cargando variantes disponibles de sucursal:', currentStorage.id)

        // ✅ SINGLE OPTIMIZED QUERY instead of N+1 queries
        const response = await inventoryService.getVariantsByStorage(currentStorage.id)

        if (response.status === 'success' && response.data) {
            // Data is already in the correct format, no additional processing needed
            setAvailableVariants(response.data)
            setError(null)
            console.log('✅ Variantes cargadas con consulta optimizada:', response.data.length)
            console.log(`🚀 Rendimiento mejorado: 1 consulta en lugar de ${response.data.length + 1} consultas`)
        } else {
            setError('No se pudieron cargar las variantes')
        }
    } catch (error) {
        console.error('❌ Error cargando variantes:', error)
        setError(error.message || 'Error al cargar variantes disponibles')
    } finally {
        setLoadingProducts(false)
    }
}, [currentStorage?.id])