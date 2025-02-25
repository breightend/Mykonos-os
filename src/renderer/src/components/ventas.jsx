import { useLocation } from 'wouter'
import { ArrowLeft } from 'lucide-react'
import MenuVertical from '../componentes especificos/menuVertical'

function Ventas() {
  const [, setLocation] = useLocation()
  return (
    <div>
      <MenuVertical currentPath="/ventas" />
      <div className="flex-1 wl-20">
        <button className="btn btn-circle" onClick={() => setLocation('/home')}>
          <ArrowLeft />
        </button>
        <h1>Soy una venta</h1>
      </div>
    </div>
  )
}

export default Ventas
