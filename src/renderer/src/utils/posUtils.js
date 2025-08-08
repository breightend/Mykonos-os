/**
 * Utility functions for the POS system
 */

/**
 * Gets the current branch/storage ID
 * For now, returns a default value, but this should be implemented
 * to get the actual current branch from user context or settings
 * @returns {number} Current branch ID
 */
export const getCurrentBranchId = () => {
  // TODO: Implement proper branch selection logic
  // This could come from:
  // 1. User authentication context (if user is assigned to specific branches)
  // 2. Local storage setting
  // 3. Global application state
  // 4. Configuration file

  // For now, returning default branch ID 1
  // In production, you should implement proper branch management
  const defaultBranchId = 1

  try {
    // Example: Get from localStorage
    const storedBranchId = localStorage.getItem('currentBranchId')
    if (storedBranchId) {
      return parseInt(storedBranchId, 10)
    }

    // Example: Get from session storage
    const sessionBranchId = sessionStorage.getItem('activeBranch')
    if (sessionBranchId) {
      return parseInt(sessionBranchId, 10)
    }

    return defaultBranchId
  } catch (error) {
    console.error('Error getting current branch ID:', error)
    return defaultBranchId
  }
}

/**
 * Sets the current branch ID
 * @param {number} branchId - Branch ID to set as current
 */
export const setCurrentBranchId = (branchId) => {
  try {
    localStorage.setItem('currentBranchId', branchId.toString())
    sessionStorage.setItem('activeBranch', branchId.toString())
  } catch (error) {
    console.error('Error setting current branch ID:', error)
  }
}

/**
 * Formats currency for display
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  }).format(amount)
}

/**
 * Formats a date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

/**
 * Generates a unique transaction ID
 * @param {string} prefix - Prefix for the ID
 * @returns {string} Unique transaction ID
 */
export const generateTransactionId = (prefix = 'TXN') => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${prefix}-${timestamp}-${random}`
}
