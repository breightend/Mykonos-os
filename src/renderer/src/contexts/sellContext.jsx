import { createContext, useState, useContext } from 'react'

const SellContext = createContext()

export const SellProvider = ({ children }) => {
  const [saleData, setSaleData] = useState({
    products: [],
    payments: [],
    customer: null,
    total: 0,
    discount: 0,
    gifts: [] // Array for gift products
  })

  // Métodos para productos (se mantienen igual)
  const addProduct = (product) => {
    setSaleData((prev) => ({
      ...prev,
      products: [...prev.products, product],
      total: prev.total + product.price * product.quantity
    }))
  }

  // Método mejorado para pagos
  const addPaymentMethod = (method) => {
    setSaleData((prev) => {
      // Verificar si el método ya existe
      const existingIndex = prev.paymentMethods.findIndex((m) => m.id === method.id)

      let updatedMethods
      if (existingIndex >= 0) {
        // Actualizar método existente
        updatedMethods = [...prev.paymentMethods]
        updatedMethods[existingIndex] = method
      } else {
        // Agregar nuevo método
        updatedMethods = [...prev.paymentMethods, method]
      }

      // Calcular nuevo total pagado
      const totalPaid = updatedMethods.reduce((sum, m) => sum + m.amount, 0)

      return {
        ...prev,
        paymentMethods: updatedMethods,
        payments: updatedMethods, // Mantener compatibilidad
        discount: prev.total - totalPaid
      }
    })
  }

  // Método para establecer múltiples métodos de pago a la vez
  const setPaymentMethods = (methods) => {
    const totalPaid = methods.reduce((sum, m) => sum + m.amount, 0)

    setSaleData((prev) => ({
      ...prev,
      paymentMethods: methods,
      payments: methods, // Mantener compatibilidad
      discount: prev.total - totalPaid
    }))
  }

  // Mantener métodos existentes para compatibilidad
  const addPayment = (payment) => {
    addPaymentMethod({
      id: payment.method,
      type: payment.method,
      amount: payment.amount
    })
  }

  const resetSale = () => {
    setSaleData({
      products: [],
      payments: [],
      customer: 0, //Aca me gustaria que me pase el dni
      total: 0,
      gifts: [] // Reset gifts array
    })
  }

  // Gift management methods
  const addProductToGifts = (product, mainProductsList = []) => {
    // Find the product in the main products list to check available quantity
    const mainProduct = mainProductsList.find((p) => p.variant_barcode === product.variant_barcode)
    if (!mainProduct) {
      return { success: false, message: 'Producto no encontrado en la venta' }
    }

    const giftProduct = {
      variant_barcode: product.variant_barcode,
      product_id: product.product_id,
      variant_id: product.variant_id,
      product_name: product.descripcion || product.description,
      size_name: product.talle || product.size_name,
      color_name: product.color || product.color_name,
      color_hex: product.color_hex,
      price: product.precio || product.price,
      quantity: 1, // Always add 1 at a time
      brand: product.marca || product.brand,
      group_name: product.grupo || product.group_name
    }

    let validationResult = { success: true, message: '' }

    setSaleData((prev) => {
      // Check current gift quantity for this product
      const existingGift = prev.gifts.find((g) => g.variant_barcode === giftProduct.variant_barcode)
      const currentGiftQuantity = existingGift ? existingGift.quantity : 0
      const newGiftQuantity = currentGiftQuantity + 1

      // Validate that gift quantity doesn't exceed main product quantity
      if (newGiftQuantity > mainProduct.cantidad) {
        validationResult = {
          success: false,
          message: `No puedes agregar más regalos. Cantidad en venta: ${mainProduct.cantidad}, ya tienes ${currentGiftQuantity} como regalo`
        }
        return prev // Don't modify state
      }

      // Check if gift already exists
      const existingGiftIndex = prev.gifts.findIndex(
        (g) => g.variant_barcode === giftProduct.variant_barcode
      )

      if (existingGiftIndex >= 0) {
        // Update existing gift quantity
        const updatedGifts = [...prev.gifts]
        updatedGifts[existingGiftIndex].quantity = newGiftQuantity
        return { ...prev, gifts: updatedGifts }
      } else {
        // Add new gift
        return { ...prev, gifts: [...prev.gifts, giftProduct] }
      }
    })

    return validationResult
  }

  const removeGiftProduct = (variantBarcode) => {
    setSaleData((prev) => ({
      ...prev,
      gifts: prev.gifts.filter((gift) => gift.variant_barcode !== variantBarcode)
    }))
  }

  const updateGiftQuantity = (variantBarcode, newQuantity, mainProductsList = []) => {
    if (newQuantity <= 0) {
      removeGiftProduct(variantBarcode)
      return { success: true, message: '' }
    }

    // Find the product in the main products list to check available quantity
    const mainProduct = mainProductsList.find((p) => p.variant_barcode === variantBarcode)
    if (!mainProduct) {
      return { success: false, message: 'Producto no encontrado en la venta' }
    }

    // Validate that new quantity doesn't exceed main product quantity
    if (newQuantity > mainProduct.cantidad) {
      return {
        success: false,
        message: `Cantidad máxima de regalos: ${mainProduct.cantidad}`
      }
    }

    setSaleData((prev) => ({
      ...prev,
      gifts: prev.gifts.map((gift) =>
        gift.variant_barcode === variantBarcode ? { ...gift, quantity: newQuantity } : gift
      )
    }))

    return { success: true, message: '' }
  }

  const clearGifts = () => {
    setSaleData((prev) => ({ ...prev, gifts: [] }))
  }

  return (
    <SellContext.Provider
      value={{
        saleData,
        setSaleData,
        addProduct,
        addPayment,
        addPaymentMethod, // Nuevo método
        setPaymentMethods, // Nuevo método
        resetSale,
        // Gift methods
        addProductToGifts,
        removeGiftProduct,
        updateGiftQuantity,
        clearGifts
      }}
    >
      {children}
    </SellContext.Provider>
  )
}

export const useSellContext = () => useContext(SellContext)
