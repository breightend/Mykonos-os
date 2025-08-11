import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api/payment-methods/banks'

export const postNuevoBanco = async (bancoData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/`, bancoData)
    return response.data
  } catch (error) {
    console.error('Error al crear nuevo banco:', error)
    throw error
  }
}

export const getBancos = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/`)
    return response.data
  } catch (error) {
    console.error('Error al obtener bancos:', error)
    throw error
  }
}

export const getBancoById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}`)
    return response.data
  } catch (error) {
    console.error('Error al obtener banco:', error)
    throw error
  }
}

export const putBanco = async (id, bancoData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/${id}`, bancoData)
    return response.data
  } catch (error) {
    console.error('Error al actualizar banco:', error)
    throw error
  }
}

export const deleteBanco = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/${id}`)
    return response.data
  } catch (error) {
    console.error('Error al eliminar banco:', error)
    throw error
  }
}

// Métodos para la tabla puente
export const linkBankPaymentMethod = async (bank_id, payment_method_id) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/link-method`, { bank_id, payment_method_id })
    return response.data
  } catch (error) {
    console.error('Error al vincular banco y método de pago:', error)
    throw error
  }
}

export const getBankPaymentMethods = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/bank-payment-methods`)
    return response.data
  } catch (error) {
    console.error('Error al obtener relaciones banco-método de pago:', error)
    throw error
  }
}

export const deleteBankPaymentMethod = async (bpm_id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/bank-payment-methods/${bpm_id}`)
    return response.data
  } catch (error) {
    console.error('Error al eliminar relación banco-método de pago:', error)
    throw error
  }
}