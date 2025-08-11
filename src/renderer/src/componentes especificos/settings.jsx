import { Cog, Moon, SunMedium, Calculator, Percent, DollarSign } from 'lucide-react'
import { useTheme } from '../contexts/themeContext'
import { useSettings } from '../contexts/settingsContext'
import { useRef, useState, useEffect } from 'react'

export default function Settings() {
  const { isDarkMode, toggleDarkMode } = useTheme()
  const { settings, updateSettings } = useSettings()
  const dialogRef = useRef(null)
  const [localSettings, setLocalSettings] = useState(settings)

  // Sincronizar configuraciones locales cuando cambien las globales
  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleOutsideClick = (e) => {
    if (e.target === dialogRef.current) {
      dialogRef.current.close()
    }
  }

  const handleSettingsChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value }
    setLocalSettings(newSettings)
    updateSettings({ [key]: value })
  }

  const handleSaveSettings = () => {
    updateSettings(localSettings)
    dialogRef.current.close()
  }

  return (
    <div>
      <button className="btn-icon btn" onClick={() => dialogRef.current.showModal()}>
        <Cog size={64} className="transition-transform hover:rotate-180" />
      </button>
      <dialog
        ref={dialogRef}
        id="settings"
        className="animate-fade-in modal backdrop-blur-sm backdrop:bg-black/50"
        onClick={handleOutsideClick}
      >
        <div className="modal-box max-w-sm rounded-2xl p-6 md:max-w-lg">
          <div className="modal-header mb-4 flex items-center justify-between rounded-2xl bg-gray-800 p-4 text-white dark:bg-gray-400 dark:text-black">
            <h3 className="text-2xl font-bold">Configuraciones</h3>
          </div>

          <div className="flex flex-col gap-6 text-base-content">
            {/* Configuración de tema */}
            <div className="card bg-base-200 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <SunMedium className="h-5 w-5" />
                Tema de la aplicación
              </h4>
              <label className="swap swap-rotate">
                <input
                  type="checkbox"
                  className="theme-controller hidden"
                  checked={isDarkMode}
                  onChange={toggleDarkMode}
                />
                <div className="swap-on flex h-10 w-10 items-center justify-center rounded-full p-2">
                  <SunMedium className="h-10 w-10 text-white" />
                </div>
                <div className="swap-off flex h-10 w-10 items-center justify-center rounded-full p-2">
                  <Moon className="h-10 w-10" />
                </div>
              </label>
            </div>
          </div>

          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-primary" onClick={handleSaveSettings}>
                Guardar y Cerrar
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  )
}
