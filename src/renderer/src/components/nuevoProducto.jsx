import { useLocation } from 'wouter'
export default function NuevoProducto() {
  const [, setLocation] = useLocation()
  return (
    <>
      <p>Soy un nuevo producto: </p>
      <button className="btn btn-primary" onClick={() => setLocation('/inventario')}>
        Volver
      </button>
    </>
  )
}
