import { useLocation } from 'wouter'

export default function ConfirmacionDatosDeCompra() {
  const [, setLocation] = useLocation()

  const handeleSubmit = () => {
    setLocation("/ventas")
  }
  return (
    <div>
      <h1 className="text-3xl font-bold">Datos de la compra</h1>
      <div>
        <button className="btn" onClick={() => setLocation('/formaPago')}>
          Cancelar
        </button>
        <button className="btn btn-success" onClick={handeleSubmit()}>Confirmar compra!</button>
      </div>
    </div>
  )
}
