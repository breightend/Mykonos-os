import React from 'react'
import MenuVertical from '../componentes especificos/menuVertical'

export default function Usuario() {
  return (
    <div className="flex">
      <MenuVertical currentPath="/usuario" />
      
      <div className="flex flex-col items-center justify-center w-full h-screen">
        <div className="card bg-base-100 w-96 shadow-xl bg-gradient-to-br from-base-200 to-base-300 p-6 transform transition-all hover:scale-105">
          <figure className="px-10 pt-6">
            <img src="/src/images/user_icon.webp" alt="Usuario" className="w-40 h-40 object-cover rounded-full shadow-lg border-4 border-primary" />
          </figure>
          <div className="card-body items-center text-center space-y-4">
            <h2 className="card-title text-2xl font-bold ">Usuario</h2>
            <div className="badge badge-primary badge-outline text-lg p-3">Rol: Administrador</div>
            <div className="card-actions mt-4">
              <button className="btn btn-primary btn-wide shadow-md">Editar Perfil</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
