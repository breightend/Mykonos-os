import MenuVertical from '../componentes especificos/menuVertical'
import { useLocation } from 'wouter'
import Navbar from '../componentes especificos/navbar'
import { useSession } from '../contexts/SessionContext'


export default function Usuario() {
  const [, setLocation] = useLocation()
  const { getCurrentUser } = useSession()
  const currentUser = getCurrentUser()



  return (
    <div>
      <MenuVertical currentPath="/usuario" />
      <Navbar />
      <div className="flex h-screen w-full flex-col items-center justify-center">
        <div className="card bg-base-100 from-base-200 to-base-300 w-96 transform bg-gradient-to-br p-6 shadow-xl transition-all hover:scale-105">
          <figure className="px-10 pt-6">
            <img
              src="/src/images/user_icon.webp"
              alt="Usuario"
              className="border-primary h-40 w-40 rounded-full border-4 object-cover shadow-lg"
            />
          </figure>
          <div className="card-body items-center space-y-4 text-center">
            <h2 className="card-title text-2xl font-bold">{currentUser?.name}</h2>
            <div className="badge badge-primary badge-outline p-3 text-lg">Rol: Administrador</div>
            <div className="card-actions mt-4">
              {/* Aca va a ir si el rol es administrador:  */}
              <select defaultValue="Cambiar sucursal" className="select select-primary w-10/12">
                <option disabled={true}>Cambiar sucursal</option>
                <option>Peatonal, San Martin, Paraná</option>
                <option>Concordia, A del Valle</option>
              </select>
              <button className="btn btn-primary btn-wide shadow-md">Editar Perfil</button>

              <button
                className="btn btn-accent btn-wide shadow-md"
                onClick={() => setLocation('/')}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
