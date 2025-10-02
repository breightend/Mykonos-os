import React, { createContext, useContext, useEffect, useState } from 'react'
import { preloadService } from '../services/preloadService.js'

const GlobalDataContext = createContext()

/**
 * Provider para datos globales precargados
 * Proporciona acceso fácil a datos compartidos sin consultas API
 */
export function GlobalDataProvider({ children }) {
  const [globalData, setGlobalData] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [errors, setErrors] = useState({})

  // Inicializar datos globales
  useEffect(() => {
    initializeGlobalData()
  }, [])

  const initializeGlobalData = async () => {
    try {
      setIsLoading(true)
      console.log('🚀 Inicializando datos globales...')

      // Verificar si necesita refrescar
      if (preloadService.shouldRefreshPreload()) {
        console.log('🔄 Refrescando datos globales...')
        preloadService.clearPreloadData()
      }

      // Precargar datos
      const data = await preloadService.preloadGlobalData()
      setGlobalData(data)
      setLastUpdate(new Date())
      setErrors(preloadService.preloadErrors)

      console.log('✅ Datos globales listos:', Object.keys(data))
    } catch (error) {
      console.error('❌ Error inicializando datos globales:', error)

      // Usar datos fallback en caso de error total
      const fallbackData = {
        colors: [
          { id: 1, name: 'Negro', hex: '#000000' },
          { id: 2, name: 'Blanco', hex: '#FFFFFF' },
          { id: 3, name: 'Azul', hex: '#0066CC' },
          { id: 4, name: 'Rojo', hex: '#CC0000' }
        ],
        sizes: [
          { id: 1, name: 'XS', order: 1 },
          { id: 2, name: 'S', order: 2 },
          { id: 3, name: 'M', order: 3 },
          { id: 4, name: 'L', order: 4 },
          { id: 5, name: 'XL', order: 5 }
        ],
        categories: [
          { id: 1, name: 'Ropa', description: 'Artículos de vestir' },
          { id: 2, name: 'Calzado', description: 'Zapatos y zapatillas' }
        ],
        brands: [{ id: 1, name: 'Marca A', description: 'Marca genérica A' }],
        payment_methods: [
          { id: 1, name: 'Efectivo', type: 'cash', active: true },
          { id: 2, name: 'Tarjeta', type: 'card', active: true }
        ]
      }

      setGlobalData(fallbackData)
      setErrors({ global: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  // Función para refrescar datos específicos
  const refreshData = async (key) => {
    try {
      console.log(`🔄 Refrescando ${key}...`)
      const newData = await preloadService.reloadData(key)

      setGlobalData((prev) => ({
        ...prev,
        [key]: newData
      }))

      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[key]
        return newErrors
      })

      console.log(`✅ ${key} actualizado`)
      return newData
    } catch (error) {
      console.error(`❌ Error refrescando ${key}:`, error)
      setErrors((prev) => ({
        ...prev,
        [key]: error.message
      }))
      throw error
    }
  }

  // Función para obtener datos con fallback inmediato
  const getData = (key, fallback = []) => {
    if (!globalData[key]) {
      console.warn(`⚠️ Datos de ${key} no disponibles, usando fallback`)
      return fallback
    }
    return globalData[key]
  }

  // Función para verificar si datos están listos
  const isDataReady = (key = null) => {
    if (key) {
      return !isLoading && globalData[key] !== undefined
    }
    return !isLoading && Object.keys(globalData).length > 0
  }

  const value = {
    // Datos
    colors: getData('colors', []),
    sizes: getData('sizes', []),
    categories: getData('categories', []),
    brands: getData('brands', []),
    paymentMethods: getData('payment_methods', []),

    // Estado
    isLoading,
    lastUpdate,
    errors,

    // Funciones
    refreshData,
    getData,
    isDataReady,

    // Datos raw para casos especiales
    globalData
  }

  return <GlobalDataContext.Provider value={value}>{children}</GlobalDataContext.Provider>
}

/**
 * Hook para usar datos globales
 */
export function useGlobalData() {
  const context = useContext(GlobalDataContext)
  if (!context) {
    throw new Error('useGlobalData debe usarse dentro de GlobalDataProvider')
  }
  return context
}

/**
 * Hook específico para colores
 */
export function useColors() {
  const { colors, refreshData, isDataReady } = useGlobalData()
  return {
    colors,
    refreshColors: () => refreshData('colors'),
    isReady: isDataReady('colors')
  }
}

/**
 * Hook específico para talles
 */
export function useSizes() {
  const { sizes, refreshData, isDataReady } = useGlobalData()
  return {
    sizes,
    refreshSizes: () => refreshData('sizes'),
    isReady: isDataReady('sizes')
  }
}

/**
 * Hook específico para categorías
 */
export function useCategories() {
  const { categories, refreshData, isDataReady } = useGlobalData()
  return {
    categories,
    refreshCategories: () => refreshData('categories'),
    isReady: isDataReady('categories')
  }
}

/**
 * Hook específico para marcas
 */
export function useBrands() {
  const { brands, refreshData, isDataReady } = useGlobalData()
  return {
    brands,
    refreshBrands: () => refreshData('brands'),
    isReady: isDataReady('brands')
  }
}

/**
 * Hook específico para métodos de pago
 */
export function usePaymentMethods() {
  const { paymentMethods, refreshData, isDataReady } = useGlobalData()
  return {
    paymentMethods,
    refreshPaymentMethods: () => refreshData('payment_methods'),
    isReady: isDataReady('payment_methods')
  }
}

export default GlobalDataContext
