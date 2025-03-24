import { KeyRound, UserRound } from 'lucide-react'
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
          className="w-full h-full rounded-none dark:hidden"
        />
        <img
          src="./src/images/night-wallpaper.jpg"
          alt="bgImage"
          className="w-full h-full rounded-none hidden dark:block"
        />
      </figure>

      <div className="relative z-20 flex items-center justify-center min-h-screen">
        <div className="card glass flex-row w-[32rem] bg-gray-800 bg-opacity-50  shadow-xl p-2 rounded-lg">
          <Settings />
          <figure className="flex items-center justify-center px-4">
            <div className="avatar">
              <div className="w-32 h-32 rounded-full border-4 border-gray-500 flex items-center justify-center">
                <img src="./src/images/user_icon.webp" alt="User Icon" />
              </div>
            </div>
          </figure>

          <div className="card-body flex-1">
            <h2 className="text-center text-2xl font-semibold mb-2 text-white">Iniciar Sesión</h2>
            <label className="input validator">
              <UserRound className="opacity-50" />
              <input
                type="text"
                className=" w-full text-base-content"
                required
                placeholder="Usuario"
                pattern="[A-Za-z][A-Za-z0-9\-]*"
                minLength="3"
                maxLength="30"
              />
            </label>
            <label className="input validator">
              <KeyRound className="opacity-50 " />
              <input
                type="password"
                required
                placeholder="Contraseña"
                minLength="8"
                pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                title="Must be more than 8 characters, including number, lowercase letter, uppercase letter"
                className="text-base-content"
              />
            </label>
            <p className="validator-hint hidden">
              Must be more than 8 characters, including
              <br />
              At least one number
              <br />
              At least one lowercase letter
              <br />
              At least one uppercase letter
            </p>
            <select defaultValue="Sucursal" className="select">
              <option disabled={true}>Sucursal</option>
              <option>Peatonal, San Martin, Paraná</option>
              <option>Concordia, A del Valle</option>
            </select>
            <div className="card-actions flex justify-end">
              <button className="btn btn-primary text-black" onClick={() => setLocation('/home')}>
                Iniciar
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 p-4">
        <p className="font-bold text-6xl dark:text-white text-black">Mykonos-OS</p>
      </div>
    </div>
  )
}
