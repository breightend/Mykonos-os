import { Cog, Moon, Sun, SunMedium } from 'lucide-react'

export default function Settings() {
  return (
    <div>
      <button
        className="btn btn-circle "
        onClick={() => document.getElementById('settings').showModal()}
      >
        <Cog size={64} className="transition-transform hover:rotate-180" />
      </button>
      <dialog id="settings" className="modal backdrop:bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="modal-box">
          <div className="modal-header bg-gray-800 p-4 rounded-2xl flex justify-between items-center mb-4">
            <h3 className="font-bold text-2xl">Configuraciones</h3>
          </div>
          <div className="text-black">
            <p>Aca van a ir las configuraciones</p>
            {/* A partir de aca se controla el tema */}
            <label className="swap swap-rotate">
              {/* this hidden checkbox controls the state */}
              <input type="checkbox" className="theme-controller" value="night" />
              {/* sun icon */}
              <SunMedium className="swap-off h-10 w-10 fill-current" />
              {/* moon icon */}
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
