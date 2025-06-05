import MenuVertical from '../componentes especificos/menuVertical'
import Navbar from '../componentes especificos/navbar'

export default function Sucursales() {
  return (
    <div className="container">
      <MenuVertical />
      <Navbar />
      <h1>Sucursales</h1>
      <p>Esta es la página de sucursales.</p>
      {/* Aquí puedes agregar más contenido relacionado con las sucursales */}
    </div>
  )
}
