import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Cambiar el tema y guardar en localStorage
  const toggleDarkMode = () => {
    const newTheme = !isDarkMode
    const themeName = newTheme ? 'dark' : 'light'

    console.log('🎨 Cambiando tema:', { isDarkMode, newTheme, themeName })

    setIsDarkMode(newTheme)
    document.documentElement.setAttribute('data-theme', themeName)
    localStorage.setItem('theme', themeName)

    console.log('✅ Tema aplicado:', document.documentElement.getAttribute('data-theme'))
  }

  // Recuperar el tema guardado al cargar la aplicación
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light'
    const isDark = savedTheme === 'dark'

    console.log('🔄 Inicializando tema:', { savedTheme, isDark })

    setIsDarkMode(isDark)
    document.documentElement.setAttribute('data-theme', savedTheme)

    // Verificar que se aplicó correctamente
    setTimeout(() => {
      const appliedTheme = document.documentElement.getAttribute('data-theme')
      console.log('✅ Tema aplicado después de 100ms:', appliedTheme)
    }, 100)
  }, [])

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>{children}</ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
