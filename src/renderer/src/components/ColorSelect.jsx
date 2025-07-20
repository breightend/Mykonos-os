import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export default function ColorSelect({
  colors = [],
  value = '',
  onChange,
  className = '',
  placeholder = 'Seleccione un color',
  disabled = false,
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Encontrar el color seleccionado
  const selectedColor = colors.find((color) => color.color_name === value)

  // Cerrar dropdown al hacer clic fuera
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
        className={`select select-bordered select-sm focus:border-secondary flex w-full items-center justify-between ${
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
        <div className="bg-base-100 border-base-300 absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border shadow-lg">
          {colors.length === 0 ? (
            <div className="p-3 text-center text-gray-500">No hay colores disponibles</div>
          ) : (
            <ul className="py-1" role="listbox">
              {colors.map((color) => (
                <li
                  key={color.id}
                  className={`hover:bg-base-200 flex cursor-pointer items-center gap-2 px-3 py-2 ${
                    value === color.color_name ? 'bg-primary/10 text-primary' : ''
                  }`}
                  onClick={() => handleSelect(color.color_name)}
                  role="option"
                  aria-selected={value === color.color_name}
                >
                  <div
                    className="h-4 w-4 flex-shrink-0 rounded-full border border-gray-300"
                    style={{ backgroundColor: color.color_hex }}
                  />
                  <span className="truncate">{color.color_name}</span>
                  {value === color.color_name && (
                    <svg
                      className="text-primary ml-auto h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
