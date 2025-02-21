import { Cog } from 'lucide-react'

export default function Settings() {
  return (
    <div>
      <button
        className="btn btn-square "
        onClick={() => document.getElementById('settings').showModal()}
      >
        <Cog size={64} className='transition-transform hover:rotate-180' />
      </button>
      <dialog id="settings" className="modal backdrop:bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="modal-box">
          <div className="modal-header bg-gray-800 p-4 rounded-2xl flex justify-between items-center mb-4">
            <h3 className="font-bold">Configuraciones</h3>
          </div>
          <div className='text-black'>

          <p>Aca van a ir las configuraciones</p>
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
