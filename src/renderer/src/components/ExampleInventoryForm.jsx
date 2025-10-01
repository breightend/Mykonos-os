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
                <label className="block text-sm font-medium mb-1">Categoría</label>
                <select className="w-full border rounded px-3 py-2">
                    <option value="">Seleccionar categoría</option>
                    {categories.map(category => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Selector de Marca */}
            <div>
                <label className="block text-sm font-medium mb-1">Marca</label>
                <select className="w-full border rounded px-3 py-2">
                    <option value="">Seleccionar marca</option>
                    {brands.map(brand => (
                        <option key={brand.id} value={brand.id}>
                            {brand.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Selector de Color */}
            <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <div className="grid grid-cols-4 gap-2">
                    {colors.map(color => (
                        <button
                            key={color.id}
                            type="button"
                            className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50"
                        >
                            <div 
                                className="w-4 h-4 rounded border"
                                style={{ backgroundColor: color.hex }}
                            />
                            <span className="text-xs">{color.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Selector de Talle */}
            <div>
                <label className="block text-sm font-medium mb-1">Talle</label>
                <div className="flex flex-wrap gap-2">
                    {sizes.map(size => (
                        <button
                            key={size.id}
                            type="button"
                            className="px-3 py-1 border rounded hover:bg-blue-50 hover:border-blue-300"
                        >
                            {size.name}
                        </button>
                    ))}
                </div>
            </div>

            <button 
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
                Crear Producto
            </button>
        </form>
    )
}

export default ExampleInventoryForm