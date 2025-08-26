import { createContext, useState, useContext } from 'react'

const ProductContext = createContext()

export const ProductProvider = ({ children }) => {
  const [productData, setProductData] = useState({
    products: [],
    total: 0,
    discount: 0
  })

  const addProduct = (product) => {
    setProductData((prev) => ({
      ...prev,
      products: [...prev.products, product],
      total: prev.total + product.price * product.quantity
    }))
  }

  return (
    <ProductContext.Provider value={{ productData, setProductData, addProduct }}>
      {children}
    </ProductContext.Provider>
  )
}

export const useProductContext = () => {
  return useContext(ProductContext)
}
