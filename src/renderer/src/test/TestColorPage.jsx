import { useState, useEffect } from 'react'
import { fetchColor } from '../services/products/colorService'
import ColorSelect from '../components/ColorSelect'

export default function TestColorPage() {
  const [colors, setColors] = useState([])
  const [selectedColor, setSelectedColor] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadColors = async () => {
      try {
        console.log('🔍 Cargando colores desde la API...')
        const colorsData = await fetchColor()
        console.log('🎨 Datos de colores recibidos:', colorsData)
        setColors(colorsData)
      } catch (error) {
        console.error('❌ Error cargando colores:', error)
      } finally {
        setLoading(false)
      }
    }

    loadColors()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
        <span className="ml-4">Cargando colores...</span>
      </div>
    )
  }

  return (
    <div className="bg-base-200 min-h-screen p-8">
      <div className="mx-auto max-w-2xl">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h1 className="card-title mb-6 text-2xl">🎨 Prueba de Componente ColorSelect</h1>

            {/* Información de debug */}
            <div className="bg-base-200 mb-6 rounded-lg p-4">
              <h3 className="mb-2 font-semibold">📊 Información de Debug:</h3>
              <p>
                <strong>Total de colores cargados:</strong> {colors.length}
              </p>
              <p>
                <strong>Color seleccionado:</strong> {selectedColor || 'Ninguno'}
              </p>

              {colors.length > 0 && (
                <div className="mt-4">
                  <p>
                    <strong>Estructura del primer color:</strong>
                  </p>
                  <pre className="bg-base-300 overflow-x-auto rounded p-2 text-xs">
                    {JSON.stringify(colors[0], null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Componente ColorSelect */}
            <div className="mb-6">
              <label className="label">
                <span className="label-text font-semibold">Seleccionar Color:</span>
              </label>

              <ColorSelect
                colors={colors}
                value={selectedColor}
                onChange={(colorName) => {
                  console.log('🎯 Color seleccionado:', colorName)
                  setSelectedColor(colorName)
                }}
                placeholder="Seleccione un color"
                className="w-full"
              />
            </div>

            {/* Resultado visual */}
            {selectedColor && (
              <div className="alert alert-success">
                <div className="flex items-center gap-3">
                  <span>✅ Color seleccionado exitosamente:</span>
                  <strong>{selectedColor}</strong>
                  {colors.find((c) => c.color_name === selectedColor) && (
                    <div
                      className="h-6 w-6 rounded-full border border-gray-300"
                      style={{
                        backgroundColor: colors.find((c) => c.color_name === selectedColor)
                          ?.color_hex
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Lista de todos los colores disponibles */}
            <div className="mt-6">
              <h3 className="mb-3 font-semibold">🎨 Todos los colores disponibles:</h3>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {colors.map((color) => (
                  <div
                    key={color.id}
                    className="hover:bg-base-200 flex cursor-pointer items-center gap-2 rounded-lg border p-2"
                    onClick={() => setSelectedColor(color.color_name)}
                  >
                    <div
                      className="h-4 w-4 flex-shrink-0 rounded-full border border-gray-300"
                      style={{ backgroundColor: color.color_hex }}
                    />
                    <span className="truncate text-sm">{color.color_name}</span>
                  </div>
                ))}
              </div>
            </div>

            {colors.length === 0 && (
              <div className="alert alert-warning">
                <span>⚠️ No se encontraron colores en la base de datos</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
