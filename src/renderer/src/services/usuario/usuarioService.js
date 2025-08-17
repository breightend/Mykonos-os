import axios from 'axios'

export async function fetchData() {
  const response = await axios.get('http://localhost:5000/api/user/employees')
  console.log(response)
}

export async function enviarData(data) {
  try {
    console.log('Data to be sent:', data)
    const response = await axios.post('http://localhost:5000/api/user/employees', data)
    return response.data
  } catch (error) {
    console.error('Error posting data:', error)

    // Better error handling
    if (error.response) {
      // Server responded with error status
      const errorMessage =
        error.response.data?.mensaje || error.response.data?.message || error.message
      throw new Error(errorMessage)
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('No se pudo conectar con el servidor')
    } else {
      // Something else happened
      throw new Error(error.message || 'Error desconocido')
    }
  }
}

