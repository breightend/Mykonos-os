import MenuVertical from '../componentes especificos/menuVertical'


export default function Home() {
  return (
    <>
      {/* Menú lateral */}
      <MenuVertical
        currentPath="/home"
      />
      <div className={`transition-all duration-300 ease-in-out`}>
        <div className="flex-1 ml-20">
          <div className="navbar bg-base-100">
            <div className="flex-1">
              <a className="btn btn-ghost text-xl">Mykonos OS HOME</a>
            </div>
          </div>
      {/* Aca resto del contenido*/}
      <div>
        <p>hola   </p>
      </div>
        </div>
      </div>
      
    </>
  )
}
