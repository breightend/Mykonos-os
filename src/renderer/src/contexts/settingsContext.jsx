import { createContext, useContext, useState, useEffect } from 'react'

const SettingsContext = createContext()

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    priceMarkupPercentage: 50, // Porcentaje de ganancia por defecto
    autoCalculatePrice: true, // Si está habilitado el cálculo automático
    markupType: 'percentage' // 'percentage' o 'fixed'
  })

  // Guardar configuraciones en localStorage
  const updateSettings = (newSettings) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    localStorage.setItem('appSettings', JSON.stringify(updatedSettings))
  }

  // Función para calcular precio de venta basado en configuraciones
  const calculateSalePrice = (costPrice) => {
    if (!settings.autoCalculatePrice || !costPrice || costPrice <= 0) {
      return ''
    }

    const cost = parseFloat(costPrice)
    if (settings.markupType === 'percentage') {
      return (cost * (1 + settings.priceMarkupPercentage / 100)).toFixed(2)
    } else {
      return (cost + settings.priceMarkupPercentage).toFixed(2)
    }
  }

  // Recuperar configuraciones guardadas al cargar la aplicación
  useEffect(() => {
    const savedSettings = localStorage.getItem('appSettings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings((prevSettings) => ({ ...prevSettings, ...parsed }))
      } catch (error) {
        console.error('Error parsing saved settings:', error)
      }
    }
  }, [])

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        calculateSalePrice
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
