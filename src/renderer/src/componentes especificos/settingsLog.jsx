import { Cog, Moon, SunMedium } from 'lucide-react'
import { useTheme } from '../contexts/themeContext'
import { useRef } from 'react'

export default function Settings() {
  const { isDarkMode, toggleDarkMode } = useTheme()
  const dialogRef = useRef(null)

  const handleOutsideClick = (e) => {
    if (e.target === dialogRef.current) {
      dialogRef.current.close()
    }
  }

  return (
    <div>
      <button
        className="btn btn-circle mb-2"
        onClick={() => dialogRef.current.showModal()}
      >
        <Cog size={30} className="transition-transform hover:rotate-180" />
      </button>
      <dialog
        ref={dialogRef}
        id="settings"
        className="modal backdrop:bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={handleOutsideClick}
      >
        <div className="modal-box max-w-sm md:max-w-lg rounded-2xl p-6">
          <div className="modal-header bg-gray-800 text-white dark:bg-gray-400 dark:text-black p-4 rounded-2xl flex justify-between items-center mb-4">
            <h3 className="font-bold text-2xl">Configuraciones</h3>
          </div>
          <div className="text-base-content flex flex-col items-center gap-4">
            <p>Aquí van a ir las configuraciones</p>
            {/* Control del tema */}
            <label className="swap swap-rotate">
              <input
                type="checkbox"
                className="theme-controller hidden"
                checked={isDarkMode}
                onChange={toggleDarkMode}
              />
              <div className="swap-on  rounded-full p-2 flex items-center justify-center h-10 w-10">
                <SunMedium className="h-10 w-10 text-white" />
              </div>
              <div className="swap-off  rounded-full p-2 flex items-center justify-center h-10 w-10">
                <Moon className="h-10 w-10 " />
              </div>
            </label>
            <button className='btn btn-ghost dark:text-white rounded-xl w-full' onClick={() => setLocation("/createUser")}>Crear usuario</button>

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
