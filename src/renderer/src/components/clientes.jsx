import MenuVertical from "../componentes especificos/menuVertical"
import Navbar from "../componentes especificos/navbar"

export default function Clientes() {
  return (
    <div>
      <Navbar />
      <MenuVertical currentPath="/clientes" />
    </div>
  )
}
