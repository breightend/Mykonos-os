import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api/inventory'

class PrintSettingsService {
  /**
   * Obtiene las configuraciones de impresión guardadas
   */
  async getPrintSettings(userId = 'default') {
    try {
      const response = await axios.get(`${API_BASE_URL}/print-settings`, {
        params: { user_id: userId }
      })
      return response.data
    } catch (error) {
      console.error('Error obteniendo configuraciones de impresión:', error)
      throw error
    }
  }

  /**
   * Guarda las configuraciones de impresión
   */
  async savePrintSettings(settings, userId = 'default') {
    try {
      const response = await axios.post(`${API_BASE_URL}/print-settings`, {
        user_id: userId,
        settings: settings
      })
      return response.data
    } catch (error) {
      console.error('Error guardando configuraciones de impresión:', error)
      throw error
    }
  }
}

export default new PrintSettingsService()
