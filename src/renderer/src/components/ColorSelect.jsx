import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export default function ColorSelect({
  allColors = [],
  availableColors = [],
  value = '',
  onChange,
  className = '',
  placeholder = 'Seleccione un color',
  disabled = false,
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const selectedColor = allColors.find((color) => color.color_name === value)

  // Debug logs
  useEffect(() => {
    console.log('🎨 ColorSelect Props:', {
      colors: allColors.length,
      value,
      selectedColor,
      colorsData: allColors.slice(0, 3) // Muestra solo los primeros 3 colores para evitar saturación
    })
  }, [allColors, value, selectedColor])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSelect = (colorName) => {
    onChange?.(colorName)
    setIsOpen(false)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setIsOpen(!isOpen)
    } else if (event.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Select Button */}
      <button
        type="button"
        className={`select-bordered select select-sm flex w-full items-center justify-between focus:border-secondary ${
          disabled ? 'select-disabled' : ''
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        required={required}
      >
        <div className="flex flex-1 items-center gap-2 text-left">
          {selectedColor ? (
            <>
              <div
                className="h-4 w-4 flex-shrink-0 rounded-full border border-gray-300"
                style={{ backgroundColor: selectedColor.color_hex }}
              />
              <span className="truncate">{selectedColor.color_name}</span>
            </>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Options */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-base-300 bg-base-100 shadow-lg">
          {availableColors.length === 0 ? (
            <div className="p-3 text-center text-gray-500">No hay colores disponibles</div>
          ) : (
            <ul className="py-1" role="listbox">
              {availableColors.map((color) => (
                <li
                  key={color.id}
                  className="flex items-center gap-2 p-2 hover:cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSelect(color.color_name)}
                >
                  <div
                    className="h-4 w-4 flex-shrink-0 rounded-full border border-gray-300"
                    style={{ backgroundColor: color.color_hex }}
                  />
                  <span className="truncate">{color.color_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
