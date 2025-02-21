import  Settings  from './components/settings'
function App() {
  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('./src/images/background.jpg')" }}
    >
      <div className="card glass flex-row w-[32rem] bg-gray-800 bg-opacity-50 text-white shadow-xl p-6 rounded-lg">
        <Settings />
        {/* Imagen alineada a la izquierda */}
        <figure className="flex items-center justify-center px-4">
          <div className="avatar">
            <div className="w-32 h-32 rounded-full border-4 border-gray-500 flex items-center justify-center">
              <img src="./src/images/user_icon.webp" alt="User Icon" />
            </div>
          </div>
        </figure>

        {/* Cuerpo del formulario */}
        <div className="card-body flex-1">
          <h2 className="text-center text-2xl font-semibold mb-4">Iniciar Sesión</h2>
          <input
            type="text"
            className="input input-bordered w-full mb-2 text-black"
            required
            placeholder="Username"
            pattern="[A-Za-z][A-Za-z0-9\-]*"
            minLength="3"
            maxLength="30"
          />
          <input
            type="password"
            className="input input-bordered w-full mb-4 text-black"
            required
            placeholder="Password"
            minLength="8"
            pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
          />
          <div className="card-actions flex justify-end">
            <button className="btn btn-primary">Iniciar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
