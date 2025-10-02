// Ejemplo de cómo usar los datos precargados en lugar de consultas API
import React from 'react'
import { useColors, useSizes, useCategories, useBrands } from '../contexts/GlobalDataContext'

const ExampleInventoryForm = () => {
  const { colors, isReady: colorsReady } = useColors()
  const { sizes, isReady: sizesReady } = useSizes()
  const { categories, isReady: categoriesReady } = useCategories()
  const { brands, isReady: brandsReady } = useBrands()

  if (!colorsReady || !sizesReady || !categoriesReady || !brandsReady) {
    return <div>Cargando datos...</div>
  }

  return (
    <form className="space-y-4">
      {/* Selector de Categoría */}
      <div>
        <label className="mb-1 block text-sm font-medium">Categoría</label>
        <select className="w-full rounded border px-3 py-2">
          <option value="">Seleccionar categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Selector de Marca */}
      <div>
        <label className="mb-1 block text-sm font-medium">Marca</label>
        <select className="w-full rounded border px-3 py-2">
          <option value="">Seleccionar marca</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>

      {/* Selector de Color */}
      <div>
        <label className="mb-1 block text-sm font-medium">Color</label>
        <div className="grid grid-cols-4 gap-2">
          {colors.map((color) => (
            <button
              key={color.id}
              type="button"
              className="flex items-center gap-2 rounded border p-2 hover:bg-gray-50"
            >
              <div className="h-4 w-4 rounded border" style={{ backgroundColor: color.hex }} />
              <span className="text-xs">{color.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selector de Talle */}
      <div>
        <label className="mb-1 block text-sm font-medium">Talle</label>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <button
              key={size.id}
              type="button"
              className="rounded border px-3 py-1 hover:border-blue-300 hover:bg-blue-50"
            >
              {size.name}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700"
      >
        Crear Producto
      </button>
    </form>
  )
}

export default ExampleInventoryForm
