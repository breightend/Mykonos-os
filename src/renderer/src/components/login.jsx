import Settings from '../componentes especificos/settings'
import { useLocation } from 'wouter'

export default function Login() {
  const [, setLocation] = useLocation()
  return (
    <div className=" image-full w-full z-0 bg-cover bg-center relative">
      <figure className="absolute inset-0 ">
        <img
          src="./src/images/sunset2.jpg"
          alt="bgImage"
          className="w-full h-full rounded-none night:hidden"
        />
        <img
          src="./src/images/night-wallpaper.jpg"
          alt="bgImage"
          className="w-full h-full rounded-none hidden night:block"
        />
      </figure>

      <div className="relative z-20 flex items-center justify-center min-h-screen">
        <div className="card glass flex-row w-[32rem] bg-gray-800 bFg-opacity-50 text-white shadow-xl p-2 rounded-lg">
          <Settings />
          <figure className="flex items-center justify-center px-4">
            <div className="avatar">
              <div className="w-32 h-32 rounded-full border-4 border-gray-500 flex items-center justify-center">
                <img src="./src/images/user_icon.webp" alt="User Icon" />
              </div>
            </div>
          </figure>

          <div className="card-body flex-1">
            <h2 className="text-center text-2xl font-semibold mb-2">Iniciar Sesión</h2>
            <input
              type="text"
              className="input input-bordered w-full mb-2 text-base-content "
              required
              placeholder="Usuario"
              pattern="[A-Za-z][A-Za-z0-9\-]*"
              minLength="3"
              maxLength="30"
            />
            <input
              type="password"
              className="input input-bordered w-full mb-4 text-base-content"
              required
              placeholder="Contraseña"
              minLength="8"
              pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
            />
            <div className="card-actions flex justify-end">
              <button className="btn btn-primary text-black" onClick={() => setLocation('/home')}>
                Iniciar
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 p-4">
        <p className="font-bold text-6xl text-white "> Mykonos-OS</p>
      </div>
    </div>
  )
}
