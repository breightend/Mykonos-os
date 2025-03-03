import { Cog, SunMedium, Moon } from 'lucide-react'
import { useTheme } from '../contexts/themeContext' // Importar el contexto del tema

/* Aca van a ir las configuraciones que vayan adentro de las
 */
export default function SettingsLog() {
  const { isDarkMode, toggleDarkMode } = useTheme()

  return (
    <div>
      <div className="tooltip tooltip-right" data-tip="Configuraciones">
        <button
          className="btn btn-ghost justify-start w-full "
          onClick={() => document.getElementById('settings').showModal()}
        >
          <Cog />
        </button>
      </div>
      <dialog id="settings" className="modal backdrop:bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="modal-box">
          <div className="modal-header bg-gray-800 p-4 rounded-2xl flex justify-between items-center mb-4">
            <h3 className="font-bold text-2xl">Configuraciones</h3>
          </div>
          <div className="text-black">
            <p>Aca van a ir las configuraciones</p>
            {/* A partir de aca se controla el tema */}
            <label className="swap swap-rotate">
              <input
                type="checkbox"
                className="theme-controller"
                checked={isDarkMode} // Usar el estado del tema
                onChange={toggleDarkMode} // Cambiar el tema al hacer clic
              />
              <SunMedium className="swap-off h-10 w-10 fill-current" />
              <Moon className="swap-on h-10 w-10 fill-current" />
            </label>
          </div>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-primary">Cerrar</button>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  )
}
