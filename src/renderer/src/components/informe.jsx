import MenuVertical from "../componentes especificos/menuVertical"
import Navbar from "../componentes especificos/navbar"

export default function Informe() {
  return (
    <div>
      <Navbar />
      <MenuVertical currentPath="/informe" />
      <h2>Esto es un informe! </h2>
    </div>
  )
}
