import { useTheme } from './context/ThemeContext'

const ThemeController = () => {
  const { isDarkMode, toggleDarkMode } = useTheme()

  return (
    <div>
      <p>Modo oscuro: {isDarkMode ? 'Activado' : 'Desactivado'}</p>
      <button onClick={toggleDarkMode}>
        {isDarkMode ? 'Desactivar modo oscuro' : 'Activar modo oscuro'}
      </button>
    </div>
  )
}

export default ThemeController
