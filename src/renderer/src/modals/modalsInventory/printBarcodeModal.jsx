import { Printer } from 'lucide-react'
import { useState, useEffect } from 'react'
import { inventoryService } from '../../services/inventory/inventoryService'

export default function PrintBarcodeModal() {
  const [products, setProducts] = useState([])
  const [selectedVariants, setSelectedVariants] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const response = await inventoryService.getProductsSummary()
      if (response.status === 'success') {
        setProducts(response.data)
      }
    } catch (error) {
      console.error('Error cargando productos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProductVariants = async (productId) => {
    try {
      const response = await inventoryService.getProductDetails(productId)
      if (response.status === 'success' && response.data.stock_variants) {
        return response.data.stock_variants.filter((variant) => variant.variant_barcode)
      }
    } catch (error) {
      console.error('Error cargando variantes:', error)
    }
    return []
  }

  const handleAddVariant = async (productId) => {
    const variants = await loadProductVariants(productId)
    // Agregar variantes que no estén ya seleccionadas
    const newVariants = variants
      .filter((v) => !selectedVariants.some((sv) => sv.id === v.id))
      .map((v) => ({ ...v, quantity: 1 }))

    setSelectedVariants((prev) => [...prev, ...newVariants])
  }

  const updateVariantQuantity = (variantId, quantity) => {
    setSelectedVariants((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, quantity: Math.max(1, quantity) } : v))
    )
  }

  const removeVariant = (variantId) => {
    setSelectedVariants((prev) => prev.filter((v) => v.id !== variantId))
  }

  const handlePrint = () => {
    console.log('Imprimiendo códigos de barras de variantes:', selectedVariants)
    alert(
      `Se imprimirán ${selectedVariants.reduce((sum, v) => sum + v.quantity, 0)} códigos de barras`
    )
    // Aquí implementarías la lógica real de impresión
  }

  return (
    <dialog id="printBarcode" className="modal">
      <div className="modal-box w-11/12 max-w-5xl">
        <h3 className="text-lg font-bold">Imprimir códigos de barras de variantes</h3>
        <p className="py-4">Seleccione las variantes (talle + color) y cantidades a imprimir:</p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Lista de productos */}
          <div>
            <h4 className="mb-2 font-semibold">Productos disponibles:</h4>
            <div className="max-h-64 overflow-y-auto rounded border p-2">
              {loading ? (
                <div className="flex justify-center">
                  <span className="loading loading-spinner"></span>
                </div>
              ) : (
                products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between border-b p-2 last:border-b-0"
                  >
                    <div>
                      <span className="font-medium">{product.producto}</span>
                      <span className="ml-2 text-sm text-gray-500">({product.marca})</span>
                    </div>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => handleAddVariant(product.id)}
                    >
                      Agregar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Variantes seleccionadas */}
          <div>
            <h4 className="mb-2 font-semibold">Variantes para imprimir:</h4>
            <div className="max-h-64 overflow-y-auto rounded border p-2">
              {selectedVariants.length === 0 ? (
                <p className="py-4 text-center text-gray-500">No hay variantes seleccionadas</p>
              ) : (
                selectedVariants.map((variant) => (
                  <div
                    key={variant.id}
                    className="flex items-center justify-between border-b p-2 last:border-b-0"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {variant.size_name} | {variant.color_name}
                      </div>
                      <div className="text-xs text-gray-500">🏷️ {variant.variant_barcode}</div>
                      <div className="text-xs text-gray-500">📍 {variant.sucursal_nombre}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={variant.quantity}
                        onChange={(e) =>
                          updateVariantQuantity(variant.id, parseInt(e.target.value))
                        }
                        className="input input-xs w-16"
                      />
                      <button
                        className="btn btn-xs btn-error"
                        onClick={() => removeVariant(variant.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {selectedVariants.length > 0 && (
          <div className="bg-base-200 mt-4 rounded p-4">
            <h5 className="mb-2 font-semibold">Resumen de impresión:</h5>
            <p>
              Total de códigos de barras: {selectedVariants.reduce((sum, v) => sum + v.quantity, 0)}
            </p>
            <p>Variantes diferentes: {selectedVariants.length}</p>
          </div>
        )}

        <div className="modal-action">
          <form method="dialog" className="flex gap-2">
            <button className="btn btn-neutral">Cancelar</button>
            <button
              className="btn btn-success"
              disabled={selectedVariants.length === 0}
              onClick={handlePrint}
            >
              <Printer className="mr-2" />
              Imprimir ({selectedVariants.reduce((sum, v) => sum + v.quantity, 0)})
            </button>
          </form>
        </div>
      </div>
    </dialog>
  )
}
