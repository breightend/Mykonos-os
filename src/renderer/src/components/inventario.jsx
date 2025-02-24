import { useLocation } from 'wouter'

export default function Inventario() {
  const [, setLocation] = useLocation()
  return (
    <>
      <h2>Inventario: </h2>
      <button className="btn btn-accent" onClick={setLocation('/home')}>
        Volver
      </button>
      <button className="btn btn-accent" onClick={setLocation('/nuevoProducto')}>
        Nuevo producto
      </button>
    </>
  )
}
