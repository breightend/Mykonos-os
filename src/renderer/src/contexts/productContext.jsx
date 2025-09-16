import { createContext, useState, useContext } from 'react'

const ProductContext = createContext()

export const ProductProvider = ({ children }) => {
  const [productData, setProductData] = useState({
    products: [],
    total: 0,
    discount: 0
  })

  const [purchaseInfo, setPurchaseInfo] = useState({
    entity_id: null,
    basic_payment_method: '',
    bank_id: '',
    transaction_number: '',
    invoice_number: '',
    notes: '',
    delivery_date: '',
    echeq_time: '',
    invoice_file: null,
    subtotal: 0,
    discount: 0,
    total: 0
  })

  const addProduct = (product) => {
    // If product doesn't have an ID (new product), assign a temporary one
    let productId = product.id
    let isNewProduct = false
    if (!productId || productId <= 0) {
      productId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      isNewProduct = true
      console.log('Assigning temporary ID to new product:', productId)
    }

    // Transform the product data to match the purchase page requirements
    const purchaseProduct = {
      id: productId,
      product_id: productId,
      is_new_product: isNewProduct, // Flag to identify new products for purchase creation
      // Store original product data for creating in database if needed
      original_product_data: isNewProduct ? { ...product } : null,
      product_name: product.product_name,
      provider_code: product.provider_code,
      cost_price: parseFloat(product.cost) || 0,
      sale_price: parseFloat(product.sale_price) || 0,
      quantity: product.initial_quantity || 0,
      discount: 0, // Can be set later in purchase page
      subtotal: (parseFloat(product.cost) || 0) * (product.initial_quantity || 0),
      brand_id: product.brand_id,
      group_id: product.group_id,
      stock_variants: product.stock_variants || [],
      provider_id: product.provider_id,
      product_image: product.product_image || null, // Add the image field
      description: product.description || '',
      comments: product.comments || ''
    }

    setProductData((prev) => ({
      ...prev,
      products: [...prev.products, purchaseProduct],
      total: prev.total + purchaseProduct.subtotal
    }))
  }

  const removeProduct = (productId) => {
    setProductData((prev) => {
      const updatedProducts = prev.products.filter((p) => p.id !== productId)
      const newTotal = updatedProducts.reduce((acc, product) => acc + product.subtotal, 0)
      return {
        ...prev,
        products: updatedProducts,
        total: newTotal
      }
    })
  }

  const clearProducts = () => {
    setProductData({
      products: [],
      total: 0,
      discount: 0
    })
  }

  const clearPurchaseInfo = () => {
    setPurchaseInfo({
      entity_id: null,
      basic_payment_method: '',
      bank_id: '',
      transaction_number: '',
      invoice_number: '',
      notes: '',
      delivery_date: '',
      echeq_time: '',
      invoice_file: null,
      subtotal: 0,
      discount: 0,
      total: 0
    })
  }

  const updatePurchaseInfo = (newInfo) => {
    setPurchaseInfo((prev) => ({
      ...prev,
      ...newInfo
    }))
  }

  const updateProductQuantity = (productId, newQuantity) => {
    setProductData((prev) => {
      const updatedProducts = prev.products.map((product) =>
        product.id === productId
          ? { ...product, quantity: newQuantity, subtotal: product.cost_price * newQuantity }
          : product
      )
      const newTotal = updatedProducts.reduce((acc, product) => acc + product.subtotal, 0)
      return {
        ...prev,
        products: updatedProducts,
        total: newTotal
      }
    })
  }

  return (
    <ProductContext.Provider
      value={{
        productData,
        setProductData,
        addProduct,
        removeProduct,
        clearProducts,
        updateProductQuantity,
        purchaseInfo,
        setPurchaseInfo,
        updatePurchaseInfo,
        clearPurchaseInfo
      }}
    >
      {children}
    </ProductContext.Provider>
  )
}

export const useProductContext = () => {
  return useContext(ProductContext)
}
