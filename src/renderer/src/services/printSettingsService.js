import axios from 'axios'
import { API_ENDPOINTS } from '../config/apiConfig.js'

const API_BASE_URL = API_ENDPOINTS.INVENTORY

class PrintSettingsService {
  /**
   * Obtiene las configuraciones de impresión guardadas
   */
  async getPrintSettings() {
    try {
      const sessionToken = localStorage.getItem('session_token')
      if (!sessionToken) {
        throw new Error('No session token found')
      }

      const response = await axios.get(`${API_BASE_URL}/print-settings`, {
        params: { session_token: sessionToken }
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
  async savePrintSettings(settings) {
    try {
      const sessionToken = localStorage.getItem('session_token')
      if (!sessionToken) {
        throw new Error('No session token found')
      }

      const response = await axios.post(`${API_BASE_URL}/print-settings`, {
        session_token: sessionToken,
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
