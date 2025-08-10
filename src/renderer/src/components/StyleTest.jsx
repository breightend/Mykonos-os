import { useState } from 'react'

export default function StyleTest() {
  const [showModal, setShowModal] = useState(false)
  const [selectedOption, setSelectedOption] = useState('')
  const [inputValue, setInputValue] = useState('')

  return (
    <div className="space-y-8 p-8">
      <h1 className="mb-8 text-center text-3xl font-bold">🎨 Test de Estilos - Sistema Mykonos</h1>

      {/* Botones */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Botones</h2>
        <div className="flex flex-wrap gap-4">
          <button className="btn btn-primary">Primario</button>
          <button className="btn btn-secondary">Secundario</button>
          <button className="btn btn-accent">Acento</button>
          <button className="btn btn-warning">Warning</button>
          <button className="btn btn-error">Error</button>
          <button className="btn btn-ghost">Ghost</button>
          <button className="tooltip tooltip-bottom btn btn-ghost" data-tip="Tooltip funcional">
            Ghost con Tooltip
          </button>
        </div>
      </div>

      {/* Selects */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Selects</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <select className="select-bordered select w-full">
            <option disabled selected>
              Selecciona una opción
            </option>
            <option>Opción 1</option>
            <option>Opción 2</option>
            <option>Opción 3</option>
          </select>
          <select className="select-bordered select select-warning w-full">
            <option disabled selected>
              Select Warning
            </option>
            <option>Opción A</option>
            <option>Opción B</option>
          </select>
          <select className="select-bordered select select-sm w-full">
            <option disabled selected>
              Select Small
            </option>
            <option>Mini A</option>
            <option>Mini B</option>
          </select>
        </div>
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Inputs</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <input type="text" placeholder="Input normal" className="input-bordered input w-full" />
          <input
            type="text"
            placeholder="Input warning"
            className="input-bordered input input-warning w-full"
          />
          <input
            type="number"
            placeholder="Input numérico"
            className="input-bordered input w-full"
          />
        </div>
      </div>

      {/* Modal Test */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Modal</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Abrir Modal de Prueba
        </button>

        {showModal && (
          <dialog open className="modal">
            <div className="modal-box">
              <h3 className="mb-4 text-lg font-bold">¡Modal Funcional!</h3>
              <p className="mb-4">Este modal debería verse perfecto con fondo difuminado.</p>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Input dentro del modal"
                  className="input-bordered input w-full"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <select className="select-bordered select w-full">
                  <option>Select en modal</option>
                  <option>Opción 1</option>
                  <option>Opción 2</option>
                </select>
              </div>
              <div className="modal-action">
                <button className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={() => setShowModal(false)}>
                  Confirmar
                </button>
              </div>
            </div>
            <form method="dialog" className="modal-backdrop">
              <button onClick={() => setShowModal(false)}>cerrar</button>
            </form>
          </dialog>
        )}
      </div>

      {/* Stats */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Stats</h2>
        <div className="stats w-full shadow">
          <div className="stat">
            <div className="stat-title">Total Ventas</div>
            <div className="stat-value">$25,600</div>
            <div className="stat-desc">↗︎ 400 (22%)</div>
          </div>
          <div className="stat">
            <div className="stat-title">Productos</div>
            <div className="stat-value">2,400</div>
            <div className="stat-desc">↗︎ 90 (14%)</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Tabla</h2>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover">
                <td>Camiseta Básica</td>
                <td>$2,500</td>
                <td>45</td>
                <td>
                  <span className="badge badge-success">En Stock</span>
                </td>
              </tr>
              <tr className="hover">
                <td>Pantalón Denim</td>
                <td>$8,900</td>
                <td>12</td>
                <td>
                  <span className="badge badge-warning">Poco Stock</span>
                </td>
              </tr>
              <tr className="hover">
                <td>Zapatos Deportivos</td>
                <td>$15,600</td>
                <td>0</td>
                <td>
                  <span className="badge badge-error">Sin Stock</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Alerts */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Alerts</h2>
        <div className="alert alert-info">
          <span>ℹ️ Esta es una alerta informativa.</span>
        </div>
        <div className="alert alert-warning">
          <span>⚠️ Esta es una alerta de advertencia.</span>
        </div>
        <div className="alert alert-error">
          <span>❌ Esta es una alerta de error.</span>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Cards</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Card Título</h2>
              <p>Este es el contenido de la card. Debería verse elegante y profesional.</p>
              <div className="card-actions justify-end">
                <button className="btn btn-primary btn-sm">Acción</button>
              </div>
            </div>
          </div>
          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title">Card Secundaria</h2>
              <p>Card con fondo diferente para variety visual.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Menu</h2>
        <ul className="menu menu-horizontal rounded-box bg-base-200">
          <li>
            <a>Item 1</a>
          </li>
          <li>
            <a>Item 2</a>
          </li>
          <li>
            <a>Item 3</a>
          </li>
        </ul>
      </div>
    </div>
  )
}
