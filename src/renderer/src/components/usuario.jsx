import React from 'react'
import MenuVertical from '../componentes especificos/menuVertical'

export default function Usuario() {
  return (
    <div>
      <MenuVertical currentPath="/usuario" />
      <div className="flex flex-col items-center mt-10  h-screen">
        <div className="card bg-base-100 w-96 shadow-xl bg-base-200">
          <figure className="px-10 pt-10">
            <img src=".\src\images\user_icon.webp" alt="" />
          </figure>
          <div className="card-body items-center text-center">
            <h2 className="card-title">Usuario</h2>
            <div className="badge badge-accent badge-outline">Rol: </div>
            <div className="card-actions"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
