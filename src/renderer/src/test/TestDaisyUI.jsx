import React from 'react'

function TestDaisyUI() {
  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="container mx-auto max-w-4xl">
        <h1 className="mb-8 text-4xl font-bold text-primary">🧪 Prueba DaisyUI</h1>

        {/* Card de prueba */}
        <div className="card mb-6 bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">¡DaisyUI funciona!</h2>
            <p>
              Si ves esta tarjeta con colores y estilos bonitos, DaisyUI está funcionando
              correctamente.
            </p>
            <div className="card-actions justify-end">
              <button className="btn btn-primary">Botón Primario</button>
              <button className="btn btn-secondary">Botón Secundario</button>
            </div>
          </div>
        </div>

        {/* Botones de prueba */}
        <div className="mb-6 flex gap-4">
          <button className="btn btn-accent">Accent</button>
          <button className="btn btn-info">Info</button>
          <button className="btn btn-success">Success</button>
          <button className="btn btn-warning">Warning</button>
          <button className="btn btn-error">Error</button>
        </div>

        {/* Input de prueba */}
        <div className="form-control mb-6">
          <label className="label">
            <span className="label-text">Campo de prueba</span>
          </label>
          <input type="text" placeholder="Escribe algo..." className="input-bordered input" />
        </div>

        {/* Selector de tema */}
        <div className="form-control mb-6">
          <label className="label">
            <span className="label-text">Cambiar tema</span>
          </label>
          <select
            className="select-bordered select"
            onChange={(e) => document.documentElement.setAttribute('data-theme', e.target.value)}
          >
            <option value="cupcake">Cupcake (Claro)</option>
            <option value="night">Night (Oscuro)</option>
          </select>
        </div>

        {/* Alert de prueba */}
        <div className="alert alert-info">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="h-6 w-6 shrink-0 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>Si puedes ver esta alerta con colores, ¡todo está funcionando!</span>
        </div>
      </div>
    </div>
  )
}

export default TestDaisyUI
